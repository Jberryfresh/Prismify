/**
 * Authentication Middleware
 *
 * Middleware functions for protecting API routes and verifying user authentication.
 *
 * Usage:
 *   import { requireAuth, optionalAuth } from './middleware/auth.js';
 *
 *   // Protected route - requires authentication
 *   app.get('/api/protected', requireAuth, (req, res) => {
 *     res.json({ user: req.user });
 *   });
 *
 *   // Optional auth - adds user to request if authenticated
 *   app.get('/api/public', optionalAuth, (req, res) => {
 *     res.json({ user: req.user || null });
 *   });
 *
 * @module middleware/auth
 */

import { authService } from '../services/auth/authService.js';
import { createClient } from '../config/supabase.js';
import { ensureUserProfile } from '../services/users/userProfileSync.js';

const devAuthBypassEnabled = process.env.DEV_AUTH_BYPASS === 'true';
const devFallbackUser = {
  id: process.env.DEV_FAKE_USER_ID || '00000000-0000-0000-0000-000000000001',
  email: process.env.DEV_FAKE_USER_EMAIL || 'dev@prismify.local',
  user_metadata: {
    role: 'developer',
  },
  app_metadata: {
    role: 'developer',
    provider: 'dev-bypass',
  },
};

function applyDevBypass(req, res, next) {
  if (!devAuthBypassEnabled) {
    return false;
  }

  req.user = devFallbackUser;
  req.userId = devFallbackUser.id;
  req.accessToken = null;
  try {
    req.supabase = createClient({ admin: true });
  } catch (error) {
    console.error('[auth] Failed to create admin Supabase client for DEV_AUTH_BYPASS:', error);
    req.supabase = null;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[auth] DEV_AUTH_BYPASS active – request authorized as dev user');
  }
  next();
  return true;
}

/**
 * Extract JWT token from request headers
 *
 * Supports multiple token formats:
 * - Authorization: Bearer <token>
 * - Authorization: <token>
 *
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null if not found
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Handle "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Handle plain token format
  return authHeader;
}

/**
 * Middleware: Require authentication
 *
 * Blocks requests without valid JWT token.
 * Attaches user object to req.user on success.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      if (applyDevBypass(req, res, next)) {
        return;
      }
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please provide a valid access token.',
        },
      });
    }

    // Verify token and get user
    const { user, error } = await authService.verifyToken(token);

    if (error || !user) {
      if (applyDevBypass(req, res, next)) {
        return;
      }
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: error?.message || 'Invalid or expired access token.',
        },
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    req.accessToken = token;
    req.supabase = createClient({ accessToken: token });
    await ensureUserProfile(user);

    next();
  } catch (error) {
    console.error('requireAuth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication verification failed.',
      },
    });
  }
}

/**
 * Middleware: Optional authentication
 *
 * Allows requests with or without authentication.
 * Attaches user object to req.user if authenticated, otherwise req.user is null.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      if (devAuthBypassEnabled) {
        req.user = devFallbackUser;
        req.userId = devFallbackUser.id;
        req.accessToken = null;
        try {
          req.supabase = createClient({ admin: true });
        } catch (error) {
          console.error(
            '[auth] Failed to create admin Supabase client for optional DEV_AUTH_BYPASS:',
            error
          );
          req.supabase = null;
        }
        return next();
      }
      req.user = null;
      req.userId = null;
      return next();
    }

    // Verify token and get user
    const { user, error } = await authService.verifyToken(token);

    if (error || !user) {
      if (devAuthBypassEnabled) {
        req.user = devFallbackUser;
        req.userId = devFallbackUser.id;
        req.accessToken = null;
        try {
          req.supabase = createClient({ admin: true });
        } catch (devError) {
          console.error(
            '[auth] Failed to create admin Supabase client for optional DEV_AUTH_BYPASS (invalid token):',
            devError
          );
          req.supabase = null;
        }
      } else {
        // Don't block request, just log the issue
        console.warn('optionalAuth: Invalid token provided:', error?.message);
        req.user = null;
        req.userId = null;
        req.accessToken = null;
        req.supabase = null;
      }
    } else {
      req.user = user;
      req.userId = user.id;
      req.accessToken = token;
      req.supabase = createClient({ accessToken: token });
      await ensureUserProfile(user);
    }

    next();
  } catch (error) {
    console.error('optionalAuth middleware error:', error);
    // Don't block request on error
    req.user = null;
    req.userId = null;
    req.accessToken = null;
    req.supabase = null;
    next();
  }
}

/**
 * Middleware: Require admin role
 *
 * Blocks requests from non-admin users.
 * Must be used after requireAuth middleware.
 *
 * Admin check looks for:
 * - user.user_metadata.role === 'admin'
 * - user.app_metadata.role === 'admin'
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
  }

  const isAdmin =
    req.user.user_metadata?.role === 'admin' || req.user.app_metadata?.role === 'admin';

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required.',
      },
    });
  }

  next();
}

/**
 * Middleware: Verify user owns resource
 *
 * Checks if req.user.id matches a user ID in the request.
 * Looks for user ID in: params.userId, body.userId, query.userId
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requireOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
  }

  // Extract target user ID from request
  const targetUserId = req.params.userId || req.body.userId || req.query.userId;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_USER_ID',
        message: 'User ID not found in request.',
      },
    });
  }

  // Check if user owns the resource
  if (req.user.id !== targetUserId) {
    // Allow admin override
    const isAdmin =
      req.user.user_metadata?.role === 'admin' || req.user.app_metadata?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource.',
        },
      });
    }
  }

  next();
}

/**
 * Middleware: Rate limiting by user ID
 *
 * Simple in-memory rate limiter (use Redis in production).
 * Tracks requests per user per time window.
 *
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
export function rateLimitByUser(maxRequests = 100, windowMs = 60000) {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.userId) {
      // No auth, apply IP-based limiting (implement separately)
      return next();
    }

    const now = Date.now();
    const userId = req.userId;

    // Get or create request log for user
    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    // Remove old requests outside time window
    const validRequests = userRequests.filter((timestamp) => now - timestamp < windowMs);
    requests.set(userId, validRequests);

    // Check if user exceeded limit
    if (validRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = new Date(oldestRequest + windowMs);

      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please try again later.`,
          retryAfter: resetTime.toISOString(),
        },
      });
    }

    // Add current request timestamp
    validRequests.push(now);
    requests.set(userId, validRequests);

    next();
  };
}

/**
 * Middleware: Extract session from cookie (for server-side rendering)
 *
 * For Next.js or other SSR frameworks that need session from cookies.
 * Creates a per-request Supabase client with the session from the cookie.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function sessionFromCookie(req, res, next) {
  try {
    // Extract access token from cookie
    const cookies = req.headers.cookie;
    if (!cookies) {
      req.user = null;
      req.session = null;
      return next();
    }

    // Parse cookies to find access token
    const cookieMap = {};
    cookies.split(';').forEach((cookie) => {
      const [name, value] = cookie.trim().split('=');
      cookieMap[name] = value;
    });

    const accessToken = cookieMap['sb-access-token'];
    if (!accessToken) {
      req.user = null;
      req.session = null;
      return next();
    }

    // Verify token
    const { user, error } = await authService.verifyToken(accessToken);

    if (error || !user) {
      req.user = null;
      req.session = null;
      return next();
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('sessionFromCookie middleware error:', error);
    req.user = null;
    req.session = null;
    next();
  }
}

export default {
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireOwnership,
  rateLimitByUser,
  sessionFromCookie,
};
