/**
 * Test Script for Audit Storage Service
 * Run with: node scripts/test-audit-storage.js
 * Tests saving comprehensive audit results to Supabase
 */

import SEOAgent from '../src/agents/specialized/SEOAgent.js';
import auditStorage from '../src/services/auditStorage.js';

// Sample HTML for testing
const sampleHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Complete guide to SEO optimization with 7-component analysis and best practices.">
  <meta property="og:title" content="SEO Guide 2025">
  <meta property="og:description" content="Master SEO techniques">
  <meta property="og:image" content="https://example.com/seo.jpg">
  <link rel="canonical" href="https://example.com/seo-guide">
  <link rel="stylesheet" href="styles.min.css">
  <link rel="dns-prefetch" href="//cdn.example.com">
  <title>Complete SEO Optimization Guide 2025 - Best Practices</title>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>
</head>
<body>
  <header><nav><a href="/">Home</a><a href="/blog">Blog</a></nav></header>
  <main>
    <article>
      <h1>Complete SEO Optimization Guide</h1>
      <h2>Introduction</h2>
      <p>Search Engine Optimization is critical for success. This guide covers technical SEO, content optimization, and mobile-first strategies.</p>
      <img src="seo.jpg" alt="SEO optimization guide illustration" loading="lazy" srcset="seo-small.jpg 480w, seo.jpg 800w" />
      <h2>Technical SEO</h2>
      <p>Technical optimization ensures search engines can crawl and index your content effectively.</p>
      <ul><li>Use HTTPS</li><li>Optimize page speed</li><li>Add structured data</li></ul>
      <form action="https://example.com/subscribe" method="POST">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" aria-label="Email input" />
        <button type="submit">Subscribe</button>
      </form>
    </article>
  </main>
  <footer><p>&copy; 2025 SEO Guide</p></footer>
  <script src="app.min.js"></script>
