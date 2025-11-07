/**
 * Subscription Tier Middleware
 *
 * Enforces subscription tier limits and feature access based on user's plan.
 * Integrates with Supabase users table to check subscription_tier column.
 *
 * Subscription Tiers:
 * - free: No subscription - 1 audit/month, 10 keywords/month
 * - starter: $49/month - 10 audits/month, 50 keywords/month
 * - professional: $149/month - 50 audits/month, 500 keywords/month
 * - agency: $499/month - Unlimited audits and keywords
 *
 * Usage:
 * ```javascript
 * import { requireTier, checkQuota } from './middleware/subscription.js';
 *
 * // Require minimum tier
 * router.post('/api/audits', requireTier('professional'), createAudit);
 *
 * // Check quota before allowing action
 * router.post('/api/audits', checkQuota('audits'), createAudit);
 * ```
 */

import { createClient } from '../config/supabase.js';
import usageTracker from '../services/usageTracker.js';
import subscriptionManager from '../services/subscriptionManager.js';

/**
 * Subscription tier hierarchy
 * Higher tiers include all features of lower tiers
 */
const TIER_HIERARCHY = {
  starter: 1,
  professional: 2,
  agency: 3,
};

/**
 * Get appropriate error message based on subscription status
 * @param {string} status - Subscription status
 * @returns {string} User-friendly error message
 */
function getSubscriptionErrorMessage(status) {
  if (status === subscriptionManager.SUBSCRIPTION_STATUS.PAST_DUE) {
    return 'Your subscription payment failed. Please update your payment method to continue using the service.';
  }
  if (status === subscriptionManager.SUBSCRIPTION_STATUS.UNPAID) {
    return 'Your subscription has been suspended due to payment failure. Please update your payment method to restore access.';
  }
  return 'Your subscription is not active. Please update your payment method or resubscribe.';
}

/**
 * Monthly quotas per subscription tier
 */
export const TIER_QUOTAS = {
  starter: {
    audits: 10,
    keywords: 50,
    reports: 10,
    competitors: 3,
  },
  professional: {
    audits: 50,
    keywords: 500,
    reports: 50,
    competitors: 10,
  },
  agency: {
    audits: Infinity, // Unlimited
    keywords: Infinity,
    reports: Infinity,
    competitors: Infinity,
  },
};

/**
 * Feature flags per tier
 */
export const TIER_FEATURES = {
  starter: ['basic_audits', 'keyword_research', 'pdf_reports'],
  professional: [
    'basic_audits',
    'keyword_research',
    'pdf_reports',
    'competitor_analysis',
    'rank_tracking',
    'white_label_reports',
    'api_access',
  ],
  agency: [
    'basic_audits',
    'keyword_research',
    'pdf_reports',
    'competitor_analysis',
    'rank_tracking',
    'white_label_reports',
    'api_access',
    'priority_support',
    'custom_integrations',
    'team_collaboration',
    'advanced_analytics',
  ],
};

/**
 * Get user's subscription tier from database
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User subscription data
 */
async function getUserSubscription(userId) {
  const supabase = createClient({ admin: true });

  const { data: user, error } = await supabase
    .from('users')
    .select('subscription_tier, stripe_customer_id, subscription_status, created_at')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('User subscription not found');
  }

  return {
    tier: user.subscription_tier || 'starter', // Default to starter
    status: user.subscription_status || 'active',
    stripeCustomerId: user.stripe_customer_id,
    createdAt: user.created_at,
  };
}

/**
 * Get current period usage for a resource
 * @param {string} userId - User UUID
 * @param {string} resourceType - Type of resource ('audits', 'keywords', 'reports')
 * @returns {Promise<number>} Current usage count
 */
async function getCurrentUsage(userId, resourceType) {
  const supabase = createClient({ admin: true });

  // Calculate start of current billing period (1st of current month)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let tableName;
  switch (resourceType) {
    case 'audits':
      tableName = 'seo_analyses';
      break;
    case 'keywords':
      tableName = 'keywords'; // Assuming you have a keywords table
      break;
    case 'reports':
      tableName = 'reports'; // Assuming you have a reports table
      break;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }

  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString());

  if (error) {
    console.error(`Error fetching ${resourceType} usage:`, error);
    throw new Error(`Failed to check ${resourceType} usage`);
  }

  return count || 0;
}

/**
 * Middleware: Require minimum subscription tier
 * @param {string} minimumTier - Minimum tier required ('starter', 'professional', 'agency')
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/api/advanced-feature', requireTier('professional'), handler);
 */
