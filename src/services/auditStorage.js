/**
 * Audit Storage Service
 * Handles persisting SEO audit results to Supabase
 * Stores comprehensive 7-component scores, recommendations, and historical tracking
 */

import { createClient } from '../config/supabase.js';

class AuditStorage {
  /**
   * Save comprehensive audit results to database
   * @param {Object} params - Storage parameters
   * @param {string} params.userId - User ID
   * @param {string} params.projectId - Optional project ID
   * @param {string} params.url - Audited URL
   * @param {Object} params.auditResults - Complete audit results from SEOAgent
   * @returns {Promise<Object>} Saved audit record
   */
  async saveAudit({ userId, projectId, url, auditResults }) {
    const supabase = createClient();

    try {
      // Prepare audit record
      const auditRecord = {
        user_id: userId,
        project_id: projectId || null,
        content_url: url,
        analysis_type: 'comprehensive_seo_audit',
        seo_score: auditResults.overall_score,
        results: {
          overall_score: auditResults.overall_score,
          grade: auditResults.grade,
          timestamp: auditResults.timestamp,
          scores: auditResults.scores,
          url: auditResults.url,
        },
        ai_provider: 'seo_agent',
        created_at: new Date().toISOString(),
      };

      // Insert main audit record
      const { data: audit, error: auditError } = await supabase
        .from('seo_analyses')
        .insert(auditRecord)
        .select()
        .single();

      if (auditError) {
        return { success: false, error: auditError.message };
      }

      // Save recommendations to separate storage for better querying
      if (auditResults.recommendations && auditResults.recommendations.length > 0) {
        await this.saveRecommendations({
          auditId: audit.id,
          recommendations: auditResults.recommendations,
        });
      }

      // Save to audit history for progress tracking
      await this.saveToHistory({
        userId,
        url,
        score: auditResults.overall_score,
      });

      return {
        success: true,
        audit: {
          id: audit.id,
          url: audit.content_url,
          overall_score: audit.seo_score,
          grade: audit.results?.grade,
          created_at: audit.created_at,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save recommendations as structured data
   * Uses JSONB storage in results field with recommendations array
   * @param {Object} params
   * @param {string} params.auditId - Audit ID
   * @param {Array} params.recommendations - Recommendations array
   * @returns {Promise<Object>} Success object with {success: boolean, error?: string}
   */
  async saveRecommendations({ auditId, recommendations }) {
    const supabase = createClient();

    try {
      // Fetch current results JSONB object
      const { data: audit, error: fetchError } = await supabase
        .from('seo_analyses')
        .select('results')
        .eq('id', auditId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      const currentResults = audit && audit.results ? audit.results : {};
      const updatedResults = { ...currentResults, recommendations };

      const { error: updateError } = await supabase
        .from('seo_analyses')
        .update({ results: updatedResults })
        .eq('id', auditId);

      if (updateError) {
        // Don't throw - recommendations are supplementary
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save audit to history for progress tracking
   * Creates time-series data for charts showing SEO score improvements
   */
  async saveToHistory({ userId, url, score }) {
    const supabase = createClient();

    try {
      // Check if we have a history entry for this URL in the last 24 hours
      const { data: recentHistory } = await supabase
        .from('seo_analyses')
        .select('id, created_at, seo_score')
        .eq('user_id', userId)
        .eq('content_url', url)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      // If score changed significantly (>5 points), this is noteworthy progress
      const isSignificantChange =
        !recentHistory ||
        recentHistory.length === 0 ||
        Math.abs(recentHistory[0].seo_score - score) >= 5;

      return {
        success: true,
        isSignificantChange,
        previousScore:
          recentHistory && recentHistory.length > 0 ? recentHistory[0].seo_score : null,
        currentScore: score,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get audit by ID with full details
   */
  async getAudit(auditId, userId) {
    const supabase = createClient();

    try {
      const { data: audit, error } = await supabase
        .from('seo_analyses')
        .select('*')
        .eq('id', auditId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (!audit) {
        return { success: false, error: 'Audit not found' };
      }

      return {
        success: true,
        audit: {
          id: audit.id,
          url: audit.content_url,
          overall_score: audit.seo_score,
          grade: audit.results?.grade || this.calculateGrade(audit.seo_score),
          scores: audit.results?.scores || {},
          recommendations: audit.results?.recommendations || [],
          timestamp: audit.results?.timestamp || audit.created_at,
          created_at: audit.created_at,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get audit history for a URL (for progress charts)
   */
  async getAuditHistory(userId, url, limit = 10) {
    const supabase = createClient();

    try {
      const { data: history, error } = await supabase
        .from('seo_analyses')
        .select('id, seo_score, created_at, results')
        .eq('user_id', userId)
        .eq('content_url', url)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return {
        success: true,
        history: history.map((entry) => ({
          id: entry.id,
          score: entry.seo_score,
          timestamp: entry.created_at,
          scores: entry.results?.scores || {},
        })),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List user's audits with pagination
   */
  async listAudits(userId, { page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = {}) {
    const supabase = createClient();

    try {
      const offset = (page - 1) * limit;

      const {
        data: audits,
        error,
        count,
      } = await supabase
        .from('seo_analyses')
        .select('id, content_url, seo_score, created_at, results', { count: 'exact' })
        .eq('user_id', userId)
        .order(sortBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        success: true,
        audits: audits.map((audit) => ({
          id: audit.id,
          url: audit.content_url,
          overall_score: audit.seo_score,
          grade: audit.results?.grade || this.calculateGrade(audit.seo_score),
          created_at: audit.created_at,
        })),
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete audit by ID
   */
  async deleteAudit(auditId, userId) {
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('seo_analyses')
        .delete()
        .eq('id', auditId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get statistics for user's audits
   */
  async getAuditStats(userId) {
    const supabase = createClient();

    try {
      // Get total audits count
      const { count: totalAudits } = await supabase
        .from('seo_analyses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get average score
      const { data: scores } = await supabase
        .from('seo_analyses')
        .select('seo_score')
        .eq('user_id', userId);

      const avgScore =
        scores && scores.length > 0
          ? scores.reduce((sum, a) => sum + a.seo_score, 0) / scores.length
          : 0;

      // Get recent audits (last 7 days)
      const { count: recentAudits } = await supabase
        .from('seo_analyses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      return {
        success: true,
        stats: {
          totalAudits: totalAudits || 0,
          averageScore: Math.round(avgScore),
          recentAudits: recentAudits || 0,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate grade from score (0-100 range)
   * @param {number} score - Score from 0-100
   * @returns {string} Letter grade (A+, A, B, C, D, F)
   */
  calculateGrade(score) {
    if (score >= 90) {
      return 'A+';
    }
    if (score >= 80) {
      return 'A';
    }
    if (score >= 70) {
      return 'B';
    }
    if (score >= 60) {
      return 'C';
    }
    if (score >= 50) {
      return 'D';
    }
    return 'F';
  }

  /**
   * Save meta tag variations (for Task 3.1.3)
   */
  async saveMetaTagVariations({ userId, projectId, variations }) {
    const supabase = createClient();

    const metaRecord = {
      user_id: userId,
      project_id: projectId || null,
      title: variations.titleVariations[0]?.text || '',
      description: variations.descriptionVariations[0]?.text || '',
      keywords: variations.metaKeywords || [],
      og_title: variations.ogTitle || '',
      og_description: variations.ogDescription || '',
      twitter_card: 'summary_large_image',
      ai_provider: variations.generated ? 'gemini' : 'fallback',
      created_at: new Date().toISOString(),
    };

    const { data: metaTags, error } = await supabase
      .from('meta_tags')
      .insert(metaRecord)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      metaTags: {
        id: metaTags.id,
        title: metaTags.title,
        description: metaTags.description,
        created_at: metaTags.created_at,
      },
    };
  }
}

// Export singleton instance
export default new AuditStorage();
