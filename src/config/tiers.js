/**
 * Tier Quotas Configuration
 *
 * Shared quota limits for subscription tiers.
 * Used across stripe service, usage tracker, and billing logic.
 *
 * @module config/tiers
 */

/**
 * Monthly quota limits per subscription tier
 */
export const TIER_QUOTAS = {
  starter: {
    audits: 10,
    keywords: 50,
    reports: 10,
  },
  professional: {
    audits: 50,
    keywords: 500,
    reports: 50,
  },
  agency: {
    audits: -1, // Unlimited
    keywords: -1,
    reports: -1,
  },
};

/**
 * Check if a quota is unlimited
 * @param {number} quota - The quota value
 * @returns {boolean} True if unlimited
 */
export function isUnlimited(quota) {
  return quota === -1;
}

/**
 * Get quota for a specific tier and resource
 * @param {string} tier - Tier name (starter, professional, agency)
 * @param {string} resource - Resource type (audits, keywords, reports)
 * @returns {number} Quota limit (-1 for unlimited)
 */
export function getQuota(tier, resource) {
  return TIER_QUOTAS[tier]?.[resource] ?? 0;
}
