/**
 * Billing Routes
 *
 * Handles subscription and billing operations:
 * - Create checkout session
 * - Create billing portal session
 * - Get subscription status
 * - Change subscription plan
 * - Cancel subscription
 *
 * @module routes/billing
 */

import express from 'express';
import stripeService from '../services/stripe/stripeService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/billing/checkout
 * Create Stripe checkout session for new subscription
 */
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Validate required fields
    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: priceId, successUrl, cancelUrl',
        },
      });
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      userId,
      userEmail,
      priceId,
      successUrl,
      cancelUrl,
      true // Include 14-day trial
    );

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHECKOUT_ERROR',
        message: 'Failed to create checkout session',
        details: error.message,
      },
    });
  }
});

/**
 * POST /api/billing/portal
 * Create billing portal session for subscription management
 */
router.post('/portal', requireAuth, async (req, res) => {
  try {
    const { returnUrl } = req.body;
    const userId = req.user.id;

    // Get user's Stripe customer ID
    const { data: user, error: userError } = await req.supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user?.stripe_customer_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No active subscription found',
        },
      });
    }

    // Create portal session
    const session = await stripeService.createPortalSession(
      user.stripe_customer_id,
      returnUrl || process.env.NEXT_PUBLIC_APP_URL
    );

    res.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PORTAL_ERROR',
        message: 'Failed to create billing portal session',
        details: error.message,
      },
    });
  }
});

/**
 * GET /api/billing/subscription
 * Get current user's subscription details
 */
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get subscription from database
    const { data: subscription, error: subError } = await req.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw subError;
    }

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          hasSubscription: false,
          tier: 'free',
        },
      });
    }

    // Get quotas for tier
    const quotas = stripeService.getTierQuotas(subscription.plan_name);

    res.json({
      success: true,
      data: {
        hasSubscription: true,
        subscription: {
          id: subscription.stripe_subscription_id,
          tier: subscription.plan_name,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at,
        },
        quotas,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_ERROR',
        message: 'Failed to fetch subscription details',
        details: error.message,
      },
    });
  }
});

/**
 * POST /api/billing/subscription/change
 * Change subscription plan (upgrade/downgrade)
 */
router.post('/subscription/change', requireAuth, async (req, res) => {
  try {
    const { newPriceId } = req.body;
    const userId = req.user.id;

    if (!newPriceId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required field: newPriceId',
        },
      });
    }

    // Get current subscription
    const { data: subscription, error: subError } = await req.supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No active subscription found',
        },
      });
    }

    // Update subscription in Stripe
    const updatedSubscription = await stripeService.updateSubscription(
      subscription.stripe_subscription_id,
      newPriceId
    );

    // Sync to database
    await stripeService.syncSubscriptionToDatabase(updatedSubscription);

    res.json({
      success: true,
      data: {
        message: 'Subscription updated successfully',
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
        },
      },
    });
  } catch (error) {
    console.error('Error changing subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update subscription',
        details: error.message,
      },
    });
  }
});

/**
 * POST /api/billing/subscription/cancel
 * Cancel subscription (at period end by default)
 */
router.post('/subscription/cancel', requireAuth, async (req, res) => {
  try {
    const { immediately } = req.body;
    const userId = req.user.id;

    // Get current subscription
    const { data: subscription, error: subError } = await req.supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No active subscription found',
        },
      });
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripeService.cancelSubscription(
      subscription.stripe_subscription_id,
      immediately === true
    );

    // Sync to database
    await stripeService.syncSubscriptionToDatabase(canceledSubscription);

    res.json({
      success: true,
      data: {
        message: immediately
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at period end',
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        },
      },
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: 'Failed to cancel subscription',
        details: error.message,
      },
    });
  }
});

/**
 * POST /api/billing/subscription/reactivate
 * Reactivate a canceled subscription (before period ends)
 */
router.post('/subscription/reactivate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current subscription
    const { data: subscription, error: subError } = await req.supabase
      .from('subscriptions')
      .select('stripe_subscription_id, cancel_at_period_end')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No subscription found',
        },
      });
    }

    if (!subscription.cancel_at_period_end) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_CANCELED',
          message: 'Subscription is not set to cancel',
        },
      });
    }

    // Reactivate subscription in Stripe
    const reactivatedSubscription = await stripeService.reactivateSubscription(
      subscription.stripe_subscription_id
    );

    // Sync to database
    await stripeService.syncSubscriptionToDatabase(reactivatedSubscription);

    res.json({
      success: true,
      data: {
        message: 'Subscription reactivated successfully',
        subscription: {
          id: reactivatedSubscription.id,
          status: reactivatedSubscription.status,
          cancelAtPeriodEnd: reactivatedSubscription.cancel_at_period_end,
        },
      },
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REACTIVATE_ERROR',
        message: 'Failed to reactivate subscription',
        details: error.message,
      },
    });
  }
});

export default router;