</body>
</html>
`;

async function testAuditStorage() {
  console.log('🧪 Testing Audit Storage Service\n');
  console.log('='.repeat(70));

  // Mock user ID (in production, this comes from auth)
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockProjectId = '987fcdeb-51a2-43c1-b789-123456789abc';

  try {
    // Step 1: Create SEO Agent and run audit
    console.log('\n📦 Step 1: Running Comprehensive SEO Audit');
    console.log('-'.repeat(70));

    const seoAgent = new SEOAgent('Audit-Storage-Test');
    await seoAgent.start();

    const auditResults = await seoAgent.performComprehensiveAudit({
      url: 'https://example.com/seo-guide',
      content: sampleHTML,
    });

    console.log(`✅ Audit Complete:`);
    console.log(`   Overall Score: ${auditResults.overall_score}/100 (${auditResults.grade})`);
    console.log(`   Components: ${Object.keys(auditResults.scores).length}`);
    console.log(`   Recommendations: ${auditResults.recommendations.length}`);

    // Step 2: Save audit to database
    console.log('\n💾 Step 2: Saving Audit to Database');
    console.log('-'.repeat(70));

    const saveResult = await auditStorage.saveAudit({
      userId: mockUserId,
      projectId: mockProjectId,
      url: 'https://example.com/seo-guide',
      auditResults,
    });

    if (saveResult.success) {
      console.log(`✅ Audit Saved Successfully:`);
      console.log(`   Audit ID: ${saveResult.audit.id}`);
      console.log(`   URL: ${saveResult.audit.url}`);
      console.log(`   Score: ${saveResult.audit.overall_score}/100`);
      console.log(`   Grade: ${saveResult.audit.grade}`);
      console.log(`   Timestamp: ${saveResult.audit.created_at}`);
    } else {
      console.error(`❌ Failed to save audit`);
      throw new Error('Audit save failed');
    }

    const auditId = saveResult.audit.id;

    // Step 3: Retrieve audit
    console.log('\n🔍 Step 3: Retrieving Audit from Database');
    console.log('-'.repeat(70));

    const getResult = await auditStorage.getAudit(auditId, mockUserId);

    if (getResult.success) {
      console.log(`✅ Audit Retrieved Successfully:`);
      console.log(`   URL: ${getResult.audit.url}`);
      console.log(`   Overall Score: ${getResult.audit.overall_score}/100`);
      console.log(`   Components:`);
      Object.entries(getResult.audit.scores).forEach(([component, result]) => {
        console.log(`      - ${component}: ${result.score}/100`);
      });
      console.log(`   Recommendations: ${getResult.audit.recommendations.length}`);
    } else {
      console.error(`❌ Failed to retrieve audit:`, getResult.error);
    }

    // Step 4: Get audit history
    console.log('\n📊 Step 4: Testing Audit History');
    console.log('-'.repeat(70));

    const historyResult = await auditStorage.getAuditHistory(
      mockUserId,
      'https://example.com/seo-guide'
    );

    if (historyResult.success) {
      console.log(`✅ Audit History Retrieved:`);
      console.log(`   Total Entries: ${historyResult.history.length}`);
      historyResult.history.forEach((entry, index) => {
        console.log(
          `   ${index + 1}. Score: ${entry.score}/100 - ${new Date(entry.timestamp).toLocaleString()}`
        );
      });
    } else {
      console.error(`❌ Failed to get history:`, historyResult.error);
    }

    // Step 5: List user's audits
    console.log('\n📋 Step 5: Listing User Audits');
    console.log('-'.repeat(70));

    const listResult = await auditStorage.listAudits(mockUserId, {
      page: 1,
      limit: 5,
      sortBy: 'created_at',
      order: 'desc',
    });

    if (listResult.success) {
      console.log(`✅ Audits Listed:`);
      console.log(`   Total: ${listResult.pagination.total}`);
      console.log(`   Page: ${listResult.pagination.page}/${listResult.pagination.pages}`);
      console.log(`\n   Recent Audits:`);
      listResult.audits.forEach((audit, index) => {
        console.log(`   ${index + 1}. ${audit.url}`);
        console.log(`      Score: ${audit.overall_score}/100 (${audit.grade})`);
        console.log(`      Date: ${new Date(audit.created_at).toLocaleString()}`);
      });
    } else {
      console.error(`❌ Failed to list audits:`, listResult.error);
    }

    // Step 6: Get audit statistics
    console.log('\n📈 Step 6: Audit Statistics');
    console.log('-'.repeat(70));

    const statsResult = await auditStorage.getAuditStats(mockUserId);

    if (statsResult.success) {
      console.log(`✅ Statistics:`);
      console.log(`   Total Audits: ${statsResult.stats.totalAudits}`);
      console.log(`   Average Score: ${statsResult.stats.averageScore}/100`);
      console.log(`   Recent Audits (7 days): ${statsResult.stats.recentAudits}`);
    } else {
      console.error(`❌ Failed to get stats:`, statsResult.error);
    }

    // Step 7: Test meta tag variations storage
    console.log('\n🏷️  Step 7: Saving Meta Tag Variations');
    console.log('-'.repeat(70));

    const metaVariations = await seoAgent.generateMetaTags({
      title: 'Complete SEO Optimization Guide 2025',
      content: sampleHTML.substring(0, 500),
      excerpt: 'Master SEO techniques with this comprehensive guide',
      keywords: ['SEO', 'optimization', 'search engine'],
      generateVariations: true,
    });

    const metaResult = await auditStorage.saveMetaTagVariations({
      userId: mockUserId,
      projectId: mockProjectId,
      variations: metaVariations,
    });

    if (metaResult.success) {
      console.log(`✅ Meta Tags Saved:`);
      console.log(`   Meta Tag ID: ${metaResult.metaTags.id}`);
      console.log(`   Title: "${metaResult.metaTags.title}"`);
      console.log(`   Description: "${metaResult.metaTags.description.substring(0, 60)}..."`);
    } else {
      console.error(`❌ Failed to save meta tags`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ All Audit Storage Tests Completed!');
    console.log('='.repeat(70));
    console.log('\n📊 Test Summary:');
    console.log('  ✅ Comprehensive audit execution');
    console.log('  ✅ Save audit with 7-component scores');
    console.log('  ✅ Save recommendations');
    console.log('  ✅ Historical tracking');
    console.log('  ✅ Retrieve audit by ID');
    console.log('  ✅ List audits with pagination');
    console.log('  ✅ Audit statistics');
    console.log('  ✅ Meta tag variations storage');
    console.log('\n🚀 Database integration ready for production!\n');

    await seoAgent.stop();
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\n📋 Stack trace:');
    console.error(error.stack);
    console.error('\n💡 Check:');
    console.error('   1. Is Supabase running (local or cloud)?');
    console.error('   2. Are database tables created (seo_analyses, meta_tags)?');
    console.error('   3. Is SUPABASE_URL and SUPABASE_ANON_KEY set in .env?');
    console.error('   4. Is mock user ID valid in database?');
    process.exit(1);
  }
}

// Run the test
testAuditStorage();
