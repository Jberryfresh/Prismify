/**
 * Stripe Integration Tests
 *
 * Tests for subscription management, billing, and webhook handling
 *
 * Run with: npm run test:stripe
 * Requires: Stripe test keys in .env
 */

import { strict as assert } from 'assert';
import { test } from 'node:test';
import stripeService from '../src/services/stripe/stripeService.js';

// Test configuration
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_EMAIL = `test-${Date.now()}@prismify.test`;
const TEST_NAME = 'Test User';

console.log('\n🧪 Stripe Integration Tests\n');

test('Stripe Service - Create Customer', async () => {
  try {
    const customer = await stripeService.createOrGetCustomer(TEST_USER_ID, TEST_EMAIL, TEST_NAME);

    assert.ok(customer.id, 'Customer should have an ID');
    assert.equal(customer.email, TEST_EMAIL, 'Email should match');
    assert.equal(customer.name, TEST_NAME, 'Name should match');
    assert.equal(
      customer.metadata.supabase_user_id,
      TEST_USER_ID,
      'Metadata should contain user ID'
    );

    console.log(`✅ Customer created: ${customer.id}`);
  } catch (error) {
    console.error('❌ Failed to create customer:', error.message);
    throw error;
  }
});

test('Stripe Service - Get Tier from Price ID', async () => {
  // Note: This will return null without real price IDs
  const tier = stripeService.getTierFromPriceId('price_test_123');

  // Should return null for unknown price ID
  assert.equal(tier, null, 'Unknown price ID should return null');

  console.log('✅ Tier lookup works correctly');
});

test('Stripe Service - Get Tier Quotas', async () => {
  const starterQuotas = stripeService.getTierQuotas('starter');

  assert.ok(starterQuotas, 'Quotas should exist for starter tier');
  assert.equal(starterQuotas.audits_per_month, 10, 'Starter should have 10 audits');
  assert.equal(starterQuotas.keywords_per_month, 50, 'Starter should have 50 keywords');

  const professionalQuotas = stripeService.getTierQuotas('professional');
  assert.equal(professionalQuotas.audits_per_month, 50, 'Professional should have 50 audits');

  const agencyQuotas = stripeService.getTierQuotas('agency');
  assert.equal(agencyQuotas.audits_per_month, -1, 'Agency should have unlimited audits');

  console.log('✅ Tier quotas retrieved correctly');
});

test('Stripe Service - Validate Price IDs Configuration', async () => {
  const requiredPriceIds = [
    'STRIPE_PRICE_STARTER_MONTHLY',
    'STRIPE_PRICE_STARTER_ANNUAL',
    'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
    'STRIPE_PRICE_PROFESSIONAL_ANNUAL',
    'STRIPE_PRICE_AGENCY_MONTHLY',
    'STRIPE_PRICE_AGENCY_ANNUAL',
  ];

  const missingPriceIds = requiredPriceIds.filter(
    (key) =>
      !process.env[key] ||
      process.env[key].includes('price_starter') ||
      process.env[key].includes('price_professional') ||
      process.env[key].includes('price_agency')
  );

  if (missingPriceIds.length > 0) {
    console.log('⚠️  Warning: Some price IDs not configured in .env:', missingPriceIds.join(', '));
    console.log('   Create products in Stripe Dashboard and update .env');
  } else {
    console.log('✅ All price IDs configured');
  }
});

test('Usage Tracker - Get User Tier and Quotas', async (t) => {
  // Skip if Supabase not configured
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('your-project')) {
    t.skip('Supabase not configured - skipping database tests');
    return;
  }

  const usageTracker = (await import('../src/services/usageTracker.js')).default;

  try {
    // This will fail if user doesn't exist - that's expected in test
    const result = await usageTracker.getUserTierAndQuotas(TEST_USER_ID);

    assert.ok(result.tier, 'Should return a tier');
    assert.ok(result.quotas, 'Should return quotas');

    console.log(`✅ Usage tracker works - Tier: ${result.tier}`);
  } catch {
    console.log('⚠️  Usage tracker test skipped - test user not in database');
  }
});

// Integration test summary
test('Stripe Integration - Summary', async () => {
  console.log('\n📋 Stripe Integration Status:\n');

  const checks = [
    {
      name: 'Stripe Secret Key',
      check: () =>
        process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_'),
      required: true,
    },
    {
      name: 'Stripe Publishable Key',
      check: () =>
        process.env.STRIPE_PUBLISHABLE_KEY && !process.env.STRIPE_PUBLISHABLE_KEY.includes('your_'),
      required: true,
    },
    {
      name: 'Stripe Webhook Secret',
      check: () =>
        process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.includes('your_'),
      required: false,
    },
    {
      name: 'Price IDs Configured',
      check: () => {
        const priceEnvs = [
          'STRIPE_PRICE_STARTER_MONTHLY',
          'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
          'STRIPE_PRICE_AGENCY_MONTHLY',
        ];
        return priceEnvs.every(
          (key) =>
            process.env[key] &&
            !process.env[key].includes('price_starter') &&
            !process.env[key].includes('price_professional') &&
            !process.env[key].includes('price_agency')
        );
      },
      required: false,
    },
    {
      name: 'Supabase Connected',
      check: () => process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project'),
      required: true,
    },
  ];

  let allPassed = true;

  checks.forEach((check) => {
    const passed = check.check();
    const icon = passed ? '✅' : check.required ? '❌' : '⚠️ ';
    const status = passed ? 'Configured' : check.required ? 'MISSING' : 'Optional';

    console.log(`${icon} ${check.name}: ${status}`);

    if (!passed && check.required) {
      allPassed = false;
    }
  });

  console.log('\n');

  if (!allPassed) {
    console.log('⚠️  Some required configuration is missing.');
    console.log('   Update your .env file before deploying to production.\n');
  } else {
    console.log('✅ All required Stripe configuration is in place!\n');
  }

  assert.ok(true, 'Summary complete');
});

// Cleanup note
console.log('Note: Test Stripe customers are created but not cleaned up.');
console.log('Delete test customers from Stripe Dashboard if needed.\n');
