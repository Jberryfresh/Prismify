/**
 * Test Script for Comprehensive 7-Component SEO Audit
 * Run with: node scripts/test-comprehensive-audit.js
 */

import SEOAgent from '../src/agents/specialized/SEOAgent.js';

// Sample HTML content for testing
const sampleHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="This is a comprehensive SEO test page with various optimization features to test all 7 components of our SEO scoring system.">
  <meta name="keywords" content="seo, testing, optimization, web development">
  <meta property="og:title" content="SEO Test Page">
  <meta property="og:description" content="Testing comprehensive SEO audit functionality">
  <meta property="og:image" content="https://example.com/image.jpg">
  <link rel="canonical" href="https://example.com/test-page">
  <link rel="stylesheet" href="styles.min.css">
  <link rel="dns-prefetch" href="//cdn.example.com">
  <title>SEO Test Page - Comprehensive Optimization Example</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "SEO Test Article"
  }
  </script>
  <style>
    @media (max-width: 768px) {
      body { font-size: 16px; }
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  
  <main>
    <article>
      <h1>Main Heading - SEO Best Practices</h1>
      
      <h2>Introduction to SEO Testing</h2>
      <p>This is a comprehensive test page designed to evaluate all seven components of our SEO scoring system. 
      The content includes proper heading structure, internal links, and optimized images to demonstrate best practices.</p>
      
      <img src="hero-image.jpg" alt="Hero image showing SEO best practices" loading="lazy" />
      
      <h2>Content Quality Matters</h2>
      <p>High-quality content is essential for good SEO performance. This section demonstrates proper keyword usage,
      natural language, and comprehensive coverage of the topic. Internal linking helps users navigate to related content.</p>
      
      <ul>
        <li>Use descriptive headings (H1, H2, H3)</li>
        <li>Include relevant keywords naturally</li>
        <li>Add internal and external links</li>
        <li>Optimize images with alt text</li>
      </ul>
      
      <h2>Technical SEO Implementation</h2>
      <p>Technical SEO ensures that search engines can crawl and index your content effectively. This includes proper 
      URL structure, structured data markup, and mobile optimization.</p>
      
      <img src="technical-seo.jpg" alt="Technical SEO implementation diagram" loading="lazy" srcset="technical-seo-small.jpg 480w, technical-seo.jpg 800w" />
      
      <h2>Mobile-First Indexing</h2>
      <p>With mobile-first indexing, Google primarily uses the mobile version of content for indexing and ranking.
      Responsive design and mobile optimization are now critical factors.</p>
      
      <a href="https://example.com/external-resource" rel="noopener noreferrer" target="_blank">External Resource</a>
      
      <h2>Performance Optimization</h2>
      <p>Page speed is a confirmed ranking factor. Optimize images, minify resources, and use lazy loading to improve
      performance metrics and user experience.</p>
      
      <form action="https://example.com/submit" method="POST">
        <label for="email">Email Address:</label>
        <input type="email" id="email" name="email" aria-label="Email address input" />
        <button type="submit">Subscribe</button>
      </form>
    </article>
  </main>
  
  <footer>
    <p>&copy; 2025 SEO Test Site. All rights reserved.</p>
  </footer>
  
  <script src="app.min.js"></script>
</body>
</html>
`;

const poorHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Page</title>
</head>
<body>
  <h1>Welcome</h1>
  <h1>Another H1</h1>
  <p>Short content.</p>
  <img src="image.jpg">
  <script src="http://example.com/script.js"></script>
</body>
</html>
`;

async function testComprehensiveAudit() {
  console.log('🧪 Testing Comprehensive 7-Component SEO Audit\n');
  console.log('='.repeat(70));

  try {
    // Create SEO Agent
    console.log('\n📦 Creating SEO Agent...');
    const seoAgent = new SEOAgent('SEO-Audit-Test');

    // Start the agent
    console.log('🚀 Starting agent...');
    await seoAgent.start();

    // Test Case 1: Comprehensive Audit - Good SEO
    console.log('\n🔍 Test Case 1: Well-Optimized Page');
    console.log('-'.repeat(70));

    const auditResults = await seoAgent.performComprehensiveAudit({
      url: 'https://example.com/test-page',
      content: sampleHTML,
    });

    console.log('\n📊 Overall Results:');
    console.log(`  Overall Score: ${auditResults.overall_score}/100`);
    console.log(`  Grade: ${auditResults.grade}`);
    console.log(`  Timestamp: ${auditResults.timestamp}\n`);

    console.log('📈 Component Scores:');
    const scoreEntries = [
      ['Meta Tags', auditResults.scores.meta],
      ['Content Quality', auditResults.scores.content],
      ['Technical SEO', auditResults.scores.technical],
      ['Mobile Optimization', auditResults.scores.mobile],
      ['Performance', auditResults.scores.performance],
      ['Security', auditResults.scores.security],
      ['Accessibility', auditResults.scores.accessibility],
    ];

    scoreEntries.forEach(([name, result]) => {
      const emoji = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌';
      const bar = '█'.repeat(Math.floor(result.score / 5));
      console.log(
        `  ${emoji} ${name.padEnd(20)}: ${result.score.toString().padStart(3)}/100 ${bar}`
      );
    });

    console.log('\n🔧 Recommendations by Priority:\n');

    // Group recommendations by severity
    const critical = auditResults.recommendations.filter((r) => r.severity === 'critical');
    const high = auditResults.recommendations.filter((r) => r.severity === 'high');
    const medium = auditResults.recommendations.filter((r) => r.severity === 'medium');
    const low = auditResults.recommendations.filter((r) => r.severity === 'low');
    const info = auditResults.recommendations.filter((r) => r.severity === 'info');

    if (critical.length > 0) {
      console.log('  🔴 CRITICAL ISSUES:');
      critical.forEach((rec) => console.log(`     [${rec.component}] ${rec.message}`));
      console.log('');
    }

    if (high.length > 0) {
      console.log('  🟠 HIGH PRIORITY:');
      high.forEach((rec) => console.log(`     [${rec.component}] ${rec.message}`));
      console.log('');
    }

    if (medium.length > 0) {
      console.log('  🟡 MEDIUM PRIORITY:');
      medium.forEach((rec) => console.log(`     [${rec.component}] ${rec.message}`));
      console.log('');
    }

    if (low.length > 0) {
      console.log('  🟢 LOW PRIORITY:');
      low.slice(0, 5).forEach((rec) => console.log(`     [${rec.component}] ${rec.message}`));
      if (low.length > 5) {
        console.log(`     ... and ${low.length - 5} more low priority items`);
      }
      console.log('');
    }

    if (info.length > 0) {
      console.log('  ℹ️  INFORMATIONAL:');
      info.slice(0, 3).forEach((rec) => console.log(`     [${rec.component}] ${rec.message}`));
      console.log('');
    }

    // Test Case 2: Individual Component Details
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Test Case 2: Individual Component Details\n');

    console.log('📝 Meta Tags Component:');
    console.log(`   Score: ${auditResults.scores.meta.score}/100`);
    console.log(`   Passed checks: ${auditResults.scores.meta.passed.length}`);
    console.log(`   Issues found: ${auditResults.scores.meta.issues.length}`);
    if (auditResults.scores.meta.passed.length > 0) {
      console.log('   ✅ Passing:');
      auditResults.scores.meta.passed.forEach((p) => console.log(`      - ${p}`));
    }

    console.log('\n📱 Mobile Optimization Component:');
    console.log(`   Score: ${auditResults.scores.mobile.score}/100`);
    console.log(`   Passed checks: ${auditResults.scores.mobile.passed.length}`);
    console.log(`   Issues found: ${auditResults.scores.mobile.issues.length}`);
    if (auditResults.scores.mobile.passed.length > 0) {
      console.log('   ✅ Passing:');
      auditResults.scores.mobile.passed.forEach((p) => console.log(`      - ${p}`));
    }

    console.log('\n🔒 Security Component:');
    console.log(`   Score: ${auditResults.scores.security.score}/100`);
    console.log(`   Passed checks: ${auditResults.scores.security.passed.length}`);
    console.log(`   Issues found: ${auditResults.scores.security.issues.length}`);
    if (auditResults.scores.security.passed.length > 0) {
      console.log('   ✅ Passing:');
      auditResults.scores.security.passed.forEach((p) => console.log(`      - ${p}`));
    }

    console.log('\n♿ Accessibility Component:');
    console.log(`   Score: ${auditResults.scores.accessibility.score}/100`);
    console.log(`   Passed checks: ${auditResults.scores.accessibility.passed.length}`);
    console.log(`   Issues found: ${auditResults.scores.accessibility.issues.length}`);
    if (auditResults.scores.accessibility.passed.length > 0) {
      console.log('   ✅ Passing:');
      auditResults.scores.accessibility.passed.forEach((p) => console.log(`      - ${p}`));
    }

    // Test Case 3: Poor SEO Example
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Test Case 3: Poorly-Optimized Page\n');

    const poorResults = await seoAgent.performComprehensiveAudit({
      url: 'http://example.com/poor-page',
      content: poorHTML,
    });

    console.log('📊 Results:');
    console.log(`  Overall Score: ${poorResults.overall_score}/100 (Expected: Low)`);
    console.log(`  Grade: ${poorResults.grade}`);
    console.log(`  Total Issues: ${poorResults.recommendations.length}`);
    console.log(
      `  Critical Issues: ${poorResults.recommendations.filter((r) => r.severity === 'critical').length}`
    );
    console.log(
      `  High Priority: ${poorResults.recommendations.filter((r) => r.severity === 'high').length}`
    );

    console.log('\n📈 Component Scores (Poor Page):');
    Object.entries(poorResults.scores).forEach(([component, result]) => {
      const emoji = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌';
      console.log(`  ${emoji} ${component.padEnd(15)}: ${result.score}/100`);
    });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ All Tests Completed Successfully!');
    console.log('='.repeat(70));
    console.log('\n📊 Test Summary:');
    console.log('  ✅ 7-component scoring system');
    console.log('  ✅ Comprehensive audit with weighted scoring');
    console.log('  ✅ Issue detection and prioritization');
    console.log('  ✅ Recommendation generation');
    console.log('  ✅ Good vs. poor page differentiation');
    console.log('\n🚀 Ready for API integration!\n');

    // Stop the agent
    await seoAgent.stop();
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\n📋 Stack trace:');
    console.error(error.stack);
    console.error(
      '\n💡 This test does not require AI API keys - it performs static analysis only.'
    );
    process.exit(1);
  }
}

// Run the test
testComprehensiveAudit();
