/**
 * User Profile Sync Service
 *
 * Ensures a corresponding row exists in the application's `users` table
 * for every authenticated Supabase user. Intended to run after
 * authentication middleware attaches `req.user`.
 */

import { createClient } from '../../config/supabase.js';

let syncDisabled = false;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.toLowerCase() : null;
}

function extractFullName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.fullName ||
    null
  );
}

function extractSubscriptionTier(user) {
  return user?.user_metadata?.subscription_tier || 'starter';
}

export async function ensureUserProfile(user) {
  if (!user?.id || syncDisabled) {
    return;
  }

  let adminClient;
  try {
    adminClient = createClient({ admin: true });
  } catch (error) {
    syncDisabled = true;
    console.warn('[userProfileSync] Admin client unavailable, skipping profile sync.', error);
    return;
  }

  try {
    const email = normalizeEmail(user.email);
    const fullName = extractFullName(user);
    const subscriptionTier = extractSubscriptionTier(user);
    const timestamp = new Date().toISOString();

    const { data: existing, error: fetchError } = await adminClient
      .from('users')
      .select('id, email, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existing) {
      await adminClient.from('users').insert({
        id: user.id,
        email,
        full_name: fullName,
        subscription_tier: subscriptionTier,
        created_at: timestamp,
        updated_at: timestamp,
      });
      return;
    }

    const updates = {};
    if (email && email !== existing.email) {
      updates.email = email;
    }
    if (fullName && !existing.full_name) {
      updates.full_name = fullName;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    updates.updated_at = timestamp;

    await adminClient.from('users').update(updates).eq('id', user.id);
  } catch (error) {
    console.error('[userProfileSync] Failed to sync user profile:', error);
  }
}

export default ensureUserProfile;
