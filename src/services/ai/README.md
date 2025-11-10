# AI Services - Unified Integration

This directory contains the unified AI service integration for Prismify SEO SaaS Platform with intelligent fallback, caching, and cost tracking.

## Architecture

```
src/services/ai/
├── unifiedAIService.js     # Main entry point - handles provider fallback
├── geminiService.js         # Google Gemini integration (primary, free)
└── claudeService.js         # Anthropic Claude integration (fallback, paid)

src/services/cache/
└── aiCache.js              # Redis-based response caching

src/services/analytics/
└── aiCostTracker.js        # Cost tracking and budget alerts
```

## Provider Strategy

### Gemini (Primary - Free Tier)

- **Status**: ✅ Currently operational
- **Cost**: FREE (15 requests/minute)
- **Quality**: Good
- **Best for**: SEO optimization, meta tags, keyword research
- **Fallback**: Automatically switches to Claude if unavailable

### Claude (Fallback - Paid)

- **Status**: ⚠️ Requires Anthropic subscription
- **Cost**: $3/million input tokens, $15/million output tokens
- **Quality**: Excellent
- **Best for**: Complex content analysis, premium quality
- **Activation**: Automatically used when Gemini fails or is unavailable

## Features

### 1. Intelligent Fallback

- Tries Gemini first (free tier)
- Automatically falls back to Claude if Gemini fails
- Comprehensive error logging
- Provider health checking

### 2. Response Caching (70%+ Cost Savings)

- **Cache Strategy**:
  - Meta tags: 24 hours TTL
  - Keywords: 7 days TTL
  - SEO recommendations: 24 hours TTL
  - Content analysis: 12 hours TTL
- **Benefits**:
  - Reduces API calls by 70%+
  - Faster response times
  - Lower costs
- **Implementation**: Redis-backed with SHA-256 hash keys

### 3. Cost Tracking & Budget Alerts

- **Daily/monthly cost tracking**
- **Budget thresholds**:
  - Warning: $50/day
  - Critical: $100/day
- **Provider-specific analytics**
- **Token usage monitoring**

## Usage

### Basic Text Generation

```javascript
import unifiedAIService from './services/ai/unifiedAIService.js';

// Initialize once at app startup
await unifiedAIService.initialize();

// Generate text
const result = await unifiedAIService.generate({
  prompt: 'Write an SEO-optimized meta description for a coffee shop',
  maxTokens: 100,
  temperature: 0.7,
});

console.log(result.text);
console.log('Provider:', result.provider); // 'gemini' or 'anthropic'
console.log('From cache:', result.fromCache); // true/false
console.log('Duration:', result.duration, 'ms');
```

### Generate SEO Headlines

```javascript
const headlines = await unifiedAIService.generateHeadlines({
  topic: 'AI-Powered SEO Tools',
  style: 'professional',
  count: 5,
});

// Returns array of 5 headlines
```

### Generate Article Content

```javascript
const article = await unifiedAIService.generateArticle({
  topic: 'Best SEO Practices for 2025',
  style: 'professional',
  length: 'medium', // short, medium, long, extended
  keywords: ['SEO', 'optimization', 'rankings'],
  targetAudience: 'marketers',
});

console.log(article.content);
console.log('Word count:', article.metadata.wordCount);
console.log('Read time:', article.metadata.readTime, 'min');
```

### Check Content Consistency

```javascript
const consistency = await unifiedAIService.checkConsistency({
  content: 'Your article content here...',
  targetStyle: 'professional',
  targetPersonality: 'balanced',
});

console.log('Consistency score:', consistency.consistencyScore);
console.log('Issues:', consistency.styleIssues);
```

## Caching Control

### Enable/Disable Caching

```javascript
// With caching (default)
const result1 = await unifiedAIService.generate({ prompt: 'Hello' });

// Disable caching for specific request
const result2 = await unifiedAIService.executeWithFallback(
  'generate',
  { prompt: 'Hello' },
  { enabled: false }
);

// Custom cache TTL
const result3 = await unifiedAIService.executeWithFallback(
  'generate',
  { prompt: 'Hello' },
  { type: 'general', ttl: 3600 } // 1 hour
);
```

### Cache Statistics

```javascript
import aiCacheService from './services/cache/aiCache.js';

const stats = aiCacheService.getStats();
console.log('Cache hit rate:', stats.hitRate);
console.log('Cost savings:', stats.costSavings);
console.log('Hits:', stats.hits);
console.log('Misses:', stats.misses);
```

### Invalidate Cache

```javascript
// Invalidate specific cache
await aiCacheService.invalidate('metaTags', { prompt: 'specific prompt' });

// Invalidate all caches of a type
await aiCacheService.invalidateAll('metaTags');
```

## Cost Tracking

### Get Cost Dashboard

```javascript
import aiCostTracker from './services/analytics/aiCostTracker.js';

const dashboard = await aiCostTracker.getCostDashboard();
console.log('Daily cost:', dashboard.costs.daily);
console.log('Monthly cost:', dashboard.costs.monthly);
console.log('Budget used:', dashboard.costs.dailyBudgetUsed);
console.log('Provider stats:', dashboard.providers);
```

