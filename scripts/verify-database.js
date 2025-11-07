/**
 * Verify Database Tables Script
 * Checks if all Prismify tables were created successfully
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function verifyTables() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 VERIFYING PRISMIFY DATABASE TABLES');
  console.log('═══════════════════════════════════════════════════════\n');

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const tables = [
    'users',
    'api_keys',
    'seo_projects',
    'seo_analyses',
    'meta_tags',
    'api_usage',
    'subscription_history',
  ];

  console.log('📊 Checking tables...\n');

  let successCount = 0;
  let failCount = 0;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table.padEnd(20)} - Error: ${error.message}`);
        failCount++;
      } else {
        console.log(`   ✅ ${table.padEnd(20)} - EXISTS (${count || 0} rows)`);
        successCount++;
      }
    } catch (error) {
      console.log(`   ❌ ${table.padEnd(20)} - Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`📈 Results: ${successCount}/${tables.length} tables verified`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (successCount === tables.length) {
    console.log('🎉 SUCCESS! All database tables created!\n');
    console.log('✅ Your database is ready for:');
    console.log('   • User authentication');
    console.log('   • SEO project management');
    console.log('   • AI-powered SEO analysis');
    console.log('   • API usage tracking');
    console.log('   • Subscription billing\n');
    console.log('🚀 Next Steps:');
    console.log('   1. Test SEO Agent: npm run test:agent');
    console.log('   2. Build API endpoints');
    console.log('   3. Create your first user!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tables are missing!\n');
    console.log('💡 To fix:');
    console.log('   1. Go to: https://app.supabase.com/project/cxakwpnjeadurxvhtbov/sql');
    console.log('   2. Open: c:\\Prismify\\supabase\\schema.sql');
    console.log('   3. Copy all SQL and paste into Supabase SQL Editor');
    console.log('   4. Click "Run"\n');
    process.exit(1);
  }
}

verifyTables();
