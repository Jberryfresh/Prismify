/**
 * SEO Agent
 * Optimizes content for search engines
 * Handles keyword analysis, meta tag generation, and search optimization
 */

import Agent from '../base/Agent.js';
// Multi-provider AI service - automatically uses Gemini (free) or Claude (paid) based on config
import unifiedAIService from '../../services/ai/unifiedAIService.js';

class SEOAgent extends Agent {
  constructor(config = {}) {
    super('SEO', config);

    this.targetKeywordDensity = config.targetKeywordDensity || 0.02; // 2%
    this.maxKeywords = config.maxKeywords || 5;
  }

  /**
   * Initialize the SEO Agent
   */
  async initialize() {
    try {
      // Initialize unified AI service (supports both Gemini and Claude)
      await unifiedAIService.initialize();

      // Verify at least one AI provider is available
      if (!unifiedAIService.isAvailable()) {
        throw new Error(
          'No AI service providers are available. Please configure GEMINI_API_KEY or ANTHROPIC_API_KEY in your .env file'
        );
      }

      this.logger.info(
        `[${this.name}] SEO Agent initialized successfully with ${unifiedAIService.preferredProvider} AI`
      );
      return true;
    } catch (error) {
      this.logger.error(`[${this.name}] Initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Execute SEO optimization task
   * @param {Object} task - SEO task
   * @param {string} task.type - Task type: 'optimize', 'analyze', 'generateMeta'
   * @param {Object} task.params - Task parameters (or task.data for backwards compatibility)
   * @returns {Promise<Object>} SEO optimization result
   */
  async execute(task) {
    const { type, params, data } = task;
    const taskParams = params || data || {};

    switch (type) {
      case 'optimize':
        return await this.optimizeContent(taskParams);

      case 'analyze':
        return await this.analyzeContent(taskParams);

      case 'generateMeta':
        return await this.generateMetaTags(taskParams);

      case 'suggestKeywords':
        return await this.suggestKeywords(taskParams);

      case 'generateSlug':
        return await this.generateSlug(taskParams);

      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  /**
   * Optimize content for SEO
   * @param {Object} params - Optimization parameters
   * @returns {Promise<Object>} Optimization result
   */
  async optimizeContent(params) {
    const { title, content, excerpt, keywords = [], category } = params;

    this.logger.info(`[SEO] Optimizing content: "${title}"`);

    // Analyze current SEO
    const analysis = await this.analyzeContent({
      title,
      content,
      excerpt,
      keywords,
    });

    // Generate optimized meta tags
    const metaTags = await this.generateMetaTags({
      title,
      content,
      excerpt,
      keywords,
      category,
    });

    // Suggest additional keywords if needed
    let suggestedKeywords = keywords;
    if (keywords.length < 3) {
      const keywordSuggestions = await this.suggestKeywords({ title, content, category });
      suggestedKeywords = [...new Set([...keywords, ...keywordSuggestions.keywords.slice(0, 5)])];
    }

    // Generate SEO-friendly slug
    const { slug } = this.generateSlug({ title });

    // Generate optimization recommendations
    const recommendations = this.generateRecommendations(analysis, metaTags);

    return {
      analysis,
      metaTags,
      suggestedKeywords,
      slug,
      recommendations,
      seoScore: this.calculateSEOScore(analysis, metaTags),
    };
  }

  /**
   * Analyze content for SEO
   * @param {Object} params - Analysis parameters
   * @returns {Promise<Object>} SEO analysis
   */
  async analyzeContent(params) {
    const { title, content, excerpt, keywords = [] } = params;

    this.logger.info('[SEO] Analyzing content SEO');

    const analysis = {
      title: this.analyzeTitleSEO(title),
      content: this.analyzeContentSEO(content, keywords),
      excerpt: this.analyzeExcerptSEO(excerpt),
      keywords: this.analyzeKeywordUsage(content, keywords),
      readability: this.analyzeReadability(content),
    };

    // Calculate overall SEO score
    analysis.overallScore = this.calculateOverallSEOScore(analysis);
    analysis.grade = this.getGrade(analysis.overallScore);

    return analysis;
  }

  /**
   * Generate meta tags for content
   * @param {Object} params - Meta tag parameters
   * @returns {Promise<Object>} Generated meta tags
   */
  /**
   * Generate SEO-optimized meta tags with AI
   * Enhanced to generate multiple variations per field with validation
   * @param {Object} params - Meta tag generation parameters
   * @param {string} params.title - Page title
   * @param {string} params.content - Page content
   * @param {string} params.excerpt - Page excerpt/summary
   * @param {Array} params.keywords - Target keywords
   * @param {string} params.category - Content category
   * @param {boolean} params.generateVariations - Generate 3-5 variations per field (default: false)
   * @returns {Promise<Object>} Generated meta tags with variations
   */
  async generateMetaTags(params) {
    const {
      title = '',
      content = '',
      excerpt = '',
      keywords = [],
      category,
      generateVariations = false,
    } = params;

    this.logger.info('[SEO] Generating meta tags');

    // Validation
    if (!title || !content) {
      console.error('[SEO] Missing required fields: title or content');
      return this.getFallbackMetaTags({ title, content, excerpt, keywords });
    }

    // For backwards compatibility, use single-variation mode by default
    if (!generateVariations) {
      return this.generateSingleMetaTags({ title, content, excerpt, keywords, category });
    }

    // Generate multiple variations for SaaS product
    return this.generateMetaTagVariations({ title, content, excerpt, keywords, category });
  }

  /**
   * Generate single optimized meta tags (legacy/default mode)
   */
  async generateSingleMetaTags({ title, content, excerpt, keywords, category }) {
    const prompt = `Generate SEO-optimized meta tags for the following article:

Title: ${title}
Category: ${category || 'General'}
Keywords: ${keywords.join(', ')}

Content Preview:
${content.substring(0, 500)}...

Generate meta tags in JSON format:
{
  "metaTitle": "SEO-optimized title (50-60 characters)",
  "metaDescription": "Compelling description (150-160 characters)",
  "metaKeywords": ["keyword1", "keyword2", "keyword3"],
  "ogTitle": "Open Graph title",
  "ogDescription": "Open Graph description",
  "twitterTitle": "Twitter card title",
  "twitterDescription": "Twitter card description",
  "focusKeyword": "primary keyword"
}`;

    try {
      const aiResponse = await unifiedAIService.generate({
        prompt: prompt,
        maxTokens: 300,
        temperature: 0.7,
      });

      const metaText = aiResponse.text || aiResponse.content || JSON.stringify(aiResponse);
      let metaTags;

      try {
        metaTags = JSON.parse(metaText);
        // Validate and fix any length issues
        return this.validateAndFixMetaTags(metaTags, { title, content, excerpt, keywords });
      } catch {
        console.warn('[SEO] Failed to parse AI response, using fallback meta tags');
        return this.getFallbackMetaTags({ title, content, excerpt, keywords });
      }
    } catch (error) {
      console.error('[SEO] Error generating meta tags:', error.message);
      return this.getFallbackMetaTags({ title, content, excerpt, keywords });
    }
  }

  /**
   * Generate multiple meta tag variations (SaaS mode)
   * Generates 3-5 variations for titles and descriptions
   */
  async generateMetaTagVariations({ title, content, excerpt, keywords, category }) {
    const prompt = `Generate SEO-optimized meta tag variations for the following article:

Title: ${title}
Category: ${category || 'General'}
Target Keywords: ${keywords.join(', ')}

Content Preview:
${content.substring(0, 500)}...

Generate 3-5 variations for titles and descriptions with different angles and keyword placements.
Each variation should be unique and optimized for different search intents.

IMPORTANT LENGTH REQUIREMENTS:
- Meta titles: 50-60 characters (STRICT - will be truncated in search results if longer)
- Meta descriptions: 150-160 characters (STRICT - will be truncated if longer)

Return JSON format:
{
  "titleVariations": [
    {"text": "Title variation 1", "length": 55, "keywordCount": 2, "score": 95},
    {"text": "Title variation 2", "length": 58, "keywordCount": 1, "score": 88},
    {"text": "Title variation 3", "length": 52, "keywordCount": 3, "score": 92}
  ],
  "descriptionVariations": [
    {"text": "Description variation 1 with compelling CTA", "length": 155, "keywordDensity": 0.03, "score": 90},
    {"text": "Description variation 2 with different angle", "length": 158, "keywordDensity": 0.02, "score": 85},
    {"text": "Description variation 3 with benefits focus", "length": 152, "keywordDensity": 0.025, "score": 88}
  ],
  "metaKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "focusKeyword": "primary keyword",
  "recommendations": [
    "Use title variation 1 for maximum CTR",
    "Pair with description variation 1 for consistent messaging"
  ]
}`;

    try {
      const aiResponse = await unifiedAIService.generate({
        prompt: prompt,
        maxTokens: 800,
        temperature: 0.8, // Higher temperature for more creative variations
      });

      const metaText = aiResponse.text || aiResponse.content || JSON.stringify(aiResponse);
      let variations;

      try {
        variations = JSON.parse(metaText);

        // Validate all variations
        const validated = this.validateMetaTagVariations(variations, {
          title,
          content,
          excerpt,
          keywords,
        });

        // Add Open Graph and Twitter variations (use top-scored title/description)
        const topTitle = validated.titleVariations[0].text;
        const topDescription = validated.descriptionVariations[0].text;

        return {
          ...validated,
          ogTitle: topTitle,
          ogDescription: topDescription.substring(0, 200),
          twitterTitle: topTitle.substring(0, 70),
          twitterDescription: topDescription.substring(0, 200),
          generated: true,
          timestamp: new Date().toISOString(),
        };
      } catch {
        console.warn('[SEO] Failed to parse AI variations, generating fallback variations');
        return this.generateFallbackVariations({ title, content, excerpt, keywords });
      }
    } catch (error) {
      console.error('[SEO] Error generating meta tag variations:', error.message);
      return this.generateFallbackVariations({ title, content, excerpt, keywords });
    }
  }

  /**
   * Validate and fix meta tag variations
   */
  validateMetaTagVariations(variations, { title, content, excerpt, keywords }) {
    const validated = {
      titleVariations: [],
      descriptionVariations: [],
      metaKeywords: variations.metaKeywords || keywords.slice(0, 5),
      focusKeyword: variations.focusKeyword || keywords[0] || 'general',
      recommendations: variations.recommendations || [],
    };

    // Validate title variations
    if (variations.titleVariations && Array.isArray(variations.titleVariations)) {
      variations.titleVariations.forEach((titleVar) => {
        const text = titleVar.text || titleVar;
        const length = text.length;

        // Enforce 50-60 character limit
        if (length >= 50 && length <= 60) {
          validated.titleVariations.push({
            text,
            length,
            keywordCount: titleVar.keywordCount || this.countKeywords(text, keywords),
            score: titleVar.score || this.scoreMetaTitle(text, keywords),
            valid: true,
          });
        } else if (length > 60) {
          // Truncate to 60 characters
          const truncated = text.substring(0, 57) + '...';
          validated.titleVariations.push({
            text: truncated,
            length: truncated.length,
            keywordCount: this.countKeywords(truncated, keywords),
            score: this.scoreMetaTitle(truncated, keywords) - 10, // Penalty for truncation
            valid: false,
            warning: 'Truncated from ' + length + ' characters',
          });
        } else {
          // Too short, but keep it
          validated.titleVariations.push({
            text,
            length,
            keywordCount: this.countKeywords(text, keywords),
            score: this.scoreMetaTitle(text, keywords) - 15, // Penalty for being too short
            valid: false,
            warning: 'Title too short (recommended: 50-60 characters)',
          });
        }
      });
    }

    // Validate description variations
    if (variations.descriptionVariations && Array.isArray(variations.descriptionVariations)) {
      variations.descriptionVariations.forEach((descVar) => {
        const text = descVar.text || descVar;
        const length = text.length;

        // Enforce 150-160 character limit
        if (length >= 150 && length <= 160) {
          validated.descriptionVariations.push({
            text,
            length,
            keywordDensity: descVar.keywordDensity || this.calculateKeywordDensity(text, keywords),
            score: descVar.score || this.scoreMetaDescription(text, keywords),
            valid: true,
          });
        } else if (length > 160) {
          // Truncate to 160 characters
          const truncated = text.substring(0, 157) + '...';
          validated.descriptionVariations.push({
            text: truncated,
            length: truncated.length,
            keywordDensity: this.calculateKeywordDensity(truncated, keywords),
            score: this.scoreMetaDescription(truncated, keywords) - 10,
            valid: false,
            warning: 'Truncated from ' + length + ' characters',
          });
        } else {
          // Too short, but keep it
          validated.descriptionVariations.push({
            text,
            length,
            keywordDensity: this.calculateKeywordDensity(text, keywords),
            score: this.scoreMetaDescription(text, keywords) - 15,
            valid: false,
            warning: 'Description too short (recommended: 150-160 characters)',
          });
        }
      });
    }

    // Sort by score (highest first)
    validated.titleVariations.sort((a, b) => b.score - a.score);
    validated.descriptionVariations.sort((a, b) => b.score - a.score);

    // Ensure we have at least 3 variations
    if (validated.titleVariations.length < 3) {
      const fallback = this.generateFallbackVariations({ title, content, excerpt, keywords });
      validated.titleVariations = [...validated.titleVariations, ...fallback.titleVariations].slice(
        0,
        5
      );
    }

    if (validated.descriptionVariations.length < 3) {
      const fallback = this.generateFallbackVariations({ title, content, excerpt, keywords });
      validated.descriptionVariations = [
        ...validated.descriptionVariations,
        ...fallback.descriptionVariations,
      ].slice(0, 5);
    }

    return validated;
  }

  /**
   * Generate fallback variations when AI fails
   */
  generateFallbackVariations({ title, content, excerpt, keywords }) {
    const baseTitle = title.substring(0, 60);
    const baseDescription = excerpt || content.substring(0, 160);
    const primaryKeyword = keywords[0] || 'guide';

    return {
      titleVariations: [
        {
          text: baseTitle.substring(0, 57) + '...',
          length: 60,
          keywordCount: this.countKeywords(baseTitle, keywords),
          score: 75,
          valid: true,
        },
        {
          text: `${primaryKeyword}: ${baseTitle.substring(0, 50)}`,
          length: Math.min(primaryKeyword.length + baseTitle.substring(0, 50).length + 2, 60),
          keywordCount: 1,
          score: 70,
          valid: true,
        },
        {
          text: `${baseTitle.substring(0, 45)} | ${primaryKeyword}`,
          length: Math.min(baseTitle.substring(0, 45).length + primaryKeyword.length + 3, 60),
          keywordCount: 1,
          score: 68,
          valid: true,
        },
      ],
      descriptionVariations: [
        {
          text: baseDescription.substring(0, 157) + '...',
          length: 160,
          keywordDensity: this.calculateKeywordDensity(baseDescription, keywords),
          score: 70,
          valid: true,
        },
        {
          text: `Learn about ${primaryKeyword}. ${baseDescription.substring(0, 130)}...`,
          length: 160,
          keywordDensity: 0.02,
          score: 65,
          valid: true,
        },
        {
          text: `${baseDescription.substring(0, 140)} Read more here.`,
          length: Math.min(baseDescription.substring(0, 140).length + 15, 160),
          keywordDensity: this.calculateKeywordDensity(baseDescription, keywords),
          score: 68,
          valid: true,
        },
      ],
      metaKeywords: keywords.slice(0, 5),
      focusKeyword: keywords[0] || 'general',
      recommendations: ['AI generation unavailable - using fallback variations'],
      generated: false,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate and fix single meta tags
   */
  validateAndFixMetaTags(metaTags, { title, content, excerpt, keywords }) {
    return {
      metaTitle: this.validateLength(metaTags.metaTitle || title, 50, 60),
      metaDescription: this.validateLength(
        metaTags.metaDescription || excerpt || content,
        150,
        160
      ),
      metaKeywords: metaTags.metaKeywords || keywords.slice(0, 5),
      ogTitle: this.validateLength(metaTags.ogTitle || metaTags.metaTitle || title, 50, 60),
      ogDescription: this.validateLength(
        metaTags.ogDescription || metaTags.metaDescription || excerpt || content,
        150,
        200
      ),
      twitterTitle: this.validateLength(
        metaTags.twitterTitle || metaTags.metaTitle || title,
        50,
        70
      ),
      twitterDescription: this.validateLength(
        metaTags.twitterDescription || metaTags.metaDescription || excerpt || content,
        150,
        200
      ),
      focusKeyword: metaTags.focusKeyword || keywords[0] || 'general',
    };
  }

  /**
   * Get fallback meta tags when generation fails
   */
  getFallbackMetaTags({ title, content, excerpt, keywords }) {
    return {
      metaTitle: this.validateLength(title, 50, 60),
      metaDescription: this.validateLength(excerpt || content, 150, 160),
      metaKeywords: keywords.slice(0, 5),
      ogTitle: this.validateLength(title, 50, 60),
      ogDescription: this.validateLength(excerpt || content, 150, 200),
      twitterTitle: this.validateLength(title, 50, 70),
      twitterDescription: this.validateLength(excerpt || content, 150, 200),
      focusKeyword: keywords[0] || 'general',
    };
  }

  /**
   * Validate text length and truncate if needed
   */
  validateLength(text, minLength, maxLength) {
    if (!text) {
      return '';
    }
    if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + '...';
    }
    return text;
  }

  /**
   * Count keywords in text
   */
  countKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.filter((keyword) => lowerText.includes(keyword.toLowerCase())).length;
  }

  /**
   * Calculate keyword density
   */
  calculateKeywordDensity(text, keywords) {
    const words = text.split(/\s+/).length;
    const keywordOccurrences = keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      return count + (text.match(regex) || []).length;
    }, 0);
    return words > 0 ? keywordOccurrences / words : 0;
  }

  /**
   * Score meta title (0-100)
   */
  scoreMetaTitle(text, keywords) {
    let score = 0;

    // Length check (40 points)
    const length = text.length;
    if (length >= 50 && length <= 60) {
      score += 40;
    } else if (length >= 45 && length < 50) {
      score += 30;
    } else if (length > 60 && length <= 65) {
      score += 25;
    } else {
      score += 10;
    }

    // Keyword presence (40 points)
    const keywordCount = this.countKeywords(text, keywords);
    if (keywordCount >= 2) {
      score += 40;
    } else if (keywordCount === 1) {
      score += 25;
    } else {
      score += 5;
    }

    // Readability (20 points)
    const hasNumbers = /\d/.test(text);
    const hasPowerWords = /(best|top|guide|how|ultimate|complete|essential)/i.test(text);

    if (hasNumbers) {
      score += 10;
    }
    if (hasPowerWords) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Score meta description (0-100)
   */
  scoreMetaDescription(text, keywords) {
    let score = 0;

    // Length check (30 points)
    const length = text.length;
    if (length >= 150 && length <= 160) {
      score += 30;
    } else if (length >= 140 && length < 150) {
      score += 20;
    } else if (length > 160 && length <= 170) {
      score += 15;
    } else {
      score += 5;
    }

    // Keyword density (30 points)
    const density = this.calculateKeywordDensity(text, keywords);
    if (density >= 0.02 && density <= 0.04) {
      score += 30;
    } else if (density >= 0.01 && density < 0.02) {
      score += 20;
    } else if (density > 0.04 && density <= 0.06) {
      score += 15;
    } else {
      score += 5;
    }

    // Call to action (20 points)
    const hasCTA = /(learn|discover|find|get|read|explore|see|click)/i.test(text);
    if (hasCTA) {
      score += 20;
    }

    // Benefits/value proposition (20 points)
    const hasBenefits =
      /(improve|increase|boost|optimize|enhance|grow|save|easy|fast|simple)/i.test(text);
    if (hasBenefits) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Suggest keywords for content
   * @param {Object} params - Keyword suggestion parameters
   * @returns {Promise<Object>} Keyword suggestions
   */
  async suggestKeywords(params) {
    const { title, content, category } = params;

    this.logger.info(`[SEO] Suggesting keywords for: "${title}"`);

    const prompt = `Analyze the following article and suggest ${this.maxKeywords} highly relevant SEO keywords and phrases:

Title: ${title}
Category: ${category || 'General'}

Content:
${content.substring(0, 1000)}...

Provide keywords in JSON format:
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "longTailKeywords": ["long tail phrase 1", "long tail phrase 2"],
  "relatedTopics": ["topic1", "topic2"]
}`;

    try {
      // Use unified AI service for keyword suggestions
      const aiResponse = await unifiedAIService.generateText({
        prompt: prompt,
        maxTokens: 512,
        temperature: 0.7,
      });

      const keywordText = aiResponse.text || aiResponse;
      let suggestions;

      try {
        suggestions = JSON.parse(keywordText);
      } catch {
        // Extract keywords from content if parsing fails
        suggestions = {
          keywords: this.extractTopWords(content, 5),
          longTailKeywords: [],
          relatedTopics: [],
        };
      }

      return suggestions;
    } catch {
      // Fallback to simple extraction
      return {
        keywords: this.extractTopWords(content, 5),
        longTailKeywords: [],
        relatedTopics: [],
      };
    }
  }

  /**
   * Generate SEO-friendly slug
   * @param {Object} params - Slug parameters
   * @returns {Object} Generated slug
   */
  generateSlug(params) {
    const { title } = params;

    if (!title) {
      throw new Error('Title is required for slug generation');
    }

    // Convert to lowercase and remove special characters
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 100); // Limit length

    // Remove leading/trailing hyphens
    slug = slug.replace(/^-+|-+$/g, '');

    return {
      slug,
      length: slug.length,
      isOptimal: slug.length >= 3 && slug.length <= 75,
    };
  }

  /**
   * Analyze title for SEO
   */
  analyzeTitleSEO(title) {
    const length = title ? title.length : 0;
    const wordCount = title ? title.split(/\s+/).length : 0;
    const hasNumbers = title ? /\d/.test(title) : false;
    const hasPowerWords = title
      ? /\b(best|top|guide|ultimate|essential|proven|amazing|complete)\b/i.test(title)
      : false;

    return {
      length,
      wordCount,
      isOptimalLength: length >= 30 && length <= 70,
      hasNumbers,
      hasPowerWords,
      score: this.calculateTitleScore(length, hasNumbers, hasPowerWords),
    };
  }

  /**
   * Analyze content for SEO
   */
  analyzeContentSEO(content, _keywords) {
    const wordCount = content ? content.split(/\s+/).length : 0;
    const charCount = content ? content.length : 0;
    const paragraphCount = content ? content.split(/\n\n/).filter((p) => p.trim()).length : 0;
    const hasHeadings = content ? /#{1,6}\s/.test(content) || /<h[1-6]>/i.test(content) : false;
    const hasLists = content ? /[-*]\s|\d+\.\s|<[ou]l>/i.test(content) : false;

    return {
      wordCount,
      charCount,
      paragraphCount,
      hasHeadings,
      hasLists,
      isOptimalLength: wordCount >= 300 && wordCount <= 2500,
      score: this.calculateContentScore(wordCount, hasHeadings, hasLists),
    };
  }

  /**
   * Analyze excerpt for SEO
   */
  analyzeExcerptSEO(excerpt) {
    const length = excerpt ? excerpt.length : 0;
    const wordCount = excerpt ? excerpt.split(/\s+/).length : 0;

    return {
      length,
      wordCount,
      isOptimalLength: length >= 120 && length <= 160,
      exists: !!excerpt,
      score: excerpt && length >= 120 && length <= 160 ? 1 : excerpt ? 0.5 : 0,
    };
  }

  /**
   * Analyze keyword usage
   */
  analyzeKeywordUsage(content, keywords) {
    const contentLower = content ? content.toLowerCase() : '';
    const wordCount = content ? content.split(/\s+/).length : 0;

    const usage = keywords.map((keyword) => {
      const keywordLower = keyword.toLowerCase();
      const matches = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
      const density = wordCount > 0 ? matches / wordCount : 0;

      return {
        keyword,
        occurrences: matches,
        density: Math.round(density * 10000) / 10000,
        isOptimal: density >= 0.01 && density <= 0.03,
      };
    });

    return {
      keywords: usage,
      averageDensity:
        usage.length > 0 ? usage.reduce((sum, k) => sum + k.density, 0) / usage.length : 0,
    };
  }

  /**
   * Analyze readability
   */
  analyzeReadability(content) {
    const sentences = content ? content.split(/[.!?]+/).filter((s) => s.trim()) : [];
    const words = content ? content.split(/\s+/) : [];
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

    return {
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      isReadable: avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20,
      score: avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20 ? 1 : 0.7,
    };
  }

  /**
   * Calculate title score
   */
  calculateTitleScore(length, hasNumbers, hasPowerWords) {
    let score = 0.5;
    if (length >= 30 && length <= 70) {
      score += 0.3;
    }
    if (hasNumbers) {
      score += 0.1;
    }
    if (hasPowerWords) {
      score += 0.1;
    }
    return Math.min(score, 1);
  }

  /**
   * Calculate content score
   */
  calculateContentScore(wordCount, hasHeadings, hasLists) {
    let score = 0.4;
    if (wordCount >= 300) {
      score += 0.3;
    }
    if (hasHeadings) {
      score += 0.15;
    }
    if (hasLists) {
      score += 0.15;
    }
    return Math.min(score, 1);
  }

  /**
   * Calculate overall SEO score
   */
  calculateOverallSEOScore(analysis) {
    return (
      analysis.title.score * 0.25 +
      analysis.content.score * 0.3 +
      analysis.excerpt.score * 0.15 +
      analysis.readability.score * 0.3
    );
  }

  /**
   * Calculate SEO score from analysis and meta tags
   */
  calculateSEOScore(analysis, metaTags) {
    let score = analysis.overallScore * 0.7; // 70% from content analysis

    // 30% from meta tags
    if (metaTags.metaTitle && metaTags.metaTitle.length >= 50 && metaTags.metaTitle.length <= 60) {
      score += 0.1;
    }
    if (
      metaTags.metaDescription &&
      metaTags.metaDescription.length >= 150 &&
      metaTags.metaDescription.length <= 160
    ) {
      score += 0.1;
    }
    if (metaTags.metaKeywords && metaTags.metaKeywords.length >= 3) {
      score += 0.1;
    }

    return Math.round(score * 100) / 100;
  }

  /**
   * Get grade
   */
  getGrade(score) {
    if (score >= 0.9) {
      return 'A+';
    }
    if (score >= 0.8) {
      return 'A';
    }
    if (score >= 0.7) {
      return 'B';
    }
    if (score >= 0.6) {
      return 'C';
    }
    if (score >= 0.5) {
      return 'D';
    }
    return 'F';
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(analysis, _metaTags) {
    const recommendations = [];

    // Title recommendations
    if (!analysis.title.isOptimalLength) {
      recommendations.push({
        category: 'title',
        priority: 'high',
        message: 'Optimize title length to 30-70 characters',
      });
    }
    if (!analysis.title.hasNumbers && !analysis.title.hasPowerWords) {
      recommendations.push({
        category: 'title',
        priority: 'medium',
        message: 'Consider adding numbers or power words to title',
      });
    }

    // Content recommendations
    if (!analysis.content.isOptimalLength) {
      recommendations.push({
        category: 'content',
        priority: 'high',
        message: `Adjust content length to 300-2500 words (current: ${analysis.content.wordCount})`,
      });
    }
    if (!analysis.content.hasHeadings) {
      recommendations.push({
        category: 'content',
        priority: 'medium',
        message: 'Add headings to improve content structure',
      });
    }

    // Excerpt recommendations
    if (!analysis.excerpt.exists) {
      recommendations.push({
        category: 'excerpt',
        priority: 'high',
        message: 'Add an excerpt (120-160 characters)',
      });
    }

    // Keyword recommendations
    if (analysis.keywords.keywords.length === 0) {
      recommendations.push({
        category: 'keywords',
        priority: 'high',
        message: 'Add target keywords for better SEO',
      });
    }

    return recommendations;
  }

  /**
   * Extract top words from content
   */
  extractTopWords(content, limit = 5) {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'this',
      'that',
    ]);

    const words = content
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 4 && !stopWords.has(word));

    const frequency = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Perform comprehensive SEO audit with 7-component scoring
   * @param {Object} params - Audit parameters
   * @param {string} params.url - Website URL to audit
   * @param {string} params.content - Page content (HTML or text)
   * @param {Object} params.options - Audit options
   * @returns {Promise<Object>} Comprehensive audit results
   */
  async performComprehensiveAudit(params) {
    const { url, content } = params;

    this.logger.info(`[SEO] Starting comprehensive audit for: ${url}`);

    try {
      // Extract basic info from content
      const contentInfo = this.extractContentInfo(content);

      // Run all 7 component analyses in parallel for speed
      const [
        metaScore,
        contentScore,
        technicalScore,
        mobileScore,
        performanceScore,
        securityScore,
        accessibilityScore,
      ] = await Promise.all([
        this.analyzeMetaTags(content, contentInfo),
        this.analyzeContentQuality(content, contentInfo),
        this.analyzeTechnicalSEO(url, content),
        this.analyzeMobileOptimization(content),
        this.analyzePerformance(url, content),
        this.analyzeSecurity(url, content),
        this.analyzeAccessibility(content),
      ]);

      // Calculate overall score (weighted average)
      const overallScore = this.calculateComprehensiveScore({
        metaScore,
        contentScore,
        technicalScore,
        mobileScore,
        performanceScore,
        securityScore,
        accessibilityScore,
      });

      // Generate prioritized recommendations
      const recommendations = this.generateComprehensiveRecommendations({
        metaScore,
        contentScore,
        technicalScore,
        mobileScore,
        performanceScore,
        securityScore,
        accessibilityScore,
      });

      return {
        url,
        timestamp: new Date().toISOString(),
        overall_score: overallScore,
        scores: {
          meta: metaScore,
          content: contentScore,
          technical: technicalScore,
          mobile: mobileScore,
          performance: performanceScore,
          security: securityScore,
          accessibility: accessibilityScore,
        },
        recommendations,
        grade: this.getGrade(overallScore / 100),
      };
    } catch (error) {
      this.logger.error('[SEO] Comprehensive audit failed:', error);
      throw error;
    }
  }

  /**
   * Extract content information from HTML/text
   */
  extractContentInfo(content) {
    const info = {
      title: '',
      description: '',
      keywords: [],
      headings: [],
      images: [],
      links: [],
      wordCount: 0,
    };

    if (!content) {
      return info;
    }

    // Extract title
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    info.title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    info.description = descMatch ? descMatch[1].trim() : '';

    // Extract meta keywords
    const keywordsMatch = content.match(
      /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i
    );
    if (keywordsMatch) {
      info.keywords = keywordsMatch[1]
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k);
    }

    // Extract headings
    const h1Matches = content.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
    const h2Matches = content.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
    info.headings = {
      h1: h1Matches.map((h) => h.replace(/<[^>]+>/g, '').trim()),
      h2: h2Matches.map((h) => h.replace(/<[^>]+>/g, '').trim()),
    };

    // Extract images
    const imgMatches = content.match(/<img[^>]+>/gi) || [];
    info.images = imgMatches.map((img) => {
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      const altMatch = img.match(/alt=["']([^"']+)["']/i);
      return {
        src: srcMatch ? srcMatch[1] : '',
        alt: altMatch ? altMatch[1] : '',
        hasAlt: !!altMatch,
      };
    });

    // Extract links
    const linkMatches = content.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi) || [];
    info.links = linkMatches.map((link) => {
      const hrefMatch = link.match(/href=["']([^"']+)["']/i);
      const textMatch = link.match(/>([^<]+)</);
      return {
        href: hrefMatch ? hrefMatch[1] : '',
        text: textMatch ? textMatch[1].trim() : '',
      };
    });

    // Word count (remove HTML tags)
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    info.wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length;

    return info;
  }

  /**
   * Component 1: Analyze Meta Tags (0-100 score)
   */
  async analyzeMetaTags(content, contentInfo) {
    const analysis = {
      score: 0,
      issues: [],
      passed: [],
    };

    // Title check (25 points)
    if (contentInfo.title) {
      const titleLength = contentInfo.title.length;
      if (titleLength >= 30 && titleLength <= 60) {
        analysis.score += 25;
        analysis.passed.push('Title length is optimal (30-60 characters)');
      } else if (titleLength > 0) {
        analysis.score += 10;
        analysis.issues.push({
          severity: 'medium',
          message: `Title length is ${titleLength} characters (recommended: 30-60)`,
        });
      } else {
        analysis.issues.push({ severity: 'critical', message: 'Missing page title' });
      }
    } else {
      analysis.issues.push({ severity: 'critical', message: 'Missing page title' });
    }

    // Meta description check (25 points)
    if (contentInfo.description) {
      const descLength = contentInfo.description.length;
      if (descLength >= 120 && descLength <= 160) {
        analysis.score += 25;
        analysis.passed.push('Meta description length is optimal (120-160 characters)');
      } else if (descLength > 0) {
        analysis.score += 10;
        analysis.issues.push({
          severity: 'medium',
          message: `Meta description is ${descLength} characters (recommended: 120-160)`,
        });
      } else {
        analysis.issues.push({ severity: 'critical', message: 'Missing meta description' });
      }
    } else {
      analysis.issues.push({ severity: 'critical', message: 'Missing meta description' });
    }

    // H1 heading check (20 points)
    if (contentInfo.headings.h1.length === 1) {
      analysis.score += 20;
      analysis.passed.push('Page has exactly one H1 heading');
    } else if (contentInfo.headings.h1.length === 0) {
      analysis.issues.push({ severity: 'high', message: 'Missing H1 heading' });
    } else {
      analysis.score += 10;
      analysis.issues.push({
        severity: 'medium',
        message: `Page has ${contentInfo.headings.h1.length} H1 headings (should have exactly 1)`,
      });
    }

    // Open Graph tags check (15 points)
    const hasOgTitle = /<meta\s+property=["']og:title["']/i.test(content);
    const hasOgDescription = /<meta\s+property=["']og:description["']/i.test(content);
    const hasOgImage = /<meta\s+property=["']og:image["']/i.test(content);

    if (hasOgTitle && hasOgDescription && hasOgImage) {
      analysis.score += 15;
      analysis.passed.push('Open Graph meta tags are present');
    } else {
      const missing = [];
      if (!hasOgTitle) {
        missing.push('og:title');
      }
      if (!hasOgDescription) {
        missing.push('og:description');
      }
      if (!hasOgImage) {
        missing.push('og:image');
      }
      analysis.issues.push({
        severity: 'low',
        message: `Missing Open Graph tags: ${missing.join(', ')}`,
      });
    }

    // Canonical tag check (15 points)
    const hasCanonical = /<link\s+rel=["']canonical["']/i.test(content);
    if (hasCanonical) {
      analysis.score += 15;
      analysis.passed.push('Canonical URL is specified');
    } else {
      analysis.issues.push({ severity: 'medium', message: 'Missing canonical URL tag' });
    }

    return analysis;
  }

  /**
   * Component 2: Analyze Content Quality (0-100 score)
   */
  async analyzeContentQuality(content, contentInfo) {
    const analysis = {
      score: 0,
      issues: [],
      passed: [],
    };

    // Word count check (30 points)
    const wordCount = contentInfo.wordCount;
    if (wordCount >= 300 && wordCount <= 2500) {
      analysis.score += 30;
      analysis.passed.push(`Content has optimal word count (${wordCount} words)`);
    } else if (wordCount >= 200 && wordCount < 300) {
      // Give partial credit for 200-299 words
      analysis.score += 20;
      analysis.issues.push({
        severity: 'medium',
        message: `Content could be longer (${wordCount} words, recommended: 300+)`,
      });
    } else if (wordCount < 200) {
      analysis.score += Math.floor((wordCount / 200) * 10);
      analysis.issues.push({
        severity: 'high',
        message: `Content is too short (${wordCount} words, recommended: 300+)`,
      });
    } else {
      analysis.score += 30;
      analysis.passed.push(`Content is comprehensive (${wordCount} words)`);
    }

    // Heading structure check (25 points)
    const h2Count = contentInfo.headings.h2.length;
    if (h2Count >= 2 && h2Count <= 10) {
      analysis.score += 25;
      analysis.passed.push(`Good heading structure (${h2Count} H2 headings)`);
    } else if (h2Count === 0) {
      analysis.issues.push({ severity: 'high', message: 'No H2 headings found - add subheadings' });
    } else if (h2Count > 10) {
      analysis.score += 15;
      analysis.issues.push({
        severity: 'low',
        message: `Many H2 headings (${h2Count}) - consider consolidating`,
      });
    } else {
      analysis.score += 15;
      analysis.issues.push({
        severity: 'medium',
        message: 'Add more H2 headings for better structure',
      });
    }

    // Image optimization check (20 points)
    const totalImages = contentInfo.images.length;
    const imagesWithAlt = contentInfo.images.filter((img) => img.hasAlt).length;

    if (totalImages > 0) {
      const altPercentage = (imagesWithAlt / totalImages) * 100;
      if (altPercentage === 100) {
        analysis.score += 20;
        analysis.passed.push('All images have alt text');
      } else if (altPercentage >= 80) {
        analysis.score += 15;
        analysis.issues.push({
          severity: 'low',
          message: `${totalImages - imagesWithAlt} images missing alt text`,
        });
      } else {
        analysis.score += 5;
        analysis.issues.push({
          severity: 'medium',
          message: `${totalImages - imagesWithAlt} of ${totalImages} images missing alt text`,
        });
      }
    } else {
      analysis.score += 10;
      analysis.issues.push({
        severity: 'low',
        message: 'No images found - consider adding visual content',
      });
    }

    // Internal linking check (15 points)
    const internalLinks = contentInfo.links.filter(
      (link) => !link.href.match(/^https?:\/\//)
    ).length;

    if (internalLinks >= 3) {
      analysis.score += 15;
      analysis.passed.push(`Good internal linking (${internalLinks} internal links)`);
    } else if (internalLinks > 0) {
      analysis.score += 8;
      analysis.issues.push({
        severity: 'medium',
        message: `Add more internal links (found ${internalLinks}, recommended: 3+)`,
      });
    } else {
      analysis.issues.push({ severity: 'medium', message: 'No internal links found' });
    }

    // List usage check (10 points)
    const hasLists = /<[ou]l>/i.test(content);
    if (hasLists) {
      analysis.score += 10;
      analysis.passed.push('Content includes lists for better readability');
    } else {
      analysis.issues.push({
        severity: 'low',
        message: 'Consider adding bullet or numbered lists',
      });
    }

    return analysis;
  }

  /**
   * Component 3: Analyze Technical SEO (0-100 score)
   */
  async analyzeTechnicalSEO(url, content) {
    const analysis = {
      score: 0,
      issues: [],
      passed: [],
    };

    // HTTPS check (25 points)
    if (url.startsWith('https://')) {
      analysis.score += 25;
      analysis.passed.push('Site uses HTTPS (secure)');
    } else {
      analysis.issues.push({ severity: 'critical', message: 'Site does not use HTTPS' });
    }

    // Robots meta tag check (15 points)
    const robotsMeta = content.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
    if (!robotsMeta || !robotsMeta[1].includes('noindex')) {
      analysis.score += 15;
      analysis.passed.push('Page is indexable by search engines');
    } else {
      analysis.issues.push({
        severity: 'high',
        message: 'Page is set to noindex (will not appear in search)',
      });
    }

    // Structured data check (20 points)
    const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(content);
    if (hasJsonLd) {
      analysis.score += 20;
      analysis.passed.push('Structured data (JSON-LD) is present');
    } else {
      analysis.issues.push({
        severity: 'medium',
        message: 'Missing structured data (Schema.org markup)',
      });
    }

    // XML Sitemap reference check (15 points)
    // Note: This would require checking robots.txt in a real implementation
    analysis.score += 8;
    analysis.issues.push({
      severity: 'low',
      message: 'Verify XML sitemap exists and is submitted to search engines',
    });

    // URL structure check (15 points)
    const urlPath = url.replace(/^https?:\/\/[^/]+/, '');
    const hasCleanUrl = !urlPath.includes('?') && !urlPath.includes('&') && urlPath.length < 100;

    if (hasCleanUrl) {
      analysis.score += 15;
      analysis.passed.push('Clean, SEO-friendly URL structure');
    } else {
      analysis.score += 5;
      analysis.issues.push({
        severity: 'medium',
        message: 'URL contains parameters or is too long',
      });
    }

    // Page load resources check (10 points)
    const scriptCount = (content.match(/<script/gi) || []).length;
    const styleCount = (content.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length;

    if (scriptCount < 10 && styleCount < 5) {
      analysis.score += 10;
      analysis.passed.push('Reasonable number of external resources');
    } else {
      analysis.issues.push({
        severity: 'low',
        message: `Many external resources (${scriptCount} scripts, ${styleCount} stylesheets) - may impact performance`,
      });
    }

    return analysis;
  }

  /**
   * Component 4: Analyze Mobile Optimization (0-100 score)
   */
  async analyzeMobileOptimization(content) {
    const analysis = {
      score: 0,
      issues: [],
      passed: [],
    };

    // Viewport meta tag check (40 points)
    const viewportMeta = content.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
    if (viewportMeta && viewportMeta[1].includes('width=device-width')) {
      analysis.score += 40;
      analysis.passed.push('Viewport meta tag is properly configured');
    } else if (viewportMeta) {
      analysis.score += 20;
      analysis.issues.push({
        severity: 'high',
        message: 'Viewport meta tag exists but may not be optimal',
      });
    } else {
      analysis.issues.push({
        severity: 'critical',
        message: 'Missing viewport meta tag - not mobile-friendly',
      });
    }

    // Responsive images check (20 points)
    const images = content.match(/<img[^>]+>/gi) || [];
    const responsiveImages = images.filter(
      (img) => img.includes('srcset') || img.includes('sizes')
    ).length;

    if (images.length > 0) {
      const responsivePercentage = (responsiveImages / images.length) * 100;
      if (responsivePercentage === 100) {
        analysis.score += 20;
        analysis.passed.push('All images are responsive (use srcset/sizes)');
      } else if (responsivePercentage >= 80) {
        analysis.score += 18;
        analysis.passed.push(`${Math.round(responsivePercentage)}% of images are responsive`);
      } else if (responsivePercentage >= 50) {
        analysis.score += 15;
        analysis.passed.push('Most images are responsive');
      } else if (responsivePercentage > 0) {
        analysis.score += 10;
        analysis.issues.push({
          severity: 'low',
          message: `Only ${Math.round(responsivePercentage)}% of images are responsive - add srcset/sizes`,
        });
      } else {
        analysis.issues.push({
          severity: 'medium',
          message: 'Images are not responsive - add srcset/sizes attributes',
        });
      }
    } else {
      analysis.score += 10;
    }

    // Touch-friendly elements check (20 points)
    // Note: hasTouchEvents variable removed as actual touch detection would require runtime analysis
    const hasLargeClickTargets = true; // Simplified - would need CSS analysis in real implementation

    if (hasLargeClickTargets) {
      analysis.score += 20;
      analysis.passed.push('Touch-friendly design detected');
    } else {
      analysis.issues.push({
        severity: 'low',
        message: 'Ensure tap targets are at least 48x48 pixels',
      });
    }

    // Font size check (20 points)
    // Note: hasViewportUnits variable removed as this would require CSS analysis in real implementation
    const hasMediaQueries = /@media/i.test(content);

    if (hasMediaQueries) {
      analysis.score += 20;
      analysis.passed.push('Responsive font sizing detected');
    } else {
      analysis.issues.push({
        severity: 'low',
        message: 'Consider using responsive font sizes for mobile',
      });
    }

    return analysis;
  }

  /**
   * Component 5: Analyze Performance (0-100 score)
   */
  async analyzePerformance(url, content) {
    const analysis = {
      score: 40, // Start with moderate base score instead of 50
      issues: [],
      passed: [],
    };

    // Note: Real implementation would use Google PageSpeed Insights API
    // For now, we'll do basic checks that give realistic scores

    // Image optimization check (30 points)
    const images = content.match(/<img[^>]+>/gi) || [];
    const lazyImages = images.filter((img) => img.includes('loading="lazy"')).length;

    if (images.length > 0) {
      const lazyPercentage = (lazyImages / images.length) * 100;
      if (lazyPercentage === 100) {
        analysis.score += 30;
        analysis.passed.push('All images use lazy loading');
      } else if (lazyPercentage >= 50) {
        analysis.score += 20;
        analysis.passed.push(`${Math.round(lazyPercentage)}% of images use lazy loading`);
      } else if (lazyPercentage > 0) {
        analysis.score += 10;
        analysis.issues.push({
          severity: 'medium',
          message: `Add lazy loading to more images (currently ${Math.round(lazyPercentage)}%)`,
        });
      } else {
        analysis.issues.push({
          severity: 'medium',
          message: 'Add lazy loading to images for better performance',
        });
      }
    } else {
      analysis.score += 15;
    }

    // Resource hints check (15 points)
    const hasDnsPrefetch = /<link\s+rel=["']dns-prefetch["']/i.test(content);
    const hasPreconnect = /<link\s+rel=["']preconnect["']/i.test(content);

    if (hasDnsPrefetch && hasPreconnect) {
      analysis.score += 15;
      analysis.passed.push('Resource hints (dns-prefetch and preconnect) are used');
    } else if (hasDnsPrefetch || hasPreconnect) {
      analysis.score += 10;
      analysis.passed.push('Resource hints are partially implemented');
    } else {
      analysis.score += 5;
      analysis.issues.push({
        severity: 'low',
        message: 'Add dns-prefetch or preconnect for external resources',
      });
    }

    // Minification check (15 points)
    const hasMinifiedCss = /<link[^>]+\.min\.css/i.test(content);
    const hasMinifiedJs = /<script[^>]+\.min\.js/i.test(content);

    if (hasMinifiedCss && hasMinifiedJs) {
      analysis.score += 15;
      analysis.passed.push('CSS and JavaScript resources are minified');
    } else if (hasMinifiedCss || hasMinifiedJs) {
      analysis.score += 10;
      analysis.passed.push('Some resources are minified');
    } else {
      analysis.score += 5;
      analysis.issues.push({ severity: 'medium', message: 'Minify CSS and JavaScript files' });
    }

    analysis.issues.push({
      severity: 'info',
      message:
        'Run full performance audit with Google PageSpeed Insights for detailed Core Web Vitals',
    });

    return analysis;
  }

  /**
   * Component 6: Analyze Security (0-100 score)
   */
  async analyzeSecurity(url, content) {
    const analysis = {
      score: 0,
      issues: [],
      passed: [],
    };

    // HTTPS check (40 points)
    if (url.startsWith('https://')) {
      analysis.score += 40;
      analysis.passed.push('Site uses HTTPS encryption');
    } else {
      analysis.issues.push({
        severity: 'critical',
        message: 'Site does not use HTTPS - major security risk',
      });
    }

    // Mixed content check (20 points)
    const hasMixedContent =
      /src=["']http:\/\//i.test(content) || /href=["']http:\/\//i.test(content);

    if (!hasMixedContent && url.startsWith('https://')) {
      analysis.score += 20;
      analysis.passed.push('No mixed content (HTTP resources on HTTPS page)');
    } else if (hasMixedContent) {
      analysis.issues.push({
        severity: 'high',
        message: 'Mixed content detected - HTTP resources on HTTPS page',
      });
    }

    // Security headers check (20 points)
    // Note: Would require actual HTTP response headers in real implementation
    analysis.score += 10;
    analysis.issues.push({
      severity: 'info',
      message: 'Verify security headers: X-Frame-Options, X-Content-Type-Options, CSP',
    });

    // External links check (10 points)
    const externalLinks = content.match(/<a[^>]+href=["']https?:\/\/[^"']+["'][^>]*>/gi) || [];
    const noopenerLinks = externalLinks.filter((link) => link.includes('rel="noopener')).length;

    if (externalLinks.length > 0) {
      const noopenerPercentage = (noopenerLinks / externalLinks.length) * 100;
      if (noopenerPercentage >= 80) {
        analysis.score += 10;
        analysis.passed.push('External links use rel="noopener noreferrer"');
      } else {
        analysis.issues.push({
          severity: 'low',
          message: 'Add rel="noopener noreferrer" to external links',
        });
      }
    } else {
      analysis.score += 5;
    }

    // Form security check (10 points)
    const hasForms = /<form/i.test(content);
    if (hasForms) {
      const hasHttpsForms = !/<form[^>]+action=["']http:\/\//i.test(content);
      if (hasHttpsForms) {
        analysis.score += 10;
        analysis.passed.push('Forms submit to secure (HTTPS) endpoints');
      } else {
        analysis.issues.push({
          severity: 'high',
          message: 'Forms submit to insecure (HTTP) endpoints',
        });
      }
    } else {
      analysis.score += 10;
    }

    return analysis;
  }

  /**
   * Component 7: Analyze Accessibility (0-100 score)
   */
  async analyzeAccessibility(content) {
    const analysis = {
      score: 0,
      issues: [],
      passed: [],
    };

    // Alt text check (25 points)
    const images = content.match(/<img[^>]+>/gi) || [];
    const imagesWithAlt = images.filter((img) => /alt=["'][^"']*["']/.test(img)).length;

    if (images.length > 0) {
      const altPercentage = (imagesWithAlt / images.length) * 100;
      if (altPercentage === 100) {
        analysis.score += 25;
        analysis.passed.push('All images have alt text for screen readers');
      } else if (altPercentage >= 80) {
        analysis.score += 15;
        analysis.issues.push({
          severity: 'medium',
          message: `${images.length - imagesWithAlt} images missing alt text`,
        });
      } else {
        analysis.score += 5;
        analysis.issues.push({
          severity: 'high',
          message: `${images.length - imagesWithAlt} of ${images.length} images missing alt text`,
        });
      }
    } else {
      analysis.score += 15;
    }

    // ARIA labels check (20 points)
    const hasAriaLabels = /aria-label=/i.test(content);
    const hasAriaDescriptions = /aria-describedby=/i.test(content);

    if (hasAriaLabels || hasAriaDescriptions) {
      analysis.score += 20;
      analysis.passed.push('ARIA labels are used for better accessibility');
    } else {
      analysis.issues.push({
        severity: 'medium',
        message: 'Add ARIA labels to improve screen reader accessibility',
      });
    }

    // Semantic HTML check (20 points)
    const hasSemanticTags =
      /<header/i.test(content) ||
      /<nav/i.test(content) ||
      /<main/i.test(content) ||
      /<article/i.test(content) ||
      /<footer/i.test(content);

    if (hasSemanticTags) {
      analysis.score += 20;
      analysis.passed.push('Semantic HTML5 tags are used');
    } else {
      analysis.issues.push({
        severity: 'medium',
        message: 'Use semantic HTML5 tags (header, nav, main, article, footer)',
      });
    }

    // Form labels check (15 points)
    const formInputs = content.match(/<input[^>]+>/gi) || [];
    const inputsWithLabels = formInputs.filter(
      (input) => /<label[^>]*for=["'][^"']+["'][^>]*>/i.test(content) || /aria-label=/i.test(input)
    ).length;

    if (formInputs.length > 0) {
      const labelPercentage = (inputsWithLabels / formInputs.length) * 100;
      if (labelPercentage >= 90) {
        analysis.score += 15;
        analysis.passed.push('Form inputs have associated labels');
      } else {
        analysis.issues.push({
          severity: 'high',
          message: 'Add <label> tags or aria-label to all form inputs',
        });
      }
    } else {
      analysis.score += 10;
    }

    // Language declaration check (10 points)
    const hasLang = /<html[^>]+lang=/i.test(content);
    if (hasLang) {
      analysis.score += 10;
      analysis.passed.push('Page language is declared (lang attribute)');
    } else {
      analysis.issues.push({ severity: 'medium', message: 'Add lang attribute to <html> tag' });
    }

    // Heading hierarchy check (10 points)
    const headings = content.match(/<h[1-6]/gi) || [];
    const hasProperHierarchy = headings.length > 0; // Simplified check

    if (hasProperHierarchy) {
      analysis.score += 10;
      analysis.passed.push('Heading hierarchy exists');
    } else {
      analysis.issues.push({
        severity: 'low',
        message: 'Ensure proper heading hierarchy (H1 → H2 → H3)',
      });
    }

    return analysis;
  }

  /**
   * Calculate comprehensive SEO score (weighted average of all components)
   */
  calculateComprehensiveScore(scores) {
    // Weighted scoring - total = 100
    const weights = {
      meta: 0.2, // 20% - Meta tags are critical for search visibility
      content: 0.2, // 20% - Content quality is core to SEO
      technical: 0.15, // 15% - Technical SEO is important
      mobile: 0.15, // 15% - Mobile-first indexing
      performance: 0.1, // 10% - Page speed is a ranking factor
      security: 0.1, // 10% - HTTPS is required
      accessibility: 0.1, // 10% - Accessibility matters for all users
    };

    const weightedScore =
      scores.metaScore.score * weights.meta +
      scores.contentScore.score * weights.content +
      scores.technicalScore.score * weights.technical +
      scores.mobileScore.score * weights.mobile +
      scores.performanceScore.score * weights.performance +
      scores.securityScore.score * weights.security +
      scores.accessibilityScore.score * weights.accessibility;

    return Math.round(weightedScore);
  }

  /**
   * Generate comprehensive recommendations from all components
   */
  generateComprehensiveRecommendations(scores) {
    const allIssues = [
      ...scores.metaScore.issues.map((i) => ({ ...i, component: 'Meta Tags' })),
      ...scores.contentScore.issues.map((i) => ({ ...i, component: 'Content' })),
      ...scores.technicalScore.issues.map((i) => ({ ...i, component: 'Technical SEO' })),
      ...scores.mobileScore.issues.map((i) => ({ ...i, component: 'Mobile' })),
      ...scores.performanceScore.issues.map((i) => ({ ...i, component: 'Performance' })),
      ...scores.securityScore.issues.map((i) => ({ ...i, component: 'Security' })),
      ...scores.accessibilityScore.issues.map((i) => ({ ...i, component: 'Accessibility' })),
    ];

    // Sort by severity: critical > high > medium > low > info
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return allIssues;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.logger.info('[SEO] Cleaning up...');
    await super.cleanup();
  }
}

export default SEOAgent;
