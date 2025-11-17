import { NextResponse } from 'next/server';
import { buildBackendUrl } from '@/lib/server/backend';
import { getProxyAuthHeaders } from '@/lib/server/auth';

const SUBSCRIPTION_ENDPOINT = buildBackendUrl('subscriptions/me');
const QUOTAS_ENDPOINT = buildBackendUrl('subscriptions/quotas');

export async function GET() {
  try {
    const auth = await getProxyAuthHeaders();

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [subRes, quotaRes] = await Promise.all([
      fetch(SUBSCRIPTION_ENDPOINT, {
        headers: auth.headers,
      }),
      fetch(QUOTAS_ENDPOINT, {
        headers: auth.headers,
      }),
    ]);

    const subData = await subRes.json();
    const quotaData = await quotaRes.json();

    if (!subRes.ok || subData.success === false) {
      const message =
        subData?.error?.message ||
        (typeof subData?.error === 'string' ? subData.error : null) ||
        'Failed to fetch subscription';
      return NextResponse.json({ error: message }, { status: subRes.status });
    }

    if (!quotaRes.ok || quotaData.success === false) {
      const message =
        quotaData?.error?.message ||
        (typeof quotaData?.error === 'string' ? quotaData.error : null) ||
        'Failed to fetch quota information';
      return NextResponse.json({ error: message }, { status: quotaRes.status });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          subscription: subData.data,
          quotas: quotaData.data,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription settings' },
      { status: 500 }
    );
  }
}
