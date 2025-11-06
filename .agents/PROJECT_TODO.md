# PRISMIFY - AGENTS PROJECT_TODO.md

> Purpose: Master checklist for all agents working on Prismify. Each task is organized by Phase → Increment (e.g., 1.1, 1.2). Agents should mark tasks as [🔲] in-progress, [✓] completed and add notes (what changed, PR link, test results, time spent). Follow the branch/PR naming and commit conventions in the repo.

---

## How to use this file (READ FIRST)

- Each item has: ID, short title, criticality tag, acceptance criteria, files/areas to edit, tests to run.
- When you start a task: replace the leading checkbox with `[🔲]` and add your Git branch name below the task: `Branch: `
- When finished: replace checkbox with `[✓]`, add `CompletedBy: <github-username>`, `CompletedAt: YYYY-MM-DD HH:MM UTC`, `PR: <link>`, and a short note about what changed and verification steps.
- If blocked: add `BlockedBy:` with reason and suggested owner(s) to resolve.
- Use the commit message template: `[PHASE-X.Y] Short description - P{0|1|2}` (P0 = Critical)
- One increment per branch. See Branch Naming: `phase-{x}.{y}-{short-desc}`.

---

## Legend: Criticality / Priority
- P0 (Critical): Must be done before any dependent work; security, data integrity, breaking bug fixes.
- P1 (High): Needed for MVP or core functionality (auth, DB schema, core endpoints).
- P2 (Medium): Important features that improve UX or developer ergonomics (analytics, tests, docs).
- P3 (Low): Nice-to-have, polish, long-term improvements.

---

## Definition of Done (DoD)
For a task to be considered done it must have:
1. Code pushed to a feature branch and PR opened.
2. CI passes (lint, tests, build). If unit tests are missing, add at least 1-2 tests for new logic.
3. Automated checks (security, dependency) not failing or documented exceptions.
4. Documentation updated (README, docs/ or inline) if public API/behavior changed.
5. Acceptance criteria met and manual verification steps recorded in task notes.
6. PR linked in this TODO entry and marked [✓].

---

## Branch & PR Rules (copy of recommended policy)
- Branch name: `phase-{X}.{Y}-{short-description}`
- One increment per branch. Small, focused commits.
- PR title: `[PHASE-X.Y] <Short description> - P{0|1|2|3}`
- Include in PR body: Summary, Acceptance Criteria, How to Test, Screenshots/logs (if applicable), Related Issues.

---

# Phase 1 — Foundation & Local Development (PHASE 1)
Goal: Make the repository, local dev, and core infra runnable for all contributors.

## 1.1 Repo Hygiene & Onboarding (P0)
- [ ] 1.1.1 Create contribution and developer onboarding docs (docs/DEV_ONBOARDING.md)
  - Acceptance: New developer can run `npm install` and `npm run dev` following docs.
  - Files: `README.md`, `docs/DEV_ONBOARDING.md` (update if exists)
  - Tests: Follow the doc on a fresh clone (manual verification)
- [ ] 1.1.2 Add CODEOWNERS, LICENSE, and CONTRIBUTING templates
  - Acceptance: Codeowners file exists at repo root and protects key dirs
  - Files: `.github/CODEOWNERS`, `CONTRIBUTING.md`
- [ ] 1.1.3 Setup branch protection rules (document) and PR templates
  - Acceptance: Documented in `.github/PULL_REQUEST_TEMPLATE.md`

## 1.2 Environment & Secrets (P0)
- [ ] 1.2.1 Validate `.env.example` and secure `.env` handling
  - Acceptance: `.env.example` includes all required variables; `.env` ignored by git
  - Files: `.env.example`, `.gitignore`
- [ ] 1.2.2 Add helper script to generate secure JWT secrets
  - Criticality: P1
  - Files: `scripts/generate-secrets.js` or README snippet
  - Acceptance: Running the script prints and does not persist secrets

## 1.3 Local Dev & DB (P0)
- [ ] 1.3.1 Docker Compose (Postgres, Redis, optional MinIO) (P0)
  - Acceptance: `docker-compose up` brings up db + redis; env points to local services
  - Files: `docker-compose.yml`, `docker/.env`, `scripts/dev-start.sh`
