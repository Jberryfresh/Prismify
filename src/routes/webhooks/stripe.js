/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events for subscription lifecycle:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 *
 * @module routes/webhooks/stripe
 */

import Stripe from 'stripe';
import stripeService from '../../services/stripe/stripeService.js';
import subscriptionManager from '../../services/subscriptionManager.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// Webhook signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe webhook endpoint
 * POST /api/webhooks/stripe
 */
export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription) {
  console.log('Processing subscription.created:', subscription.id);

  try {
    await stripeService.syncSubscriptionToDatabase(subscription);

    // TODO: Send welcome email
    // TODO: Trigger onboarding sequence

    console.log('Subscription created successfully:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription.created:', error);
    throw error;
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription.updated:', subscription.id);

  try {
    await stripeService.syncSubscriptionToDatabase(subscription);

    // Check if subscription was canceled
    if (subscription.cancel_at_period_end) {
      // TODO: Send cancellation confirmation email
      // TODO: Trigger win-back campaign
      console.log('Subscription set to cancel at period end:', subscription.id);
    }

    // Check if subscription was reactivated
    if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
      // TODO: Send reactivation email
      console.log('Subscription reactivated:', subscription.id);
    }

    console.log('Subscription updated successfully:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription.updated:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription.deleted:', subscription.id);

  try {
    await stripeService.handleSubscriptionDeleted(subscription);

    // TODO: Send final goodbye email with data export option
    // TODO: Archive user data (keep for 90 days per policy)

    console.log('Subscription deleted successfully:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription.deleted:', error);
    throw error;
  }
}

/**
 * Handle payment succeeded event
 */
async function handlePaymentSucceeded(invoice) {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  try {
    // Get subscription ID from invoice
    const subscriptionId = invoice.subscription;

    if (subscriptionId) {
      // Retrieve and sync subscription
      const subscription = await stripeService.getSubscription(subscriptionId);
      await stripeService.syncSubscriptionToDatabase(subscription);

      // Get user ID from subscription metadata
      const userId = subscription.metadata?.supabase_user_id;

      // Reactivate subscription if it was in past_due status
      if (userId && subscription.status === 'active') {
        await subscriptionManager.reactivateSubscription(userId);
        console.log(`Subscription reactivated after successful payment for user: ${userId}`);
      }

      // TODO: Send payment receipt email
      // TODO: Log payment in analytics

      console.log('Payment processed successfully:', invoice.id);
    }
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error);
    throw error;
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  try {
    // Get subscription ID from invoice
    const subscriptionId = invoice.subscription;

    if (subscriptionId) {
      // Retrieve subscription to check status
      const subscription = await stripeService.getSubscription(subscriptionId);

      // Get user ID from subscription metadata
      const userId = subscription.metadata?.supabase_user_id;
      const customerId = invoice.customer;

      if (userId) {
        // Trigger grace period and dunning sequence
        await subscriptionManager.handlePaymentFailure(userId, customerId, invoice);

        console.log(`Payment failure handled for user ${userId}. Grace period initiated.`);
        console.log('Subscription status:', subscription.status);
      } else {
        console.error('No user ID found in subscription metadata for:', subscriptionId);
      }
    }
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error);
    throw error;
  }
}

/**
 * Handle trial ending soon event
 */
async function handleTrialWillEnd(subscription) {
  console.log('Processing subscription.trial_will_end:', subscription.id);

  try {
    // TODO: Send trial ending reminder email
    // TODO: Offer upgrade incentive (20% off first month)
    // TODO: Highlight value received during trial

    console.log('Trial ending reminder sent:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription.trial_will_end:', error);
    throw error;
  }
}

export default handleStripeWebhook;
