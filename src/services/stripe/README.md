# Stripe Service Documentation

## Overview

The Stripe service handles all subscription and billing operations for Prismify, including:

- Customer creation and management
- Subscription lifecycle (create, update, cancel)
- Checkout session generation
- Billing portal access
- Webhook event processing
- Usage-based quota enforcement

## Setup

### 1. Install Stripe

```bash
npm install stripe
```

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Stripe Keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create products in Stripe Dashboard first)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_ANNUAL=price_...
```

### 3. Create Products in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Click "Add product"
3. Create three products with these configurations:

**Starter Plan**

- Name: "Starter Plan"
- Description: "Perfect for freelancers and small businesses"
- Pricing:
  - Monthly: $49/month (recurring)
  - Annual: $470/year (recurring) - 20% discount
- Metadata: `tier=starter`

**Professional Plan**

- Name: "Professional Plan"
- Description: "For growing agencies and businesses"
- Pricing:
  - Monthly: $149/month (recurring)
  - Annual: $1,430/year (recurring) - 20% discount
- Metadata: `tier=professional`

**Agency Plan**

- Name: "Agency Plan"
- Description: "Enterprise-grade SEO for large agencies"
- Pricing:
  - Monthly: $499/month (recurring)
  - Annual: $4,790/year (recurring) - 20% discount
- Metadata: `tier=agency`

4. Copy the price IDs and add them to `.env`

### 4. Configure Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the webhook signing secret and add to `.env` as `STRIPE_WEBHOOK_SECRET`

## API Reference

### Create Checkout Session

Create a Stripe Checkout session for new subscriptions:

```javascript
import stripeService from './services/stripe/stripeService.js';

const session = await stripeService.createCheckoutSession(
  userId,
  userEmail,
  priceId,
  'https://yoursite.com/success',
  'https://yoursite.com/cancel',
  true // Include 14-day trial
);

// Redirect user to session.url
```

### Create Subscription (Direct)

Create a subscription without Checkout (for admin/API use):

```javascript
const subscription = await stripeService.createSubscription(
  userId,
  priceId,
  false // No trial
);
```

### Get Subscription

```javascript
const subscription = await stripeService.getSubscription(subscriptionId);
```

### Update Subscription (Change Plan)

```javascript
const updatedSubscription = await stripeService.updateSubscription(subscriptionId, newPriceId);
```

### Cancel Subscription

```javascript
// Cancel at period end (default)
const subscription = await stripeService.cancelSubscription(subscriptionId);

// Cancel immediately
const subscription = await stripeService.cancelSubscription(subscriptionId, true);
```

### Reactivate Subscription

```javascript
const subscription = await stripeService.reactivateSubscription(subscriptionId);
```

### Create Billing Portal Session

```javascript
const portalSession = await stripeService.createPortalSession(
  customerId,
  'https://yoursite.com/dashboard'
);

// Redirect user to portalSession.url
```

### Get Tier from Price ID

```javascript
const tier = stripeService.getTierFromPriceId(priceId);
// Returns: 'starter', 'professional', 'agency', or null
```

### Get Tier Quotas

```javascript
const quotas = stripeService.getTierQuotas('professional');
// Returns: { audits_per_month: 50, keywords_per_month: 500, max_projects: 20 }
```

## Billing Routes

### POST /api/billing/checkout

Create checkout session for new subscription.

**Request:**

```json
{
  "priceId": "price_xxx",
  "successUrl": "https://yoursite.com/success",
  "cancelUrl": "https://yoursite.com/cancel"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxx",
    "url": "https://checkout.stripe.com/c/pay/xxx"
  }
}
```

### POST /api/billing/portal

Create billing portal session (requires existing subscription).

**Request:**

```json
{
  "returnUrl": "https://yoursite.com/dashboard"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/p/session/xxx"
  }
}
```

### GET /api/billing/subscription

Get current user's subscription details.

**Response:**

```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "subscription": {
      "id": "sub_xxx",
      "tier": "professional",
      "status": "active",
      "currentPeriodStart": "2025-11-01T00:00:00Z",
      "currentPeriodEnd": "2025-12-01T00:00:00Z",
      "cancelAtPeriodEnd": false,
      "canceledAt": null
    },
    "quotas": {
      "audits_per_month": 50,
      "keywords_per_month": 500,
      "max_projects": 20
    }
  }
}
```

### POST /api/billing/subscription/change

Change subscription plan (upgrade/downgrade).

**Request:**

```json
{
  "newPriceId": "price_xxx"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Subscription updated successfully",
    "subscription": {
      "id": "sub_xxx",
      "status": "active"
    }
  }
}
```

### POST /api/billing/subscription/cancel

Cancel subscription.

**Request:**

```json
{
  "immediately": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Subscription will cancel at period end",
    "subscription": {
      "id": "sub_xxx",
      "status": "active",
      "cancelAtPeriodEnd": true
    }
  }
}
```

### POST /api/billing/subscription/reactivate

Reactivate canceled subscription (before period ends).

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Subscription reactivated successfully",
    "subscription": {
      "id": "sub_xxx",
      "status": "active",
      "cancelAtPeriodEnd": false
    }
  }
}
```

