/**
 * Audits Controller
 * Handles SEO audit operations - the core product feature
 */

import { createClient } from '../config/supabase.js';
import usageTracker from '../services/usageTracker.js';

/**
 * Create new SEO audit
 * @route POST /api/audits
 */
export async function createAudit(req, res) {
  try {
    const supabase = createClient();
    const userId = req.user.id;
    const { url } = req.body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Valid URL is required',
        },
      });
    }

    // Basic URL validation
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL must be a valid HTTP or HTTPS URL',
        },
      });
    }

    // Create initial audit record with "processing" status
    const { data: audit, error: insertError } = await supabase
      .from('seo_analyses')
      .insert({
        user_id: userId,
        url: url.trim(),
        status: 'processing',
        created_at: new Date().toISOString(),
      })
      .select('id, user_id, url, status, created_at')
      .single();

    if (insertError) {
      console.error('Error creating audit:', insertError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create audit',
        },
      });
    }

    // Log API usage for quota tracking
    try {
      await usageTracker.logUsage(userId, 'audit', {
        audit_id: audit.id,
        url,
      });
    } catch (usageError) {
      console.error('Error logging usage:', usageError);
      // Continue anyway - audit is more important than usage tracking
    }

    // TODO: Phase 3 - Queue audit job for SEOAgent processing
    // For now, return pending audit that will be processed in Phase 3
    // In Phase 3, this will trigger:
    // 1. SEOAgent.performAudit(url, options)
    // 2. Calculate 7-component scores
    // 3. Generate recommendations
    // 4. Update audit status to 'completed'

    return res.status(202).json({
      success: true,
      data: {
        ...audit,
        message: 'Audit queued for processing. Results will be available shortly.',
        estimated_completion: new Date(Date.now() + 60000).toISOString(), // 60 seconds from now
      },
    });
  } catch (error) {
    console.error('Create audit error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}

/**
 * Get specific audit results
 * @route GET /api/audits/:id
 */
export async function getAudit(req, res) {
  try {
    const supabase = createClient();
    const userId = req.user.id;
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid audit ID format',
        },
      });
    }

    // Get audit from database
    const { data: audit, error } = await supabase
      .from('seo_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns this audit
      .single();

    if (error || !audit) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AUDIT_NOT_FOUND',
          message: 'Audit not found or access denied',
        },
      });
    }

    return res.json({
      success: true,
      data: audit,
    });
  } catch (error) {
    console.error('Get audit error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}

/**
 * List user's audits with pagination
 * @route GET /api/audits
 */
export async function listAudits(req, res) {
  try {
    const supabase = createClient();
    const userId = req.user.id;

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 per page
    const sort = req.query.sort || 'created_at';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';

    // Validate sort field (prevent SQL injection)
    const allowedSortFields = ['created_at', 'updated_at', 'url', 'overall_score'];
    if (!allowedSortFields.includes(sort)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SORT_FIELD',
          message: `Sort field must be one of: ${allowedSortFields.join(', ')}`,
        },
      });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from('seo_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get audits with pagination
    const { data: audits, error } = await supabase
      .from('seo_analyses')
      .select('id, url, overall_score, status, created_at, updated_at')
      .eq('user_id', userId)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error listing audits:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch audits',
        },
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return res.json({
      success: true,
      data: audits || [],
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('List audits error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}

/**
 * Delete audit
 * @route DELETE /api/audits/:id
 */
export async function deleteAudit(req, res) {
  try {
    const supabase = createClient();
    const userId = req.user.id;
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid audit ID format',
        },
      });
    }

    // Verify ownership before deleting
    const { data: audit } = await supabase
      .from('seo_analyses')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!audit) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AUDIT_NOT_FOUND',
          message: 'Audit not found or access denied',
        },
      });
    }

    // Delete audit
    const { error: deleteError } = await supabase
      .from('seo_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting audit:', deleteError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete audit',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        message: 'Audit successfully deleted',
        deleted_id: id,
      },
    });
  } catch (error) {
    console.error('Delete audit error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}
