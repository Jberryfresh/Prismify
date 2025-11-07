/**
 * Stripe Service - Subscription Management and Billing
 *
 * Handles all Stripe operations:
 * - Customer creation and management
 * - Subscription lifecycle (create, update, cancel)
 * - Payment method management
 * - Webhook event processing
 * - Usage-based billing and metering
 *
 * @module services/stripe/stripeService
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Price IDs for subscription tiers
 * These should be set in .env file after creating products in Stripe Dashboard
 */
const PRICE_IDS = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
  professional_annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
  agency_monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY,
  agency_annual: process.env.STRIPE_PRICE_AGENCY_ANNUAL,
};

/**
 * Subscription tier quotas
 */
const TIER_QUOTAS = {
  starter: {
    audits_per_month: 10,
    keywords_per_month: 50,
    max_projects: 3,
  },
  professional: {
    audits_per_month: 50,
    keywords_per_month: 500,
    max_projects: 20,
  },
  agency: {
    audits_per_month: -1, // unlimited
    keywords_per_month: -1, // unlimited
    max_projects: -1, // unlimited
  },
};

/**
 * Create or retrieve Stripe customer for user
 *
 * @param {string} userId - Supabase user ID
 * @param {string} email - User email
 * @param {string} name - User full name
 * @returns {Promise<Object>} Stripe customer object
 */
export async function createOrGetCustomer(userId, email, name) {
  try {
    // Check if customer already exists in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    if (user?.stripe_customer_id) {
      // Return existing customer
      const customer = await stripe.customers.retrieve(user.stripe_customer_id);
      return customer;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        supabase_user_id: userId,
      },
    });

    // Store customer ID in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return customer;
  } catch (error) {
    console.error('Error creating/getting customer:', error);
    throw error;
  }
}

/**
 * Create checkout session for subscription
 *
 * @param {string} userId - Supabase user ID
 * @param {string} email - User email
 * @param {string} priceId - Stripe price ID
 * @param {string} successUrl - Success redirect URL
 * @param {string} cancelUrl - Cancel redirect URL
 * @param {boolean} trialPeriod - Whether to include 14-day trial
 * @returns {Promise<Object>} Checkout session object
 */
export async function createCheckoutSession(
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
  trialPeriod = true
) {
  try {
    // Get or create customer
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, full_name')
      .eq('id', userId)
      .single();

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await createOrGetCustomer(userId, email, user?.full_name || email);
      customerId = customer.id;
    }

    // Create checkout session
    const sessionConfig = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: userId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
        },
      },
    };

    // Add trial period if requested
    if (trialPeriod) {
      sessionConfig.subscription_data.trial_period_days = 14;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create subscription directly (for admin/API use)
 *
 * @param {string} userId - Supabase user ID
 * @param {string} priceId - Stripe price ID
 * @param {boolean} trialPeriod - Whether to include 14-day trial
 * @returns {Promise<Object>} Subscription object
 */
export async function createSubscription(userId, priceId, trialPeriod = false) {
  try {
    // Get customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await createOrGetCustomer(userId, user.email, user.full_name);
      customerId = customer.id;
    }

    // Create subscription
    const subscriptionConfig = {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        supabase_user_id: userId,
      },
    };

    if (trialPeriod) {
      subscriptionConfig.trial_period_days = 14;
    }

    const subscription = await stripe.subscriptions.create(subscriptionConfig);

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Get subscription by ID
 *
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} Subscription object
 */
export async function getSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Update subscription (change plan)
 *
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} newPriceId - New Stripe price ID
 * @returns {Promise<Object>} Updated subscription object
 */
