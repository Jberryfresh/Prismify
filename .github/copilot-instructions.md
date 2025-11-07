# SEO SaaS Platform - AI Agent Instructions

## 🎯 CRITICAL: Read First

**ALWAYS read these files in order before starting work:**

1. `.agents/AGENTS.md` - Agent behavior rules and communication guidelines (create from UNIVERSAL_AGENT_INSTRUCTIONS.md)
2. `SEO_PROJECT_GOALS.md` - Strategic vision, business model, and success metrics
3. `SEO_IDEAS.md` - Complete feature list and prioritization
4. `SEO_FUTURE_INNOVATIONS.md` - Long-term roadmap (Year 2-5)

## Project Overview

SEO SaaS Platform is an **AI-powered SEO optimization service** delivered as a subscription-based SaaS product. The platform leverages AI agents to autonomously analyze websites, generate optimization recommendations, and provide actionable insights that drive organic traffic growth.

**Business Model**: 3-tier subscription pricing ($49/$149/$499 monthly) targeting freelancers, agencies, and enterprises with goal of $4.5M ARR by Year 5.

**Current Status**: **Planning Phase** - Ready for MVP development  
**Tech Stack**: Next.js 14, Supabase (PostgreSQL), Redis, Stripe, Google Gemini API, Vercel hosting  
**MVP Timeline**: 8-12 weeks to launch with core features

**Branch Strategy**: TBD - Will use phase-based branching similar to DigitalTide

## Agent Behavior Protocol

### Communication Rules

- **Be Concise**: Short, clear, direct responses. Business context, not fluff
- **Professional Tone**: Senior engineer style - calm, factual, confident
- **User Direction First**: You support, don't lead. Max 3 suggestions per query
- **User Approval Required**: ALWAYS confirm before creating, editing, or deleting files

### Command Execution

- **Attempt First**: Execute shell/CLI commands yourself (with permission)
- **Graceful Failure**: If command fails after 1-2 attempts, explain what/why/next-step
- **No Loops**: Never repeat failed command without logic changes

### Branch & Commit Workflow

- **Phase-Based Branching**: Create branch per PHASE (not per task)
- **Branch Naming**: `phase-{number}-{description}` (e.g., `phase-1-core-platform`)
- **Commit Format**: `[PHASE-X] Task description - Priority Level`
- **PR Strategy**: Complete entire phase → Create PR → Get approval → Merge → Delete branch
- **Scoped Work**: Only modify files related to current phase/branch scope

## Architecture Essentials

### Tech Stack Overview

**Frontend (Next.js 14):**

- **App Router**: Use app directory structure, not pages directory
- **Server Components**: Default to server components, use 'use client' only when needed
- **Styling**: Tailwind CSS + shadcn/ui components for consistent design system
- **Data Fetching**: React Query for client-side, native fetch for server components
- **Forms**: React Hook Form + Zod for validation

**Backend (Supabase + Custom API):**

- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password + OAuth (Google, GitHub)
- **Storage**: Supabase Storage for report PDFs and exports
- **Realtime**: Supabase Realtime for live audit progress updates
- **Custom APIs**: Edge Functions for complex SEO analysis logic

**AI Integration:**

- **Primary**: Google Gemini API (free tier, then pay-as-go)
- **Fallback**: OpenAI GPT-4 for enterprise tier
- **Use Cases**: Meta tag generation, keyword research, content analysis
- **Cost Control**: Cache AI responses in Redis, rate limit requests

**Infrastructure:**

- **Hosting**: Vercel (frontend + serverless functions)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Cache**: Redis via Upstash (serverless Redis)
- **Payments**: Stripe for subscriptions and billing
- **CDN**: Cloudflare for DDoS protection and performance
- **Monitoring**: Vercel Analytics + Sentry for error tracking

### Database Schema (Core Tables)

**users table:**

```sql
- id (uuid, primary key)
- email (text, unique)
- full_name (text)
- subscription_tier (enum: starter, professional, agency)
- stripe_customer_id (text)
- created_at, updated_at (timestamps)
```

