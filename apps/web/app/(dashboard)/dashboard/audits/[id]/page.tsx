'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
} from 'lucide-react';

interface Recommendation {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  effort: number;
}

interface AuditResult {
  id: string;
  url: string;
  overall_score: number;
  meta_score: number;
  content_score: number;
  technical_score: number;
  mobile_score: number;
  performance_score: number;
  security_score: number;
  accessibility_score: number;
  recommendations: Recommendation[];
  status: 'completed' | 'failed' | 'pending';
  created_at: string;
}

export default function AuditDetailPage() {
  const router = useRouter();
  const params = useParams();
  const auditId = params.id as string;

  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditDetails = useCallback(async () => {
    if (!auditId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/audits/${auditId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch audit details');
      }

      setAudit(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [auditId]);

  useEffect(() => {
    fetchAuditDetails();
  }, [fetchAuditDetails]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-600" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
    }
  };

  const filterRecommendations = (priority?: string) => {
    if (!audit?.recommendations) return [];
    if (!priority) return audit.recommendations;
    return audit.recommendations.filter((rec) => rec.priority === priority);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/audits/history')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              {error || 'Audit not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreComponents = [
    { name: 'Meta Tags', score: audit.meta_score },
    { name: 'Content', score: audit.content_score },
    { name: 'Technical', score: audit.technical_score },
    { name: 'Mobile', score: audit.mobile_score },
    { name: 'Performance', score: audit.performance_score },
    { name: 'Security', score: audit.security_score },
    { name: 'Accessibility', score: audit.accessibility_score },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/audits/history')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Results</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-slate-500 dark:text-slate-400">{audit.url}</span>
              <a
                href={audit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Analyzed on {new Date(audit.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500 mb-1">Overall Score</div>
            <div className={`text-5xl font-bold ${getScoreColor(audit.overall_score)}`}>
              {audit.overall_score}
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
          <CardDescription>
            Detailed analysis of your website’s SEO performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scoreComponents.map((component) => (
              <div key={component.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{component.name}</span>
                  <span className={`font-bold ${getScoreColor(component.score)}`}>
                    {component.score}
                  </span>
                </div>
                <Progress
                  value={component.score}
                  className="h-2"
                  indicatorClassName={getScoreBgColor(component.score)}
                />
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
            {audit.recommendations?.length || 0} actionable insights to improve your SEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                All ({audit.recommendations?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="critical">
                Critical ({filterRecommendations('critical').length})
              </TabsTrigger>
              <TabsTrigger value="high">
                High ({filterRecommendations('high').length})
              </TabsTrigger>
              <TabsTrigger value="medium">
                Medium ({filterRecommendations('medium').length})
              </TabsTrigger>
              <TabsTrigger value="low">
                Low ({filterRecommendations('low').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                {audit.recommendations?.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    No recommendations available
                  </p>
                ) : (
                  audit.recommendations?.map((rec, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          {getPriorityIcon(rec.priority)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg">{rec.title}</h3>
                              <Badge variant={rec.priority === 'critical' ? 'destructive' : 'secondary'}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mb-3">
                              {rec.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>Impact: {rec.impact}/10</span>
                              <span>Effort: {rec.effort}/10</span>
                              <span className="capitalize">Category: {rec.category}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {['critical', 'high', 'medium', 'low'].map((priority) => (
              <TabsContent key={priority} value={priority} className="mt-6">
                <div className="space-y-4">
                  {filterRecommendations(priority).length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      No {priority} priority recommendations
                    </p>
                  ) : (
                    filterRecommendations(priority).map((rec, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            {getPriorityIcon(rec.priority)}
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{rec.title}</h3>
                              <p className="text-slate-600 dark:text-slate-400 mb-3">
                                {rec.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>Impact: {rec.impact}/10</span>
                                <span>Effort: {rec.effort}/10</span>
                                <span className="capitalize">Category: {rec.category}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => router.push('/dashboard/audits')}>
          Run New Audit
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Export PDF
        </Button>
      </div>
    </div>
  );
}
