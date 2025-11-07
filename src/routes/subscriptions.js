/**
 * Subscription Routes
 *
 * API endpoints for managing subscription tiers, quotas, and feature access.
 * All routes require authentication.
 *
 * Routes:
 * - GET /api/subscriptions/me - Get current user's subscription info
 * - GET /api/subscriptions/quotas - Get quota usage for all resources
 * - GET /api/subscriptions/features - Get available features for user's tier
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getQuotaInfo,
  getUserFeatures,
  hasFeatureAccess,
  TIER_QUOTAS,
  TIER_FEATURES,
} from '../middleware/subscription.js';
import { createClient } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/subscriptions/me
 * Get current user's subscription information
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "tier": "professional",
 *     "status": "active",
 *     "stripe_customer_id": "cus_...",
 *     "created_at": "2025-01-01T00:00:00.000Z"
 *   }
 * }
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = createClient({ admin: true });

    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, stripe_customer_id, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_FETCH_FAILED',
          message: 'Failed to fetch subscription information',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        tier: user.subscription_tier || 'starter',
        status: user.subscription_status || 'active',
        stripe_customer_id: user.stripe_customer_id,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching subscription',
      },
    });
  }
});

/**
 * GET /api/subscriptions/quotas
 * Get quota usage for all resources
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "tier": "professional",
 *     "status": "active",
 *     "quotas": {
 *       "audits": { "limit": 50, "used": 12, "remaining": 38, "percentage": 24 },
 *       "keywords": { "limit": 500, "used": 145, "remaining": 355, "percentage": 29 }
 *     }
 *   }
 * }
 */
router.get('/quotas', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const quotaInfo = await getQuotaInfo(userId);

    return res.json({
      success: true,
      data: quotaInfo,
    });
  } catch (error) {
    console.error('Error fetching quotas:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'QUOTA_FETCH_FAILED',
        message: 'Failed to fetch quota information',
      },
    });
  }
});

/**
 * GET /api/subscriptions/features
 * Get all features available to user's tier
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "tier": "professional",
 *     "features": [
 *       "basic_audits",
 *       "keyword_research",
 *       "competitor_analysis",
 *       "rank_tracking"
 *     ]
 *   }
 * }
 */
router.get('/features', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const features = await getUserFeatures(userId);

    const supabase = createClient({ admin: true });
    const { data: user } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    return res.json({
      success: true,
      data: {
        tier: user?.subscription_tier || 'starter',
        features,
      },
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FEATURES_FETCH_FAILED',
        message: 'Failed to fetch feature list',
      },
    });
  }
});

/**
 * GET /api/subscriptions/features/:featureName
 * Check if user has access to a specific feature
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "feature": "competitor_analysis",
 *     "has_access": true
 *   }
 * }
 */
router.get('/features/:featureName', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { featureName } = req.params;

    const hasAccess = await hasFeatureAccess(userId, featureName);

    return res.json({
      success: true,
      data: {
        feature: featureName,
        has_access: hasAccess,
      },
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FEATURE_CHECK_FAILED',
        message: 'Failed to check feature access',
      },
    });
  }
});

/**
 * GET /api/subscriptions/tiers
 * Get information about all subscription tiers
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "tiers": {
 *       "starter": {
 *         "price": 49,
 *         "quotas": { "audits": 10, "keywords": 50 },
 *         "features": ["basic_audits", "keyword_research"]
 *       }
 *     }
 *   }
 * }
 */
router.get('/tiers', async (req, res) => {
  try {
    const tiers = {
      starter: {
        name: 'Starter',
        price: 49,
        billing: 'monthly',
        quotas: TIER_QUOTAS.starter,
        features: TIER_FEATURES.starter,
        description: 'Perfect for freelancers and small businesses',
      },
      professional: {
        name: 'Professional',
        price: 149,
        billing: 'monthly',
        quotas: TIER_QUOTAS.professional,
        features: TIER_FEATURES.professional,
        description: 'Ideal for growing agencies and marketing teams',
      },
      agency: {
        name: 'Agency',
        price: 499,
        billing: 'monthly',
        quotas: TIER_QUOTAS.agency,
        features: TIER_FEATURES.agency,
        description: 'Unlimited access for large agencies and enterprises',
      },
    };

    return res.json({
      success: true,
      data: { tiers },
    });
  } catch (error) {
    console.error('Error fetching tier information:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'TIERS_FETCH_FAILED',
        message: 'Failed to fetch tier information',
      },
    });
  }
});

export default router;
