import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileSearch, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // TODO: Fetch real data from API
  const stats = {
    totalAudits: 0,
    avgScore: 0,
    criticalIssues: 0,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Here&apos;s what&apos;s happening with your SEO performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <FileSearch className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAudits}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.totalAudits === 0 ? 'Run your first audit' : '+12% from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgScore > 0 ? `${stats.avgScore}/100` : '—'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.avgScore === 0 ? 'No data yet' : '+5 points this week'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalIssues}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.criticalIssues === 0 ? 'All clear!' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Card */}
      {stats.totalAudits === 0 && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Get Started with Prismify</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Run your first SEO audit in seconds
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Our AI-powered SEO analysis will give you a comprehensive score across 7 key areas:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="secondary">Meta Tags</Badge>
              <Badge variant="secondary">Content Quality</Badge>
              <Badge variant="secondary">Technical SEO</Badge>
              <Badge variant="secondary">Mobile Friendly</Badge>
              <Badge variant="secondary">Performance</Badge>
              <Badge variant="secondary">Security</Badge>
              <Badge variant="secondary">Accessibility</Badge>
              <Badge variant="secondary">+ Recommendations</Badge>
            </div>
            <Link href="/dashboard/audits">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                <FileSearch className="mr-2 h-4 w-4" />
                Run Your First Audit
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Audits Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Audits</CardTitle>
            <Link href="/dashboard/audits/history">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.totalAudits === 0 ? (
            <div className="text-center py-12">
              <FileSearch className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                No audits yet. Run your first audit to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* TODO: Map over real audit data */}
              <p className="text-sm text-slate-500">Your recent audits will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
