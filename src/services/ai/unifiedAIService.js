/**
 * Unified AI Service
 * Provides intelligent multi-provider AI integration with automatic fallback
 *
 * Provider Priority:
 * 1. Gemini (Free tier - 15 req/min)
 * 2. Claude (Paid - Best quality)
 * 3. OpenAI (Paid - Alternative)
 */

import config from '../../config/index.js';
import geminiService from './geminiService.js';
import claudeService from './claudeService.js';
import aiCacheService from '../cache/aiCache.js';
import aiCostTracker from '../analytics/aiCostTracker.js';

class UnifiedAIService {
  constructor() {
    this.providers = {
      gemini: geminiService,
      anthropic: claudeService,
      claude: claudeService, // Alias
    };

    this.preferredProvider = config.ai.preferredProvider || 'gemini';
    // Fallback order: Gemini (primary, free) → Claude (fallback, paid when available)
    this.fallbackOrder = ['gemini', 'anthropic'];
    this.providerStatus = {};
    this.stats = {
      totalRequests: 0,
      providerUsage: {},
      failedRequests: 0,
      fallbacksUsed: 0,
      lastError: null,
    };
  }

  /**
   * Initialize all available providers
   */
  async initialize() {
    const results = {};

    // Initialize cache service and cost tracker
    await aiCacheService.initialize();
    await aiCostTracker.initialize();

    // Initialize Gemini (free tier - currently working)
    if (config.ai.gemini.apiKey) {
      try {
        const success = await geminiService.initialize();
        results.gemini = success ? 'available' : 'unavailable';
        this.providerStatus.gemini = success;
      } catch (error) {
        console.warn('⚠️  Gemini initialization failed:', error.message);
        results.gemini = 'unavailable';
        this.providerStatus.gemini = false;
      }
    } else {
      results.gemini = 'not_configured';
      this.providerStatus.gemini = false;
    }

    // Initialize Claude (paid - fallback when Anthropic subscription active)
    if (config.ai.anthropic.apiKey) {
      try {
        // Note: Claude service doesn't have initialize method, so we check healthCheck
        const isHealthy = await claudeService.healthCheck();
        results.anthropic = isHealthy ? 'available' : 'unavailable';
        this.providerStatus.anthropic = isHealthy;
      } catch (error) {
        console.warn('⚠️  Claude initialization failed:', error.message);
        results.anthropic = 'unavailable';
        this.providerStatus.anthropic = false;
      }
    } else {
      results.anthropic = 'not_configured';
      this.providerStatus.anthropic = false;
    }

    // Log initialization results
    console.log('\n🤖 AI Services Status:');
    console.log(`   Gemini (Primary): ${this.getStatusEmoji(results.gemini)} ${results.gemini}`);
    console.log(
      `   Claude (Fallback): ${this.getStatusEmoji(results.anthropic)} ${results.anthropic}`
    );
    console.log(`   Preferred: ${this.preferredProvider}`);

    // Warn if no providers available
    if (!this.isAvailable()) {
      console.error('❌ WARNING: No AI providers are available! Please configure API keys.');
    }
    console.log('');

    return results;
  }

  /**
   * Get status emoji for logging
   */
  getStatusEmoji(status) {
    const emojis = {
      available: '✅',
      unavailable: '❌',
      not_configured: '⚠️ ',
    };
    return emojis[status] || '❓';
  }

  /**
   * Get the next available provider
   */
  async getAvailableProvider(preferredFirst = true) {
    // Try preferred provider first if requested
    if (preferredFirst && this.providerStatus[this.preferredProvider]) {
      const provider = this.providers[this.preferredProvider];
      if (provider && provider.isAvailable()) {
        return { name: this.preferredProvider, service: provider };
      }
    }

    // Try fallback order
    for (const providerName of this.fallbackOrder) {
      if (this.providerStatus[providerName]) {
        const provider = this.providers[providerName];
        if (provider && provider.isAvailable()) {
          if (providerName !== this.preferredProvider) {
            this.stats.fallbacksUsed++;
          }
          return { name: providerName, service: provider };
        }
      }
    }

    throw new Error('No AI providers available');
  }

