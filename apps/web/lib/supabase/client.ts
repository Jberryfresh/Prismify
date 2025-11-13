import { createBrowserClient } from '@supabase/ssr';

/**
 * Create Supabase client for client-side usage
 * Adds a runtime guard with a helpful error when env is missing.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Log full context to console for easier debugging in dev
    // (avoid leaking secrets in production logs)
    // eslint-disable-next-line no-console
    console.error('[supabase] Missing env vars', {
      NEXT_PUBLIC_SUPABASE_URL: !!url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anon,
    });
    throw new Error(
      'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your frontend .env.local'
    );
  }

  return createBrowserClient(url, anon);
}