export async function updateSubscription(subscriptionId, newPriceId) {
  try {
    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice', // Charge/credit difference immediately
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription (at period end)
 *
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {boolean} immediately - Cancel immediately instead of at period end
 * @returns {Promise<Object>} Updated subscription object
 */
export async function cancelSubscription(subscriptionId, immediately = false) {
  try {
    if (immediately) {
      // Cancel immediately
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } else {
      // Cancel at period end
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return subscription;
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Reactivate canceled subscription (before period ends)
 *
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} Updated subscription object
 */
export async function reactivateSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

/**
 * Create billing portal session
 *
 * @param {string} customerId - Stripe customer ID
 * @param {string} returnUrl - URL to return to after portal session
 * @returns {Promise<Object>} Portal session object
 */
export async function createPortalSession(customerId, returnUrl) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

/**
 * Get subscription tier from price ID
 *
 * @param {string} priceId - Stripe price ID
 * @returns {string} Tier name (starter, professional, agency)
 */
export function getTierFromPriceId(priceId) {
  if (priceId === PRICE_IDS.starter_monthly || priceId === PRICE_IDS.starter_annual) {
    return 'starter';
  } else if (
    priceId === PRICE_IDS.professional_monthly ||
    priceId === PRICE_IDS.professional_annual
  ) {
    return 'professional';
  } else if (priceId === PRICE_IDS.agency_monthly || priceId === PRICE_IDS.agency_annual) {
    return 'agency';
  }
  return null;
}

/**
 * Get tier quotas
 *
 * @param {string} tier - Tier name (starter, professional, agency)
 * @returns {Object} Quota limits
 */
export function getTierQuotas(tier) {
  return TIER_QUOTAS[tier] || TIER_QUOTAS.starter;
}

/**
 * Sync subscription to database
 *
 * @param {Object} subscription - Stripe subscription object
 * @returns {Promise<void>}
 */
export async function syncSubscriptionToDatabase(subscription) {
  try {
    const userId = subscription.metadata.supabase_user_id;
    const priceId = subscription.items.data[0].price.id;
    const tier = getTierFromPriceId(priceId);

    // Update users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
      })
      .eq('id', userId);

    if (userError) {
      throw userError;
    }

    // Insert/update subscriptions table
    const { error: subError } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        plan_name: tier,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
      },
      { onConflict: 'stripe_subscription_id' }
    );

    if (subError) {
      throw subError;
    }
  } catch (error) {
    console.error('Error syncing subscription to database:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted event
 *
 * @param {Object} subscription - Stripe subscription object
 * @returns {Promise<void>}
 */
export async function handleSubscriptionDeleted(subscription) {
  try {
    const userId = subscription.metadata.supabase_user_id;

    // Update users table to free tier
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_tier: 'free',
        stripe_subscription_id: null,
        subscription_status: 'canceled',
      })
      .eq('id', userId);

    if (userError) {
      throw userError;
    }

    // Update subscriptions table
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subError) {
      throw subError;
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

/**
 * List invoices for a customer
 *
 * @param {string} customerId - Stripe customer ID
 * @param {number} limit - Number of invoices to retrieve (default: 10, max: 100)
 * @returns {Promise<Object>} - Invoice list
 */
export async function listInvoices(customerId, limit = 10) {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: Math.min(limit, 100),
    });

    return {
      invoices: invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_due,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000).toISOString(),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
        paidAt: invoice.status_transitions.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        periodStart: new Date(invoice.period_start * 1000).toISOString(),
        periodEnd: new Date(invoice.period_end * 1000).toISOString(),
      })),
      hasMore: invoices.has_more,
    };
  } catch (error) {
    console.error('Error listing invoices:', error);
    throw error;
  }
}

/**
 * Get a specific invoice
 *
 * @param {string} invoiceId - Stripe invoice ID
 * @returns {Promise<Object>} - Invoice details
 */
export async function getInvoice(invoiceId) {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);

    return {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000).toISOString(),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      periodStart: new Date(invoice.period_start * 1000).toISOString(),
      periodEnd: new Date(invoice.period_end * 1000).toISOString(),
      lines: invoice.lines.data.map((line) => ({
        id: line.id,
        description: line.description,
        amount: line.amount,
        quantity: line.quantity,
        price: line.price?.unit_amount,
      })),
    };
  } catch (error) {
    console.error('Error retrieving invoice:', error);
    throw error;
  }
}

/**
 * Get upcoming invoice for a subscription
 *
 * @param {string} customerId - Stripe customer ID
 * @param {string} subscriptionId - Stripe subscription ID (optional)
 * @returns {Promise<Object|null>} - Upcoming invoice preview or null
 */
export async function getUpcomingInvoice(customerId, subscriptionId = null) {
  try {
    const params = { customer: customerId };
    if (subscriptionId) {
      params.subscription = subscriptionId;
    }

    const invoice = await stripe.invoices.retrieveUpcoming(params);

    return {
      amount: invoice.amount_due,
      currency: invoice.currency,
      periodStart: new Date(invoice.period_start * 1000).toISOString(),
      periodEnd: new Date(invoice.period_end * 1000).toISOString(),
      lines: invoice.lines.data.map((line) => ({
        description: line.description,
        amount: line.amount,
        quantity: line.quantity,
      })),
    };
  } catch (error) {
    // No upcoming invoice (e.g., canceled subscription)
    if (error.code === 'invoice_upcoming_none') {
      return null;
    }
    console.error('Error retrieving upcoming invoice:', error);
    throw error;
  }
}

/**
 * Download invoice PDF
 * Returns the PDF URL from Stripe
 *
 * @param {string} invoiceId - Stripe invoice ID
 * @returns {Promise<string>} - PDF URL
 */
export async function downloadInvoicePDF(invoiceId) {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);

    if (!invoice.invoice_pdf) {
      throw new Error('Invoice PDF not available');
    }

    return invoice.invoice_pdf;
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    throw error;
  }
}

export default {
  createOrGetCustomer,
  createCheckoutSession,
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  createPortalSession,
  getTierFromPriceId,
  getTierQuotas,
  syncSubscriptionToDatabase,
  handleSubscriptionDeleted,
  listInvoices,
  getInvoice,
  getUpcomingInvoice,
  downloadInvoicePDF,
  stripe, // Export stripe instance for advanced usage
};
