import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildBackendUrl } from '@/lib/server/backend';
import { getProxyAuthHeaders } from '@/lib/server/auth';

const KEYWORDS_ENDPOINT = buildBackendUrl('keywords/research');

export async function POST(request: NextRequest) {
  try {
    const auth = await getProxyAuthHeaders();

    if (!auth) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(KEYWORDS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.headers,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Keyword research API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to research keywords',
        },
      },
      { status: 500 }
    );
  }
}
