/**
 * Subscription Manager - Subscription Status & Grace Period Management
 *
 * Handles:
 * - Subscription status checks (active, past_due, canceled, expired)
 * - Grace period enforcement (3 days for failed payments)
 * - Automated dunning email triggers
 * - High-value customer alerts
 * - Access control during grace periods
 *
 * @module services/subscriptionManager
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key (bypasses RLS)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Grace period configuration
 */
const GRACE_PERIOD = {
  DAYS: 3, // Number of days grace period
  HIGH_VALUE_MRR: 149, // MRR threshold for high-value customer alerts ($149+)
  DUNNING_SCHEDULE: {
    DAY_1: 1, // First dunning email (24 hours after failure)
    DAY_3: 3, // Second dunning email (72 hours after failure)
    DAY_7: 7, // Final warning (not within grace period, but good practice)
  },
};

/**
 * Subscription statuses and their meanings
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active', // Subscription is active and paid
  PAST_DUE: 'past_due', // Payment failed, in grace period
  CANCELED: 'canceled', // User canceled subscription
  EXPIRED: 'expired', // Subscription ended (trial or subscription period)
  TRIALING: 'trialing', // In trial period
  INCOMPLETE: 'incomplete', // Initial payment not completed
  INCOMPLETE_EXPIRED: 'incomplete_expired', // Initial payment failed
  UNPAID: 'unpaid', // Payment failed, grace period expired
};

/**
 * Check if user's subscription is active or in grace period
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Subscription status details
 */
export async function checkSubscriptionStatus(userId) {
  try {
    // Get user's subscription data
    const { data: user, error } = await supabase
      .from('users')
      .select(
        'subscription_tier, subscription_status, stripe_customer_id, payment_failed_at, created_at'
      )
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    const status = user.subscription_status || SUBSCRIPTION_STATUS.ACTIVE;
    const paymentFailedAt = user.payment_failed_at ? new Date(user.payment_failed_at) : null;
    const now = new Date();

    // Calculate if in grace period
    let inGracePeriod = false;
    let gracePeriodEndsAt = null;
    let daysRemaining = 0;

    if (status === SUBSCRIPTION_STATUS.PAST_DUE && paymentFailedAt) {
      const daysSinceFailure = Math.floor((now - paymentFailedAt) / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, GRACE_PERIOD.DAYS - daysSinceFailure);
      inGracePeriod = daysRemaining > 0;

      if (inGracePeriod) {
        gracePeriodEndsAt = new Date(paymentFailedAt);
        gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD.DAYS);
      }
    }

    // Determine if access should be allowed
    const hasAccess =
      status === SUBSCRIPTION_STATUS.ACTIVE ||
      status === SUBSCRIPTION_STATUS.TRIALING ||
      (status === SUBSCRIPTION_STATUS.PAST_DUE && inGracePeriod);

    return {
      userId,
      tier: user.subscription_tier || 'starter',
      status,
      hasAccess,
      inGracePeriod,
      gracePeriodEndsAt: gracePeriodEndsAt ? gracePeriodEndsAt.toISOString() : null,
      daysRemaining,
      paymentFailedAt: paymentFailedAt ? paymentFailedAt.toISOString() : null,
      stripeCustomerId: user.stripe_customer_id,
      needsAction: status === SUBSCRIPTION_STATUS.PAST_DUE || status === SUBSCRIPTION_STATUS.UNPAID,
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw error;
  }
}

/**
 * Update subscription status in database
 * Called by Stripe webhooks
 *
 * @param {string} userId - User UUID
 * @param {string} newStatus - New subscription status
 * @param {Object} metadata - Additional metadata (payment_failed_at, etc.)
 * @returns {Promise<Object>} Updated user record
 */
