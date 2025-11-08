/**
 * User Profile Routes
 * Handles user profile management including retrieval, updates, and deletion
 * 
 * Routes:
 * - GET /api/user - Get current user profile
 * - PATCH /api/user - Update user profile
 * - DELETE /api/user - Delete user account (GDPR compliant)
 * - GET /api/user/export - Export user data (GDPR compliant)
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as usersController from '../controllers/users.js';

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

/**
 * GET /api/user
 * Get current user profile
 */
router.get('/', usersController.getCurrentUser);

/**
 * PATCH /api/user
 * Update user profile
 * Body: { full_name?, email?, preferences? }
 */
router.patch('/', usersController.updateUser);

/**
 * DELETE /api/user
 * Delete user account (soft delete with data retention for legal purposes)
 * Requires password confirmation in body
 */
router.delete('/', usersController.deleteUser);

/**
 * GET /api/user/export
 * Export all user data (GDPR Article 20 - Right to data portability)
 * Returns JSON file with all user data
 */
router.get('/export', usersController.exportUserData);

export default router;
