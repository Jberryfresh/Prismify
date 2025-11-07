/**
 * Email Service
 *
 * Handles email sending for authentication and notifications.
 * Uses Supabase Auth for authentication emails (password reset, verification).
 * Can be extended with custom SMTP for transactional emails.
 *
 * @module services/email/emailService
 */

import { supabase } from '../../config/supabase.js';

/**
 * Email Service Class
 *
 * Provides methods for sending various types of emails.
 * Authentication emails are handled by Supabase Auth.
 */
export class EmailService {
  /**
   * Send password reset email
   *
   * @param {string} email - User's email address
   * @param {string} redirectTo - URL to redirect after reset (optional)
   * @returns {Promise<{success: boolean, error: Object|null}>}
   */
  async sendPasswordResetEmail(email, redirectTo = null) {
    try {
      const resetUrl =
        redirectTo || `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });

      if (error) {
        console.error('Failed to send password reset email:', error);
        return { success: false, error };
      }

      console.log(`Password reset email sent to: ${email}`);
      return { success: true, error: null };
    } catch (error) {
      console.error('EmailService.sendPasswordResetEmail error:', error);
      return {
        success: false,
        error: { message: 'Failed to send password reset email.' },
      };
    }
  }

  /**
   * Resend email verification
   *
   * @param {string} email - User's email address
   * @param {string} redirectTo - URL to redirect after verification (optional)
   * @returns {Promise<{success: boolean, error: Object|null}>}
   */
  async resendVerificationEmail(email, redirectTo = null) {
    try {
      const verifyUrl =
        redirectTo || `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: verifyUrl,
        },
      });

      if (error) {
        console.error('Failed to resend verification email:', error);
        return { success: false, error };
      }

      console.log(`Verification email sent to: ${email}`);
      return { success: true, error: null };
    } catch (error) {
      console.error('EmailService.resendVerificationEmail error:', error);
      return {
        success: false,
        error: { message: 'Failed to resend verification email.' },
      };
    }
  }

  /**
   * Send magic link for passwordless login
   *
   * @param {string} email - User's email address
   * @param {string} redirectTo - URL to redirect after login (optional)
   * @returns {Promise<{success: boolean, error: Object|null}>}
   */
  async sendMagicLink(email, redirectTo = null) {
    try {
      const loginUrl =
        redirectTo || `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: loginUrl,
        },
      });

      if (error) {
        console.error('Failed to send magic link:', error);
        return { success: false, error };
      }

      console.log(`Magic link sent to: ${email}`);
      return { success: true, error: null };
    } catch (error) {
      console.error('EmailService.sendMagicLink error:', error);
      return {
        success: false,
        error: { message: 'Failed to send magic link.' },
      };
    }
  }

  /**
   * Send welcome email (placeholder for custom implementation)
   *
   * @param {string} email - User's email address
   * @param {string} name - User's name
   * @returns {Promise<{success: boolean, error: Object|null}>}
   */
  async sendWelcomeEmail(email, name) {
    try {
      // TODO: Implement with SendGrid, Postmark, or other email service
      console.log(`Welcome email would be sent to: ${email} (${name})`);
      console.warn('Welcome emails not yet implemented. Configure SMTP provider.');

      return {
        success: true,
        error: null,
        note: 'Welcome email feature not yet configured',
      };
    } catch (error) {
      console.error('EmailService.sendWelcomeEmail error:', error);
      return {
        success: false,
        error: { message: 'Failed to send welcome email.' },
      };
    }
  }

  /**
   * Send notification email (placeholder for custom implementation)
   *
   * @param {string} email - User's email address
   * @param {string} subject - Email subject
   * @param {string} _body - Email body (HTML or text) - unused until SMTP configured
   * @returns {Promise<{success: boolean, error: Object|null}>}
   */
  async sendNotificationEmail(email, subject, _body) {
    try {
      // TODO: Implement with SendGrid, Postmark, or other email service
      console.log(`Notification email would be sent to: ${email}`);
      console.log(`Subject: ${subject}`);
      console.warn('Notification emails not yet implemented. Configure SMTP provider.');

      return {
        success: true,
        error: null,
        note: 'Notification email feature not yet configured',
      };
    } catch (error) {
      console.error('EmailService.sendNotificationEmail error:', error);
      return {
        success: false,
        error: { message: 'Failed to send notification email.' },
      };
    }
  }

  /**
   * Validate email format
   *
   * @param {string} email - Email address to validate
   * @returns {boolean} True if email is valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email domain is allowed
   *
   * @param {string} email - Email address to check
   * @param {Array<string>} allowedDomains - List of allowed domains (optional)
   * @returns {boolean} True if domain is allowed
   */
  isAllowedDomain(email, allowedDomains = null) {
    if (!allowedDomains || allowedDomains.length === 0) {
      return true; // No restrictions
    }

    const domain = email.split('@')[1]?.toLowerCase();
    return allowedDomains.some((allowed) => domain === allowed.toLowerCase());
  }

  /**
   * Check if email is disposable/temporary
   *
   * @param {string} email - Email address to check
   * @returns {boolean} True if email appears to be disposable
   */
  isDisposableEmail(email) {
    // Common disposable email domains
    const disposableDomains = [
      'tempmail.com',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email',
      'temp-mail.org',
      'fakeinbox.com',
      'trashmail.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }
}

// Export singleton instance
export const emailService = new EmailService();

export default emailService;
