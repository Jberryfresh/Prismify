/**
 * SEO Audit Routes
 * Core product feature - handles SEO audits, analysis, and recommendations
 * 
 * Routes:
 * - POST /api/audits - Create new SEO audit
 * - GET /api/audits/:id - Get audit results
 * - GET /api/audits - List user's audits with pagination
 * - DELETE /api/audits/:id - Delete audit
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/subscription.js';
import * as auditsController from '../controllers/audits.js';

const router = express.Router();

// All audit routes require authentication
router.use(requireAuth);

/**
 * POST /api/audits
 * Create new SEO audit
 * Body: { url: string, options?: { includeKeywords?: boolean, depth?: number } }
 * 
 * Quota limits:
 * - Starter: 10 audits/month
 * - Professional: 50 audits/month
 * - Agency: unlimited
 */
router.post(
  '/',
  checkQuota('audits'),
  auditsController.createAudit
);

/**
 * GET /api/audits/:id
 * Get specific audit results
 */
router.get('/:id', auditsController.getAudit);

/**
 * GET /api/audits
 * List user's audits with pagination
 * Query params: ?page=1&limit=10&sort=created_at&order=desc
 */
router.get('/', auditsController.listAudits);

/**
 * DELETE /api/audits/:id
 * Delete audit
 */
router.delete('/:id', auditsController.deleteAudit);

export default router;
