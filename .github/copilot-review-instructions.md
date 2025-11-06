# SEO SaaS Platform - AI Code Review Instructions

## 🎯 Review Philosophy

**Goal**: Maintain high code quality, security, and performance standards while moving fast. Reviews should be constructive, educational, and focused on catching issues before they reach production.

**Review Principles:**
- **Security First**: Flag any potential security vulnerabilities immediately
- **Performance Matters**: Identify performance bottlenecks and inefficient patterns
- **User Experience**: Ensure changes enhance or maintain UX quality
- **Business Impact**: Consider how changes affect subscription tiers and revenue
- **Maintainability**: Code should be readable and maintainable by future developers

---

## 🔍 Critical Review Checklist

### Security Review (P1-CRITICAL)

**Authentication & Authorization:**
- [ ] All API routes verify user authentication via Supabase
- [ ] Row Level Security (RLS) policies properly restrict data access
- [ ] No hardcoded API keys or secrets in code
- [ ] JWT tokens properly validated and not exposed client-side
- [ ] Session management follows best practices (httpOnly cookies)

**Input Validation:**
- [ ] All user inputs validated with Zod schemas or equivalent
- [ ] SQL injection prevention (use parameterized queries only)
- [ ] XSS prevention (sanitize all user-generated content)
- [ ] File upload validation (type, size, malicious content checks)
- [ ] URL/domain validation for audit submissions

**Rate Limiting:**
- [ ] Rate limits enforced on expensive operations (audits, keyword research)
- [ ] Subscription tier limits validated server-side, not just client-side
- [ ] DDoS protection via Cloudflare or similar
- [ ] Webhook signature verification for Stripe events
- [ ] API abuse prevention mechanisms in place

**Data Protection:**
- [ ] Sensitive data encrypted at rest and in transit (HTTPS enforced)
- [ ] No PII logged to console or error tracking
- [ ] User data deletion properly implemented (GDPR compliance)
- [ ] Database backups configured and tested
- [ ] Secrets stored in environment variables, never committed

### Performance Review (P1-CRITICAL)

**Response Times:**
- [ ] API endpoints respond within 500ms for 95th percentile
- [ ] Audit processing completes within 60 seconds
- [ ] Database queries optimized with proper indexes
- [ ] N+1 query problems avoided (use joins or batch queries)
- [ ] Large datasets paginated (max 100 results per request)

**Caching Strategy:**
- [ ] AI responses cached in Redis to minimize API costs
- [ ] Static assets cached with appropriate headers
- [ ] Supabase queries cached where appropriate
- [ ] Cache invalidation strategy implemented
- [ ] Redis TTLs set appropriately (not too short or long)

**Frontend Performance:**
- [ ] Images optimized (Next.js Image component used)
- [ ] Code splitting implemented for large components
- [ ] Lazy loading for below-the-fold content
- [ ] Bundle size kept under 300KB for main chunks
- [ ] Server components used by default, client components only when needed

**AI API Cost Control:**
- [ ] Gemini API calls rate-limited per user/tier
- [ ] Responses cached to avoid duplicate API calls
- [ ] Fallback to cheaper models for non-critical tasks
- [ ] Token usage monitored and capped per request
- [ ] Error handling prevents infinite retry loops

### Business Logic Review (P2-HIGH)

**Subscription Enforcement:**
- [ ] Starter plan limited to 10 audits/month
- [ ] Professional plan limited to 50 audits/month
- [ ] Agency plan truly unlimited (no artificial caps)
- [ ] Keyword research limits enforced per tier
- [ ] Feature flags properly check subscription tier
- [ ] Grace period implemented for expired subscriptions

**Stripe Integration:**
- [ ] Webhook events properly handled (subscription.created, updated, deleted)
- [ ] Failed payment retry logic implemented
- [ ] Proration handled correctly for mid-cycle upgrades/downgrades
- [ ] Cancellation flows preserve data until period end
- [ ] Refund handling implemented (if applicable)
- [ ] Test mode transactions never mixed with production

**Data Integrity:**
- [ ] Audit scores consistently calculated (0-100 scale)
- [ ] Historical data preserved when audits are deleted
- [ ] Relationships maintained (cascading deletes where appropriate)
- [ ] No orphaned records created
- [ ] Transaction boundaries properly defined for multi-step operations

### Code Quality Review (P2-HIGH)

**TypeScript Standards:**
- [ ] No `any` types used (use `unknown` or proper types)
- [ ] All functions have return type annotations
- [ ] Interfaces defined for all API request/response shapes
- [ ] Enums used for finite value sets (subscription tiers, statuses)
- [ ] Strict mode enabled and no type errors

**React/Next.js Best Practices:**
- [ ] Server components used by default (performance benefit)
- [ ] `'use client'` directive only on truly interactive components
- [ ] No useState/useEffect in server components
- [ ] Proper loading and error states for async operations
- [ ] Suspense boundaries for streaming/loading states
- [ ] Metadata properly set for SEO (ironic, but important!)

