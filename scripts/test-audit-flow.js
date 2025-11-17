/**
 * Test Audit Flow
 * Verifies end-to-end audit creation and retrieval
 */

import 'dotenv/config';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_URL = 'https://example.com';

// Test user credentials
const TEST_EMAIL = `prismifytest+${Date.now()}@gmail.com`; // Unique email each run
const TEST_PASSWORD = 'Test123!@#';

async function testAuditFlow() {
  console.log('\n🧪 Testing Audit Flow\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test URL: ${TEST_URL}\n`);

  let token;

  try {
    // Step 0: Try to create test user (may fail if already exists, that's okay)
    console.log('0️⃣  Creating test user (if not exists)...');
    try {
      const signupRes = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          full_name: 'Test Starter User',
        }),
      });

      if (signupRes.ok) {
        const signupData = await signupRes.json();
        console.log('✅ Test user created');

        // If user was just created and we have a session, use it
        if (signupData.data?.session?.access_token) {
          token = signupData.data.session.access_token;
          console.log('✅ Using signup session token (email confirmation disabled)\n');
        } else {
          console.log('ℹ️  Email confirmation required - you will need to verify email\n');
        }
      } else {
        const error = await signupRes.json();
        // User may already exist, proceed to login
        console.log(`ℹ️  User may already exist: ${error.error?.message || 'unknown'}\n`);
      }
    } catch (signupError) {
      console.log(`ℹ️  Signup attempt failed (may already exist): ${signupError.message}\n`);
    }

    // Step 1: Login to get auth token (if we don't have one from signup)
    if (!token) {
      console.log('1️⃣  Logging in...');
      const loginRes = await fetch(`${BACKEND_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      });

      if (!loginRes.ok) {
        const error = await loginRes.json();
        throw new Error(`Login failed: ${error.error?.message || loginRes.statusText}`);
      }

      const loginData = await loginRes.json();
      token = loginData.data.access_token;
      console.log('✅ Login successful\n');
    }

    // Step 2: Create audit
    console.log('2️⃣  Creating audit...');
    const createRes = await fetch(`${BACKEND_URL}/api/audits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: TEST_URL }),
    });

    if (!createRes.ok) {
      const error = await createRes.json();
      throw new Error(`Audit creation failed: ${error.error?.message || createRes.statusText}`);
    }

    const createData = await createRes.json();
    const audit = createData.data;
    console.log('✅ Audit created');
    console.log(`   ID: ${audit.id}`);
    console.log(`   URL: ${audit.url}`);
    console.log(`   Overall Score: ${audit.overall_score}`);
    console.log(`   Status: ${audit.status}`);
    console.log(`   Source: ${audit.source || 'database'}`);
    if (createData.meta) {
      console.log(`   Persisted: ${createData.meta.persisted !== false}`);
    }
    console.log();

    // Step 3: Retrieve audit
    console.log('3️⃣  Retrieving audit...');
    const getRes = await fetch(`${BACKEND_URL}/api/audits/${audit.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!getRes.ok) {
      const error = await getRes.json();
      throw new Error(`Audit retrieval failed: ${error.error?.message || getRes.statusText}`);
    }

    const getData = await getRes.json();
    const retrieved = getData.data;
    console.log('✅ Audit retrieved');
    console.log(`   ID matches: ${retrieved.id === audit.id}`);
    console.log(`   Score matches: ${retrieved.overall_score === audit.overall_score}`);
    console.log();

    // Step 4: List audits
    console.log('4️⃣  Listing audits...');
    const listRes = await fetch(`${BACKEND_URL}/api/audits`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) {
      const error = await listRes.json();
      throw new Error(`Audit listing failed: ${error.error?.message || listRes.statusText}`);
    }

    const listData = await listRes.json();
    console.log('✅ Audits listed');
    console.log(`   Total audits: ${listData.meta.total}`);
    console.log(`   Audits in response: ${listData.data.length}`);
    console.log(`   New audit in list: ${listData.data.some((a) => a.id === audit.id)}`);
    console.log();

    // Display score breakdown
    console.log('📊 Score Breakdown:');
    console.log(`   Overall: ${retrieved.overall_score}`);
    console.log(`   Meta Tags: ${retrieved.meta_score}`);
    console.log(`   Content: ${retrieved.content_score}`);
    console.log(`   Technical: ${retrieved.technical_score}`);
    console.log(`   Mobile: ${retrieved.mobile_score}`);
    console.log(`   Performance: ${retrieved.performance_score}`);
    console.log(`   Security: ${retrieved.security_score}`);
    console.log(`   Accessibility: ${retrieved.accessibility_score}`);
    console.log();

    // Display recommendations
    if (retrieved.recommendations && retrieved.recommendations.length > 0) {
      console.log(`📋 Recommendations (${retrieved.recommendations.length}):`);
      retrieved.recommendations.forEach((rec, i) => {
        console.log(
          `   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title} (Impact: ${rec.impact}/10, Effort: ${rec.effort}/10)`
        );
      });
      console.log();
    }

    console.log('✅ All tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAuditFlow();