**audits table:**

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- url (text)
- overall_score (integer 0-100)
- meta_score, content_score, technical_score, mobile_score, performance_score, security_score, accessibility_score (integers)
- recommendations (jsonb)
- status (enum: pending, processing, completed, failed)
- created_at (timestamp)
```

**keywords table:**

```sql
- id (uuid, primary key)
- audit_id (uuid, foreign key to audits)
- keyword (text)
- search_volume (integer)
- competition (text: low, medium, high)
- difficulty_score (integer 0-100)
- opportunity_score (integer 0-100)
```

**subscriptions table:**

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- stripe_subscription_id (text)
- plan_name (enum: starter, professional, agency)
- status (enum: active, canceled, past_due)
- current_period_start, current_period_end (timestamps)
- cancel_at_period_end (boolean)
```

**audit_history table:**

```sql
- id (uuid, primary key)
- audit_id (uuid, foreign key to audits)
- url (text)
- score (integer)
- created_at (timestamp)
- (for tracking score changes over time)
```

### API Structure

**RESTful Endpoints:**

```
POST   /api/audits          - Create new audit
GET    /api/audits/:id      - Get audit results
GET    /api/audits          - List user's audits
DELETE /api/audits/:id      - Delete audit

POST   /api/keywords/research    - Research keywords
GET    /api/keywords/:audit_id   - Get keywords for audit

POST   /api/meta-tags/generate   - Generate meta tag suggestions
POST   /api/schema/generate      - Generate schema markup
POST   /api/sitemap/generate     - Generate XML sitemap

GET    /api/subscriptions        - Get user subscription
POST   /api/subscriptions/create - Create/update subscription
POST   /api/subscriptions/cancel - Cancel subscription

POST   /api/reports/pdf          - Generate PDF report
POST   /api/reports/csv          - Generate CSV export
```

**Authentication:**

- Use Supabase Auth middleware for protected routes
- JWT tokens in Authorization header: `Bearer <token>`
- Refresh tokens handled automatically by Supabase client

**Rate Limiting:**

- Starter: 10 audits/month, 50 keywords/month
- Professional: 50 audits/month, 500 keywords/month
- Agency: Unlimited audits and keywords
- Implement via Upstash Redis rate limiter

### SEO Agent Integration

**Extracted from DigitalTide (`src/agents/specialized/SEOAgent.js`):**

The core SEO analysis engine is 3,083 lines of production-ready code that needs to be:

1. Extracted from DigitalTide project
2. Refactored as standalone npm package
3. Wrapped with Express/Next.js API endpoints
4. Integrated with Supabase for data storage

**Key Functions to Expose:**

- `generateMetaTags(url, content)` - AI-powered meta tag optimization
- `researchKeywords(topic, location)` - Keyword research with competition analysis
- `generateInternalLinkingStrategy(siteStructure)` - Internal linking recommendations
- `generateSchemaMarkup(type, data)` - JSON-LD schema generation
- `generateSitemap(urls, options)` - XML sitemap creation
- `generateComprehensiveSEOScore(auditData)` - 7-component scoring algorithm
- `optimizeContent(content, targetKeywords)` - Content optimization suggestions

**Integration Pattern:**

```javascript
// Next.js API route example
import { SEOAgent } from '@/lib/seo-agent';

export async function POST(req) {
  const { url } = await req.json();
  const agent = new SEOAgent();

  const results = await agent.performAudit(url);

  // Save to Supabase
  const { data } = await supabase.from('audits').insert({ user_id, url, ...results });

  return Response.json({ success: true, data });
}
```

## Project-Specific Conventions

### Priority System

**CRITICAL**: Always complete priorities in order. Never skip ahead.

- **🔴 P1-CRITICAL**: Must complete before next phase. Platform cannot function without these.
- **🟡 P2-HIGH**: Important for UX and revenue. Complete before lower priorities.
- **🟢 P3-MEDIUM**: Valuable additions that enhance platform.
- **🔵 P4-LOW**: Nice to have. Only implement after all higher priorities complete.

**Current Phase: MVP Planning**

- ✅ Business planning (PROJECT_GOALS.md) - COMPLETE
- ✅ Feature documentation (IDEAS.md) - COMPLETE
- ✅ Long-term roadmap (FUTURE_INNOVATIONS.md) - COMPLETE
- ⏳ Technical setup - NEXT
- ⏳ Core platform development (Weeks 1-4)
- ⏳ Feature completion (Weeks 5-8)
- ⏳ Polish & launch (Weeks 9-12)

### Config Management

**Environment Variables (.env.local):**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Services
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key  # Fallback