export function requireTier(minimumTier) {
  return async (req, res, next) => {
    try {
      // Get authenticated user (assumes requireAuth middleware ran first)
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // Check subscription status (includes grace period logic)
      const subscriptionStatus = await subscriptionManager.checkSubscriptionStatus(req.user.id);

      // Block access if subscription inactive and not in grace period
      if (!subscriptionStatus.hasAccess) {
        const message = getSubscriptionErrorMessage(subscriptionStatus.status);

        return res.status(403).json({
          success: false,
          error: {
            code: 'SUBSCRIPTION_INACTIVE',
            message,
            status: subscriptionStatus.status,
            gracePeriodEnded:
              subscriptionStatus.status === subscriptionManager.SUBSCRIPTION_STATUS.UNPAID,
            updatePaymentUrl: '/billing',
          },
        });
      }

      // Show warning if in grace period
      if (subscriptionStatus.inGracePeriod) {
        res.setHeader('X-Grace-Period-Warning', 'true');
        res.setHeader('X-Grace-Period-Days-Remaining', subscriptionStatus.daysRemaining.toString());
        res.setHeader('X-Grace-Period-Ends-At', subscriptionStatus.gracePeriodEndsAt);
      }

      // Check tier hierarchy
      const userTierLevel = TIER_HIERARCHY[subscriptionStatus.tier];
      const requiredTierLevel = TIER_HIERARCHY[minimumTier];

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_TIER',
            message: `This feature requires ${minimumTier} tier or higher. Your current tier: ${subscriptionStatus.tier}.`,
            upgrade_url: '/pricing',
          },
        });
      }

      // Attach subscription to request for downstream use
      req.subscription = {
        tier: subscriptionStatus.tier,
        status: subscriptionStatus.status,
        hasAccess: subscriptionStatus.hasAccess,
        inGracePeriod: subscriptionStatus.inGracePeriod,
        daysRemaining: subscriptionStatus.daysRemaining,
        gracePeriodEndsAt: subscriptionStatus.gracePeriodEndsAt,
        stripeCustomerId: subscriptionStatus.stripeCustomerId,
      };
      next();
    } catch (error) {
      console.error('Subscription tier check failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_CHECK_FAILED',
          message: 'Failed to verify subscription tier',
        },
      });
    }
  };
}

/**
 * Middleware: Check if user has quota remaining for a resource
 * @param {string} resourceType - Type of resource ('audits', 'keywords', 'reports')
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/api/audits', checkQuota('audits'), createAudit);
 */
export function checkQuota(resourceType) {
  return async (req, res, next) => {
    try {
      // Get authenticated user
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // Use usageTracker service to check quota
      const quotaCheck = await usageTracker.checkQuota(req.user.id, resourceType);

      // Check if action is allowed
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `You've reached your monthly limit for ${resourceType}. Upgrade your plan for more.`,
            current_tier: quotaCheck.tier,
            current_usage: quotaCheck.usage,
            quota_limits: quotaCheck.quotas,
            reset_date: quotaCheck.resetDate,
            upgrade_url: '/pricing',
          },
        });
      }

      // Attach quota info to request for downstream use
      req.quota = {
        type: resourceType,
        tier: quotaCheck.tier,
        usage: quotaCheck.usage,
        quotas: quotaCheck.quotas,
        remaining: quotaCheck.remaining,
        resetDate: quotaCheck.resetDate,
      };

      next();
    } catch (error) {
      console.error('Quota check failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUOTA_CHECK_FAILED',
          message: 'Failed to check usage quota',
        },
      });
    }
  };
}

/**
 * Middleware: Check if user has access to a specific feature
 * @param {string} featureName - Feature identifier (e.g., 'competitor_analysis')
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/api/competitors', requireFeature('competitor_analysis'), handler);
 */
export function requireFeature(featureName) {
  return async (req, res, next) => {
    try {
      // Get authenticated user
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // Get user's subscription
      const subscription = await getUserSubscription(req.user.id);

      // Check if tier includes the feature
      const tierFeatures = TIER_FEATURES[subscription.tier];
      if (!tierFeatures || !tierFeatures.includes(featureName)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FEATURE_NOT_AVAILABLE',
            message: `This feature (${featureName}) is not available in your ${subscription.tier} plan.`,
            upgrade_url: '/pricing',
          },
        });
      }

      // Attach subscription to request
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Feature check failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEATURE_CHECK_FAILED',
          message: 'Failed to verify feature access',
        },
      });
    }
  };
}

/**
 * Helper: Get user's quota information
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Quota information for all resources
 */
export async function getQuotaInfo(userId) {
  const subscription = await getUserSubscription(userId);
  const tier = subscription.tier;
  const quotas = TIER_QUOTAS[tier];

  const quotaInfo = {};

  for (const [resourceType, limit] of Object.entries(quotas)) {
    try {
      const used = await getCurrentUsage(userId, resourceType);
      quotaInfo[resourceType] = {
        limit: limit === Infinity ? 'unlimited' : limit,
        used,
        remaining: limit === Infinity ? 'unlimited' : Math.max(0, limit - used),
        percentage: limit === Infinity ? 0 : Math.round((used / limit) * 100),
      };
    } catch (err) {
      // If table doesn't exist yet, set usage to 0
      console.warn(`Could not fetch usage for ${resourceType}:`, err.message);
      quotaInfo[resourceType] = {
        limit: limit === Infinity ? 'unlimited' : limit,
        used: 0,
        remaining: limit === Infinity ? 'unlimited' : limit,
        percentage: 0,
      };
    }
  }

  return {
    tier: subscription.tier,
    status: subscription.status,
    quotas: quotaInfo,
  };
}

/**
 * Helper: Check if user can access a feature
 * @param {string} userId - User UUID
 * @param {string} featureName - Feature identifier
 * @returns {Promise<boolean>} True if user has access
 */
export async function hasFeatureAccess(userId, featureName) {
  const subscription = await getUserSubscription(userId);
  const tierFeatures = TIER_FEATURES[subscription.tier];
  return tierFeatures && tierFeatures.includes(featureName);
}

/**
 * Helper: Get all features available to user
 * @param {string} userId - User UUID
 * @returns {Promise<string[]>} Array of feature identifiers
 */
export async function getUserFeatures(userId) {
  const subscription = await getUserSubscription(userId);
  return TIER_FEATURES[subscription.tier] || [];
}

export default {
  requireTier,
  checkQuota,
  requireFeature,
  getQuotaInfo,
  hasFeatureAccess,
  getUserFeatures,
  TIER_HIERARCHY,
  TIER_QUOTAS,
  TIER_FEATURES,
};
