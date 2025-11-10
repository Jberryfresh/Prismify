/**
 * Test AI Service Integration
 * Tests unified AI service with fallback, caching, and cost tracking
 *
 * Usage: node scripts/test-ai-integration.js
 */

import unifiedAIService from '../src/services/ai/unifiedAIService.js';
import aiCacheService from '../src/services/cache/aiCache.js';
import aiCostTracker from '../src/services/analytics/aiCostTracker.js';

async function testAIIntegration() {
  console.log('🧪 Testing AI Service Integration\n');

  try {
    // Test 1: Initialize services
    console.log('📋 Test 1: Initializing AI services...');
    const initResults = await unifiedAIService.initialize();
    console.log('✅ Initialization results:', JSON.stringify(initResults, null, 2));

    if (!unifiedAIService.isAvailable()) {
      console.error('❌ No AI providers available. Please configure API keys.');
      return;
    }

    // Test 2: Provider info
    console.log('\n📋 Test 2: Getting provider information...');
    const providerInfo = unifiedAIService.getProviderInfo();
    console.log('✅ Provider info:', JSON.stringify(providerInfo, null, 2));

    // Test 3: Simple text generation (will be cached)
    console.log('\n📋 Test 3: Testing text generation (first request - no cache)...');
    const prompt1 = {
      prompt: 'Write a short SEO-optimized meta description for a coffee shop website.',
      maxTokens: 100,
    };
    const result1 = await unifiedAIService.generate(prompt1);
    console.log('✅ Generated text:', result1.text.substring(0, 100) + '...');
    console.log('   Provider:', result1.provider);
    console.log('   From cache:', result1.fromCache);
    console.log('   Duration:', result1.duration + 'ms');

    // Test 4: Same request (should hit cache)
    console.log('\n📋 Test 4: Testing cache hit (same request)...');
    const result2 = await unifiedAIService.generate(prompt1);
    console.log('✅ Generated text:', result2.text.substring(0, 100) + '...');
    console.log('   From cache:', result2.fromCache);
    console.log('   Cached at:', result2.cached_at || 'N/A');

    // Test 5: Cache statistics
    console.log('\n📋 Test 5: Checking cache statistics...');
    const cacheStats = aiCacheService.getStats();
    console.log('✅ Cache stats:', JSON.stringify(cacheStats, null, 2));

    // Test 6: Cost tracking dashboard
    console.log('\n📋 Test 6: Checking cost tracking dashboard...');
    const costDashboard = await aiCostTracker.getCostDashboard();
    console.log('✅ Cost dashboard:', JSON.stringify(costDashboard, null, 2));

    // Test 7: Overall statistics
    console.log('\n📋 Test 7: Getting overall AI service statistics...');
    const stats = unifiedAIService.getStats();
    console.log('✅ Overall stats:', JSON.stringify(stats, null, 2));

    // Test 8: Generate headlines (different cache type)
    console.log('\n📋 Test 8: Testing headline generation...');
    const headlineResult = await unifiedAIService.generateHeadlines({
      topic: 'AI-Powered SEO Optimization',
      style: 'professional',
      count: 3,
    });
    console.log('✅ Generated headlines:');
    headlineResult.forEach((headline, i) => {
      console.log(`   ${i + 1}. ${headline}`);
    });

    console.log('\n✅ All tests completed successfully!\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log(`   Total AI requests: ${stats.usage.totalRequests}`);
    console.log(`   Cache hits: ${cacheStats.hits}`);
    console.log(`   Cache misses: ${cacheStats.misses}`);
    console.log(`   Cache hit rate: ${cacheStats.hitRate}`);
    console.log(`   Estimated cost savings: ${cacheStats.costSavings}`);
    console.log(`   Daily AI cost: ${costDashboard.costs.daily}`);
    console.log(`   Fallbacks used: ${stats.usage.fallbacksUsed}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await aiCacheService.close();
    await aiCostTracker.close();
    console.log('✅ Cleanup complete\n');
  }
}

// Run tests
testAIIntegration();