# Redis (Upstash)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SEO SaaS Platform
```

**Never commit .env files** - use .env.example for templates

### Response Structure

**Standardized API responses:**

```typescript
// Success
{
  success: true,
  data: { /* payload */ },
  meta?: { /* pagination, etc */ }
}

// Error
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'User-friendly error message',
    details?: { /* field errors */ }
  }
}
```

### TypeScript Conventions

**Use TypeScript for type safety:**

```typescript
// Define types in lib/types.ts
export interface Audit {
  id: string;
  user_id: string;
  url: string;
  overall_score: number;
  meta_score: number;
  content_score: number;
  technical_score: number;
  mobile_score: number;
  performance_score: number;
  security_score: number;
  accessibility_score: number;
  recommendations: Recommendation[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface Recommendation {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number; // 1-10
  effort: number; // 1-10
}
```

## Development Workflows

### Essential Commands

```powershell
# Initial setup
npm create next-app@latest seo-saas --typescript --tailwind --app
cd seo-saas
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @stripe/stripe-js stripe
npm install @google/generative-ai  # Gemini
npm install @upstash/redis @upstash/ratelimit
npm install react-hook-form zod @hookform/resolvers
npm install recharts  # Charts
npm install jspdf  # PDF generation

# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint check
npm run type-check       # TypeScript check

# Supabase (after installing Supabase CLI)
supabase init            # Initialize Supabase project
supabase start           # Start local Supabase
supabase db push         # Push schema changes
supabase db reset        # Reset database with seed data
supabase gen types typescript --local > lib/database.types.ts  # Generate types

# Deployment
vercel                   # Deploy to Vercel
vercel --prod            # Deploy to production
```

### Testing Strategy

```powershell
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test  # E2E testing

# Run tests
npm run test             # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:watch       # Watch mode
```

### Git Workflow

```powershell
# Start new phase
git checkout -b phase-1-core-platform

# Regular commits
git add .
git commit -m "[PHASE-1] Add user authentication - P1-CRITICAL"

# Push and create PR
git push origin phase-1-core-platform
# Create PR on GitHub, get approval, merge, delete branch

# After merge
git checkout main
git pull origin main
```

## File Organization Rules

### Next.js App Directory Structure

```
seo-saas/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── audits/
│   │   ├── keywords/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── audits/
│   │   ├── keywords/
│   │   ├── subscriptions/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx  # Landing page
├── components/
│   ├── ui/  # shadcn/ui components
│   ├── dashboard/
│   ├── audit/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── stripe/
│   ├── seo-agent/  # Extracted SEOAgent
│   ├── types.ts
│   └── utils.ts
├── hooks/
│   ├── useAudits.ts
│   ├── useSubscription.ts
│   └── useKeywords.ts
└── public/
    ├── images/
    └── docs/
```

### Component Patterns

**Server Components (default):**

```tsx
// app/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: audits } = await supabase.from('audits').select('*').limit(10);

  return <DashboardView audits={audits} />;
}
```

**Client Components (interactive):**

```tsx
'use client';
// components/audit/AuditForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function AuditForm() {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    const res = await fetch('/api/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Handle response
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

## Security Best Practices

### Authentication Flow

1. User signs up/logs in via Supabase Auth
2. Supabase returns JWT access token
3. Store token in httpOnly cookie (handled by Supabase)
4. Verify token on API routes using Supabase middleware
5. Implement Row Level Security (RLS) in Supabase

### Row Level Security (RLS) Policies

```sql
-- Users can only see their own audits
CREATE POLICY "Users can view own audits"
ON audits FOR SELECT
USING (auth.uid() = user_id);

-- Users can only create audits for themselves
CREATE POLICY "Users can create own audits"
ON audits FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### API Route Protection

```typescript
// app/api/audits/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // Verify authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated, proceed...
}
```

### Input Validation

```typescript
import { z } from 'zod';

const auditSchema = z.object({
  url: z.string().url('Invalid URL format'),
  options: z
    .object({
      includeKeywords: z.boolean().optional(),
      depth: z.number().min(1).max(100).optional(),
    })
    .optional(),
});

// In API route
const body = await req.json();
const validated = auditSchema.parse(body); // Throws if invalid
```

### Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Proceed with request...
}
```

## Critical Gotchas

