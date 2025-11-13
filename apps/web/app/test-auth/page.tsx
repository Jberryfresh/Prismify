'use client';

import { useState } from 'react';
import { runAuthTests, formatTestResults } from '@/lib/test/authTests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, CheckCircle2, XCircle } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pass' | 'fail';
  message: string;
  duration: number;
}

export default function TestAuthPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRunTests = async () => {
    setLoading(true);
    setResults([]);

    try {
      const testResults = await runAuthTests();
      setResults(testResults);
      
      // Also log to console
      console.log(formatTestResults(testResults));
    } catch (error) {
      // Surface the error in the UI so developers immediately see what went wrong
      console.error('Error running tests:', error);
      setResults([
        {
          test: 'Test Runner',
          status: 'fail',
          message: error instanceof Error ? error.message : String(error),
          duration: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Prismify Auth Tests</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Automated tests for authentication flow and Supabase integration
          </p>
        </div>

        {/* Run Tests Button */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication Flow Tests</CardTitle>
            <CardDescription>
              Run automated tests to verify Supabase auth, protected routes, and session management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRunTests}
              disabled={loading}
              className="w-full sm:w-auto bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">{passed}</div>
                      <div className="text-sm text-slate-500">Passed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold">{failed}</div>
                      <div className="text-sm text-slate-500">Failed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Individual Test Results */}
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className={result.status === 'fail' ? 'border-red-300' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {result.status === 'pass' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <CardTitle className="text-lg">Test {index + 1}: {result.test}</CardTitle>
                      </div>
                      <Badge variant={result.status === 'pass' ? 'default' : 'destructive'}>
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {result.message}
                    </p>
                    <p className="text-xs text-slate-500">
                      Duration: {result.duration}ms
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Instructions */}
        {results.length === 0 && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>Test Suite Includes:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Supabase client initialization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Protected route redirects (middleware)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Environment variable validation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Current session verification</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
