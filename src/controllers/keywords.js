/**
 * Keywords Controller
 * Handles keyword research and analysis operations
 */

import { createClient } from '@supabase/supabase-js';
import * as usageTracker from '../services/usageTracker.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Research keywords for a seed keyword/topic
 * POST /api/keywords/research
 */
export async function researchKeywords(req, res) {
  try {
    const { seed_keyword, target_location, audit_id } = req.body;
    const userId = req.user.id;

    // Validation
    if (!seed_keyword || seed_keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_KEYWORD',
          message: 'Seed keyword is required',
        },
      });
    }

    if (seed_keyword.length > 200) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'KEYWORD_TOO_LONG',
          message: 'Keyword must be 200 characters or less',
        },
      });
    }

    // Check for existing research within 7 days (cache)
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: cachedResults } = await supabase
      .from('keywords')
      .select('*')
      .eq('user_id', userId)
      .eq('seed_keyword', seed_keyword.toLowerCase())
      .eq('target_location', target_location || 'US')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (cachedResults && cachedResults.length > 0) {
      // Return cached results
      const { data: allKeywords } = await supabase
        .from('keywords')
        .select('*')
        .eq('seed_keyword', seed_keyword.toLowerCase())
        .eq('user_id', userId)
        .order('opportunity_score', { ascending: false });

      return res.json({
        success: true,
        data: {
          keywords: allKeywords || [],
          cached: true,
          cache_date: cachedResults[0].created_at,
        },
      });
    }

    // PLACEHOLDER: Google Keyword Planner API integration (Phase 3)
    // For now, return mock data with realistic structure
    // In Phase 3, integrate with: https://developers.google.com/google-ads/api/docs/keyword-planning
    const mockKeywordData = generateMockKeywordData(
      seed_keyword,
      target_location
    );

    // Store keywords in database
    const keywordsToInsert = mockKeywordData.map((kw) => ({
      user_id: userId,
      audit_id: audit_id || null,
      seed_keyword: seed_keyword.toLowerCase(),
      keyword: kw.keyword,
      search_volume: kw.search_volume,
      competition: kw.competition,
      difficulty_score: kw.difficulty_score,
      opportunity_score: kw.opportunity_score,
      cpc: kw.cpc,
      target_location: target_location || 'US',
    }));

    const { data: insertedKeywords, error: insertError } = await supabase
      .from('keywords')
      .insert(keywordsToInsert)
      .select();

    if (insertError) {
      console.error('Error storing keywords:', insertError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to store keyword research results',
        },
      });
    }

    // Track usage
    await usageTracker.incrementUsage(userId, 'keyword_research', 1);

    return res.status(201).json({
      success: true,
      data: {
        keywords: insertedKeywords,
        cached: false,
        total_keywords: insertedKeywords.length,
      },
    });
  } catch (error) {
    console.error('Error researching keywords:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to research keywords',
      },
    });
  }
}

/**
 * Get keywords for a specific audit
 * GET /api/keywords/:audit_id
 */
export async function getKeywordsByAudit(req, res) {
  try {
    const { audit_id } = req.params;
    const userId = req.user.id;

    // Verify audit ownership
    const { data: audit } = await supabase
      .from('seo_analyses')
      .select('user_id')
      .eq('id', audit_id)
      .single();

    if (!audit) {
      return res.status(404).json({
        success: false,
        error: { code: 'AUDIT_NOT_FOUND', message: 'Audit not found' },
      });
    }

    if (audit.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this audit',
        },
      });
    }

    // Get keywords
    const { data: keywords, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('audit_id', audit_id)
      .order('opportunity_score', { ascending: false });

    if (error) {
      console.error('Error fetching keywords:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch keywords',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        keywords: keywords || [],
        total: keywords?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error getting keywords by audit:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch keywords',
      },
    });
  }
}

/**
 * Get top opportunity keywords for an audit
 * GET /api/keywords/:audit_id/opportunities
 */
export async function getTopOpportunities(req, res) {
  try {
    const { audit_id } = req.params;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Verify audit ownership
    const { data: audit } = await supabase
      .from('seo_analyses')
      .select('user_id')
      .eq('id', audit_id)
      .single();

    if (!audit) {
      return res.status(404).json({
        success: false,
        error: { code: 'AUDIT_NOT_FOUND', message: 'Audit not found' },
      });
    }

    if (audit.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this audit',
        },
      });
    }

    // Get high-opportunity keywords (high search volume, low competition)
    const { data: keywords, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('audit_id', audit_id)
      .order('opportunity_score', { ascending: false })
      .limit(Math.min(limit, 50));

    if (error) {
      console.error('Error fetching opportunities:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch opportunities',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        opportunities: keywords || [],
        total: keywords?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error getting top opportunities:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch opportunities',
      },
    });
  }
}

/**
 * Generate mock keyword data for testing
 * TODO: Replace with real Google Keyword Planner API in Phase 3
 */
function generateMockKeywordData(seedKeyword, _location = 'US') {
  const variations = [
    seedKeyword,
    `${seedKeyword} services`,
    `best ${seedKeyword}`,
    `${seedKeyword} near me`,
    `${seedKeyword} company`,
    `affordable ${seedKeyword}`,
    `${seedKeyword} solutions`,
    `professional ${seedKeyword}`,
    `${seedKeyword} pricing`,
    `${seedKeyword} reviews`,
  ];

  return variations.map((keyword) => {
    const searchVolume = Math.floor(Math.random() * 5000) + 100;
    const competitionLevel =
      ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
    const difficultyScore = Math.floor(Math.random() * 100);

    // Calculate opportunity score (high volume + low competition = high opportunity)
    const volumeScore = Math.min(searchVolume / 50, 100);
    const competitionPenalty =
      competitionLevel === 'low' ? 0 : competitionLevel === 'medium' ? 20 : 40;
    const opportunityScore = Math.max(
      0,
      Math.min(100, volumeScore - competitionPenalty)
    );

    return {
      keyword,
      search_volume: searchVolume,
      competition: competitionLevel,
      difficulty_score: difficultyScore,
      opportunity_score: Math.round(opportunityScore),
      cpc: (Math.random() * 10 + 0.5).toFixed(2),
    };
  });
}
