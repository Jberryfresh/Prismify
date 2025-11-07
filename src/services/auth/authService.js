/**
 * Authentication Service
 *
 * Handles all authentication operations using Supabase Auth:
 * - User signup (email/password)
 * - User login (email/password)
 * - OAuth authentication (Google, GitHub)
 * - Session management
 * - Password reset
 * - Email verification
 *
 * @module services/auth/authService
 */

import { supabase, createClient } from '../../config/supabase.js';

/**
 * Authentication Service Class
 *
 * Provides methods for all authentication operations.
 * Uses Supabase Auth under the hood with proper error handling.
 */
export class AuthService {
  /**
   * Sign up a new user with email and password
   *
   * @param {string} email - User's email address
   * @param {string} password - User's password (min 8 characters)
   * @param {Object} metadata - Additional user metadata (name, company, etc.)
   * @returns {Promise<{user: Object, session: Object, error: Object|null}>}
   */
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`,
        },
      });

      if (error) {
        return { user: null, session: null, error };
      }

      // If email confirmation is required, user.email_confirmed_at will be null
      const requiresConfirmation = !data.user?.email_confirmed_at;

      return {
        user: data.user,
        session: data.session,
        error: null,
        requiresConfirmation,
      };
    } catch (error) {
      console.error('AuthService.signUp error:', error);
      return {
        user: null,
        session: null,
        error: { message: 'Failed to sign up. Please try again.' },
      };
    }
  }

  /**
   * Sign in an existing user with email and password
   *
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<{user: Object, session: Object, error: Object|null}>}
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      console.error('AuthService.signIn error:', error);
      return {
        user: null,
        session: null,
        error: { message: 'Failed to sign in. Please try again.' },
      };
    }
  }

  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   *
   * @param {string} provider - OAuth provider name ('google', 'github', etc.)
   * @param {string} redirectTo - URL to redirect after authentication
   * @returns {Promise<{url: string, error: Object|null}>}
   */
  async signInWithOAuth(provider, redirectTo = null) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            redirectTo || `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`,
        },
      });

      if (error) {
        return { url: null, error };
      }

      return {
        url: data.url,
        error: null,
      };
    } catch (error) {
      console.error('AuthService.signInWithOAuth error:', error);
      return {
        url: null,
        error: { message: 'Failed to initiate OAuth sign in.' },
      };
    }
  }

  /**
   * Sign out the current user
   *
   * @returns {Promise<{success: boolean, error: Object|null}>}
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('AuthService.signOut error:', error);
      return {
        success: false,
        error: { message: 'Failed to sign out.' },
      };
    }
  }

  /**
   * Admin sign out user (revokes all sessions)
   * @param {string} userId - User ID to sign out
   * @returns {Promise<{error: Object|null}>}
   */
  async adminSignOut(userId) {
    try {
      const adminClient = createClient({ admin: true });
      const { error } = await adminClient.auth.admin.signOut(userId);
      return { error };
    } catch (error) {
      console.error('AuthService.adminSignOut error:', error);
      return { error: { message: 'Failed to sign out user' } };
    }
  }

  /**
   * Get the current authenticated session
   *
   * @returns {Promise<{session: Object|null, error: Object|null}>}
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return { session: null, error };
      }

      return {
        session: data.session,
        error: null,
      };
    } catch (error) {
      console.error('AuthService.getSession error:', error);
      return {
        session: null,
        error: { message: 'Failed to get session.' },
      };
    }
  }

  /**
   * Get the current authenticated user
   *
   * @returns {Promise<{user: Object|null, error: Object|null}>}
   */
  async getUser() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return { user: null, error };
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      console.error('AuthService.getUser error:', error);
      return {
        user: null,
        error: { message: 'Failed to get user.' },
      };
    }
  }

  /**
   * Refresh the current session
   *
   * @returns {Promise<{session: Object, error: Object|null}>}
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return { session: null, error };
      }

      return {
        session: data.session,
        error: null,
      };
    } catch (error) {
      console.error('AuthService.refreshSession error:', error);
      return {
        session: null,
        error: { message: 'Failed to refresh session.' },
      };
    }
  }

  /**
   * Send password reset email
   *
   * @param {string} email - User's email address
   * @returns {Promise<{success: boolean, error: Object|null}>}
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('AuthService.resetPassword error:', error);
      return {
        success: false,
        error: { message: 'Failed to send password reset email.' },
      };
    }
  }

  /**
   * Update user password
   *
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean, error: Object|null}>}
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('AuthService.updatePassword error:', error);
      return {
        success: false,
        error: { message: 'Failed to update password.' },
      };
    }
  }

  /**
   * Update user metadata
   *
   * @param {Object} metadata - User metadata to update
   * @returns {Promise<{user: Object, error: Object|null}>}
   */
  async updateUserMetadata(metadata) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata,
      });

      if (error) {
        return { user: null, error };
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      console.error('AuthService.updateUserMetadata error:', error);
      return {
        user: null,
        error: { message: 'Failed to update user metadata.' },
      };
    }
  }

  /**
   * Verify JWT token and return user
   *
   * @param {string} token - JWT token to verify
   * @returns {Promise<{user: Object|null, error: Object|null}>}
   */
  async verifyToken(token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error) {
        return { user: null, error };
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      console.error('AuthService.verifyToken error:', error);
      return {
        user: null,
        error: { message: 'Invalid or expired token.' },
      };
    }
  }

  /**
   * Admin: Get user by ID (requires service role)
   *
   * @param {string} userId - User ID
   * @returns {Promise<{user: Object|null, error: Object|null}>}
   */
  async adminGetUser(userId) {
    const adminClient = createClient({ admin: true });

    try {
      const { data, error } = await adminClient.auth.admin.getUserById(userId);

      if (error) {
        return { user: null, error };
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      console.error('AuthService.adminGetUser error:', error);
      return {
        user: null,
        error: { message: 'Failed to get user.' },
      };
    }
  }

  /**
   * Admin: Delete user (requires service role)
   *
   * @param {string} userId - User ID to delete
   * @returns {Promise<{success: boolean, error: Object|null}>}
   */
  async adminDeleteUser(userId) {
    const adminClient = createClient({ admin: true });

    try {
      const { error } = await adminClient.auth.admin.deleteUser(userId);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('AuthService.adminDeleteUser error:', error);
      return {
        success: false,
        error: { message: 'Failed to delete user.' },
      };
    }
  }

  /**
   * Listen to auth state changes
   *
   * @param {Function} callback - Callback function to handle auth events
   * @returns {Object} Subscription object with unsubscribe method
   */
  onAuthStateChange(callback) {
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return subscription;
  }
}

// Export singleton instance
export const authService = new AuthService();

export default authService;
