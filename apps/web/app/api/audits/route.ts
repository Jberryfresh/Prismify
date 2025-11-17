import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildBackendUrl } from '@/lib/server/backend';
import { getProxyAuthHeaders } from '@/lib/server/auth';

const AUDITS_ENDPOINT = buildBackendUrl('audits');

export async function GET() {
  try {
    const auth = await getProxyAuthHeaders();

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward request to backend API
    const response = await fetch(AUDITS_ENDPOINT, {
      headers: auth.headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Audit fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getProxyAuthHeaders();

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Forward request to backend API
    const response = await fetch(AUDITS_ENDPOINT, {
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
    console.error('Audit creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create audit' },
      { status: 500 }
    );
  }
}