export async function updateSubscriptionStatus(userId, newStatus, metadata = {}) {
  try {
    const updates = {
      subscription_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // If payment failed, record timestamp
    if (newStatus === SUBSCRIPTION_STATUS.PAST_DUE && !metadata.payment_failed_at) {
      updates.payment_failed_at = new Date().toISOString();
    }

    // If payment succeeded, clear failure timestamp
    if (newStatus === SUBSCRIPTION_STATUS.ACTIVE) {
      updates.payment_failed_at = null;
    }

    // Add any additional metadata
    Object.assign(updates, metadata);

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

/**
 * Handle failed payment - trigger grace period and dunning emails
 *
 * @param {string} userId - User UUID
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {Object} invoice - Stripe invoice object
 * @returns {Promise<void>}
 */
export async function handlePaymentFailure(userId, stripeCustomerId, invoice) {
  try {
    // Update subscription status to past_due
    await updateSubscriptionStatus(userId, SUBSCRIPTION_STATUS.PAST_DUE);

    // Get user details for email
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name, subscription_tier')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Determine if high-value customer (Professional or Agency tier)
    const isHighValue = ['professional', 'agency'].includes(user.subscription_tier);

    // Send Day 1 dunning email
    await sendDunningEmail(user.email, user.full_name, {
      day: 1,
      gracePeriodDays: GRACE_PERIOD.DAYS,
      invoiceUrl: invoice.hosted_invoice_url,
      amountDue: (invoice.amount_due / 100).toFixed(2),
      currency: invoice.currency.toUpperCase(),
    });

    // Alert team if high-value customer
    if (isHighValue) {
      await alertHighValueCustomer(user, invoice);
    }

    console.log(
      `Payment failure handled for user ${userId}. Grace period: ${GRACE_PERIOD.DAYS} days.`
    );
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Check for grace period expirations and send dunning emails
 * Should be run daily via cron job
 *
 * @returns {Promise<Object>} Summary of actions taken
 */
export async function processGracePeriods() {
  try {
    const now = new Date();
    const summary = {
      checked: 0,
      day3Emails: 0,
      day7Emails: 0,
      expired: 0,
      errors: [],
    };

    // Get all users with past_due status
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, subscription_tier, payment_failed_at, stripe_customer_id')
      .eq('subscription_status', SUBSCRIPTION_STATUS.PAST_DUE)
      .not('payment_failed_at', 'is', null);

    if (error) {
      throw error;
    }

    summary.checked = users?.length || 0;

    for (const user of users || []) {
      try {
        const paymentFailedAt = new Date(user.payment_failed_at);
        const daysSinceFailure = Math.floor((now - paymentFailedAt) / (1000 * 60 * 60 * 24));

        // Grace period expired - suspend access
        if (daysSinceFailure >= GRACE_PERIOD.DAYS) {
          await updateSubscriptionStatus(user.id, SUBSCRIPTION_STATUS.UNPAID);
          summary.expired++;
          console.log(`Grace period expired for user ${user.id}. Access suspended.`);
        }
        // Day 3 dunning email
        else if (daysSinceFailure === GRACE_PERIOD.DUNNING_SCHEDULE.DAY_3) {
          await sendDunningEmail(user.email, user.full_name, {
            day: 3,
            gracePeriodDays: GRACE_PERIOD.DAYS,
            daysRemaining: GRACE_PERIOD.DAYS - daysSinceFailure,
          });
          summary.day3Emails++;
        }
      } catch (err) {
        summary.errors.push({
          userId: user.id,
          error: err.message,
        });
        console.error(`Error processing grace period for user ${user.id}:`, err);
      }
    }

    console.log('Grace period processing complete:', summary);
    return summary;
  } catch (error) {
    console.error('Error processing grace periods:', error);
    throw error;
  }
}

/**
 * Send dunning email to user
 * TODO: Integrate with email service
 *
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {Object} context - Email context (day, gracePeriodDays, etc.)
 * @returns {Promise<void>}
 */
async function sendDunningEmail(email, name, context) {
  // TODO: Integrate with EmailService from Phase 2.1.2
  // For now, log the email that should be sent
  console.log(`[DUNNING EMAIL] Day ${context.day} to ${email}:`, {
    to: email,
    subject: getDunningEmailSubject(context.day),
    context,
  });

  // When email service is ready:
  // const emailService = require('./email/emailService.js');
  // await emailService.sendDunningEmail(email, name, context);
}

/**
 * Get dunning email subject based on day
 *
 * @param {number} day - Day in dunning sequence
 * @returns {string} Email subject
 */
function getDunningEmailSubject(day) {
  switch (day) {
    case 1:
      return 'Payment Failed - Action Required';
    case 3:
      return 'Urgent: Update Payment Method to Keep Your Access';
    case 7:
      return 'Final Notice: Your Account Has Been Suspended';
    default:
      return 'Payment Issue - Please Update Your Payment Method';
  }
}

/**
 * Alert team about high-value customer payment failure
 * TODO: Integrate with notification system (Slack, email, etc.)
 *
 * @param {Object} user - User object
 * @param {Object} invoice - Stripe invoice object
 * @returns {Promise<void>}
 */
async function alertHighValueCustomer(user, invoice) {
  // TODO: Send to Slack, internal dashboard, or notification system
  console.log('[HIGH-VALUE CUSTOMER ALERT] Payment failed:', {
    userId: user.id,
    email: user.email,
    tier: user.subscription_tier,
    amountDue: (invoice.amount_due / 100).toFixed(2),
    currency: invoice.currency.toUpperCase(),
    invoiceUrl: invoice.hosted_invoice_url,
    action: 'Manual follow-up recommended',
  });

  // When notification system is ready:
  // await notificationService.alertTeam('payment_failure_high_value', {...});
}

/**
 * Reactivate subscription after successful payment
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Updated user record
 */
export async function reactivateSubscription(userId) {
  try {
    const updates = {
      subscription_status: SUBSCRIPTION_STATUS.ACTIVE,
      payment_failed_at: null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`Subscription reactivated for user ${userId}`);
    return data;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

/**
 * Get subscription summary for admin dashboard
 *
 * @returns {Promise<Object>} Subscription statistics
 */
export async function getSubscriptionSummary() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_tier');

    if (error) {
      throw error;
    }

    const summary = {
      total: users.length,
      byStatus: {},
      byTier: {},
      inGracePeriod: 0,
      expiredGracePeriod: 0,
    };

    // Count by status
    for (const status of Object.values(SUBSCRIPTION_STATUS)) {
      summary.byStatus[status] = users.filter((u) => u.subscription_status === status).length;
    }

    // Count by tier
    const tiers = ['starter', 'professional', 'agency'];
    for (const tier of tiers) {
      summary.byTier[tier] = users.filter((u) => u.subscription_tier === tier).length;
    }

    // Get detailed grace period stats
    const { data: gracePeriodUsers } = await supabase
      .from('users')
      .select('payment_failed_at')
      .eq('subscription_status', SUBSCRIPTION_STATUS.PAST_DUE)
      .not('payment_failed_at', 'is', null);

    if (gracePeriodUsers) {
      const now = new Date();
      for (const user of gracePeriodUsers) {
        const daysSinceFailure = Math.floor(
          (now - new Date(user.payment_failed_at)) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceFailure < GRACE_PERIOD.DAYS) {
          summary.inGracePeriod++;
        } else {
          summary.expiredGracePeriod++;
        }
      }
    }

    return summary;
  } catch (error) {
    console.error('Error getting subscription summary:', error);
    throw error;
  }
}

export default {
  checkSubscriptionStatus,
  updateSubscriptionStatus,
  handlePaymentFailure,
  processGracePeriods,
  reactivateSubscription,
  getSubscriptionSummary,
  SUBSCRIPTION_STATUS,
  GRACE_PERIOD,
};
