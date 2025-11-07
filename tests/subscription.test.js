/**
 * Subscription & RBAC Tests
 *
 * Integration tests for subscription tier enforcement and role-based access control.
 * Tests quota limits, feature access, and tier requirements.
 *
 * **NOTE:** These tests query Supabase (cloud), not local PostgreSQL.
 * To run successfully, you need:
 * 1. Valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 * 2. Test users in Supabase users table with IDs matching below
 * 3. Run seed data against Supabase (not just local Docker)
 *
 * For local testing only (without Supabase), these tests will fail with "User subscription not found".
 * This is expected behavior. The middleware is designed for production use with Supabase.
 *
 * To set up test data in Supabase:
 * 1. Sign up 3 test users via Supabase Auth
 * 2. Update their subscription_tier in the users table
 * 3. Update the USER_ID constants below with actual Supabase user UUIDs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../src/config/supabase.js';
import {
  requireTier,
  checkQuota,
  requireFeature,
  getQuotaInfo,
  hasFeatureAccess,
  getUserFeatures,
} from '../src/middleware/subscription.js';

// Test user IDs from seed data (check database with: docker exec prismify-postgres psql -U prismify -d prismify_dev -c "SELECT id, email, subscription_tier FROM users;")
// These IDs are for LOCAL database only. For Supabase tests, replace with actual Supabase user IDs.
const STARTER_USER_ID = 'c8d934b7-00ee-46de-8a97-26062f249d4c'; // starter@prismify.test (LOCAL)
const PROFESSIONAL_USER_ID = 'f43d71f8-129a-461b-9981-1a83a3737460'; // professional@prismify.test (LOCAL)
const AGENCY_USER_ID = 'f0c273ea-fcc1-4bbd-ae5f-8e47efd0941b'; // agency@prismify.test (LOCAL)

describe('Subscription & RBAC Tests', () => {
  let supabase;

  before(async () => {
    supabase = createClient({ admin: true });
    console.log('\n🔐 Starting subscription and RBAC tests...\n');
  });

  after(async () => {
    console.log('\n✅ Subscription tests complete!\n');
  });

  describe('Tier Hierarchy', () => {
    it('should allow starter user to access starter features', async () => {
      const req = { user: { id: STARTER_USER_ID } };
      const res = {
        status: (_code) => ({
          json: (data) => {
            assert.fail(`Should not reject starter tier: ${JSON.stringify(data)}`);
          },
        }),
      };
      const next = () => {
        assert.ok(true, 'Middleware passed for starter tier');
      };

      const middleware = requireTier('starter');
      await middleware(req, res, next);
    });

    it('should block starter user from professional features', async () => {
      const req = { user: { id: STARTER_USER_ID } };
      let blocked = false;

      const res = {
        status: (code) => ({
          json: (data) => {
            assert.equal(code, 403);
            assert.equal(data.error.code, 'INSUFFICIENT_TIER');
            blocked = true;
          },
        }),
      };
      const next = () => {
        assert.fail('Should have blocked starter user from professional tier');
      };

      const middleware = requireTier('professional');
      await middleware(req, res, next);
      assert.ok(blocked, 'Middleware correctly blocked insufficient tier');
    });

    it('should allow professional user to access professional features', async () => {
      const req = { user: { id: PROFESSIONAL_USER_ID } };
      const res = {
        status: (_code) => ({
          json: (data) => {
            assert.fail(`Should not reject professional tier: ${JSON.stringify(data)}`);
          },
        }),
      };
      const next = () => {
        assert.ok(true, 'Middleware passed for professional tier');
      };

      const middleware = requireTier('professional');
      await middleware(req, res, next);
    });

    it('should allow agency user to access all features', async () => {
      const req = { user: { id: AGENCY_USER_ID } };
      const res = {
        status: (_code) => ({
          json: (data) => {
            assert.fail(`Should not reject agency tier: ${JSON.stringify(data)}`);
          },
        }),
      };
      const next = () => {
        assert.ok(true, 'Middleware passed for agency tier');
      };

      const middleware = requireTier('agency');
      await middleware(req, res, next);
    });
  });

  describe('Quota Enforcement', () => {
    it('should return quota information for starter user', async () => {
      const quotaInfo = await getQuotaInfo(STARTER_USER_ID);

      assert.ok(quotaInfo, 'Quota info returned');
      assert.equal(quotaInfo.tier, 'starter');
      assert.ok(quotaInfo.quotas, 'Quotas object exists');
      assert.ok(quotaInfo.quotas.audits, 'Audits quota exists');
      assert.equal(quotaInfo.quotas.audits.limit, 10);

      console.log('  Starter quotas:', JSON.stringify(quotaInfo.quotas, null, 2));
    });

    it('should return unlimited quota for agency user', async () => {
      const quotaInfo = await getQuotaInfo(AGENCY_USER_ID);

      assert.equal(quotaInfo.tier, 'agency');
      assert.equal(quotaInfo.quotas.audits.limit, 'unlimited');
      assert.equal(quotaInfo.quotas.keywords.limit, 'unlimited');

      console.log('  Agency quotas:', JSON.stringify(quotaInfo.quotas, null, 2));
    });

    it('should allow agency user to bypass quota checks', async () => {
      const req = { user: { id: AGENCY_USER_ID } };
      const res = {
        status: (_code) => ({
          json: (data) => {
            assert.fail(`Should not block agency user: ${JSON.stringify(data)}`);
          },
        }),
      };
      const next = () => {
        assert.ok(true, 'Agency user bypassed quota check');
      };

      const middleware = checkQuota('audits');
      await middleware(req, res, next);
    });

    it('should track quota usage for professional user', async () => {
      const quotaInfo = await getQuotaInfo(PROFESSIONAL_USER_ID);

      assert.equal(quotaInfo.tier, 'professional');
      assert.equal(quotaInfo.quotas.audits.limit, 50);
      assert.ok(quotaInfo.quotas.audits.used >= 0, 'Usage is tracked');
      assert.ok(quotaInfo.quotas.audits.remaining >= 0, 'Remaining quota calculated');

      console.log('  Professional quotas:', JSON.stringify(quotaInfo.quotas, null, 2));
    });
  });

  describe('Feature Access', () => {
    it('should return starter features for starter user', async () => {
      const features = await getUserFeatures(STARTER_USER_ID);

      assert.ok(Array.isArray(features), 'Features is an array');
      assert.ok(features.includes('basic_audits'), 'Starter has basic_audits');
      assert.ok(features.includes('keyword_research'), 'Starter has keyword_research');
      assert.ok(
        !features.includes('competitor_analysis'),
        'Starter does not have competitor_analysis'
      );

      console.log('  Starter features:', features);
    });

    it('should return professional features for professional user', async () => {
      const features = await getUserFeatures(PROFESSIONAL_USER_ID);

      assert.ok(features.includes('basic_audits'), 'Professional has basic_audits');
      assert.ok(features.includes('competitor_analysis'), 'Professional has competitor_analysis');
      assert.ok(features.includes('api_access'), 'Professional has API access');

      console.log('  Professional features:', features);
    });

    it('should return all features for agency user', async () => {
      const features = await getUserFeatures(AGENCY_USER_ID);

      assert.ok(features.includes('basic_audits'), 'Agency has basic_audits');
      assert.ok(features.includes('competitor_analysis'), 'Agency has competitor_analysis');
      assert.ok(features.includes('priority_support'), 'Agency has priority_support');
      assert.ok(features.includes('team_collaboration'), 'Agency has team_collaboration');

      console.log('  Agency features:', features);
    });

    it('should correctly check feature access', async () => {
      const starterHasCompetitor = await hasFeatureAccess(STARTER_USER_ID, 'competitor_analysis');
      const proHasCompetitor = await hasFeatureAccess(PROFESSIONAL_USER_ID, 'competitor_analysis');

      assert.equal(starterHasCompetitor, false, 'Starter does not have competitor analysis');
      assert.equal(proHasCompetitor, true, 'Professional has competitor analysis');
    });

    it('should block starter user from professional-only features', async () => {
      const req = { user: { id: STARTER_USER_ID } };
      let blocked = false;

      const res = {
        status: (code) => ({
          json: (data) => {
            assert.equal(code, 403);
            assert.equal(data.error.code, 'FEATURE_NOT_AVAILABLE');
            blocked = true;
          },
        }),
      };
      const next = () => {
        assert.fail('Should have blocked starter user from professional feature');
      };

      const middleware = requireFeature('competitor_analysis');
      await middleware(req, res, next);
      assert.ok(blocked, 'Middleware correctly blocked feature access');
    });
  });

  describe('Database Integration', () => {
    it('should fetch subscription from users table', async () => {
      const { data: user, error } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status')
        .eq('id', STARTER_USER_ID)
        .single();

      assert.ok(!error, 'No error fetching user');
      assert.ok(user, 'User exists');
      assert.equal(user.subscription_tier, 'starter');
      assert.equal(user.subscription_status, 'active');

      console.log('  Fetched user:', user);
    });

    it('should count usage from seo_analyses table', async () => {
      const { count, error } = await supabase
        .from('seo_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', STARTER_USER_ID);

      assert.ok(!error, 'No error counting analyses');
      assert.ok(count !== null, 'Count is not null');

      console.log(`  Starter user has ${count} analyses`);
    });
  });
});
