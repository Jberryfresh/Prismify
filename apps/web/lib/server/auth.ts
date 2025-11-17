import { createClient } from '@/lib/supabase/server';

interface ProxyAuthHeaders {
  headers: Record<string, string>;
  isBypassed: boolean;
}

const DEV_AUTH_BYPASS_ENABLED = process.env.DEV_AUTH_BYPASS === 'true';

/**
 * Resolves authorization headers for proxying API requests to the backend.
 * Prefers the current Supabase session token, but falls back to a dev bypass
 * when explicitly enabled via DEV_AUTH_BYPASS.
 */
export async function getProxyAuthHeaders(): Promise<ProxyAuthHeaders | null> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        isBypassed: false,
      };
    }
  } catch (error) {
    if (!DEV_AUTH_BYPASS_ENABLED) {
      throw error;
    }

    console.warn('[auth] Supabase session lookup failed, falling back to DEV_AUTH_BYPASS:', error);
    return {
      headers: {},
      isBypassed: true,
    };
  }

  if (DEV_AUTH_BYPASS_ENABLED) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth] DEV_AUTH_BYPASS active – proxying request without Supabase session');
    }

    return {
      headers: {},
      isBypassed: true,
    };
  }

  return null;
}