**Error Handling:**
- [ ] All async operations wrapped in try-catch
- [ ] User-friendly error messages displayed
- [ ] Errors logged to Sentry or similar for debugging
- [ ] Failed operations don't leave system in inconsistent state
- [ ] Proper HTTP status codes returned (400, 401, 403, 404, 500)

**Testing:**
- [ ] Unit tests cover core business logic
- [ ] API routes have integration tests
- [ ] Critical user flows have E2E tests (Playwright)
- [ ] Edge cases tested (empty data, max limits, invalid input)
- [ ] Test coverage >80% for critical paths

---

## 🚨 Auto-Reject Criteria (Must Fix Before Merge)

**Immediate rejection if PR contains:**
1. **Hardcoded secrets** (API keys, passwords, tokens)
2. **Committed `.env` files** with real credentials
3. **SQL injection vulnerabilities** (string concatenation in queries)
4. **Missing authentication checks** on protected API routes
5. **Disabled TypeScript checks** (`@ts-ignore` without explanation)
6. **Console.log statements** in production code (use proper logging)
7. **Uncommitted merge conflicts** or broken code
8. **Package.json changes** without package-lock.json update
9. **Failing tests** in CI/CD pipeline
10. **Security vulnerabilities** flagged by npm audit

---

## ✅ Review Guidelines by File Type

### API Routes (`app/api/**/*.ts`)

**Check for:**
- Authentication middleware applied
- Request validation with Zod schemas
- Proper error handling and status codes
- Rate limiting on expensive operations
- Database transactions for multi-step operations
- Response follows standardized format

**Example good pattern:**
```typescript
export async function POST(req: Request) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate input
    const body = await req.json();
    const validated = auditSchema.parse(body);

    // 3. Check subscription limits
    const canPerformAudit = await checkAuditLimit(session.user.id);
    if (!canPerformAudit) {
      return Response.json({ error: 'Audit limit reached' }, { status: 403 });
    }

    // 4. Perform operation
    const result = await performAudit(validated.url);

    // 5. Return standardized response
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Audit creation error:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to create audit' 
    }, { status: 500 });
  }
}
```

### React Components (`components/**/*.tsx`)

**Check for:**
- Proper TypeScript prop types defined
- Accessibility attributes (aria-labels, alt text)
- Loading and error states handled
- No unnecessary re-renders (useMemo, useCallback where needed)
- Server components by default, client only when interactive
- Responsive design (mobile-first approach)

**Red flags:**
- Inline styles (use Tailwind classes)
- Direct DOM manipulation (use React patterns)
- Fetch calls in useEffect (use React Query or server components)
- Missing key props in lists
- Hardcoded text (should be in constants for i18n)

### Database Migrations (`supabase/migrations/**/*.sql`)

**Check for:**
- Proper indexes on foreign keys and frequently queried columns
- Row Level Security (RLS) policies defined for all tables
- NOT NULL constraints where appropriate
- Default values set for optional columns
- Cascading delete/update rules defined
- Migration is reversible (DOWN migration exists)

**Example good migration:**
```sql
-- Create table
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);

-- Enable RLS
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own audits"
  ON audits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audits"
  ON audits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### SEO Agent Logic (`lib/seo-agent/**/*.ts`)

**Check for:**
- Input sanitization for URLs and content
- Timeout handling for long-running operations
- Graceful degradation if AI API unavailable
- Cost-effective AI API usage (batch requests, caching)
- Proper scoring algorithms (0-100 scale, weighted averages)
- Clear documentation of algorithm logic

**Performance concerns:**
- Avoid crawling entire site synchronously (limit depth/pages)
- Timeout long-running HTTP requests (5-10 second max)
- Don't block on external API calls (use async patterns)
- Cache analysis results to avoid re-computation

---

## 📋 Review Comments Template

### For Security Issues:
```
🚨 SECURITY: [Brief description]

**Issue**: [Detailed explanation of vulnerability]
**Risk**: [Potential impact - data breach, unauthorized access, etc.]
**Fix**: [Specific code change needed]
**Reference**: [Link to security best practice or OWASP guideline]
```

### For Performance Issues:
```
⚡ PERFORMANCE: [Brief description]