1. **Next.js App Router**: Use app directory, not pages. Server components by default
2. **Supabase RLS**: ALWAYS enable Row Level Security policies on tables
3. **Stripe Webhooks**: Verify webhook signatures to prevent fraud
4. **AI API Costs**: Cache responses aggressively, implement rate limiting
5. **TypeScript**: Enable strict mode in tsconfig.json for better type safety
6. **Environment Variables**: NEXT*PUBLIC* prefix for client-side, no prefix for server-only
7. **Audit Performance**: Run SEO audits asynchronously, never block user requests
8. **Subscription Limits**: Enforce tier limits (audit counts, keywords) in middleware

## Phase Status & Roadmap

### ✅ Phase 0: Planning (Complete)

- Business model and revenue projections
- Feature documentation and prioritization
- Long-term roadmap (Year 2-5)
- Technical architecture decisions
- This instructions file

### ⏳ Phase 1: Core Platform (Weeks 1-4) - NEXT

- **Setup**:
  - Initialize Next.js project with TypeScript
  - Set up Supabase project and database schema
  - Configure Stripe subscription products
  - Set up Vercel project for deployment
- **Authentication**:
  - Implement Supabase Auth (email/password)
  - Add OAuth providers (Google, GitHub)
  - Create protected routes and middleware
  - Build login/register/profile pages
- **Subscription Management**:
  - Integrate Stripe Checkout for subscriptions
  - Build pricing page with 3 tiers
  - Implement subscription status checks
  - Handle webhook events (subscription created/canceled)
- **Basic Dashboard**:
  - Dashboard layout with navigation
  - User profile and settings page
  - Subscription management UI
  - Audit history list view

### ⏳ Phase 2: Feature Completion (Weeks 5-8)

- **SEO Audit Engine**:
  - Extract and refactor SEOAgent from DigitalTide
  - Implement 7-component scoring system
  - Build audit results display
  - Add historical tracking and trends
- **Keyword Research**:
  - Integrate keyword research API
  - Build keyword results table with sorting/filtering
  - Add opportunity score calculations
  - Export keywords to CSV
- **Reports & Exports**:
  - Generate PDF reports with charts
  - CSV export for all data types
  - Email report delivery
  - Report templates (technical vs. executive)

### ⏳ Phase 3: Polish & Launch (Weeks 9-12)

- **Landing Page**:
  - Hero section with value proposition
  - Feature showcase with screenshots
  - Pricing table with comparison
  - Testimonials and social proof
  - FAQ section
- **Onboarding**:
  - Welcome email sequence
  - Interactive product tour
  - First audit walkthrough
  - Quick win guide
- **Beta Testing**:
  - Recruit 20-30 beta users
  - Collect feedback via surveys
  - Fix critical bugs and UX issues
  - Optimize performance
- **Launch**:
  - Product Hunt launch
  - Post on Hacker News, IndieHackers
  - Email marketing to beta waitlist
  - Social media announcements

### ⏳ Phase 4+: Growth Features (Month 2+)

- See SEO_FUTURE_INNOVATIONS.md for detailed roadmap

## Quick Reference

**Critical priorities**:

- Extract SEOAgent.js from DigitalTide and make standalone
- Set up Supabase with proper RLS policies
- Integrate Stripe subscriptions correctly with webhooks
- Build intuitive dashboard with audit results

**Key entry points**:

- `app/page.tsx` - Landing page
- `app/(dashboard)/dashboard/page.tsx` - Main dashboard
- `app/api/audits/route.ts` - Audit creation API
- `lib/seo-agent/` - Core SEO analysis engine
- `SEO_PROJECT_GOALS.md` - Business strategy and metrics

**Common tasks**:

- **Add new API endpoint** → Create route.ts in app/api/[endpoint]/
- **Add new page** → Create page.tsx in app/[route]/
- **Add UI component** → Use shadcn/ui: `npx shadcn-ui@latest add [component]`
- **Update database schema** → Edit Supabase migration, run `supabase db push`
- **Check subscription status** → Query subscriptions table, verify tier limits

---

**Last Updated:** November 6, 2025  
**Status:** Planning Complete - Ready for Phase 1  
**Owner:** Justin Berry (Founder & Developer)  
**Next Steps:** Initialize Next.js project, set up Supabase, extract SEOAgent.js
