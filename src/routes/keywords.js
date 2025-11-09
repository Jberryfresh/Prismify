/**
 * Keyword Research Routes
 * Endpoints for keyword analysis and research
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/subscription.js';
import * as keywordsController from '../controllers/keywords.js';

const router = express.Router();

/**
 * POST /api/keywords/research
 * Research keywords for a topic/seed keyword
 * Rate limited by subscription tier
 */
router.post('/research', requireAuth, checkQuota('keywords'), keywordsController.researchKeywords);

/**
 * GET /api/keywords/:audit_id
 * Get keywords for a specific audit
 */
router.get('/:audit_id', requireAuth, keywordsController.getKeywordsByAudit);

/**
 * GET /api/keywords/:audit_id/opportunities
 * Get highest opportunity keywords for an audit
 */
router.get('/:audit_id/opportunities', requireAuth, keywordsController.getTopOpportunities);

export default router;