- [ ] 1.3.2 Database migrations and seed (P0)
  - Acceptance: `npm run migrate` runs successfully; seeds create test user/data
  - Files: `supabase/migrations/*`, `scripts/run-migration.js`
- [ ] 1.3.3 Local test data and seed script (P1)
  - Acceptance: `npm run seed` creates 3 users, 1 project, 1 analysis

## 1.4 Continuous Integration (P1)
- [ ] 1.4.1 GitHub Actions: Lint, test, build (P1)
  - Acceptance: `ci.yml` runs on PRs with lint and unit tests
  - Files: `.github/workflows/ci.yml`
- [ ] 1.4.2 Add code formatting hooks (prettier/eslint) (P1)
  - Acceptance: `pre-commit` runs autoformat
  - Files: `.prettierrc`, `.eslintrc` and `.husky` hooks

---

# Phase 2 — Core Backend & AI Services (PHASE 2)
Goal: Build API, authentication, AI router, and baseline agent framework.

## 2.1 Authentication & Authorization (P0)
- [ ] 2.1.1 Implement JWT auth with refresh tokens (P0)
  - Acceptance: `POST /auth/login` returns access and refresh tokens; `POST /auth/refresh` rotates refresh tokens
  - Files: `src/routes/auth.js`, `src/services/auth/*`, `src/config/index.js`
  - Tests: unit tests for token creation/verification
- [ ] 2.1.2 Password hashing / reset flow (P1)
  - Acceptance: Reset email flow scaffolded, password rules enforced
  - Files: `src/services/email/*`, `src/routes/password.js`
- [ ] 2.1.3 RBAC/roles and admin guard (P1)
  - Acceptance: Role-based middleware implemented; admin-only endpoint example
  - Files: `src/middleware/roles.js`

## 2.2 Public API Endpoints (P1)
- [ ] 2.2.1 Users CRUD endpoints (P1)
  - Acceptance: Create, read (self), update, delete (self) with RBAC
  - Files: `src/routes/users.js`, `src/controllers/users.js`
  - Tests: integration tests with Supabase test DB
- [ ] 2.2.2 SEO Projects endpoints (P1)
  - Acceptance: Projects can be created and listed per user
  - Files: `src/routes/projects.js`
- [ ] 2.2.3 SEO Analysis endpoints (P1)
  - Acceptance: Submit content, start analysis job, return analysis results
  - Files: `src/routes/analyses.js`, `src/services/agents/*`

## 2.3 Unified AI Router (P0)
- [ ] 2.3.1 Ensure `unifiedAIService` routing and fallbacks (P0)
  - Acceptance: `unifiedAIService.executeWithFallback` logs providers tried and returns structured error on total failure
  - Files: `src/services/ai/unifiedAIService.js`, `src/services/ai/geminiService.js`
  - Tests: Mock provider failures to verify fallback behavior
- [ ] 2.3.2 Provider configuration via env and feature flags (P1)
  - Acceptance: Switch providers by changing `AI_PROVIDER` env; feature flags documented

## 2.4 Agent Framework & Orchestration (P0)
- [ ] 2.4.1 Base agent class and orchestrator (P0)
  - Acceptance: `src/agents/base/Agent.js` and orchestrator can start/stop agents, handle heartbeats
  - Files: `src/agents/*`, `scripts/test-agent-framework.js`
- [ ] 2.4.2 Task queue & retries (P1)
  - Acceptance: Use Redis/Bull or in-memory queue for dev; tasks retryable with backoff
  - Files: `src/services/queue/*`
- [ ] 2.4.3 Agent registry & discovery (P2)
  - Acceptance: Orchestrator can list registered agents and their status

---

# Phase 3 — Specialized Agents & Features (PHASE 3)
Goal: Implement SEO Agent, Crawler, Writer, and content pipelines.

## 3.1 SEO Agent (P0)
- [ ] 3.1.1 Harden meta generation outputs (P0)
  - Acceptance: Validate AI outputs against JSON schema; fallback behavior tested
  - Files: `src/agents/specialized/SEOAgent.js`, `src/schemas/meta.schema.json`
