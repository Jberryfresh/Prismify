# Subscription & RBAC System

Complete guide for implementing role-based access control and subscription tier enforcement in Prismify.

## Overview

Prismify uses a **3-tier subscription model** with quota limits and feature flags:

| Tier             | Price | Audits/Month | Keywords/Month | Features                                                    |
| ---------------- | ----- | ------------ | -------------- | ----------------------------------------------------------- |
| **Starter**      | $49   | 10           | 50             | Basic audits, keyword research, PDF reports                 |
| **Professional** | $149  | 50           | 500            | + Competitor analysis, rank tracking, white-label, API      |
| **Agency**       | $499  | Unlimited    | Unlimited      | + Priority support, custom integrations, team collaboration |

## Quick Start

### 1. Protect a Route by Tier

```javascript
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTier } from '../middleware/subscription.js';

const router = express.Router();

// Only Professional and Agency users can access
router.post('/api/audits/advanced', requireAuth, requireTier('professional'), async (req, res) => {
  // Your handler logic
  res.json({
    success: true,
    data: {
      /* advanced audit */
    },
  });
});

export default router;
```

### 2. Enforce Quota Limits

```javascript
import { requireAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/subscription.js';

// Block if user exceeded their monthly audit limit
router.post('/api/audits', requireAuth, checkQuota('audits'), async (req, res) => {
  // User has quota available
  // Create audit...

  // Quota info is available in req.quota:
  console.log(req.quota);
  // {
  //   type: 'audits',
  //   limit: 50,
  //   used: 12,
  //   remaining: 38
  // }

  res.json({ success: true });
});
```

### 3. Check Feature Access

```javascript
import { requireFeature } from '../middleware/subscription.js';

// Only users with 'competitor_analysis' feature can access
router.get(
  '/api/competitors/:domain',
  requireAuth,
  requireFeature('competitor_analysis'),
  async (req, res) => {
    // Analyze competitors...
    res.json({ success: true, data: competitors });
  }
);
```

## Middleware Reference

### `requireTier(minimumTier)`

**Requires user to have a specific subscription tier or higher.**

```javascript
requireTier('starter'); // All users (default tier)
requireTier('professional'); // Professional and Agency only
requireTier('agency'); // Agency only
```

**Response on failure (403):**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_TIER",
    "message": "This feature requires professional tier or higher. Your current tier: starter.",
    "upgrade_url": "/pricing"
  }
}
```

### `checkQuota(resourceType)`

**Ensures user hasn't exceeded their monthly quota for a resource.**

```javascript
checkQuota('audits'); // Check audit quota
checkQuota('keywords'); // Check keyword quota
checkQuota('reports'); // Check report quota
checkQuota('competitors'); // Check competitor analysis quota
```

**Response on failure (429 - Too Many Requests):**

```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "You've reached your monthly limit of 10 audits. Upgrade your plan for more.",
    "current_usage": 10,
    "quota_limit": 10,
    "upgrade_url": "/pricing"
  }
}
```

**Agency tier:** Always bypasses quota checks (unlimited access)

### `requireFeature(featureName)`

**Checks if user's tier includes a specific feature.**

```javascript
requireFeature('basic_audits'); // Starter+
requireFeature('competitor_analysis'); // Professional+
requireFeature('priority_support'); // Agency only
```

**Response on failure (403):**

```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_AVAILABLE",
    "message": "This feature (competitor_analysis) is not available in your starter plan.",
    "upgrade_url": "/pricing"
  }
}
```

## Helper Functions

### `getQuotaInfo(userId)`

Get quota usage for all resources.

```javascript
import { getQuotaInfo } from '../middleware/subscription.js';

const quotaInfo = await getQuotaInfo(userId);

console.log(quotaInfo);
// {
//   tier: 'professional',
//   status: 'active',
//   quotas: {
//     audits: {
//       limit: 50,
//       used: 12,
//       remaining: 38,
//       percentage: 24
//     },
//     keywords: {
//       limit: 500,
//       used: 145,
//       remaining: 355,
//       percentage: 29
//     }
//   }
// }
```

### `hasFeatureAccess(userId, featureName)`

Check if user has access to a feature (returns boolean).

```javascript
import { hasFeatureAccess } from '../middleware/subscription.js';

const canAnalyze = await hasFeatureAccess(userId, 'competitor_analysis');

if (canAnalyze) {
  // Show competitor analysis UI
} else {
  // Show upgrade prompt
}
```

### `getUserFeatures(userId)`

Get all features available to user.

```javascript
import { getUserFeatures } from '../middleware/subscription.js';

const features = await getUserFeatures(userId);
// ['basic_audits', 'keyword_research', 'pdf_reports', 'competitor_analysis', ...]

