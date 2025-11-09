/**
 * Report Routes
 * Endpoints for generating and exporting reports
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as reportsController from '../controllers/reports.js';

const router = express.Router();

/**
 * POST /api/reports/pdf
 * Generate PDF report for an audit
 */
router.post('/pdf', requireAuth, reportsController.generatePDF);

/**
 * POST /api/reports/csv
 * Generate CSV export of audit data
 */
router.post('/csv', requireAuth, reportsController.generateCSV);

/**
 * GET /api/reports/history
 * Get user's report generation history
 */
router.get('/history', requireAuth, reportsController.getReportHistory);

export default router;
