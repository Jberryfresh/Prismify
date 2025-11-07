/**
 * Test Script for SEO Agent
 * Run with: node scripts/test-seo-agent.js
 */

import SEOAgent from '../src/agents/specialized/SEOAgent.js';

async function testSEOAgent() {
  console.log('🧪 Testing Prismify SEO Agent...\n');

  try {
    // Create SEO Agent
    console.log('📦 Creating SEO Agent...');
    const seoAgent = new SEOAgent('SEO-Test-Agent');

    // Start the agent
    console.log('🚀 Starting agent...');
    await seoAgent.start();

    // Test content
    const testContent = {
      title: 'Complete Guide to SEO Optimization in 2025',
      content: `
        Search Engine Optimization (SEO) is crucial for online success. 
        In this comprehensive guide, we'll explore the best SEO practices for 2025.
        
        SEO helps your website rank higher in search results. With proper SEO techniques,
        you can increase organic traffic and improve your online visibility.
        
        Modern SEO focuses on quality content, user experience, and technical optimization.
        By following these SEO best practices, you'll see significant improvements.
      `.trim(),
      excerpt:
        'Learn the top SEO strategies and techniques to boost your website rankings in 2025.',
    };

    console.log('\n📝 Test Content:');
    console.log(`   Title: ${testContent.title}`);
    console.log(`   Content Length: ${testContent.content.length} characters`);

    // Test 1: Analyze Content
    console.log('\n🔍 Test 1: Content Analysis');
    console.log('─'.repeat(50));
    const analysis = await seoAgent.execute({
      type: 'analyze',
      data: testContent,
    });

    console.log('✅ Analysis Results:');
    console.log(`   Overall Score: ${analysis.overallScore}/100`);
    console.log(`   Grade: ${analysis.grade}`);
    console.log(`   Title Score: ${analysis.title.score}/100`);
    console.log(`   Content Score: ${analysis.content.score}/100`);
    console.log(`   Readability: ${analysis.readability.score}/100`);

    // Test 2: Generate Meta Tags (AI-powered)
    console.log('\n🏷️  Test 2: Generate Meta Tags (AI)');
    console.log('─'.repeat(50));
    const metaTags = await seoAgent.execute({
      type: 'generateMeta',
      data: testContent,
    });

    console.log('✅ Generated Meta Tags:');
    console.log(`   Meta Title: ${metaTags.metaTitle || 'N/A'}`);
    console.log(
      `   Meta Description: ${metaTags.metaDescription ? metaTags.metaDescription.substring(0, 60) + '...' : 'N/A'}`
    );
    console.log(`   Focus Keyword: ${metaTags.focusKeyword || 'N/A'}`);
    console.log(`   OG Title: ${metaTags.ogTitle || 'N/A'}`);

    // Test 3: Keyword Suggestions (AI-powered)
    console.log('\n🔑 Test 3: Keyword Suggestions (AI)');
    console.log('─'.repeat(50));
    const keywords = await seoAgent.execute({
      type: 'suggestKeywords',
      data: testContent,
    });

    console.log('✅ Keyword Suggestions:');
    console.log(`   Primary Keywords: ${keywords.keywords.join(', ')}`);
    if (keywords.longTailKeywords?.length > 0) {
      console.log(`   Long-tail: ${keywords.longTailKeywords.slice(0, 2).join(', ')}`);
    }
    if (keywords.relatedTopics?.length > 0) {
      console.log(`   Related Topics: ${keywords.relatedTopics.slice(0, 3).join(', ')}`);
    }

    // Test 4: Full Optimization
    console.log('\n⚡ Test 4: Full Content Optimization');
    console.log('─'.repeat(50));
    const optimized = await seoAgent.execute({
      type: 'optimize',
      data: testContent,
    });

    console.log('✅ Optimization Complete:');
    console.log(`   SEO Score: ${optimized.seoScore}/100`);
    console.log(`   Recommendations: ${optimized.recommendations.length} items`);
    console.log('\n   Top 3 Recommendations:');
    optimized.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`   ${i + 1}. [${rec.priority}] ${rec.title}`);
    });

    // Test 5: Generate Slug
    console.log('\n🔗 Test 5: Generate SEO Slug');
    console.log('─'.repeat(50));
    const slug = await seoAgent.execute({
      type: 'generateSlug',
      data: { title: testContent.title },
    });

    console.log('✅ Generated Slug:');
    console.log(`   ${slug.slug}`);

    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 All Tests Passed!');
    console.log('═'.repeat(50));
    console.log('\n📊 Agent Statistics:');
    console.log(`   Provider: ${seoAgent.name}`);
    console.log(`   Status: ${seoAgent.status}`);
    console.log(`   Tasks Executed: ${seoAgent.stats.tasksExecuted}`);
    console.log(
      `   Success Rate: ${seoAgent.stats.tasksSucceeded}/${seoAgent.stats.tasksExecuted}`
    );

    console.log('\n✅ SEO Agent is working perfectly!');
    console.log('🚀 Ready to integrate into your Prismify API!\n');

    // Stop the agent
    await seoAgent.stop();
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\n📝 Check:');
    console.error('   1. Is GEMINI_API_KEY set in .env?');
    console.error('   2. Did you run: npm install @google/generative-ai');
    console.error('   3. Is your API key valid?');
    console.error('\n💡 See docs/AI_SETUP_GUIDE.md for help\n');
    process.exit(1);
  }
}

// Run the test
testSEOAgent();
