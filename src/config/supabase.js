/**
 * Supabase Configuration
 *
 * Initializes Supabase client with environment variables.
 * Used for authentication, database operations, and storage.
 *
 * @module config/supabase
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Supabase environment variables: ${missingVars.join(', ')}\n` +
      'Please ensure these are set in your .env file.'
  );
}

/**
 * Supabase client instance (default)
 *
 * Used for all Supabase operations including:
 * - Authentication (sign up, sign in, sign out)
 * - Database queries (with RLS enforcement)
 * - Real-time subscriptions
 * - Storage operations
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Admin Supabase client (bypasses RLS)
 *
 * Use with caution! This client has elevated privileges.
 * Only use for administrative operations like:
 * - User management
 * - Bulk operations
 * - System-level queries
 */
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createSupabaseClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

function createScopedClient(accessToken) {
  if (!accessToken) {
    return supabase;
  }

  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create Supabase client (factory function)
 *
 * @param {Object} options - Client options
 * @param {boolean} options.admin - Use admin client (bypasses RLS)
 * @returns {Object} Supabase client instance
 *
 * @example
 * // Regular client (respects RLS)
 * const supabase = createClient();
 *
 * // Admin client (bypasses RLS)
 * const supabase = createClient({ admin: true });
 */
export function createClient(options = {}) {
  if (options.admin) {
    if (!supabaseAdmin) {
      throw new Error('Admin client not available. Set SUPABASE_SERVICE_ROLE_KEY in .env');
    }
    return supabaseAdmin;
  }
  if (options.accessToken) {
    return createScopedClient(options.accessToken);
  }
  return supabase;
}

// Log configuration status (without exposing secrets)
if (process.env.NODE_ENV === 'development') {
  const supabaseUrl = process.env.SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Supabase Configuration:');
  console.log(`  URL: ${supabaseUrl}`);
  console.log(
    `  Admin Client: ${hasServiceKey ? '✓ Enabled' : '✗ Disabled (service key not set)'}`
  );
}

// Export default client and factory function
export { supabase, supabaseAdmin };
export default supabase;
