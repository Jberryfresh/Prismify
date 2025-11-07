/**
 * Authentication Service Tests
 *
 * Tests for the auth service functionality.
 *
 * To run: node tests/auth.test.js
 *
 * NOTE: These are basic integration tests. In production, use a proper
 * testing framework like Jest or Vitest with mocked Supabase responses.
 */

import { authService } from '../src/services/auth/authService.js';

// Test configuration
const TEST_EMAIL = `test-${Date.now()}@prismify.test`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_METADATA = {
  full_name: 'Test User',
  company: 'Prismify Test',
};

console.log('🧪 Starting Authentication Service Tests\n');

/**
 * Test 1: Sign Up
 */
async function testSignUp() {
  console.log('Test 1: Sign Up');
  console.log(`  Email: ${TEST_EMAIL}`);

  const result = await authService.signUp(TEST_EMAIL, TEST_PASSWORD, TEST_METADATA);

  if (result.error) {
    console.log('  ❌ FAILED:', result.error.message);
    return false;
  }

  if (!result.user) {
    console.log('  ❌ FAILED: No user returned');
    return false;
  }

  console.log('  ✅ PASSED');
  console.log(`  User ID: ${result.user.id}`);
  console.log(`  Email Confirmed: ${!result.requiresConfirmation ? 'Yes' : 'No (check email)'}`);

  return result.user.id;
}

/**
 * Test 2: Sign In
 */
async function testSignIn() {
  console.log('\nTest 2: Sign In');

  const result = await authService.signIn(TEST_EMAIL, TEST_PASSWORD);

  if (result.error) {
    console.log('  ❌ FAILED:', result.error.message);
    console.log(
      '  Note: If email confirmation is required, sign in will fail until email is confirmed'
    );
    return false;
  }

  if (!result.session) {
    console.log('  ❌ FAILED: No session returned');
    return false;
  }

  console.log('  ✅ PASSED');
  console.log(`  User ID: ${result.user.id}`);
  console.log(`  Session expires: ${new Date(result.session.expires_at * 1000).toISOString()}`);

  return result.session.access_token;
}

/**
 * Test 3: Get Session
 */
async function testGetSession() {
  console.log('\nTest 3: Get Session');

  const result = await authService.getSession();

  if (result.error) {
    console.log('  ❌ FAILED:', result.error.message);
    return false;
  }

  if (!result.session) {
    console.log('  ⚠️  WARNING: No active session (user may need to sign in)');
    return null;
  }

  console.log('  ✅ PASSED');
  console.log(`  User ID: ${result.session.user.id}`);

  return result.session;
}

/**
 * Test 4: Verify Token
 */
async function testVerifyToken(token) {
  if (!token) {
    console.log('\nTest 4: Verify Token - SKIPPED (no token available)');
    return false;
  }

  console.log('\nTest 4: Verify Token');

  const result = await authService.verifyToken(token);

  if (result.error) {
    console.log('  ❌ FAILED:', result.error.message);
    return false;
  }

  if (!result.user) {
    console.log('  ❌ FAILED: Token verification failed');
    return false;
  }

  console.log('  ✅ PASSED');
  console.log(`  User ID: ${result.user.id}`);
  console.log(`  Email: ${result.user.email}`);

  return true;
}

/**
 * Test 5: Get User
 */
async function testGetUser() {
  console.log('\nTest 5: Get User');

  const result = await authService.getUser();

  if (result.error) {
    console.log('  ❌ FAILED:', result.error.message);
    return false;
  }

  if (!result.user) {
    console.log('  ⚠️  WARNING: No authenticated user');
    return null;
  }

  console.log('  ✅ PASSED');
  console.log(`  User ID: ${result.user.id}`);
  console.log(`  Email: ${result.user.email}`);

  return result.user;
}

/**
 * Test 6: Sign Out
 */
async function testSignOut() {
  console.log('\nTest 6: Sign Out');

  const result = await authService.signOut();

  if (result.error) {
    console.log('  ❌ FAILED:', result.error.message);
    return false;
  }

  console.log('  ✅ PASSED');

  return true;
}

/**
 * Test 7: Password Reset
 */
async function testPasswordReset() {
  console.log('\nTest 7: Password Reset');

  const result = await authService.resetPassword(TEST_EMAIL);

  if (result.error) {
    console.log('  ❌ FAILED:', result.error.message);
    return false;
  }

  console.log('  ✅ PASSED');
  console.log('  Password reset email sent (check inbox)');

  return true;
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('⚠️  NOTE: These tests will create a real user in your Supabase instance.');
    console.log('⚠️  Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env\n');

    let userId = null;
    let token = null;

    // Test 1: Sign Up
    userId = await testSignUp();
    if (!userId) {
      console.log('\n❌ Sign up failed. Stopping tests.');
      return;
    }

    // Wait 2 seconds for Supabase to process
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 2: Sign In
    token = await testSignIn();

    // Test 3: Get Session
    await testGetSession();

    // Test 4: Verify Token
    if (token) {
      await testVerifyToken(token);
    }

    // Test 5: Get User
    await testGetUser();

    // Test 7: Password Reset
    await testPasswordReset();

    // Test 6: Sign Out (last because it clears session)
    await testSignOut();

    console.log('\n✅ All tests completed!');
    console.log('\n📝 Summary:');
    console.log(`  Test Email: ${TEST_EMAIL}`);
    console.log(`  User ID: ${userId}`);
    console.log('\n⚠️  Remember to delete the test user from Supabase dashboard if needed.');
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }
}

// Run tests
runTests();