// Use to conditionally render UI
if (features.includes('white_label_reports')) {
  showWhiteLabelOption();
}
```

## API Endpoints

### GET /api/subscriptions/me

Get current user's subscription information.

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/subscriptions/me
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tier": "professional",
    "status": "active",
    "stripe_customer_id": "cus_ABC123",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### GET /api/subscriptions/quotas

Get quota usage for all resources.

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/subscriptions/quotas
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tier": "professional",
    "status": "active",
    "quotas": {
      "audits": {
        "limit": 50,
        "used": 12,
        "remaining": 38,
        "percentage": 24
      },
      "keywords": {
        "limit": 500,
        "used": 145,
        "remaining": 355,
        "percentage": 29
      }
    }
  }
}
```

### GET /api/subscriptions/features

Get all features available to user's tier.

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/subscriptions/features
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tier": "professional",
    "features": [
      "basic_audits",
      "keyword_research",
      "pdf_reports",
      "competitor_analysis",
      "rank_tracking",
      "white_label_reports",
      "api_access"
    ]
  }
}
```

### GET /api/subscriptions/features/:featureName

Check if user has access to a specific feature.

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/subscriptions/features/competitor_analysis
```

**Response:**

```json
{
  "success": true,
  "data": {
    "feature": "competitor_analysis",
    "has_access": true
  }
}
```

### GET /api/subscriptions/tiers

Get information about all subscription tiers (no auth required).

```bash
curl http://localhost:3000/api/subscriptions/tiers
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tiers": {
      "starter": {
        "name": "Starter",
        "price": 49,
        "billing": "monthly",
        "quotas": {
          "audits": 10,
          "keywords": 50,
          "reports": 10,
          "competitors": 3
        },
        "features": ["basic_audits", "keyword_research", "pdf_reports"],
        "description": "Perfect for freelancers and small businesses"
      }
    }
  }
}
```

## Subscription Tiers

### Starter ($49/month)

**Quotas:**

- 10 audits per month
- 50 keywords per month
- 10 reports per month
- 3 competitor analyses per month

**Features:**

- `basic_audits` - Standard SEO audits
- `keyword_research` - Keyword opportunity finder
- `pdf_reports` - Export to PDF

**Target Audience:** Freelancers, small businesses, bloggers

### Professional ($149/month)

**Quotas:**

- 50 audits per month
- 500 keywords per month
- 50 reports per month
- 10 competitor analyses per month

**Features:**

- All Starter features +
- `competitor_analysis` - Compare against competitors
- `rank_tracking` - Track keyword rankings over time
- `white_label_reports` - Branded reports for clients
- `api_access` - REST API for integrations

**Target Audience:** Marketing agencies, growing businesses, consultants

### Agency ($499/month)

**Quotas:**

- **Unlimited** audits
- **Unlimited** keywords
- **Unlimited** reports
- **Unlimited** competitor analyses

**Features:**

- All Professional features +
- `priority_support` - Dedicated support channel
- `custom_integrations` - Custom API integrations
- `team_collaboration` - Multi-user access
- `advanced_analytics` - Advanced reporting and insights

**Target Audience:** Large agencies, enterprises, SaaS companies

## Database Schema

### users Table (Subscription Fields)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'starter',  -- 'starter' | 'professional' | 'agency'
  subscription_status TEXT DEFAULT 'active', -- 'active' | 'canceled' | 'past_due'
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Quota Tracking Tables

Quota usage is calculated by counting records in these tables:

- **seo_analyses** - For audit quota (`user_id`, `created_at`)
- **keywords** - For keyword quota
- **reports** - For report quota

```sql
-- Example: Count audits this month
SELECT COUNT(*)
FROM seo_analyses
WHERE user_id = $1
  AND created_at >= date_trunc('month', CURRENT_DATE);
```

## Usage Examples

### Example 1: Protected Audit Creation

```javascript
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/subscription.js';
import { createClient } from '../config/supabase.js';

const router = express.Router();

router.post('/api/audits', requireAuth, checkQuota('audits'), async (req, res) => {
  const { url } = req.body;
  const userId = req.user.id;

  // User has quota available, create audit
  const supabase = createClient({ admin: true });

  const { data: audit, error } = await supabase
    .from('seo_analyses')
    .insert({
      user_id: userId,
      website_url: url,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'AUDIT_CREATION_FAILED', message: error.message },
    });
  }

  // Return audit with quota info
  return res.json({
    success: true,
    data: {
      audit,
      quota: req.quota, // { type, limit, used, remaining }
    },
  });
});

export default router;
```

### Example 2: Conditional Feature Rendering

```javascript
// In your dashboard API
router.get('/api/dashboard', requireAuth, async (req, res) => {
  const userId = req.user.id;

  // Get quota info
  const quotaInfo = await getQuotaInfo(userId);

  // Get features
  const features = await getUserFeatures(userId);

  // Get recent audits
  const supabase = createClient({ admin: true });
  const { data: audits } = await supabase
    .from('seo_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return res.json({
    success: true,
    data: {
      user: req.user,
      subscription: quotaInfo,
      features, // Frontend uses this to show/hide features
      audits,
    },
  });
});
```

