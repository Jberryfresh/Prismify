/**
 * Users Controller
 * Handles user profile management operations
 */

import { createClient } from '../config/supabase.js';
import authService from '../services/auth/authService.js';

/**
 * Get current user profile
 * @route GET /api/user
 */
export async function getCurrentUser(req, res) {
  try {
    const supabase = createClient();
    const userId = req.user.id;

    // Get user data from users table
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, subscription_tier, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch user profile',
        },
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Get subscription info
    const { data: subscription } = await supabase
      .from('subscription_history')
      .select('plan_name, status, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return res.json({
      success: true,
      data: {
        ...user,
        subscription: subscription || null,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}

/**
 * Update user profile
 * @route PATCH /api/user
 */
export async function updateUser(req, res) {
  try {
    const supabase = createClient();
    const userId = req.user.id;
    const { full_name, email, preferences } = req.body;

    // Validate input
    const updates = {};
    if (full_name !== undefined) {
      if (typeof full_name !== 'string' || full_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Full name must be a non-empty string',
          },
        });
      }
      updates.full_name = full_name.trim();
    }

    if (email !== undefined) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email format',
          },
        });
      }
      
      // Check if email is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_TAKEN',
            message: 'Email address is already in use',
          },
        });
      }

      updates.email = email.toLowerCase();
    }

    if (preferences !== undefined) {
      if (typeof preferences !== 'object') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Preferences must be an object',
          },
        });
      }
      updates.preferences = preferences;
    }

    // If no valid updates, return error
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update',
        },
      });
    }

    updates.updated_at = new Date().toISOString();

    // Update user in database
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, full_name, subscription_tier, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update user profile',
        },
      });
    }

    // If email was updated, also update in Supabase Auth
    if (email) {
      try {
        await authService.updateUserEmail(userId, email);
      } catch (authError) {
        console.error('Error updating auth email:', authError);
        // Continue anyway - main user record is updated
      }
    }

    return res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}

/**
 * Delete user account (GDPR compliant)
 * @route DELETE /api/user
 */
export async function deleteUser(req, res) {
  try {
    const supabase = createClient();
    const userId = req.user.id;
    const { password } = req.body;

    // Require password confirmation
    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_REQUIRED',
          message: 'Password confirmation required to delete account',
        },
      });
    }

    // Verify password
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Verify password using Supabase Auth
    try {
      const { error: signInError } = await authService.signIn(user.email, password);
      if (signInError) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Invalid password',
          },
        });
      }
    // eslint-disable-next-line no-unused-vars
    } catch (_authError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Invalid password',
        },
      });
    }

    // Soft delete: Mark account as deleted but retain data for legal/billing purposes
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: `deleted_${userId}@prismify.deleted`,
        full_name: 'Deleted User',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error deleting user:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete user account',
        },
      });
    }

    // Cancel Stripe subscription if active
    try {
      const { data: subscription } = await supabase
        .from('subscription_history')
        .select('stripe_subscription_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subscription?.stripe_subscription_id) {
        const { default: stripeService } = await import('../services/stripe/stripeService.js');
        await stripeService.cancelSubscription(subscription.stripe_subscription_id);
      }
    } catch (stripeError) {
      console.error('Error canceling subscription:', stripeError);
      // Continue with deletion even if subscription cancellation fails
    }

    // Delete from Supabase Auth
    try {
      await authService.deleteUser(userId);
    } catch (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      // User record is already soft-deleted, continue
    }

    return res.json({
      success: true,
      data: {
        message: 'Account successfully deleted',
        deleted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}

/**
 * Export all user data (GDPR Article 20 - Right to data portability)
 * @route GET /api/user/export
 */
export async function exportUserData(req, res) {
  try {
    const supabase = createClient();
    const userId = req.user.id;

    // Get user profile
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Get API keys (hashed, not actual keys)
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, scopes, created_at, last_used_at, expires_at')
      .eq('user_id', userId);

    // Get SEO projects
    const { data: projects } = await supabase
      .from('seo_projects')
      .select('*')
      .eq('user_id', userId);

    // Get SEO analyses
    const { data: analyses } = await supabase
      .from('seo_analyses')
      .select('*')
      .eq('user_id', userId);

    // Get meta tags
    const { data: metaTags } = await supabase
      .from('meta_tags')
      .select('*')
      .eq('user_id', userId);

    // Get API usage
    const { data: apiUsage } = await supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', userId);

    // Get subscription history
    const { data: subscriptions } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId);

    const exportData = {
      export_date: new Date().toISOString(),
      user_profile: user,
      api_keys: apiKeys || [],
      projects: projects || [],
      analyses: analyses || [],
      meta_tags: metaTags || [],
      api_usage: apiUsage || [],
      subscription_history: subscriptions || [],
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="prismify-data-export-${userId}-${Date.now()}.json"`);

    return res.json(exportData);
  } catch (error) {
    console.error('Export user data error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}
