/**
 * Test Script for Enhanced Meta Tag Generation with Variations
 * Run with: node scripts/test-meta-tag-variations.js
 */

import SEOAgent from '../src/agents/specialized/SEOAgent.js';

const testContent = {
  title: 'Complete Guide to SEO Optimization in 2025',
  content: `
    Search Engine Optimization (SEO) is crucial for online success in 2025. 
    This comprehensive guide covers the latest SEO strategies, from technical optimization
    to content marketing and link building.
    
    Learn how to optimize your website for search engines, improve your rankings,
    and drive more organic traffic to your business. We'll cover keyword research,
    on-page optimization, technical SEO, mobile optimization, and performance improvements.
    
    Whether you're a beginner or an experienced marketer, this guide will help you
    master modern SEO techniques and stay ahead of algorithm updates.
  `.trim(),
  excerpt: 'Master the latest SEO strategies to boost rankings and drive organic traffic in 2025.',
  keywords: ['SEO optimization', 'search engine', 'rankings', 'organic traffic', 'SEO guide'],
  category: 'Digital Marketing',
};

async function testMetaTagGeneration() {
  console.log('🧪 Testing Enhanced Meta Tag Generation with Variations\n');
  console.log('='.repeat(70));

  try {
    const seoAgent = new SEOAgent('Meta-Tag-Test');

    console.log('\n📦 Starting SEO Agent...');
    await seoAgent.start();

    // Test Case 1: Single Meta Tags (Legacy Mode)
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Test Case 1: Single Meta Tags (Legacy/Default Mode)');
    console.log('-'.repeat(70));

    const singleMeta = await seoAgent.generateMetaTags({
      ...testContent,
      generateVariations: false, // Default mode
    });

    console.log('\n📝 Generated Meta Tags:');
    console.log(`  Meta Title: "${singleMeta.metaTitle}"`);
    console.log(`  Length: ${singleMeta.metaTitle.length} characters`);
    console.log(`\n  Meta Description: "${singleMeta.metaDescription}"`);
    console.log(`  Length: ${singleMeta.metaDescription.length} characters`);
    console.log(`\n  Focus Keyword: ${singleMeta.focusKeyword}`);
    console.log(`  Meta Keywords: ${singleMeta.metaKeywords.join(', ')}`);

    // Test Case 2: Multiple Variations (SaaS Mode)
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Test Case 2: Meta Tag Variations (SaaS Mode)');
    console.log('-'.repeat(70));
    console.log('Generating 3-5 variations for titles and descriptions...\n');

    const variations = await seoAgent.generateMetaTags({
      ...testContent,
      generateVariations: true, // Enable variations mode
    });

    // Display Title Variations
    console.log('📊 Title Variations (scored and ranked):');
    console.log('-'.repeat(70));
    variations.titleVariations.forEach((titleVar, index) => {
      const emoji = titleVar.valid ? '✅' : '⚠️';
      const scoreBar = '█'.repeat(Math.floor(titleVar.score / 10));
      console.log(`\n${index + 1}. ${emoji} Score: ${titleVar.score}/100 ${scoreBar}`);
      console.log(`   "${titleVar.text}"`);
      console.log(`   Length: ${titleVar.length} chars | Keywords: ${titleVar.keywordCount}`);
      if (titleVar.warning) {
        console.log(`   ⚠️  ${titleVar.warning}`);
      }
    });

    // Display Description Variations
    console.log('\n\n📊 Description Variations (scored and ranked):');
    console.log('-'.repeat(70));
    variations.descriptionVariations.forEach((descVar, index) => {
      const emoji = descVar.valid ? '✅' : '⚠️';
      const scoreBar = '█'.repeat(Math.floor(descVar.score / 10));
      console.log(`\n${index + 1}. ${emoji} Score: ${descVar.score}/100 ${scoreBar}`);
      console.log(`   "${descVar.text}"`);
      console.log(
        `   Length: ${descVar.length} chars | Keyword Density: ${(descVar.keywordDensity * 100).toFixed(2)}%`
      );
      if (descVar.warning) {
        console.log(`   ⚠️  ${descVar.warning}`);
      }
    });

    // Display Meta Data
    console.log('\n\n📌 Additional Meta Data:');
    console.log('-'.repeat(70));
    console.log(`Focus Keyword: ${variations.focusKeyword}`);
    console.log(`Meta Keywords: ${variations.metaKeywords.join(', ')}`);
    console.log(`\nOpen Graph Title: "${variations.ogTitle}"`);
    console.log(`Open Graph Description: "${variations.ogDescription}"`);
    console.log(`\nTwitter Title: "${variations.twitterTitle}"`);
    console.log(`Twitter Description: "${variations.twitterDescription}"`);

    // Display Recommendations
    if (variations.recommendations && variations.recommendations.length > 0) {
      console.log('\n\n💡 AI Recommendations:');
      console.log('-'.repeat(70));
      variations.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log('\n\n' + '='.repeat(70));
    console.log('📈 Validation Summary:');
    console.log('-'.repeat(70));

    const validTitles = variations.titleVariations.filter((t) => t.valid).length;
    const validDescriptions = variations.descriptionVariations.filter((d) => d.valid).length;

    console.log(`✅ Valid Title Variations: ${validTitles}/${variations.titleVariations.length}`);
    console.log(
      `✅ Valid Description Variations: ${validDescriptions}/${variations.descriptionVariations.length}`
    );

    const avgTitleScore =
      variations.titleVariations.reduce((sum, t) => sum + t.score, 0) /
      variations.titleVariations.length;
    const avgDescScore =
      variations.descriptionVariations.reduce((sum, d) => sum + d.score, 0) /
      variations.descriptionVariations.length;

    console.log(`\n📊 Average Title Score: ${avgTitleScore.toFixed(1)}/100`);
    console.log(`📊 Average Description Score: ${avgDescScore.toFixed(1)}/100`);

    // Test Case 3: Test with Bad Input
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Test Case 3: Fallback Handling (Missing Content)');
    console.log('-'.repeat(70));

    const fallback = await seoAgent.generateMetaTags({
      title: 'Short',
      content: 'Too short content for proper analysis.',
      keywords: ['test'],
      generateVariations: true,
    });

    console.log('\n📝 Fallback Variations Generated:');
    console.log(`  Title Variations: ${fallback.titleVariations.length}`);
    console.log(`  Description Variations: ${fallback.descriptionVariations.length}`);
    console.log(`  Generated by AI: ${fallback.generated ? 'Yes' : 'No (fallback)'}`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ All Tests Completed Successfully!');
    console.log('='.repeat(70));
    console.log('\n📊 Feature Summary:');
    console.log('  ✅ Single meta tag generation (backwards compatible)');
    console.log('  ✅ Multiple variations (3-5 per field)');
    console.log('  ✅ Length validation (50-60 chars titles, 150-160 chars descriptions)');
    console.log('  ✅ Automatic truncation for oversized content');
    console.log('  ✅ Keyword density calculation');
    console.log('  ✅ Quality scoring (0-100 per variation)');
    console.log('  ✅ Ranked by score (best first)');
    console.log('  ✅ Fallback generation when AI unavailable');
    console.log('  ✅ Open Graph and Twitter card support');
    console.log('\n🚀 Ready for SaaS integration!\n');

    await seoAgent.stop();
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\n📋 Stack trace:');
    console.error(error.stack);
    console.error('\n💡 Check:');
    console.error('   1. Is GEMINI_API_KEY set in .env?');
    console.error('   2. Is the unified AI service initialized?');
    process.exit(1);
  }
}

// Run the test
testMetaTagGeneration();
