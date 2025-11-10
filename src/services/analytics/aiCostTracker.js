/**
 * AI Cost Tracking Service
 * Monitors AI API usage and calculates estimated costs
 *
 * Cost Estimates (as of Nov 2025):
 * - Gemini: FREE (15 req/min), then $0.075 per million input tokens
 * - Claude 3.5 Sonnet: $3 per million input tokens, $15 per million output tokens
 * - OpenAI GPT-4: $2.50 per million input tokens, $10 per million output tokens
 *
 * Tracks:
 * - Requests per provider
 * - Token usage
 * - Estimated costs
 * - Cost trends over time
 * - Budget alerts
 */

import { createClient } from 'redis';
import config from '../../config/index.js';

class AICostTracker {
  constructor() {
    this.redis = null;
    this.isConnected = false;

    // Cost per million tokens (input/output)
    this.pricing = {
      gemini: {
        input: 0.0, // Free tier
        output: 0.0, // Free tier
        paidInput: 0.075, // When over free tier
        paidOutput: 0.15,
        freeRequestsPerMinute: 15,
      },
      anthropic: {
        input: 3.0, // Claude 3.5 Sonnet
        output: 15.0,
      },
      openai: {
        input: 2.5, // GPT-4
        output: 10.0,
      },
    };

    // Daily budget thresholds
    this.budgetThresholds = {
      warning: parseFloat(process.env.AI_DAILY_BUDGET_WARNING) || 50.0, // $50/day
      critical: parseFloat(process.env.AI_DAILY_BUDGET_CRITICAL) || 100.0, // $100/day
    };

    // Redis keys
    this.keys = {
      dailyCost: 'ai:cost:daily:',
      monthlyCost: 'ai:cost:monthly:',
      providerUsage: 'ai:usage:provider:',
      alerts: 'ai:alerts:',
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

      const redisOptions = {
        url: config.redis.url,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error('Redis reconnect attempts exceeded');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      };

      // Only add password if it's configured
      if (config.redis.password) {
        redisOptions.password = config.redis.password;
      }

      this.redis = createClient(redisOptions);

      await this.redis.connect();
      this.isConnected = true;

      console.log('✅ AI Cost Tracker initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AI Cost Tracker:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Track AI API request
   * @param {Object} request - Request details
   * @param {string} request.provider - AI provider name (gemini, anthropic, openai)
   * @param {string} request.model - Model name
   * @param {number} request.inputTokens - Input tokens used
   * @param {number} request.outputTokens - Output tokens used
   * @param {string} request.method - Method called
   * @param {string} request.userId - User ID (optional)
   */
  async trackRequest(request) {
    if (!this.isConnected) {
      await this.initialize();
      if (!this.isConnected) {
        return; // Graceful degradation
      }
    }

    try {
      const {
        provider,
        model: _model,
        inputTokens,
        outputTokens,
        method: _method,
        userId: _userId,
      } = request;

      // Calculate cost
      const cost = this.calculateCost(provider, inputTokens, outputTokens);

      // Get today's date key
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const month = today.substring(0, 7); // YYYY-MM

      // Store daily cost
      const dailyKey = `${this.keys.dailyCost}${today}`;
      await this.redis.incrByFloat(dailyKey, cost);
      await this.redis.expire(dailyKey, 90 * 24 * 60 * 60); // 90 days retention

      // Store monthly cost
      const monthlyKey = `${this.keys.monthlyCost}${month}`;
      await this.redis.incrByFloat(monthlyKey, cost);
      await this.redis.expire(monthlyKey, 365 * 24 * 60 * 60); // 1 year retention

      // Store provider usage
      const usageKey = `${this.keys.providerUsage}${provider}:${today}`;
      await this.redis.hIncrBy(usageKey, 'requests', 1);
      await this.redis.hIncrBy(usageKey, 'inputTokens', inputTokens);
      await this.redis.hIncrBy(usageKey, 'outputTokens', outputTokens);
      await this.redis.hIncrBy(usageKey, 'totalTokens', inputTokens + outputTokens);
      await this.redis.hIncrByFloat(usageKey, 'cost', cost);
      await this.redis.expire(usageKey, 90 * 24 * 60 * 60); // 90 days retention

      // Check budget thresholds
      await this.checkBudgetThresholds(today);

      console.log(
        `💰 AI Cost tracked: ${provider} - ${inputTokens + outputTokens} tokens - $${cost.toFixed(4)}`
      );
    } catch (error) {
      console.error('AI cost tracking error:', error.message);
    }
  }

  /**
   * Calculate cost based on provider and token usage
   */
  calculateCost(provider, inputTokens, outputTokens) {
    const pricing = this.pricing[provider];
    if (!pricing) {
      console.warn(`Unknown provider: ${provider}, cost calculation skipped`);
      return 0;
    }

    // Calculate cost (pricing is per million tokens)
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Check if daily budget thresholds exceeded
   */
  async checkBudgetThresholds(date) {
    try {
      const dailyKey = `${this.keys.dailyCost}${date}`;
      const dailyCost = parseFloat(await this.redis.get(dailyKey)) || 0;

      // Check warning threshold
      if (
        dailyCost >= this.budgetThresholds.warning &&
        dailyCost < this.budgetThresholds.critical
      ) {
        await this.createAlert(
          'warning',
          `Daily AI cost reached $${dailyCost.toFixed(2)} (Warning threshold: $${this.budgetThresholds.warning})`
        );
      }

      // Check critical threshold
      if (dailyCost >= this.budgetThresholds.critical) {
        await this.createAlert(
          'critical',
          `Daily AI cost reached $${dailyCost.toFixed(2)} (Critical threshold: $${this.budgetThresholds.critical})`
        );
      }
    } catch (error) {
      console.error('Budget threshold check error:', error.message);
    }
  }

  /**
   * Create budget alert
   */
  async createAlert(level, message) {
    try {
      const timestamp = new Date().toISOString();
      const alertKey = `${this.keys.alerts}${timestamp}`;

      await this.redis.hSet(alertKey, {
        level,
        message,
        timestamp,
      });
      await this.redis.expire(alertKey, 30 * 24 * 60 * 60); // 30 days retention

      console.warn(`⚠️  AI BUDGET ALERT [${level.toUpperCase()}]: ${message}`);
    } catch (error) {
      console.error('Alert creation error:', error.message);
    }
  }

  /**
   * Get daily cost
   */
  async getDailyCost(date = null) {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const dailyKey = `${this.keys.dailyCost}${targetDate}`;
      const cost = await this.redis.get(dailyKey);

      return parseFloat(cost) || 0;
    } catch (error) {
      console.error('Get daily cost error:', error.message);
      return 0;
    }
  }

  /**
   * Get monthly cost
   */
  async getMonthlyCost(month = null) {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const targetMonth = month || new Date().toISOString().substring(0, 7);
      const monthlyKey = `${this.keys.monthlyCost}${targetMonth}`;
      const cost = await this.redis.get(monthlyKey);

      return parseFloat(cost) || 0;
    } catch (error) {
      console.error('Get monthly cost error:', error.message);
      return 0;
    }
  }

  /**
   * Get provider usage for a specific date
   */
  async getProviderUsage(provider, date = null) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const usageKey = `${this.keys.providerUsage}${provider}:${targetDate}`;
      const usage = await this.redis.hGetAll(usageKey);

      if (Object.keys(usage).length === 0) {
        return null;
      }

      return {
        provider,
        date: targetDate,
        requests: parseInt(usage.requests, 10) || 0,
        inputTokens: parseInt(usage.inputTokens, 10) || 0,
        outputTokens: parseInt(usage.outputTokens, 10) || 0,
        totalTokens: parseInt(usage.totalTokens, 10) || 0,
        cost: parseFloat(usage.cost) || 0,
      };
    } catch (error) {
      console.error('Get provider usage error:', error.message);
      return null;
    }
  }

