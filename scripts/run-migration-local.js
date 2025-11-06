/**
 * Local Database Migration Script
 * Runs migrations against local Docker PostgreSQL
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(process.cwd(), 'docker', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 PRISMIFY LOCAL DATABASE MIGRATION');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Local PostgreSQL connection
    const config = {
        host: 'localhost',
        port: 5432,
        database: 'prismify_dev',
        user: 'prismify',
        password: 'prismify_dev_password',
    };
    
    console.log('🔌 Connecting to local PostgreSQL...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}\n`);
    
    const client = new pg.Client(config);
    
    try {
        await client.connect();
        console.log('✓ Connected to database\n');
        
        // Read the migration file
        console.log('📖 Reading migration file...');
        const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250105000001_initial_schema.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        console.log('✓ Migration file loaded');
        console.log(`  Size: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
        console.log(`  Lines: ${migrationSQL.split('\n').length}\n`);
        
        // Execute the migration
        console.log('⚙️  Running migration...');
        console.log('   This may take a few seconds...\n');
        
        await client.query(migrationSQL);
        
        console.log('✅ Migration completed successfully!\n');
        
        // Verify tables were created
        console.log('🔍 Verifying database schema...');
        
        const { rows } = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log(`\n   Found ${rows.length} tables:\n`);
        rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });
        
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✅ LOCAL DATABASE SETUP COMPLETE!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('\n🎯 Next Steps:');
        console.log('   1. Seed test data: npm run seed');
        console.log('   2. Verify database: npm run verify');
        console.log('   3. Start developing!\n');
        
    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error(`   ${error.message}\n`);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Connection refused - Is Docker running?');
            console.error('   Try: npm run docker:start\n');
        } else if (error.code === '42P07') {
            console.error('💡 Tables already exist - This is OK!');
            console.error('   Your database is already set up.\n');
        }
        
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run the migration
runMigration();
