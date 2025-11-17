'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface SubscriptionInfo {
  tier: 'starter' | 'professional' | 'agency';
  status: 'active' | 'canceled' | 'past_due' | string;
  stripe_customer_id?: string | null;
  created_at?: string;
}

interface QuotaMetric {
  limit: number | null;
  used: number;
  remaining: number | null;
  percentage: number | null;
}

interface QuotaInfo {
  tier: 'starter' | 'professional' | 'agency';
  status: string;
  quotas: {
    audits?: QuotaMetric;
    keywords?: QuotaMetric;
  };
}

interface SubscriptionSettingsResponse {
  success: boolean;
  data?: {
    subscription: SubscriptionInfo;
    quotas: QuotaInfo;
  };
  error?: string;
}

export default function SubscriptionSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [quotas, setQuotas] = useState<QuotaInfo | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/subscriptions');
      const data: SubscriptionSettingsResponse = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to fetch subscription settings');
      }

      setSubscription(data.data?.subscription || null);
      setQuotas(data.data?.quotas || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const formatTier = (tier?: string | null) => {
    if (!tier) return 'Starter';
    switch (tier) {
      case 'professional':
        return 'Professional';
      case 'agency':
        return 'Agency';
      default:
        return 'Starter';
    }
  };

  const formatStatus = (status?: string | null) => {
    if (!status) return 'Active';
    return status.replace(/_/g, ' ');
  };

  const renderQuotaLine = (label: string, metric?: QuotaMetric) => {
    if (!metric) return null;

    const isUnlimited = metric.limit === null || metric.limit === Infinity;
    const limitText = isUnlimited ? 'Unlimited' : metric.limit;

    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-medium">
          {metric.used} / {limitText}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
  <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Settings</CardTitle>
          <CardDescription>Manage your plan and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">{error}</div>
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tierLabel = formatTier(subscription?.tier || quotas?.tier);
  const statusLabel = formatStatus(subscription?.status || quotas?.status);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          View your current plan, status, and usage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active Prismify subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Plan</p>
              <p className="text-lg font-semibold">{tierLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status</p>
              <Badge
                variant={
                  statusLabel.toLowerCase().includes('active')
                    ? 'default'
                    : statusLabel.toLowerCase().includes('past')
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {statusLabel}
              </Badge>
            </div>
          </div>

          {subscription?.created_at && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Member since {new Date(subscription.created_at).toLocaleDateString()}
            </p>
          )}

          <div className="border-t border-slate-200 dark:border-slate-800 my-4" />

          <div className="space-y-2">
            <p className="text-sm font-semibold">Usage this month</p>
            {renderQuotaLine('SEO Audits', quotas?.quotas?.audits)}
            {renderQuotaLine('Keyword Research', quotas?.quotas?.keywords)}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 my-4" />

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                // In local dev, Stripe portal may not be configured
                // For now, we just show an alert. In production, this should
                // redirect to a Customer Portal URL from the backend.
                alert('Billing portal is not configured in local dev.');
              }}
            >
              Manage Billing
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                alert('Plan changes will be managed via Stripe in production.');
              }}
            >
              Change Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
