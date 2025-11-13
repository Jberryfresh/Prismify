'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Globe,
  Smartphone,
  Zap,
  Shield,
  Eye
} from 'lucide-react';

interface AuditScore {
  overall_score: number;
  meta_score: number;
  content_score: number;
  technical_score: number;
  mobile_score: number;
  performance_score: number;
  security_score: number;
  accessibility_score: number;
}

interface Recommendation {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  effort: number;
}

interface AuditResult extends AuditScore {
  id: string;
  url: string;
  recommendations: Recommendation[];
  created_at: string;
}

export default function AuditsPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Simulate progress during analysis
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run audit');
      }

      setProgress(100);
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setProgress(0);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: 'destructive' as const,
      high: 'default' as const,
      medium: 'secondary' as const,
      low: 'outline' as const,
    };
    return variants[priority as keyof typeof variants] || 'outline';
  };

  const scoreCategories = result ? [
    { name: 'Meta Tags', score: result.meta_score, icon: Globe },
    { name: 'Content', score: result.content_score, icon: TrendingUp },
    { name: 'Technical', score: result.technical_score, icon: Zap },
    { name: 'Mobile', score: result.mobile_score, icon: Smartphone },
    { name: 'Performance', score: result.performance_score, icon: Zap },
    { name: 'Security', score: result.security_score, icon: Shield },
    { name: 'Accessibility', score: result.accessibility_score, icon: Eye },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Audit</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Analyze your website's SEO performance and get actionable recommendations
        </p>
      </div>

      {/* Audit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Run New Audit</CardTitle>
          <CardDescription>
            Enter a URL to analyze its SEO performance across 7 key components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="url" className="sr-only">
                  Website URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !url}
                className="h-12 px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Run Audit
                  </>
                )}
              </Button>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Analyzing website...
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Results</CardTitle>
                  <CardDescription className="mt-1">
                    {result.url} • {new Date(result.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(result.overall_score)}`}>
                    {result.overall_score}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Overall Score</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
              <CardDescription>
                Performance across 7 key SEO components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {scoreCategories.map(({ name, score, icon: Icon }) => (
                  <div
                    key={name}
                    className={`p-4 rounded-lg ${getScoreBgColor(score)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-5 w-5 ${getScoreColor(score)}`} />
                      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {name}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                {result.recommendations.length} actionable improvements identified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="critical">Critical</TabsTrigger>
                  <TabsTrigger value="high">High Priority</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                  {result.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getPriorityBadge(rec.priority)}>
                              {rec.priority.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {rec.category}
                            </span>
                          </div>
                          <h4 className="font-semibold">{rec.title}</h4>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-green-600">
                              {rec.impact}/10
                            </div>
                            <div className="text-xs text-slate-500">Impact</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">
                              {rec.effort}/10
                            </div>
                            <div className="text-xs text-slate-500">Effort</div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {rec.description}
                      </p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="critical" className="space-y-4 mt-4">
                  {result.recommendations
                    .filter((rec) => rec.priority === 'critical')
                    .map((rec, index) => (
                      <div
                        key={index}
                        className="border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive">CRITICAL</Badge>
                              <span className="text-xs text-slate-500">
                                {rec.category}
                              </span>
                            </div>
                            <h4 className="font-semibold">{rec.title}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {rec.description}
                        </p>
                      </div>
                    ))}
                  {result.recommendations.filter((rec) => rec.priority === 'critical')
                    .length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      No critical issues found
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="high" className="space-y-4 mt-4">
                  {result.recommendations
                    .filter((rec) => rec.priority === 'high')
                    .map((rec, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge>HIGH</Badge>
                              <span className="text-xs text-slate-500">
                                {rec.category}
                              </span>
                            </div>
                            <h4 className="font-semibold">{rec.title}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {rec.description}
                        </p>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
