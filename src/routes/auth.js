/**
 * Authentication Routes
 *
 * Express routes for authentication operations:
 * - Sign up
 * - Sign in
 * - Sign out
 * - Password reset
 * - Email verification
 * - OAuth callbacks
 *
 * @module routes/auth
 */

import express from 'express';
import { authService } from '../services/auth/authService.js';
import { emailService } from '../services/email/emailService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /auth/signup
 * Register a new user account
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, company } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required.',
        },
      });
    }

    // Validate email format
    if (!emailService.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format.',
        },
      });
    }

    // Check for disposable email
    if (emailService.isDisposableEmail(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DISPOSABLE_EMAIL',
          message: 'Disposable email addresses are not allowed.',
        },
      });
    }

    // Validate password strength (basic check)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long.',
        },
      });
    }

    // Create user
    const metadata = {};
    if (full_name) {
      metadata.full_name = full_name;
    }
    if (company) {
      metadata.company = company;
    }

    const { user, session, error, requiresConfirmation } = await authService.signUp(
      email,
      password,
      metadata
    );

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SIGNUP_FAILED',
          message: error.message || 'Failed to create account.',
        },
      });
    }

    // Success response
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
          company: user.user_metadata?.company,
        },
        session: session
          ? {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
            }
          : null,
        requiresConfirmation,
      },
      message: requiresConfirmation
        ? 'Account created. Please check your email to verify your account.'
        : 'Account created successfully.',
    });
  } catch (error) {
    console.error('POST /auth/signup error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during signup.',
      },
    });
  }
});

/**
 * POST /auth/signin
 * Sign in with email and password
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required.',
        },
      });
    }

    // Sign in
    const { user, session, error } = await authService.signIn(email, password);

    if (error) {
      // Handle specific error cases
      if (error.message?.includes('Invalid login credentials')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Incorrect email or password.',
          },
        });
      }

      if (error.message?.includes('Email not confirmed')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'EMAIL_NOT_CONFIRMED',
            message: 'Please verify your email address before signing in.',
          },
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          code: 'SIGNIN_FAILED',
          message: error.message || 'Failed to sign in.',
        },
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
          company: user.user_metadata?.company,
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        },
      },
      message: 'Signed in successfully.',
    });
  } catch (error) {
    console.error('POST /auth/signin error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during signin.',
      },
    });
  }
});

/**
 * POST /auth/signout
 * Sign out the current user
 */
router.post('/signout', requireAuth, async (req, res) => {
  try {
    const { error } = await authService.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SIGNOUT_FAILED',
          message: error.message || 'Failed to sign out.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Signed out successfully.',
    });
  } catch (error) {
    console.error('POST /auth/signout error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during signout.',
      },
    });
  }
});

/**
 * POST /auth/reset-password
 * Send password reset email
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email is required.',
        },
      });
    }

    // Validate email format
    if (!emailService.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format.',
        },
      });
    }

    // Send reset email
    const { error } = await emailService.sendPasswordResetEmail(email);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'RESET_FAILED',
          message: error.message || 'Failed to send password reset email.',
        },
      });
    }

    // Always return success (don't reveal if email exists)
    return res.status(200).json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('POST /auth/reset-password error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while processing password reset.',
      },
    });
  }
});

/**
 * POST /auth/update-password
 * Update user's password (must be authenticated)
 */
router.post('/update-password', requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Validation
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PASSWORD',
          message: 'New password is required.',
        },
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long.',
        },
      });
    }

    // Update password
    const { error } = await authService.updatePassword(newPassword);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error.message || 'Failed to update password.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('POST /auth/update-password error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating password.',
      },
    });
  }
});

/**
 * POST /auth/verify/resend
 * Resend email verification
 */
router.post('/verify/resend', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email is required.',
        },
      });
    }

    // Validate email format
    if (!emailService.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format.',
        },
      });
    }

    // Resend verification email
    const { error } = await emailService.resendVerificationEmail(email);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'RESEND_FAILED',
          message: error.message || 'Failed to resend verification email.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('POST /auth/verify/resend error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while resending verification email.',
      },
    });
  }
});

/**
 * POST /auth/magic-link
 * Send magic link for passwordless login
 */
router.post('/magic-link', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email is required.',
        },
      });
    }

    // Validate email format
    if (!emailService.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format.',
        },
      });
    }

    // Send magic link
    const { error } = await emailService.sendMagicLink(email);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MAGIC_LINK_FAILED',
          message: error.message || 'Failed to send magic link.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Magic link sent. Please check your email.',
    });
  } catch (error) {
    console.error('POST /auth/magic-link error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while sending magic link.',
      },
    });
  }
});

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name,
          company: req.user.user_metadata?.company,
          email_verified: req.user.email_confirmed_at ? true : false,
          created_at: req.user.created_at,
        },
      },
    });
  } catch (error) {
    console.error('GET /auth/me error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve user information.',
      },
    });
  }
});

/**
 * GET /auth/session
 * Get current session (optionally authenticated)
 */
router.get('/session', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        data: {
          authenticated: false,
          user: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name,
        },
      },
    });
  } catch (error) {
    console.error('GET /auth/session error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve session.',
      },
    });
  }
});

export default router;
