# Stripe Setup Guide

Complete guide to setting up Stripe for Prismify's subscription billing system.

---

## Table of Contents

1. [Create Stripe Account](#1-create-stripe-account)
2. [Get API Keys](#2-get-api-keys)
3. [Configure Webhooks](#3-configure-webhooks)
4. [Create Subscription Products](#4-create-subscription-products)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Test Mode vs Live Mode](#6-test-mode-vs-live-mode)
7. [Testing Locally](#7-testing-locally)
8. [Troubleshooting](#troubleshooting)

---

## 1. Create Stripe Account

### Step 1: Sign Up

1. Go to [https://stripe.com](https://stripe.com)
2. Click **"Start now"** or **"Sign up"**
3. Enter your email address and create a password
4. Verify your email address
5. Complete the onboarding questionnaire (business type, location, etc.)

### Step 2: Activate Your Account

For **Test Mode** (development):

- ✅ No activation required - you can start immediately
- ✅ No business verification needed
- ✅ Use test cards for payments

For **Live Mode** (production):

- 📋 Business verification required
- 📋 Bank account details needed for payouts
- 📋 Identity verification for account owner
- ⏱️ Activation can take 1-2 business days

**For now, we'll use Test Mode for development.**

---

## 2. Get API Keys

### Step 1: Navigate to API Keys

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in the top-right corner should say "Test mode")
3. Click **"Developers"** in the top navigation
4. Click **"API keys"** in the sidebar

### Step 2: Copy Your Keys

You'll see two types of keys:

#### Publishable Key (Public)

- **Format**: `pk_test_xxxxxxxxxxxxxxxxxxxxx`
- **Usage**: Used in frontend/client-side code
- **Safe to expose**: Yes, can be in public repositories
- **Copy this**: Click the "Reveal test key" button and copy it

#### Secret Key (Private)

- **Format**: `sk_test_xxxxxxxxxxxxxxxxxxxxx`
- **Usage**: Used in backend/server-side code
- **Safe to expose**: ⚠️ **NO - NEVER commit to git or expose publicly**
- **Copy this**: Click the "Reveal test key" button and copy it

### Step 3: Store Keys Securely

Add these to your `.env` file (already in `.gitignore`):

```bash
# Stripe API Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Security Note**:

- The secret key has full access to your Stripe account
- Never commit `.env` to version control
- Never hardcode keys in your source code
- Use environment variables exclusively

---

## 3. Configure Webhooks

Stripe webhooks notify your server about subscription events (payment succeeded, subscription canceled, etc.).

### Step 1: Create Webhook Endpoint

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. For **local development**, use ngrok or Stripe CLI (see Section 7)
4. For **production**, use your actual domain:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```

### Step 2: Select Events to Listen

Select these events (critical for subscription management):

**Payment Events:**

- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

**Subscription Events:**

- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`

**Invoice Events:**

- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `invoice.finalized`

**Customer Events:**

- ✅ `customer.created`
- ✅ `customer.updated`
- ✅ `customer.deleted`

### Step 3: Get Webhook Secret

1. After creating the webhook, click on it
2. Click **"Reveal"** next to "Signing secret"
3. Copy the webhook signing secret (format: `whsec_xxxxxxxxxxxxxxxxxxxxx`)
4. Add to your `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Why webhook secrets?** They verify that webhook events genuinely come from Stripe, preventing malicious requests.

---

## 4. Create Subscription Products

Prismify has 3 subscription tiers: Starter, Professional, Agency.

### Step 1: Navigate to Products

1. In Stripe Dashboard → **Product catalog** → **Products**
2. Click **"Add product"**

### Step 2: Create Each Product

#### **Product 1: Starter Plan**

- **Name**: `Prismify Starter`
- **Description**: `10 SEO audits per month, basic keyword research, PDF reports`
- **Pricing**:
  - Model: **Recurring**
  - Price: **$49.00 USD**
  - Billing period: **Monthly**
- **Tax behavior**: Leave default
- Click **"Save product"**
- **Copy the Price ID**: `price_xxxxxxxxxxxxxxxxxxxxx`

#### **Product 2: Professional Plan**

- **Name**: `Prismify Professional`
- **Description**: `50 SEO audits per month, advanced keyword research, competitor analysis, white-label reports`
- **Pricing**:
  - Model: **Recurring**
  - Price: **$149.00 USD**
  - Billing period: **Monthly**
- Click **"Save product"**
- **Copy the Price ID**: `price_xxxxxxxxxxxxxxxxxxxxx`

#### **Product 3: Agency Plan**

- **Name**: `Prismify Agency`
- **Description**: `Unlimited SEO audits, API access, team management, priority support, custom integrations`
- **Pricing**:
  - Model: **Recurring**
  - Price: **$499.00 USD**
  - Billing period: **Monthly**
- Click **"Save product"**
- **Copy the Price ID**: `price_xxxxxxxxxxxxxxxxxxxxx`

### Step 3: Add Price IDs to Environment

Add all three price IDs to your `.env`:

```bash
# Stripe Price IDs (Test Mode)
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_AGENCY=price_xxxxxxxxxxxxxxxxxxxxx
```

### Optional: Add Annual Pricing

For each product, you can add a second price with:

- Billing period: **Yearly**
- Price: **Monthly price × 10** (2 months free discount)
  - Starter: $490/year (save $98)
  - Professional: $1,490/year (save $298)
  - Agency: $4,990/year (save $998)

---

## 5. Configure Environment Variables

Your complete `.env` file should now have:

```bash
# Stripe Configuration (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Stripe Price IDs
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_AGENCY=price_xxxxxxxxxxxxxxxxxxxxx

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxxxxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Verify Configuration

Run this command to test your Stripe connection:

```powershell
node -e "const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); stripe.products.list({ limit: 3 }).then(p => console.log('✅ Stripe connected:', p.data.length, 'products')).catch(e => console.error('❌ Error:', e.message));"
```

Expected output:

```
✅ Stripe connected: 3 products
```

---

## 6. Test Mode vs Live Mode

### Test Mode (Development)

**Characteristics:**

- 🧪 No real money charged
- 🧪 Use test credit cards
- 🧪 Instant "payments" without actual processing
- 🧪 Can create unlimited test data
- 🧪 Keys start with `pk_test_` and `sk_test_`

**Test Credit Cards:**

```
Visa (Success):          4242 4242 4242 4242
Visa (Decline):          4000 0000 0000 0002
Mastercard:              5555 5555 5555 4444
American Express:        3782 822463 10005

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

[Full list of test cards](https://stripe.com/docs/testing)

### Live Mode (Production)

**Before switching to live mode:**

1. ✅ Complete Stripe account activation
2. ✅ Verify business details
3. ✅ Add bank account for payouts
4. ✅ Review pricing and tax settings
5. ✅ Test all subscription flows thoroughly in test mode
6. ✅ Set up webhook endpoint on production domain
7. ✅ Update environment variables with live keys (`pk_live_`, `sk_live_`)

**Switch when:**

- Your app is fully tested
- You're ready to accept real payments
- Business verification is complete

---

## 7. Testing Locally

### Option 1: Stripe CLI (Recommended)

The Stripe CLI forwards webhook events to your local server.

#### Install Stripe CLI

**Windows (PowerShell):**

```powershell
# Install via Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

Or download from: [https://github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)

**macOS:**

```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**

```bash
# Download and extract
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin
```

#### Login to Stripe

```powershell
stripe login
```

This opens your browser for authentication.

#### Forward Webhooks to Local Server

```powershell
# Start your Express server first
npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This command gives you a webhook signing secret starting with `whsec_`. Use this for local development.

#### Test Webhook Events

```powershell
# Trigger a test event
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

### Option 2: ngrok (Alternative)

If Stripe CLI doesn't work, use ngrok to expose your local server:

```powershell
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

Use the ngrok URL (e.g., `https://abc123.ngrok.io/api/webhooks/stripe`) in your Stripe webhook settings.

---

## Troubleshooting

### Error: "No such customer"

**Problem**: Trying to access a customer that doesn't exist in Stripe.

**Solution**:

- Ensure you create the customer in Stripe before referencing them
- Check that you're using the correct Stripe mode (test vs live)
- Verify the customer ID format: `cus_xxxxxxxxxxxxxxxxxxxxx`

### Error: "Invalid API Key"

**Problem**: Stripe can't authenticate your request.

**Solutions**:

1. Verify the key is correctly copied (no extra spaces)
2. Check you're using the secret key (`sk_test_...`) on the server
3. Ensure the key matches the current mode (test/live)
4. Regenerate the key if compromised

### Error: "No such price"

**Problem**: Price ID doesn't exist or is from wrong mode.

**Solutions**:

1. Verify price IDs in Stripe Dashboard → Products
2. Ensure you're in the correct mode (test/live)
3. Check for typos in `.env` file
4. Recreate the product/price if needed

### Webhooks Not Receiving Events

**Problem**: Your webhook endpoint isn't receiving Stripe events.

**Solutions**:

1. Check webhook endpoint URL is correct
2. Verify webhook is enabled in Stripe Dashboard
3. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Check server logs for incoming requests
5. Verify webhook secret is correct
6. Ensure endpoint returns 200 status code

### "This customer has no attached payment source"

**Problem**: Trying to charge a customer without a payment method.

**Solution**:

- Use Stripe Checkout or Payment Intents to collect payment first
- Or attach a payment method to the customer before creating subscription

### Rate Limiting Errors

**Problem**: Too many API requests in short time.

**Solutions**:

- Test mode: 100 requests per second
- Implement exponential backoff for retries
- Cache Stripe data when possible
- Use webhooks instead of polling

---

## Next Steps

After completing this setup:

1. ✅ **Test Subscription Flow**

   ```powershell
   npm test
   ```

2. ✅ **Verify Webhook Integration**
   - Create a test subscription in your app
   - Check Stripe Dashboard → Developers → Events
   - Verify events are received and processed

3. ✅ **Review Stripe Logs**
   - Dashboard → Developers → Logs
   - Monitor API requests and responses

4. ✅ **Read Prismify Docs**
   - See `docs/SUBSCRIPTION_RBAC.md` for subscription tier management
   - See `src/routes/webhooks/stripe.js` for webhook implementation

---

## Useful Resources

- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **API Reference**: [https://stripe.com/docs/api](https://stripe.com/docs/api)
- **Testing Guide**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhooks Guide**: [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Subscription Guide**: [https://stripe.com/docs/billing/subscriptions/overview](https://stripe.com/docs/billing/subscriptions/overview)
- **Stripe CLI**: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

---

## Security Checklist

Before going to production:

- [ ] API keys stored in `.env` (not hardcoded)
- [ ] `.env` in `.gitignore`
- [ ] Webhook signature verification implemented
- [ ] HTTPS enabled for webhook endpoint
- [ ] Rate limiting on API routes
- [ ] Input validation on all Stripe-related endpoints
- [ ] Error handling doesn't expose sensitive data
- [ ] Regular security audits of Stripe integration
- [ ] Monitor Stripe logs for suspicious activity
- [ ] Implement proper logging (without exposing keys)

---

**Need Help?**

- Prismify Issues: [GitHub Issues](https://github.com/Jberryfresh/Prismify/issues)
- Stripe Support: [https://support.stripe.com](https://support.stripe.com)
- Email: support@prismify.app (when live)

---

**Last Updated**: November 7, 2025  
**Prismify Version**: MVP (Phase 2.3)  
**Stripe API Version**: 2024-11-20.acacia