- [ ] 3.1.2 Rate limiting per-user for SEO requests (P1)
  - Acceptance: Quota enforcement using `api_usage` table and middleware
  - Files: `src/middleware/rateLimit.js`, `src/services/usageTracker.js`
- [ ] 3.1.3 Persist analysis results and metadata (P1)
  - Acceptance: Writes to `seo_analyses` and `meta_tags` tables

## 3.2 Crawler Agent (P1)
- [ ] 3.2.1 Basic crawler with politeness and robots.txt (P1)
  - Acceptance: Crawl single domain respecting robots and rate limits
  - Files: `src/agents/specialized/CrawlerAgent.js`
- [ ] 3.2.2 Content normalization and dedupe (P2)

## 3.3 Writer Agent (P1)
- [ ] 3.3.1 Article generation pipeline (P1)
  - Acceptance: Generate draft article and store in DB as `draft`
  - Files: `src/agents/specialized/WriterAgent.js`
- [ ] 3.3.2 Human-in-the-loop editing workflow (P2)

## 3.4 Billing & Subscription (P1)
- [ ] 3.4.1 Stripe subscription flows and webhooks (P1)
  - Acceptance: Create customers, subscribe to plans, webhook handler persists to `subscription_history`
  - Files: `src/services/billing/*`, `src/routes/webhooks/stripe.js`
- [ ] 3.4.2 Tier-based quotas enforced in API (P1)

---

# Phase 4 — Frontend & UX (PHASE 4)
Goal: Create a usable dashboard for users to manage projects and runs.

## 4.1 Public UI (P1)
- [ ] 4.1.1 Next.js app skeleton and routing (P1)
  - Acceptance: `next dev` runs, user login works with auth API
  - Files: `apps/web/` or `next/` directory
- [ ] 4.1.2 Dashboard: Projects list, Analysis results (P1)

## 4.2 Admin UI (P2)
- [ ] 4.2.1 Admin tools for billing, users, and agent status (P2)

---

# Phase 5 — QA, Security, & Performance (PHASE 5)
Goal: Validate readiness for launch and secure platform.

## 5.1 Security (P0)
- [ ] 5.1.1 Secrets management & vault integration (P0)
- [ ] 5.1.2 Penetration testing checklist (P1)

## 5.2 Performance (P1)
- [ ] 5.2.1 Load testing for API endpoints (P1)
- [ ] 5.2.2 Caching strategies (Redis) and CDN configuration (P1)

## 5.3 Quality Assurance (P1)
- [ ] 5.3.1 E2E tests for critical flows (signup, billing, analysis) (P1)
- [ ] 5.3.2 Content quality gate tests and content samples (P1)

---

# Phase 6 — Launch & Operations (PHASE 6)
Goal: Deploy, monitor, and operate the live service.

## 6.1 Deployment & Infra (P0)
- [ ] 6.1.1 Staging and production environments (P0)
- [ ] 6.1.2 CI/CD deployment flows and migrations (P0)

## 6.2 Monitoring & Alerts (P1)
- [ ] 6.2.1 Real-time agent health dashboard (P1)
- [ ] 6.2.2 Error and SLO alerting (P1)

## 6.3 Post-launch (P2)
- [ ] 6.3.1 Customer onboarding flows and analytics (P2)
- [ ] 6.3.2 Growth experiments and A/B testing (P2)

---

## Agent Etiquette & Notes
- Use clear, concise task notes. Always include `PR` with link, commit summary, and tests run.
- If you change schema or public API, update `docs/CHANGELOG.md` and `docs/API.md`.
- Keep incremental tasks small; large feature work should be broken into multiple increments.

---

## Quick index: file ownership hints
- `src/agents/*` → Agents and orchestrator
- `src/services/ai/*` → Gemini/Claude/unified AI router
- `supabase/*` → DB schema & migrations
- `scripts/*` → helper scripts (migrations, seeds, tests)
- `apps/web/` or `next/` → Frontend
- `docs/` → All developer and user-facing documentation

---

## Final instruction to agents
Before starting any task, update this file to mark it `[🔲]` and add your `Branch:` line. When complete, mark `[✓]` and include `CompletedBy`, `CompletedAt`, and `PR:`. This is the canonical project task tracker for agent work.


*Generated by agent on 2025-11-05*