  /**
   * Execute with automatic fallback and caching
   * @param {string} method - Method name to call on AI provider
   * @param {Object} params - Parameters to pass to method
   * @param {Object} cacheOptions - Cache configuration
   * @param {string} cacheOptions.type - Cache type (metaTags, keywords, seoRecommendations, contentAnalysis)
   * @param {boolean} cacheOptions.enabled - Enable caching (default: true)
   * @param {number} cacheOptions.ttl - Custom TTL in seconds (optional)
   */
  async executeWithFallback(method, params, cacheOptions = {}) {
    const {
      type: cacheType = 'general',
      enabled: cacheEnabled = true,
      ttl: customTTL = null,
    } = cacheOptions;
    const errors = [];
    const startTime = Date.now();

    // Try cache first if enabled
    if (cacheEnabled) {
      const cached = await aiCacheService.get(cacheType, { method, ...params });
      if (cached) {
        return {
          ...cached.data,
          fromCache: true,
          cached_at: cached.cached_at,
        };
      }
    }

    // Try each provider in order
    for (const providerName of this.fallbackOrder) {
      if (!this.providerStatus[providerName]) {
        continue;
      }

      const provider = this.providers[providerName];
      if (!provider) {
        continue;
      }

      // Check if provider is available (for Gemini which has isAvailable method)
      if (provider.isAvailable && !provider.isAvailable()) {
        errors.push({ provider: providerName, error: 'Provider not initialized' });
        continue;
      }

      // Check if provider supports the requested method
      if (typeof provider[method] !== 'function') {
        errors.push({
          provider: providerName,
          error: `Method '${method}' not supported by this provider`,
        });
        console.log(`⚠️  ${providerName} does not support ${method}, skipping...`);
        continue;
      }

      try {
        console.log(`🤖 Attempting ${method} with ${providerName}...`);
        const result = await provider[method](params);

        // Track success
        this.stats.totalRequests++;
        this.stats.providerUsage[providerName] = (this.stats.providerUsage[providerName] || 0) + 1;

        const duration = Date.now() - startTime;
        const usedFallback = providerName !== this.preferredProvider;

        if (usedFallback) {
          this.stats.fallbacksUsed++;
          console.log(`✅ Fallback successful: ${providerName} (${duration}ms)`);
        } else {
          console.log(`✅ Request successful: ${providerName} (${duration}ms)`);
        }

        const response = {
          ...result,
          provider: providerName,
          fallbackUsed: usedFallback,
          duration,
          fromCache: false,
        };

        // Track cost (extract token usage from result)
        if (result.usage || result.metadata) {
          const usage = result.usage || result.metadata;
          await aiCostTracker.trackRequest({
            provider: providerName,
            model: result.model || config.ai[providerName]?.model || 'unknown',
            inputTokens: usage.inputTokens || usage.input_tokens || 0,
            outputTokens: usage.outputTokens || usage.output_tokens || 0,
            method,
          });
        } else {
          console.warn(
            `⚠️  No usage data returned by ${providerName} for ${method} - cost tracking may be inaccurate`
          );
        }

        // Cache the result if enabled
        if (cacheEnabled) {
          await aiCacheService.set(cacheType, { method, ...params }, response, customTTL);
        }

        return response;
      } catch (error) {
        errors.push({ provider: providerName, error: error.message });
        console.warn(`❌ ${providerName} failed:`, error.message);

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    this.stats.failedRequests++;
    const errorMsg = errors.map((e) => `${e.provider}: ${e.error}`).join('; ');
    this.stats.lastError = errorMsg;

    throw new Error(`All AI providers failed for ${method}: ${errorMsg}`);
  }

  /**
   * Generate article content (with caching)
   */
  async generateArticle(params) {
    return this.executeWithFallback('generateArticle', params, {
      type: 'contentAnalysis',
      enabled: true,
    });
  }

  /**
   * Generate text from prompt (general purpose, with caching)
   */
  async generate(params) {
    return this.executeWithFallback('generate', params, {
      type: 'general',
      enabled: true,
    });
  }

  /**
   * Rewrite article content (with caching)
   */
  async rewriteArticle(params) {
    return this.executeWithFallback('rewriteArticle', params, {
      type: 'contentAnalysis',
      enabled: true,
    });
  }

  /**
   * Generate headlines (with caching)
   */
  async generateHeadlines(params) {
    return this.executeWithFallback('generateHeadlines', params, {
      type: 'metaTags',
      enabled: true,
    });
  }

  /**
   * Check content consistency (with caching)
   */
  async checkConsistency(params) {
    return this.executeWithFallback('checkConsistency', params, {
      type: 'contentAnalysis',
      enabled: true,
    });
  }

  /**
   * Suggest multimedia content (with caching)
   */
  async suggestMultimedia(params) {
    return this.executeWithFallback('suggestMultimedia', params, {
      type: 'contentAnalysis',
      enabled: true,
    });
  }

  /**
   * Optimize readability (with caching)
   */
  async optimizeReadability(params) {
    return this.executeWithFallback('optimizeReadability', params, {
      type: 'contentAnalysis',
      enabled: true,
    });
  }

  /**
   * Get combined statistics from all providers
   */
  getStats() {
    return {
      preferredProvider: this.preferredProvider,
      providerStatus: { ...this.providerStatus },
      usage: { ...this.stats },
      cache: aiCacheService.getStats(),
      providers: {
        gemini: this.providerStatus.gemini ? geminiService.getStats() : null,
        anthropic: this.providerStatus.anthropic ? { status: 'available' } : null,
      },
    };
  }

  /**
   * Check if any provider is available
   */
  isAvailable() {
    return Object.values(this.providerStatus).some((status) => status === true);
  }

  /**
   * Get provider preference explanation
   */
  getProviderInfo() {
    return {
      gemini: {
        name: 'Google Gemini',
        cost: 'FREE (15 requests/minute)',
        quality: 'Good',
        speed: 'Fast',
        bestFor: 'SEO optimization, meta tags, keyword research',
        status: this.providerStatus.gemini ? 'available' : 'unavailable',
        isPreferred: this.preferredProvider === 'gemini',
      },
      anthropic: {
        name: 'Anthropic Claude',
        cost: 'PAID ($3-15 per million tokens)',
        quality: 'Excellent',
        speed: 'Medium',
        bestFor: 'Complex content analysis, premium quality',
        status: this.providerStatus.anthropic ? 'available' : 'unavailable',
        isPreferred: this.preferredProvider === 'anthropic',
        note: 'Fallback provider - activates when Anthropic subscription is active',
      },
    };
  }
}

// Export singleton instance
const unifiedAIService = new UnifiedAIService();
export default unifiedAIService;