## Webhook Events

The webhook handler processes these Stripe events:

### customer.subscription.created

Triggered when a new subscription is created.

**Actions:**

- Syncs subscription to database
- Updates user's subscription_tier
- TODO: Send welcome email
- TODO: Trigger onboarding sequence

### customer.subscription.updated

Triggered when subscription is modified (plan change, cancellation, reactivation).

**Actions:**

- Syncs updated subscription to database
- Detects cancellation and triggers win-back campaign
- Detects reactivation and sends confirmation

### customer.subscription.deleted

Triggered when subscription is permanently deleted.

**Actions:**

- Sets user to free tier
- Updates database status to 'canceled'
- TODO: Send goodbye email with data export option
- TODO: Archive user data (90-day retention)

### invoice.payment_succeeded

Triggered when payment is successful.

**Actions:**

- Syncs subscription status
- TODO: Send payment receipt
- TODO: Log payment in analytics

### invoice.payment_failed

Triggered when payment fails.

**Actions:**

- TODO: Send payment failed email
- TODO: Trigger dunning sequence (3-day grace period)
- TODO: Alert if high-value customer

### customer.subscription.trial_will_end

Triggered 3 days before trial ends.

**Actions:**

- TODO: Send trial ending reminder
- TODO: Offer upgrade incentive
- TODO: Highlight value received during trial

## Usage Tracking & Quota Enforcement

### Check Quota Middleware

Use the `checkQuota` middleware to enforce subscription limits:

```javascript
import { checkQuota } from './middleware/subscription.js';

router.post('/api/audits', requireAuth, checkQuota('audits'), createAudit);
router.post('/api/keywords/research', requireAuth, checkQuota('keywords'), researchKeywords);
```

### Get Usage Stats

```javascript
import usageTracker from './services/usageTracker.js';

const stats = await usageTracker.getUsageStats(userId);
```

**Response:**

```json
{
  "tier": "professional",
  "quotas": {
    "audits_per_month": 50,
    "keywords_per_month": 500,
    "max_projects": 20
  },
  "usage": {
    "audits_used": 32,
    "keywords_used": 280,
    "projects_created": 8,
    "period_start": "2025-11-01T00:00:00Z",
    "period_end": "2025-11-30T23:59:59Z"
  },
  "percentages": {
    "audits": 64,
    "keywords": 56,
    "projects": 40
  },
  "warnings": {
    "auditsNearLimit": false,
    "keywordsNearLimit": false,
    "projectsNearLimit": false
  }
}
```

## Testing

### Test in Stripe Test Mode

1. Use test API keys (start with `sk_test_` and `pk_test_`)
2. Use test card numbers: `4242 4242 4242 4242`
3. Any future expiry date, any CVC

### Test Webhooks Locally

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy webhook signing secret to .env
STRIPE_WEBHOOK_SECRET=whsec_...

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

## Security Best Practices

1. **Never expose secret key** - Only use on server-side
2. **Verify webhook signatures** - Always use `stripe.webhooks.constructEvent()`
3. **Use HTTPS in production** - Required for webhooks
4. **Validate price IDs** - Don't trust client-sent price IDs without validation
5. **Log all subscription events** - For audit trail and debugging
6. **Handle idempotency** - Stripe may send duplicate webhook events
7. **Test error scenarios** - Payment failures, expired cards, etc.

## Common Issues

### Webhook Not Receiving Events

- Check webhook URL is accessible publicly
- Verify signing secret matches Stripe Dashboard
- Check webhook endpoint is listening for correct events
- Review Stripe Dashboard webhook logs

### Subscription Not Syncing to Database

- Check `metadata.supabase_user_id` is set correctly
- Verify Supabase service role key has write permissions
- Check database RLS policies allow service role access

### Customer Can't Access Billing Portal

- Verify customer has an active Stripe subscription
- Check `stripe_customer_id` is stored in database
- Ensure return URL is valid

## Migration from Existing System

If migrating from another billing system:

1. Export customer and subscription data
2. Import customers to Stripe via API
3. Create subscriptions with billing_cycle_anchor to match current period
4. Update database with Stripe IDs
5. Test webhook flow before switching DNS

## Support

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com
- **Prismify Issues:** Create issue in GitHub repository

---

**Last Updated:** November 7, 2025  
**Module Owner:** Prismify Development Team