### Example 3: Upgrade Prompts

```javascript
// Frontend component (React example)
function AuditCard({ quota }) {
  const isNearLimit = quota.percentage >= 80;
  const isAtLimit = quota.remaining === 0;

  if (isAtLimit) {
    return (
      <div className="upgrade-prompt">
        <h3>Quota Limit Reached</h3>
        <p>You've used all {quota.limit} audits this month.</p>
        <a href="/pricing">Upgrade to get more audits →</a>
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div className="quota-warning">
        <p>
          You've used {quota.used} of {quota.limit} audits ({quota.percentage}%).
        </p>
        <a href="/pricing">Upgrade for more</a>
      </div>
    );
  }

  return (
    <div className="quota-info">
      <p>{quota.remaining} audits remaining this month</p>
    </div>
  );
}
```

## Testing

Run subscription tests:

```bash
npm run test:subscription
```

**Test coverage:**

- ✅ Tier hierarchy enforcement
- ✅ Quota limits per tier
- ✅ Feature access control
- ✅ Agency unlimited bypass
- ✅ Database integration

## Configuration

### Add New Feature

1. **Add to TIER_FEATURES** in `src/middleware/subscription.js`:

```javascript
const TIER_FEATURES = {
  starter: ['basic_audits', 'keyword_research', 'pdf_reports'],
  professional: [
    'basic_audits',
    'keyword_research',
    'pdf_reports',
    'your_new_feature', // Add here
  ],
  agency: [
    /* all features */
  ],
};
```

2. **Protect route with feature flag:**

```javascript
router.get('/api/your-new-feature', requireAuth, requireFeature('your_new_feature'), handler);
```

### Adjust Quota Limits

Edit `TIER_QUOTAS` in `src/middleware/subscription.js`:

```javascript
const TIER_QUOTAS = {
  starter: {
    audits: 10, // Change to 15
    keywords: 50, // Change to 100
  },
  // ...
};
```

### Add New Resource Type

1. **Add quota to TIER_QUOTAS:**

```javascript
const TIER_QUOTAS = {
  starter: {
    audits: 10,
    new_resource: 5, // Add here
  },
};
```

2. **Update getCurrentUsage()** in `subscription.js`:

```javascript
switch (resourceType) {
  case 'new_resource':
    tableName = 'new_resource_table';
    break;
}
```

3. **Use in routes:**

```javascript
router.post('/api/new-resource', requireAuth, checkQuota('new_resource'), handler);
```

## Troubleshooting

### Issue: User gets "SUBSCRIPTION_NOT_FOUND" error

**Cause:** User record doesn't exist in `users` table.

**Solution:**

- Ensure user was created during signup
- Check if `subscription_tier` column has default value of `'starter'`
- Manually verify: `SELECT * FROM users WHERE id = '<user_id>';`

### Issue: Quota always shows 0 usage

**Cause:** Table name doesn't match in `getCurrentUsage()` function.

**Solution:**

- Check if resource type maps to correct table name
- Verify `user_id` foreign key exists on resource table
- Check if `created_at` column exists for date filtering

### Issue: Agency user is blocked by quota

**Cause:** Middleware order is wrong.

**Solution:**

- Ensure `requireAuth` runs before `checkQuota`
- `checkQuota` automatically bypasses for agency tier

### Issue: Feature check always fails

**Cause:** Feature name typo or not in TIER_FEATURES.

**Solution:**

- Check spelling: `'competitor_analysis'` not `'competitor-analysis'`
- Verify feature exists in `TIER_FEATURES` constant
- Use `getUserFeatures(userId)` to debug available features

## Security Considerations

1. **Always use requireAuth first:** Never check subscription without authentication
2. **Server-side only:** Never trust client-side tier checks
3. **Rate limiting:** Combine with rate limiting middleware for API protection
4. **Audit logs:** Log all quota exceeded events for abuse detection
5. **Quota manipulation:** Don't allow clients to modify `subscription_tier` directly
6. **Subscription status:** Check `subscription_status === 'active'` before allowing access

## Next Steps

- [ ] Integrate with Stripe for payment processing (Phase 2.2)
- [ ] Add subscription upgrade/downgrade flows
- [ ] Implement usage dashboards
- [ ] Add email notifications for quota warnings (80%, 100%)
- [ ] Track quota reset dates (monthly billing cycle)
- [ ] Add admin endpoints to manually adjust quotas

## Related Documentation

- [Authentication Setup](./AUTH_SETUP.md)
- [Email Configuration](./EMAIL_SETUP.md)
- [Stripe Integration](./STRIPE_SETUP.md) (Phase 2.2)