**Issue**: [What's slow and why]
**Impact**: [User experience degradation, API cost increase, etc.]
**Suggestion**: [How to optimize]
**Benchmark**: [Expected improvement]
```

### For Business Logic Issues:
```
💰 BUSINESS: [Brief description]

**Issue**: [How this affects revenue or user experience]
**Subscription Impact**: [Which tiers affected]
**Recommendation**: [Alternative approach]
```

### For Code Quality Issues:
```
🔧 CODE QUALITY: [Brief description]

**Issue**: [What makes this code hard to maintain]
**Suggestion**: [How to improve readability/maintainability]
**Example**: [Code snippet showing better pattern]
```

### For Positive Feedback:
```
✅ NICE: [What was done well]

**Highlight**: [Specific good practice used]
**Impact**: [Why this makes the codebase better]
```

---

## 🎯 Priority-Based Review Focus

### P1-CRITICAL Changes (Security, Auth, Payments)
**Review depth**: Line-by-line scrutiny  
**Required approvals**: 2+ reviewers  
**Testing required**: Integration + E2E tests must pass  
**Deployment**: Requires staging validation before production

### P2-HIGH Changes (Core Features, Database Schema)
**Review depth**: Thorough review of logic and edge cases  
**Required approvals**: 1+ experienced reviewer  
**Testing required**: Unit tests + relevant integration tests  
**Deployment**: Standard CI/CD pipeline

### P3-MEDIUM Changes (UI Components, Minor Features)
**Review depth**: Focus on user experience and maintainability  
**Required approvals**: 1 reviewer  
**Testing required**: Basic smoke tests  
**Deployment**: Can deploy to production after CI passes

### P4-LOW Changes (Documentation, CSS Tweaks)
**Review depth**: Quick scan for obvious issues  
**Required approvals**: Optional (can be self-merged after CI)  
**Testing required**: Visual inspection  
**Deployment**: Immediate after merge

---

## 🔄 Review Workflow

### For Reviewer:

1. **First Pass (5 minutes):**
   - Check PR description clearly explains what/why
   - Verify all CI checks pass (tests, linting, type-checking)
   - Scan for auto-reject criteria (secrets, console.logs, etc.)

2. **Deep Review (15-30 minutes):**
   - Review code line-by-line using checklists above
   - Test locally if changes are complex or high-risk
   - Leave specific, actionable comments with examples
   - Approve or request changes with clear next steps

3. **Follow-Up:**
   - Re-review after changes made
   - Verify all comments addressed
   - Approve and merge once satisfied

### For Author:

1. **Before Creating PR:**
   - Run `npm run lint` and fix all issues
   - Run `npm run type-check` and resolve all errors
   - Run tests locally: `npm run test`
   - Self-review the diff in GitHub before submitting

2. **PR Description Template:**
   ```markdown
   ## What Changed
   [Brief description of changes]

   ## Why
   [Business or technical justification]

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Manually tested in dev environment
   - [ ] Edge cases considered

   ## Screenshots (if UI change)
   [Before/After images]

   ## Deployment Notes
   [Any special considerations for deployment]
   ```

3. **Responding to Reviews:**
   - Reply to every comment (even if just "Fixed ✅")
   - Push fixes in separate commits (easier to re-review)
   - Mark conversations as resolved once addressed
   - Tag reviewer when ready for re-review

---

## 🚀 Pre-Merge Checklist

Before merging any PR to main branch:

- [ ] All CI checks pass (tests, linting, type-checking)
- [ ] Required approvals received (based on priority level)
- [ ] All review comments addressed or marked as "Won't fix" with justification
- [ ] No merge conflicts with main branch
- [ ] Database migrations tested (if applicable)
- [ ] Environment variables documented in .env.example (if new ones added)
- [ ] Documentation updated (if API changes or new features)
- [ ] Changelog updated (for user-facing changes)
- [ ] No security vulnerabilities in `npm audit`
- [ ] Performance benchmarks acceptable (if changed)

---

## 🎓 Learning Resources

**For reviewers and authors to reference:**

**Security:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security

**Performance:**
- Next.js Performance: https://nextjs.org/docs/app/building-your-application/optimizing
- Web Vitals: https://web.dev/vitals/
- React Query Best Practices: https://tanstack.com/query/latest/docs/react/guides/performance

**TypeScript:**
- TypeScript Best Practices: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
- Zod Validation: https://zod.dev/

**Testing:**
- Vitest Guide: https://vitest.dev/guide/
- Playwright E2E: https://playwright.dev/docs/intro

---

## 💡 Review Tips

**For effective reviews:**
1. **Be specific**: "Use `const` instead of `let` on line 42" not "Fix variable declarations"
2. **Explain why**: Don't just say what's wrong, explain the impact
3. **Suggest alternatives**: Provide concrete examples of better patterns
4. **Be respectful**: Critique code, not people. Assume good intent.
5. **Balance feedback**: Highlight good practices, not just problems
6. **Ask questions**: If something is unclear, ask for clarification
7. **Consider context**: Understand business priorities and deadlines

**For authors receiving feedback:**
1. **Don't take it personally**: Reviews improve code quality for everyone
2. **Ask for clarification**: If feedback is unclear, ask for examples
3. **Explain your reasoning**: If you disagree, explain why with data
4. **Thank reviewers**: They're helping you improve
5. **Learn from patterns**: Notice recurring feedback and adjust practices

---

**Last Updated:** November 6, 2025  
**Status:** Active - Use for all PRs  
**Owner:** Justin Berry (Founder & Developer)  
**Review Cycle:** Update quarterly based on common review patterns
