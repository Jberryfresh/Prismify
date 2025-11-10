/**
 * AI Response Caching Service
 * Reduces AI API costs by caching responses in Redis
 *
 * Cache Strategy:
 * - Meta tag suggestions: 24h TTL
 * - Keyword analysis: 7d TTL (keyword data doesn't change frequently)
 * - SEO recommendations: 24h TTL
 * - Content analysis: 12h TTL
 *
 * Cache hit rate target: 70%+
 * Cost savings target: 70%+ reduction in API calls
 */

import { createClient } from 'redis';
import crypto from 'crypto';
import config from '../../config/index.js';

class AICacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      errors: 0,
      bytesStored: 0,
    };

    // Cache TTL configurations (in seconds)
    this.ttl = {
      metaTags: 24 * 60 * 60, // 24 hours
      keywords: 7 * 24 * 60 * 60, // 7 days
      seoRecommendations: 24 * 60 * 60, // 24 hours
      contentAnalysis: 12 * 60 * 60, // 12 hours
      default: 24 * 60 * 60, // 24 hours
    };

    // Cache key prefixes
    this.prefixes = {
      metaTags: 'ai:meta:',
      keywords: 'ai:keywords:',
      seoRecommendations: 'ai:seo:',
      contentAnalysis: 'ai:content:',
      general: 'ai:general:',
    };
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      if (this.isConnected) {
        return true;
      }

      this.client = createClient({
        url: config.redis.url,
        password: config.redis.password,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error('Redis reconnect attempts exceeded');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err.message);
        this.stats.errors++;
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔗 Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.warn('⚠️  Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();

      console.log('✅ AI Cache service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AI Cache:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Generate cache key from params
   * Uses SHA-256 hash to create consistent, unique keys
   */
  generateCacheKey(prefix, params) {
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    const hash = crypto.createHash('sha256').update(sortedParams).digest('hex');
    return `${prefix}${hash}`;
  }

  /**
   * Get cached response
   */
  async get(cacheType, params) {
    if (!this.isConnected) {
      await this.initialize();
      if (!this.isConnected) {
        return null; // Graceful degradation - just skip cache
      }
    }

    try {
      const prefix = this.prefixes[cacheType] || this.prefixes.general;
      const key = this.generateCacheKey(prefix, params);

      const cached = await this.client.get(key);

      if (cached) {
        this.stats.hits++;
        console.log(`✅ Cache HIT: ${cacheType} (${key.substring(0, 20)}...)`);
        return JSON.parse(cached);
      }

      this.stats.misses++;
      console.log(`❌ Cache MISS: ${cacheType} (${key.substring(0, 20)}...)`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      this.stats.errors++;
      return null; // Graceful degradation
    }
  }

  /**
   * Set cached response
   */
  async set(cacheType, params, data, customTTL = null) {
    if (!this.isConnected) {
      await this.initialize();
      if (!this.isConnected) {
        return false; // Graceful degradation
      }
    }

    try {
      const prefix = this.prefixes[cacheType] || this.prefixes.general;
      const key = this.generateCacheKey(prefix, params);
      const ttl = customTTL || this.ttl[cacheType] || this.ttl.default;

      // Add metadata
      const cacheData = {
        data,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
        cache_type: cacheType,
      };

      const serialized = JSON.stringify(cacheData);
      await this.client.setEx(key, ttl, serialized);

      this.stats.sets++;
      this.stats.bytesStored += serialized.length;
      console.log(`💾 Cache SET: ${cacheType} (${key.substring(0, 20)}...) TTL: ${ttl}s`);

      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      this.stats.errors++;
      return false; // Graceful degradation
    }
  }

  /**
   * Invalidate cache for specific params
   */
  async invalidate(cacheType, params) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const prefix = this.prefixes[cacheType] || this.prefixes.general;
      const key = this.generateCacheKey(prefix, params);

      await this.client.del(key);
      console.log(`🗑️  Cache INVALIDATED: ${cacheType} (${key.substring(0, 20)}...)`);

      return true;
    } catch (error) {
      console.error('Cache invalidate error:', error.message);
      return false;
    }
  }

  /**
   * Invalidate all cache entries for a type
   */
  async invalidateAll(cacheType) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const prefix = this.prefixes[cacheType] || this.prefixes.general;
      const keys = await this.client.keys(`${prefix}*`);

      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️  Cache INVALIDATED ALL: ${cacheType} (${keys.length} keys)`);
      }

      return true;
    } catch (error) {
      console.error('Cache invalidate all error:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const costSavings = hitRate; // Approximate cost savings percentage

    return {
      isConnected: this.isConnected,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      errors: this.stats.errors,
      totalRequests,
      hitRate: `${hitRate.toFixed(2)}%`,
      costSavings: `${costSavings.toFixed(2)}%`,
      bytesStored: this.formatBytes(this.stats.bytesStored),
    };
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Cleanup old cache entries (optional maintenance)
   */
  async cleanup() {
    if (!this.isConnected) {
      return false;
    }

    try {
      // Redis automatically handles TTL expiration, but we can force cleanup
      console.log('🧹 Cache cleanup triggered (Redis handles TTL automatically)');
      return true;
    } catch (error) {
      console.error('Cache cleanup error:', error.message);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('👋 AI Cache connection closed');
    }
  }
}

// Export singleton instance
const aiCacheService = new AICacheService();
export default aiCacheService;
