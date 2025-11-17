'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Search, Download, TrendingUp, Target, DollarSign } from 'lucide-react';

interface Keyword {
  id: string;
  keyword: string;
  search_volume: number;
  competition: 'low' | 'medium' | 'high';
  difficulty_score: number;
  opportunity_score: number;
  cpc: string;
}

export default function KeywordsPage() {
  const [seedKeyword, setSeedKeyword] = useState('');
  const [targetLocation, setTargetLocation] = useState('US');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'volume' | 'opportunity' | 'competition'>('opportunity');
  const [cached, setCached] = useState(false);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedKeyword.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_keyword: seedKeyword,
          target_location: targetLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to research keywords');
      }

      setKeywords(data.data.keywords || []);
      setCached(data.data.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (keywords.length === 0) return;

    const headers = [
      'Keyword',
      'Search Volume',
      'Competition',
      'Difficulty Score',
      'Opportunity Score',
      'CPC',
    ];
    const rows = keywords.map((kw) => [
      kw.keyword,
      kw.search_volume,
      kw.competition,
      kw.difficulty_score,
      kw.opportunity_score,
      `$${kw.cpc}`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${seedKeyword.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCompetitionBadge = (competition: string): 'default' | 'secondary' | 'destructive' => {
    switch (competition) {
      case 'low':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getOpportunityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const sortedKeywords = [...keywords].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.search_volume - a.search_volume;
      case 'opportunity':
        return b.opportunity_score - a.opportunity_score;
      case 'competition':
        const compOrder = { low: 0, medium: 1, high: 2 };
        return compOrder[a.competition] - compOrder[b.competition];
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Keyword Research</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Discover high-opportunity keywords to target for your SEO strategy
        </p>
      </div>

      {/* Research Form */}
      <Card>
        <CardHeader>
          <CardTitle>Research Keywords</CardTitle>
          <CardDescription>
            Enter a seed keyword or topic to discover related keyword opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="seed_keyword">Seed Keyword or Topic</Label>
                <Input
                  id="seed_keyword"
                  type="text"
                  placeholder="e.g., SEO tools, digital marketing"
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                  required
                  maxLength={200}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="location">Target Location</Label>
                <Select value={targetLocation} onValueChange={setTargetLocation} disabled={loading}>
                  <SelectTrigger id="location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="IN">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={loading || !seedKeyword.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Research Keywords
                </>
              )}
            </Button>

            {error && (
              <div className="text-red-600 text-sm mt-2">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {keywords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Keyword Results</CardTitle>
                <CardDescription>
                  {keywords.length} keywords found
                  {cached && ' (cached results from recent search)'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as 'volume' | 'opportunity' | 'competition')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opportunity">Opportunity Score</SelectItem>
                    <SelectItem value="volume">Search Volume</SelectItem>
                    <SelectItem value="competition">Competition</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Search Volume
                    </div>
                  </TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Opportunity
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      CPC
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedKeywords.map((keyword) => (
                  <TableRow key={keyword.id}>
                    <TableCell className="font-medium">{keyword.keyword}</TableCell>
                    <TableCell>{keyword.search_volume.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getCompetitionBadge(keyword.competition)}>
                        {keyword.competition}
                      </Badge>
                    </TableCell>
                    <TableCell>{keyword.difficulty_score}/100</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${getOpportunityColor(keyword.opportunity_score)}`}>
                        {keyword.opportunity_score}/100
                      </span>
                    </TableCell>
                    <TableCell>${keyword.cpc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {keywords.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-slate-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No keyword research yet</p>
              <p className="text-sm">
                Enter a seed keyword above to discover keyword opportunities
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
