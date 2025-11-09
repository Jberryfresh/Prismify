/**
 * Usage Tracker Service
 *
 * Tracks user usage of platform features:
 * - SEO audits per month
 * - Keyword research requests per month
 * - Projects created
 * - API calls
 *
 * Enforces subscription tier quotas
 *
 * @module services/usageTracker
 */

import { createClient } from '@supabase/supabase-js';
import { TIER_QUOTAS } from '../config/tiers.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Get user's current subscription tier and quotas
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Tier info and quotas
 */
export async function getUserTierAndQuotas(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    const tier = user?.subscription_tier || 'free';
    const quotas = TIER_QUOTAS[tier];

    return {
      tier,
      quotas,
    };
  } catch (error) {
    console.error('Error getting user tier:', error);
    throw error;
  }
}

/**
 * Get current month's usage for user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Usage statistics
 */
export async function getCurrentMonthUsage(userId) {
  try {
    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get audit count
    const { count: auditCount, error: auditError } = await supabase
      .from('seo_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (auditError) {
      throw auditError;
    }

    // Get keyword research count (from api_usage table)
    const { count: keywordCount, error: keywordError } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('endpoint', '/api/keywords/research')
      .gte('created_at', startOfMonth.toISOString());

    if (keywordError) {
      throw keywordError;
    }

    // Get total project count (lifetime, not monthly)
    const { count: projectCount, error: projectError } = await supabase
      .from('seo_projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (projectError) {
      throw projectError;
    }

    return {
      audits_used: auditCount || 0,
      keywords_used: keywordCount || 0,
      projects_created: projectCount || 0,
      period_start: startOfMonth.toISOString(),
      period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
    };
  } catch (error) {
    console.error('Error getting usage:', error);
    throw error;
  }
}

/**
 * Check if user can perform action based on quota
 *
 * @param {string} userId - User ID
 * @param {string} action - Action type (audits, keywords, projects)
 * @returns {Promise<Object>} { allowed: boolean, usage: Object, quotas: Object }
 */
export async function checkQuota(userId, action) {
  try {
    // Get tier and quotas
    const { tier, quotas } = await getUserTierAndQuotas(userId);

    // Get current usage
    const usage = await getCurrentMonthUsage(userId);

    let allowed = false;
    let remaining = 0;
    let resetDate = null;

    // Check quota based on action type
    switch (action) {
      case 'audits': {
        const quota = quotas.audits_per_month;
        allowed = quota === -1 || usage.audits_used < quota;
        remaining = quota === -1 ? -1 : quota - usage.audits_used;
        resetDate = usage.period_end;
        break;
      }
      case 'keywords': {
        const quota = quotas.keywords_per_month;
        allowed = quota === -1 || usage.keywords_used < quota;
        remaining = quota === -1 ? -1 : quota - usage.keywords_used;
        resetDate = usage.period_end;
        break;
      }
      case 'projects': {
        const quota = quotas.max_projects;
        allowed = quota === -1 || usage.projects_created < quota;
        remaining = quota === -1 ? -1 : quota - usage.projects_created;
        resetDate = null; // Project quota doesn't reset
        break;
      }
      default:
        throw new Error(`Unknown action type: ${action}`);
    }

    return {
      allowed,
      tier,
      usage,
      quotas,
      remaining,
      resetDate,
    };
  } catch (error) {
    console.error('Error checking quota:', error);
    throw error;
  }
}

/**
 * Track API usage
 *
 * @param {string} userId - User ID
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {number} responseTime - Response time in ms
 * @param {number} statusCode - HTTP status code
 * @returns {Promise<void>}
 */
export async function trackApiUsage(userId, endpoint, method, responseTime, statusCode) {
  try {
    const { error } = await supabase.from('api_usage').insert({
      user_id: userId,
      endpoint,
      method,
      response_time: responseTime,
      status_code: statusCode,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error tracking API usage:', error);
    // Don't throw - we don't want to fail the request if tracking fails
  }
}

/**
 * Get usage statistics for dashboard
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Usage statistics with percentages
 */
export async function getUsageStats(userId) {
  try {
    const { tier, quotas } = await getUserTierAndQuotas(userId);
    const usage = await getCurrentMonthUsage(userId);

    // Calculate percentages
    const auditPercentage =
      quotas.audits_per_month === -1
        ? 0
        : Math.round((usage.audits_used / quotas.audits_per_month) * 100);

    const keywordPercentage =
      quotas.keywords_per_month === -1
        ? 0
        : Math.round((usage.keywords_used / quotas.keywords_per_month) * 100);

    const projectPercentage =
      quotas.max_projects === -1
        ? 0
        : Math.round((usage.projects_created / quotas.max_projects) * 100);

    return {
      tier,
      quotas,
      usage,
      percentages: {
        audits: auditPercentage,
        keywords: keywordPercentage,
        projects: projectPercentage,
      },
      warnings: {
        auditsNearLimit: auditPercentage >= 80,
        keywordsNearLimit: keywordPercentage >= 80,
        projectsNearLimit: projectPercentage >= 80,
      },
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
}

/**
 * Reset monthly usage counters (called by scheduled job on 1st of month)
 * Note: This is informational - actual usage is counted from database timestamps
 *
 * @returns {Promise<void>}
 */
export async function resetMonthlyUsage() {
  console.log('Monthly usage reset not required - using timestamp-based queries');
  // No-op: We use timestamp-based queries, so no manual reset needed
}

/**
 * Increment usage counter (for keyword research and other tracked actions)
 * This records usage in api_usage table for quota tracking
 *
 * @param {string} userId - User ID
 * @param {string} action - Action type (keywords, audits, etc.)
 * @param {number} count - Number to increment by (default: 1)
 * @returns {Promise<void>}
 */
export async function incrementUsage(userId, action, count = 1) {
  try {
    // Map action to endpoint for api_usage tracking
    const endpointMap = {
      keywords: '/api/keywords/research',
      keyword_research: '/api/keywords/research',
      audits: '/api/audits',
      audit: '/api/audits',
    };

    const endpoint = endpointMap[action] || `/api/${action}`;

    // Insert usage record(s)
    for (let i = 0; i < count; i++) {
      await supabase.from('api_usage').insert({
        user_id: userId,
        endpoint,
        method: 'POST',
        response_time: 0,
        status_code: 201,
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error incrementing usage:', error);
    // Don't throw - we don't want to fail the request if tracking fails
  }
}

/**
 * Log usage (alias for incrementUsage for backward compatibility)
 *
 * @param {string} userId - User ID
 * @param {string} action - Action type
 * @param {Object} _metadata - Additional metadata (ignored for now)
 * @returns {Promise<void>}
 */
export async function logUsage(userId, action, _metadata = {}) {
  return incrementUsage(userId, action, 1);
}

export default {
  getUserTierAndQuotas,
  getCurrentMonthUsage,
  checkQuota,
  trackApiUsage,
  getUsageStats,
  resetMonthlyUsage,
  incrementUsage,
  logUsage,
};