### Track Custom Request

```javascript
await aiCostTracker.trackRequest({
  provider: 'gemini',
  model: 'gemini-2.5-flash-lite',
  inputTokens: 1000,
  outputTokens: 500,
  method: 'generate',
  userId: 'user_123', // optional
});
```

### Get Recent Alerts

```javascript
const alerts = await aiCostTracker.getRecentAlerts(10);
alerts.forEach((alert) => {
  console.log(`[${alert.level}] ${alert.message} - ${alert.timestamp}`);
});
```

## Service Statistics

### Overall Stats

```javascript
const stats = unifiedAIService.getStats();
console.log('Provider status:', stats.providerStatus);
console.log('Total requests:', stats.usage.totalRequests);
console.log('Fallbacks used:', stats.usage.fallbacksUsed);
console.log('Failed requests:', stats.usage.failedRequests);
console.log('Cache stats:', stats.cache);
console.log('Provider details:', stats.providers);
```

### Provider Information

```javascript
const providerInfo = unifiedAIService.getProviderInfo();
console.log(providerInfo.gemini.status); // 'available' or 'unavailable'
console.log(providerInfo.gemini.cost); // 'FREE (15 requests/minute)'
console.log(providerInfo.anthropic.status);
console.log(providerInfo.anthropic.note); // 'Fallback provider - activates when Anthropic subscription is active'
```

## Configuration

### Environment Variables

Required in `.env`:

```bash
# Primary AI Provider (Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_MAX_TOKENS=8192
GEMINI_TEMPERATURE=0.7

# Fallback AI Provider (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here  # Optional - fallback only
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# AI Provider Preference
AI_PROVIDER=gemini  # 'gemini' or 'anthropic'

# Budget Alerts
AI_DAILY_BUDGET_WARNING=50.0   # $50/day warning
AI_DAILY_BUDGET_CRITICAL=100.0 # $100/day critical

# Redis (required for caching and cost tracking)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=  # Optional
```

### Budget Thresholds

Adjust budget alerts in environment variables:

- `AI_DAILY_BUDGET_WARNING`: Warning threshold (default: $50/day)
- `AI_DAILY_BUDGET_CRITICAL`: Critical threshold (default: $100/day)

## Testing

Run the integration test:

```bash
npm run test:ai
```

This will test:

1. Provider initialization
2. Text generation with Gemini
3. Cache hit on repeat request
4. Cache statistics
5. Cost tracking
6. Overall service statistics
7. Headline generation

## Error Handling

The service implements graceful degradation:

1. **Provider failure**: Automatically tries next provider in fallback order
2. **Cache unavailable**: Continues without caching (no errors)
3. **Cost tracking unavailable**: Continues without tracking (no errors)
4. **All providers fail**: Throws error with detailed information

Example error handling:

```javascript
try {
  const result = await unifiedAIService.generate({ prompt: 'Hello' });
  console.log(result.text);
} catch (error) {
  console.error('AI generation failed:', error.message);
  // Error message includes which providers failed and why
}
```

## Best Practices

1. **Initialize once**: Call `unifiedAIService.initialize()` at app startup
2. **Use caching**: Don't disable caching unless necessary (70%+ cost savings)
3. **Monitor costs**: Check dashboard regularly with `getCostDashboard()`
4. **Handle errors**: Always wrap AI calls in try-catch blocks
5. **Set budget alerts**: Configure thresholds appropriate for your usage
6. **Use appropriate cache types**: Match cache type to use case for optimal TTL

## Troubleshooting

### Gemini Not Working

```javascript
// Check initialization results
const initResults = await unifiedAIService.initialize();
console.log(initResults.gemini); // Should be 'available'

// Check provider status
const providerInfo = unifiedAIService.getProviderInfo();
console.log(providerInfo.gemini.status);
```

### Cache Not Working

```javascript
// Check Redis connection
import aiCacheService from './services/cache/aiCache.js';
await aiCacheService.initialize();
console.log('Cache connected:', aiCacheService.isConnected);
```

### Cost Tracking Not Working

```javascript
// Check Redis connection
import aiCostTracker from './services/analytics/aiCostTracker.js';
await aiCostTracker.initialize();
console.log('Cost tracker connected:', aiCostTracker.isConnected);
```

## Future Enhancements

Planned features (not in Phase 2.4):

- OpenAI GPT-4 as third fallback provider
- User-specific rate limiting
- Advanced cost optimization algorithms
- Predictive cost forecasting
- A/B testing different AI models
- Fine-tuned models for SEO-specific tasks

## Support

For issues or questions:

- Check `.agents/PROJECT_TODO.md` for current phase status
- Review `.agents/PROJECT_GOALS.md` for business context
- See `docs/AI_SETUP_GUIDE.md` for detailed setup instructions

---

**Last Updated**: November 10, 2025  
**Phase**: 2.4 - AI Service Integration  
**Status**: ✅ Complete
