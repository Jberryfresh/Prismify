'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

interface AuditHistoryItem {
  id: string;
  url: string;
  overall_score: number;
  created_at: string;
  status: 'completed' | 'failed' | 'pending';
}

export default function AuditHistoryPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const response = await fetch('/api/audits');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch audits');
      }

      setAudits(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreTrend = (currentScore: number, index: number) => {
    if (index === audits.length - 1) return null;
    const prevScore = audits[index + 1].overall_score;
    const diff = currentScore - prevScore;

    if (diff > 0) {
      return (
        <span className="flex items-center text-green-600 text-sm">
          <TrendingUp className="h-4 w-4 mr-1" />
          +{diff}
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center text-red-600 text-sm">
          <TrendingDown className="h-4 w-4 mr-1" />
          {diff}
        </span>
      );
    }
    return (
      <span className="flex items-center text-slate-500 text-sm">
        <Minus className="h-4 w-4 mr-1" />
        0
      </span>
    );
  };

  const sortedAndFilteredAudits = audits
    .filter((audit) => filterStatus === 'all' || audit.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return b.overall_score - a.overall_score;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          View and track your SEO audit progress over time
        </p>
      </div>

      {/* Filters and Sort */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Past Audits</CardTitle>
              <CardDescription>{audits.length} total audits</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'score')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedAndFilteredAudits.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="mb-4">No audits found</p>
              <Button onClick={() => router.push('/dashboard/audits')}>
                Run Your First Audit
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredAudits.map((audit, index) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[300px]">{audit.url}</span>
                        <a
                          href={audit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getScoreBadge(audit.overall_score) as any}>
                        {audit.overall_score}
                      </Badge>
                    </TableCell>
                    <TableCell>{getScoreTrend(audit.overall_score, index)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          audit.status === 'completed'
                            ? 'default'
                            : audit.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {audit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(audit.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/audits/${audit.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
