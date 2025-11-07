/**
 * Supabase Configuration
 *
 * Initializes Supabase client with environment variables.
 * Used for authentication, database operations, and storage.
 *
 * @module config/supabase
 */

import { createClient } from '@supabase/supabase-js';
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
 * Supabase client instance
 *
 * Used for all Supabase operations including:
 * - Authentication (sign up, sign in, sign out)
 * - Database queries (with RLS enforcement)
 * - Real-time subscriptions
 * - Storage operations
 */
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
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
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Log configuration status (without exposing secrets)
const supabaseUrl = process.env.SUPABASE_URL;
const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase Configuration:');
console.log(`  URL: ${supabaseUrl}`);
console.log(`  Admin Client: ${hasServiceKey ? '✓ Enabled' : '✗ Disabled (service key not set)'}`);

export default supabase;
