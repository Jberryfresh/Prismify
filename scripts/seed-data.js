/**
 * Database Seed Script
 * Populates local database with test data for development
 * Creates users, projects, analyses, and usage data for all subscription tiers
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

// Load environment variables from docker/.env
const envPath = join(process.cwd(), 'docker', '.env');
dotenv.config({ path: envPath });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test users for each subscription tier
const TEST_USERS = [
  {
    email: 'starter@prismify.test',
    password: 'Test123!', // Will be hashed
    full_name: 'Starter User',
    company_name: 'Freelance Dev',
    subscription_tier: 'starter',
    subscription_status: 'active',
    stripe_customer_id: 'cus_test_starter_001',
  },
  {
    email: 'professional@prismify.test',
    password: 'Test123!',
    full_name: 'Professional User',
    company_name: 'Digital Agency LLC',
    subscription_tier: 'professional',
    subscription_status: 'active',
    stripe_customer_id: 'cus_test_professional_001',
  },
  {
    email: 'agency@prismify.test',
    password: 'Test123!',
    full_name: 'Agency User',
    company_name: 'Enterprise Solutions Inc',
    subscription_tier: 'agency',
    subscription_status: 'active',
    stripe_customer_id: 'cus_test_agency_001',
  },
];

// Sample SEO projects
const SAMPLE_PROJECTS = [
  {
    name: 'E-commerce Store Optimization',
    url: 'https://example-store.com',
    description: 'Optimize product pages and category structure for better rankings',
  },
  {
    name: 'Blog Content Strategy',
    url: 'https://techblog.example.com',
    description: 'Improve technical blog SEO and internal linking',
  },
  {
    name: 'Local Business SEO',
    url: 'https://localbusiness.example.com',
    description: 'Local SEO optimization for service-based business',
  },
  {
    name: 'SaaS Landing Pages',
    url: 'https://saas-product.example.com',
    description: 'Optimize landing pages for conversion and search visibility',
  },
  {
    name: 'Portfolio Website',
    url: 'https://portfolio.example.com',
    description: 'Personal portfolio SEO optimization',
  },
];

// Sample SEO analysis data
const SAMPLE_ANALYSES = [
  {
    analysis_type: 'full_audit',
    overall_score: 78,
    meta_score: 85,
    content_score: 72,
    technical_score: 80,
    mobile_score: 88,
    performance_score: 75,
    security_score: 90,
    accessibility_score: 68,
    recommendations: [
      {
        category: 'meta_tags',
        priority: 'high',
        title: 'Missing Meta Description',
        description: 'Add unique meta descriptions to all pages',
        impact: 8,
        effort: 3,
      },
      {
        category: 'content',
        priority: 'medium',
        title: 'Optimize Header Structure',
        description: 'Use proper H1-H6 hierarchy',
        impact: 6,
        effort: 4,
      },
      {
        category: 'technical',
        priority: 'critical',
        title: 'Fix Broken Internal Links',
        description: '12 broken internal links found',
        impact: 9,
        effort: 5,
      },
    ],
  },
  {
    analysis_type: 'keyword_research',
    overall_score: 85,
    keywords_found: 45,
    keyword_opportunities: [
      { keyword: 'best seo tools', volume: 12000, difficulty: 65, opportunity: 7.5 },
      { keyword: 'seo optimization guide', volume: 8500, difficulty: 45, opportunity: 8.2 },
      { keyword: 'website seo audit', volume: 5400, difficulty: 52, opportunity: 7.8 },
    ],
  },
  {
    analysis_type: 'content_optimization',
    overall_score: 72,
    content_score: 68,
    readability_score: 75,
    keyword_density: 2.3,
    suggestions: [
      'Add more relevant keywords naturally',
      'Improve paragraph structure for better readability',
      'Include more internal links to related content',
    ],
  },
];

// Sample meta tags
const SAMPLE_META_TAGS = [
  {
    url: '/home',
    page_title: 'AI-Powered SEO Tools | Prismify',
    meta_description:
      'Boost your website rankings with AI-powered SEO analysis, keyword research, and content optimization. Start your free trial today.',
    meta_keywords: 'seo tools, ai seo, keyword research, content optimization',
    og_title: 'Prismify - AI-Powered SEO Optimization',
    og_description: 'Transform your SEO strategy with artificial intelligence',
    og_image: 'https://example.com/og-image.jpg',
  },
  {
    url: '/blog/seo-guide',
    page_title: 'Complete SEO Guide 2025 | Prismify Blog',
    meta_description:
      'Learn everything about SEO in 2025. From technical optimization to content strategy, this comprehensive guide covers it all.',
    meta_keywords: 'seo guide, seo tutorial, seo best practices',
    og_title: 'The Ultimate SEO Guide for 2025',
    og_description: 'Master SEO with our comprehensive 2025 guide',
    og_image: 'https://example.com/seo-guide-og.jpg',
  },
];

// Hash password (simple bcrypt-style for testing)
function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + 'salt')
    .digest('hex');
}

async function seedDatabase() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🌱 PRISMIFY DATABASE SEEDING');
  console.log('═══════════════════════════════════════════════════════\n');

  const config = {
    host: 'localhost',
    port: 5432,
    database: 'prismify_dev',
    user: 'prismify',
    password: 'prismify_dev_password',
  };

  console.log('🔌 Connecting to local PostgreSQL...');
  console.log(`   Database: ${config.database}\n`);

  const client = new pg.Client(config);

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Clear existing test data
    console.log('🧹 Cleaning existing test data...');
    await client.query(
      `DELETE FROM api_usage WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@prismify.test')`
    );
    await client.query(
      `DELETE FROM meta_tags WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@prismify.test')`
    );
    await client.query(
      `DELETE FROM seo_analyses WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@prismify.test')`
    );
    await client.query(
      `DELETE FROM seo_projects WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@prismify.test')`
    );
    await client.query(
      `DELETE FROM api_keys WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@prismify.test')`
    );
    await client.query(
      `DELETE FROM subscription_history WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@prismify.test')`
    );
    await client.query(`DELETE FROM users WHERE email LIKE '%@prismify.test'`);
    console.log('✓ Cleaned existing data\n');

    // Seed users
    console.log('👥 Creating test users...');
    const userIds = [];

    for (const user of TEST_USERS) {
      const result = await client.query(
        `INSERT INTO users (email, password_hash, full_name, company_name, subscription_tier, subscription_status, stripe_customer_id, email_verified)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                 RETURNING id, email, subscription_tier`,
        [
          user.email,
          hashPassword(user.password),
          user.full_name,
          user.company_name,
          user.subscription_tier,
          user.subscription_status,
          user.stripe_customer_id,
        ]
      );

      userIds.push({
        id: result.rows[0].id,
        email: result.rows[0].email,
        tier: result.rows[0].subscription_tier,
      });

      console.log(`   ✓ ${user.email} (${user.subscription_tier})`);
    }
    console.log(`\n   Created ${userIds.length} users\n`);

    // Create API keys for each user
    console.log('🔑 Creating API keys...');
    for (const user of userIds) {
      const apiKey = `prm_${user.tier}_${crypto.randomBytes(16).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const keyPrefix = apiKey.substring(0, 12);

      await client.query(
        `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, is_active)
                 VALUES ($1, $2, $3, $4, true)`,
        [
          user.id,
          `${user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} API Key`,
          keyHash,
          keyPrefix,
        ]
      );
      console.log(`   ✓ ${user.email}: ${keyPrefix}...`);
    }
    console.log();

    // Create SEO projects (distribute across users)
    console.log('📁 Creating SEO projects...');
    const projectIds = [];

    for (let i = 0; i < SAMPLE_PROJECTS.length; i++) {
      const project = SAMPLE_PROJECTS[i];
      const user = userIds[i % userIds.length]; // Distribute projects across users

      const result = await client.query(
        `INSERT INTO seo_projects (user_id, name, website_url, target_keywords, is_active)
                 VALUES ($1, $2, $3, $4, true)
                 RETURNING id, name, user_id`,
        [user.id, project.name, project.url, []]
      );

      projectIds.push({
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        name: result.rows[0].name,
      });

      console.log(`   ✓ ${project.name} (${user.email})`);
    }
    console.log(`\n   Created ${projectIds.length} projects\n`);

    // Create SEO analyses
    console.log('📊 Creating SEO analyses...');
    let analysisCount = 0;

    for (const project of projectIds) {
      // Create 1-3 analyses per project
      const numAnalyses = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numAnalyses; i++) {
        const analysis = SAMPLE_ANALYSES[i % SAMPLE_ANALYSES.length];

        await client.query(
          `INSERT INTO seo_analyses (
                        user_id, project_id, analysis_type,
                        seo_score, results, ai_provider
                    )
                    VALUES ($1, $2, $3, $4, $5, 'gemini')`,
          [
            project.user_id,
            project.id,
            analysis.analysis_type,
            analysis.overall_score,
            JSON.stringify(analysis),
          ]
        );

        analysisCount++;
      }
    }
    console.log(`   ✓ Created ${analysisCount} analyses\n`);

    // Create meta tags
    console.log('🏷️  Creating meta tags...');
    let metaTagCount = 0;
    for (const project of projectIds) {
      for (const metaTag of SAMPLE_META_TAGS) {
        await client.query(
          `INSERT INTO meta_tags (
                        user_id, project_id, title, description, keywords,
                        og_title, og_description, og_image, ai_provider
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'gemini')`,
          [
            project.user_id,
            project.id,
            metaTag.page_title,
            metaTag.meta_description,
            metaTag.meta_keywords ? metaTag.meta_keywords.split(', ') : [],
            metaTag.og_title,
            metaTag.og_description,
            metaTag.og_image,
          ]
        );
        metaTagCount++;
      }
    }
    console.log(`   ✓ Created ${metaTagCount} meta tags\n`);

    // Create API usage records
    console.log('📈 Creating API usage records...');
    let usageCount = 0;
    for (const user of userIds) {
      // Create usage records for the past 7 days
      const tierLimits = {
        starter: { daily: 10 },
        professional: { daily: 50 },
        agency: { daily: 200 },
      };

      const limits = tierLimits[user.tier];

      for (let day = 0; day < 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);

        // Create multiple requests per day
        const dailyRequests = Math.floor(Math.random() * limits.daily) + 5;

        for (let req = 0; req < dailyRequests; req++) {
          await client.query(
            `INSERT INTO api_usage (
                            user_id, endpoint, method, status_code,
                            response_time_ms, tokens_used, ai_provider, date
                        )
                        VALUES ($1, '/api/seo/analyze', 'POST', 200, $2, $3, 'gemini', $4)`,
            [
              user.id,
              Math.floor(Math.random() * 2000) + 500, // 500-2500ms
              Math.floor(Math.random() * 1000) + 1000, // 1000-2000 tokens
              date.toISOString().split('T')[0],
            ]
          );
          usageCount++;
        }
      }
    }
    console.log(`   ✓ Created ${usageCount} usage records (7 days)\n`);

    // Create subscription history
    console.log('💳 Creating subscription history...');
    for (const user of userIds) {
      const tierPrices = {
        starter: 4900, // cents
        professional: 14900,
        agency: 49900,
      };

      await client.query(
        `INSERT INTO subscription_history (
                    user_id, subscription_tier, status, amount_cents,
                    currency, stripe_subscription_id
                )
                VALUES ($1, $2, 'active', $3, 'USD', $4)`,
        [user.id, user.tier, tierPrices[user.tier], `sub_test_${user.tier}_001`]
      );
    }
    console.log(`   ✓ Created ${userIds.length} subscription records\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DATABASE SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📊 Test Data Summary:');
    console.log(`   • ${userIds.length} Users (Starter, Professional, Agency)`);
    console.log(`   • ${userIds.length} API Keys`);
    console.log(`   • ${projectIds.length} SEO Projects`);
    console.log(`   • ${analysisCount} SEO Analyses`);
    console.log(`   • ${metaTagCount} Meta Tag Configurations`);
    console.log(`   • ${usageCount} API Usage Records`);
    console.log(`   • ${userIds.length} Subscription History Records`);

    console.log('\n🔐 Test Credentials:');
    console.log('   ┌────────────────────────────────────────────────────┐');
    console.log('   │ Email: starter@prismify.test                       │');
    console.log('   │ Password: Test123!                                 │');
    console.log('   │ Tier: Starter ($49/mo)                             │');
    console.log('   ├────────────────────────────────────────────────────┤');
    console.log('   │ Email: professional@prismify.test                  │');
    console.log('   │ Password: Test123!                                 │');
    console.log('   │ Tier: Professional ($149/mo)                       │');
    console.log('   ├────────────────────────────────────────────────────┤');
    console.log('   │ Email: agency@prismify.test                        │');
    console.log('   │ Password: Test123!                                 │');
    console.log('   │ Tier: Agency ($499/mo)                             │');
    console.log('   └────────────────────────────────────────────────────┘');

    console.log('\n🎯 Next Steps:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Test authentication with seed credentials');
    console.log('   3. Verify API endpoints return seeded data');
    console.log('   4. Begin Phase 2 development!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:');
    console.error(`   ${error.message}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - Is Docker running?');
      console.error('   Try: npm run docker:start\n');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the seeding
seedDatabase();
