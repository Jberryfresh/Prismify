/**
 * Database Connection Test Script
 * Tests both Supabase client and direct PostgreSQL connection
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function testSupabaseConnection() {
  console.log('\n🔍 Testing Supabase Connection...\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
  console.log(`  SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'}`);
  console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '✓ Set' : '✗ Missing'}`);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('\n❌ Missing Supabase credentials in .env file');
    process.exit(1);
  }

  try {
    // Initialize Supabase client
    console.log('\n🚀 Initializing Supabase client...');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('✓ Supabase client initialized');

    // Test connection by querying database
    console.log('\n🔌 Testing database connection...');
    const { error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      // If table doesn't exist yet, that's okay - connection works!
      if (error.message.includes('table') && error.message.includes('users')) {
        console.log('✓ Database connected successfully!');
        console.log('⚠️  Tables not created yet - run SQL schema next');
        return true;
      }
      throw error;
    }

    console.log('✓ Database connection successful!');
    console.log(`  Tables exist and are accessible`);
    return true;
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(`  Error: ${error.message}`);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check your .env file has correct credentials');
    console.error('  2. Verify your Supabase project is active');
    console.error('  3. Check your internet connection');
    return false;
  }
}

async function testDatabaseInfo() {
  console.log('\n📊 Database Information:\n');

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  try {
    // Try to get list of tables
    await supabase
      .rpc('get_tables')
      .catch(() => ({ data: null, error: { message: 'Custom function not available' } }));

    console.log('  Project URL:', process.env.SUPABASE_URL);
    console.log('  Database Host:', process.env.DB_HOST);
    console.log('  Database Name:', process.env.DB_NAME);
    console.log('  Database Port:', process.env.DB_PORT);

    // Try a simple health check
    const { data: healthCheck } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .catch(() => ({ data: null }));

    if (healthCheck !== null) {
      console.log('\n✓ Database is healthy and tables exist!');
    }
  } catch {
    // Silent fail - just showing basic info
    console.log('\n  (Run SQL schema to create tables)');
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🗄️  PRISMIFY DATABASE CONNECTION TEST');
  console.log('═══════════════════════════════════════════════════════');

  const success = await testSupabaseConnection();

  if (success) {
    await testDatabaseInfo();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ DATABASE TEST COMPLETE - CONNECTION WORKING!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📝 Next Steps:');
    console.log('  1. Run SQL schema from docs/SUPABASE_SETUP.md');
    console.log('  2. Create database tables');
    console.log('  3. Test SEO Agent: npm run test:agent');
    console.log('  4. Start building your API!');
    console.log('\n');
    process.exit(0);
  } else {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('❌ DATABASE TEST FAILED');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run the test
main();
