/**
 * Authentication Flow Tests
 * Tests for Supabase auth integration, protected routes, and middleware
 */

import { createClient } from '@/lib/supabase/client';

interface TestResult {
  test: string;
  status: 'pass' | 'fail';
  message: string;
  duration: number;
}

/**
 * Run all authentication tests
 */
export async function runAuthTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  // Create client with guard so we can report a clear failure in the UI
  let supabase: ReturnType<typeof createClient> | null = null;
  try {
    supabase = createClient();
  } catch (err) {
    results.push({
      test: 'Supabase Client Initialization',
      status: 'fail',
      message: err instanceof Error ? err.message : String(err),
      duration: 0,
    });
    // If the client can't be created, return early with the single failure so the UI can show it
    return results;
  }

  // Test 1: Supabase client initialization
  const test1Start = Date.now();
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    results.push({
      test: 'Supabase Client Initialization',
      status: 'pass',
      message: `Client initialized successfully. Session: ${data.session ? 'Active' : 'None'}`,
      duration: Date.now() - test1Start,
    });
  } catch (error) {
    results.push({
      test: 'Supabase Client Initialization',
      status: 'fail',
      message: `Failed to initialize client: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - test1Start,
    });
  }

  // Test 2: Protected route redirect (simulated)
  const test2Start = Date.now();
  try {
    const response = await fetch('/dashboard');
    const redirected = response.redirected || response.url.includes('/login');
    
    if (redirected) {
      results.push({
        test: 'Protected Route Redirect (Unauthenticated)',
        status: 'pass',
        message: 'Correctly redirects to /login when not authenticated',
        duration: Date.now() - test2Start,
      });
    } else {
      results.push({
        test: 'Protected Route Redirect (Unauthenticated)',
        status: 'fail',
        message: 'Did not redirect to /login',
        duration: Date.now() - test2Start,
      });
    }
  } catch (error) {
    results.push({
      test: 'Protected Route Redirect (Unauthenticated)',
      status: 'fail',
      message: `Error testing redirect: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - test2Start,
    });
  }

  // Test 3: Environment variables
  const test3Start = Date.now();
  const envVars = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  };

  const missingVars = Object.entries(envVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length === 0) {
    results.push({
      test: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables are set',
      duration: Date.now() - test3Start,
    });
  } else {
    results.push({
      test: 'Environment Variables',
      status: 'fail',
      message: `Missing variables: ${missingVars.join(', ')}`,
      duration: Date.now() - test3Start,
    });
  }

  // Test 4: Check current session
  const test4Start = Date.now();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      results.push({
        test: 'Current Session Check',
        status: 'pass',
        message: `User logged in: ${user.email}`,
        duration: Date.now() - test4Start,
      });
    } else {
      results.push({
        test: 'Current Session Check',
        status: 'pass',
        message: 'No active session (expected if not logged in)',
        duration: Date.now() - test4Start,
      });
    }
  } catch (error) {
    results.push({
      test: 'Current Session Check',
      status: 'fail',
      message: `Error checking session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - test4Start,
    });
  }

  return results;
}

/**
 * Format test results for console output
 */
export function formatTestResults(results: TestResult[]): string {
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  let output = '\n🧪 AUTH FLOW TEST RESULTS\n';
  output += '═'.repeat(50) + '\n\n';

  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    output += `${icon} Test ${index + 1}: ${result.test}\n`;
    output += `   Status: ${result.status.toUpperCase()}\n`;
    output += `   Message: ${result.message}\n`;
    output += `   Duration: ${result.duration}ms\n\n`;
  });

  output += '═'.repeat(50) + '\n';
  output += `📊 Summary: ${passed} passed, ${failed} failed (${totalDuration}ms total)\n`;
  output += '═'.repeat(50) + '\n';

  return output;
}
