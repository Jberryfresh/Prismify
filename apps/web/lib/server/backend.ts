const DEFAULT_BACKEND_URL = 'http://localhost:3000';

/**
 * Build a backend API URL that works whether NEXT_PUBLIC_API_URL points to
 * the server root (http://localhost:3000) or already includes "/api"
 * (http://localhost:3000/api).
 */
export function buildBackendUrl(path = ''): string {
  const rawBase = process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL;
  const trimmedBase = rawBase.replace(/\/$/, '');
  const apiBase = trimmedBase.endsWith('/api') ? trimmedBase : `${trimmedBase}/api`;
  const normalizedPath = path.replace(/^\/+/, '');
  return `${apiBase}/${normalizedPath}`;
}