  /**
   * Get comprehensive cost dashboard
   */
  async getCostDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    const [dailyCost, monthlyCost, geminiUsage, claudeUsage] = await Promise.all([
      this.getDailyCost(today),
      this.getMonthlyCost(currentMonth),
      this.getProviderUsage('gemini', today),
      this.getProviderUsage('anthropic', today),
    ]);

    return {
      date: today,
      month: currentMonth,
      costs: {
        daily: `$${dailyCost.toFixed(2)}`,
        monthly: `$${monthlyCost.toFixed(2)}`,
        dailyBudgetUsed: `${((dailyCost / this.budgetThresholds.critical) * 100).toFixed(1)}%`,
      },
      providers: {
        gemini: geminiUsage || { provider: 'gemini', requests: 0, totalTokens: 0, cost: 0 },
        anthropic: claudeUsage || { provider: 'anthropic', requests: 0, totalTokens: 0, cost: 0 },
      },
      budgetThresholds: {
        warning: `$${this.budgetThresholds.warning.toFixed(2)}`,
        critical: `$${this.budgetThresholds.critical.toFixed(2)}`,
      },
    };
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit = 10) {
    if (!this.isConnected) {
      return [];
    }

    try {
      const keys = await this.redis.keys(`${this.keys.alerts}*`);
      const sortedKeys = keys.sort().reverse().slice(0, limit);

      const alerts = [];
      for (const key of sortedKeys) {
        const alert = await this.redis.hGetAll(key);
        alerts.push(alert);
      }

      return alerts;
    } catch (error) {
      console.error('Get recent alerts error:', error.message);
      return [];
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redis && this.isConnected) {
      await this.redis.quit();
      this.isConnected = false;
      console.log('👋 AI Cost Tracker connection closed');
    }
  }
}

// Export singleton instance
const aiCostTracker = new AICostTracker();
export default aiCostTracker;
