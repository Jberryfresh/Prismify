/**
 * Authentication Module Index
 *
 * Exports all authentication-related services and utilities.
 *
 * Usage:
 *   import { authService, requireAuth, optionalAuth } from './services/auth/index.js';
 */

import { authService, AuthService } from './authService.js';

export { authService, AuthService };
export { default as authMiddleware } from '../../middleware/auth.js';

// Re-export middleware functions for convenience
export {
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireOwnership,
  rateLimitByUser,
  sessionFromCookie,
} from '../../middleware/auth.js';

export default authService;
