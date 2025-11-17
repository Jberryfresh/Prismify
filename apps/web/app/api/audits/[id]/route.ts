import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildBackendUrl } from '@/lib/server/backend';
import { getProxyAuthHeaders } from '@/lib/server/auth';

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const auditId = context.params?.id;

  if (!auditId) {
    return NextResponse.json({ error: 'Missing audit id' }, { status: 400 });
  }

  try {
    const auth = await getProxyAuthHeaders();

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const endpoint = buildBackendUrl(`audits/${encodeURIComponent(auditId)}`);
    const response = await fetch(endpoint, {
      headers: auth.headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Audit detail fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit details' },
      { status: 500 }
    );
  }
}
