/**
 * Audits Controller
 * Handles SEO audit operations - the core product feature
 */

import { randomUUID } from 'node:crypto';
import { createClient } from '../config/supabase.js';
import usageTracker from '../services/usageTracker.js';

const memoryAuditStore = globalThis.__prismifyAuditMemory || new Map();
if (!globalThis.__prismifyAuditMemory) {
  globalThis.__prismifyAuditMemory = memoryAuditStore;
}

const getMemoryAudits = (userId) => memoryAuditStore.get(userId) || [];

const saveAuditToMemory = (userId, audit) => {
  const existing = getMemoryAudits(userId).filter((item) => item.id !== audit.id);
  const updated = [audit, ...existing];
  memoryAuditStore.set(userId, updated);
  return audit;
};

const getMemoryAudit = (userId, auditId) =>
  getMemoryAudits(userId).find((audit) => audit.id === auditId) || null;

const removeAuditFromMemory = (userId, auditId) => {
  const existing = getMemoryAudits(userId);
  if (existing.length === 0) {
    return false;
  }
  const remaining = existing.filter((audit) => audit.id !== auditId);
  memoryAuditStore.set(userId, remaining);
  return remaining.length !== existing.length;
};

const clampScore = (value) => Math.max(45, Math.min(95, Math.round(value)));

function generateMockAuditResults(url) {
  const normalizedUrl = url.trim().toLowerCase();
  const hashSeed = normalizedUrl
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);
  const baseScore = 70 + Math.sin(hashSeed) * 10;

  const scoreFor = (offset) => clampScore(baseScore + Math.sin(hashSeed + offset) * 12);

  const scores = {
    overall_score: clampScore(baseScore),
    meta_score: scoreFor(1),
    content_score: scoreFor(2),
    technical_score: scoreFor(3),
    mobile_score: scoreFor(4),
    performance_score: scoreFor(5),
    security_score: scoreFor(6),
    accessibility_score: scoreFor(7),
  };

  const recommendations = [
    {
      category: 'meta',
      priority: 'high',
      title: 'Improve page titles',
      description:
        'Ensure each page has a unique, keyword-focused title under 60 characters to improve relevance and click-through rates.',
      impact: 8,
      effort: 3,
    },
    {
      category: 'content',
      priority: 'medium',
      title: 'Add structured headings',
      description:
        'Use descriptive H2 and H3 headings to increase readability and help search engines understand the content hierarchy.',
      impact: 7,
      effort: 4,
    },
    {
      category: 'performance',
      priority: 'low',
      title: 'Optimize image assets',
      description:
        'Compress hero and gallery images and serve WebP where supported to reduce Largest Contentful Paint time.',
      impact: 6,
      effort: 4,
    },
  ];

  return {
    status: 'completed',
    ...scores,
    recommendations,
  };
}

function mapAuditRecord(record, fallbackResults = null, source = 'database') {
  if (!record && !fallbackResults) {
    return null;
  }

  const results = {
    ...(fallbackResults || {}),
    ...(record?.results || {}),
  };

  const url = record?.content_url || record?.url || results.url || '';
  const scores = {
    overall_score: record?.seo_score ?? results.overall_score ?? results.scores?.overall ?? 0,
    meta_score: record?.meta_score ?? results.meta_score ?? results.scores?.meta ?? 0,
    content_score: record?.content_score ?? results.content_score ?? results.scores?.content ?? 0,
    technical_score:
      record?.technical_score ?? results.technical_score ?? results.scores?.technical ?? 0,
    mobile_score: record?.mobile_score ?? results.mobile_score ?? results.scores?.mobile ?? 0,
    performance_score:
      record?.performance_score ?? results.performance_score ?? results.scores?.performance ?? 0,
    security_score:
      record?.security_score ?? results.security_score ?? results.scores?.security ?? 0,
    accessibility_score:
      record?.accessibility_score ??
      results.accessibility_score ??
      results.scores?.accessibility ??
      0,
  };

  const recommendations = Array.isArray(results.recommendations)
    ? results.recommendations
    : fallbackResults?.recommendations || [];

  return {
    id: record?.id || fallbackResults?.id || randomUUID(),
    url,
    ...scores,
    recommendations,
    status: record?.status || results.status || 'completed',
    created_at: record?.created_at || fallbackResults?.created_at || new Date().toISOString(),
    source,
  };
}

/**
 * Create new SEO audit
 * @route POST /api/audits
 */
export async function createAudit(req, res) {
  let submittedUrl = '';
  try {
    const supabase = req.supabase || createClient();
    const userId = req.user.id;
    const { url } = req.body;

    submittedUrl = typeof url === 'string' ? url : '';

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

    const createdAt = new Date().toISOString();
    const mockResults = generateMockAuditResults(url);

    const { data: audit, error: insertError } = await supabase
      .from('seo_analyses')
      .insert({
        user_id: userId,
        content_url: url.trim(),
        analysis_type: 'seo_audit',
        results: {
          ...mockResults,
          url: url.trim(),
        },
        seo_score: mockResults.overall_score,
        ai_provider: 'placeholder',
        created_at: createdAt,
      })
      .select('id, user_id, content_url, results, seo_score, created_at')
      .single();

    if (insertError) {
      console.error('Error creating audit (falling back to memory store):', insertError);

      const fallbackRecord = mapAuditRecord(
        {
          id: randomUUID(),
          content_url: url.trim(),
          seo_score: mockResults.overall_score,
          created_at: createdAt,
          status: 'completed',
        },
        {
          ...mockResults,
          url: url.trim(),
          created_at: createdAt,
        },
        'memory'
      );

      saveAuditToMemory(userId, fallbackRecord);

      try {
        await usageTracker.logUsage(userId, 'audit', {
          audit_id: fallbackRecord.id,
          url,
          source: 'memory',
        });
      } catch (usageError) {
        console.error('Error logging usage (memory fallback):', usageError);
      }

      return res.status(201).json({
        success: true,
        data: fallbackRecord,
        meta: {
          persisted: false,
          source: 'memory',
          reason: insertError?.message,
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

    return res.status(201).json({
      success: true,
      data: mapAuditRecord(audit, mockResults, 'database'),
    });
  } catch (error) {
    console.error('Create audit error:', error);
    const userId = req.user?.id;
    const trimmedUrl = submittedUrl.trim();

    if (userId && trimmedUrl) {
      const createdAt = new Date().toISOString();
      const mockResults = generateMockAuditResults(trimmedUrl);
      const fallbackRecord = mapAuditRecord(
        {
          id: randomUUID(),
          content_url: trimmedUrl,
          seo_score: mockResults.overall_score,
          created_at: createdAt,
          status: 'completed',
        },
        {
          ...mockResults,
          url: trimmedUrl,
          created_at: createdAt,
        },
        'memory'
      );

      saveAuditToMemory(userId, fallbackRecord);

      try {
        await usageTracker.logUsage(userId, 'audit', {
          audit_id: fallbackRecord.id,
          url: trimmedUrl,
          source: 'memory',
        });
      } catch (usageError) {
        console.error('Error logging usage (memory fallback catch):', usageError);
      }

      return res.status(201).json({
        success: true,
        data: fallbackRecord,
        meta: {
          persisted: false,
          source: 'memory',
          reason: error?.message,
        },
      });
    }

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
    const supabase = req.supabase || createClient();
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

    const { data: audit, error } = await supabase
      .from('seo_analyses')
      .select('id, content_url, seo_score, results, created_at, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !audit) {
      const memoryAudit = getMemoryAudit(userId, id);
      if (memoryAudit) {
        return res.json({
          success: true,
          data: memoryAudit,
        });
      }

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
      data: mapAuditRecord(audit, null, 'database'),
    });
  } catch (error) {
    console.error('Get audit error:', error);
    const memoryAudit = getMemoryAudit(req.user?.id, req.params.id);
    if (memoryAudit) {
      return res.json({
        success: true,
        data: memoryAudit,
      });
    }
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
    const supabase = req.supabase || createClient();
    const userId = req.user.id;

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 per page
    const sortParam = (req.query.sort || 'created_at').toLowerCase();
    const order = req.query.order === 'asc' ? 'asc' : 'desc';

    const sortFieldMap = {
      created_at: 'created_at',
      updated_at: 'created_at',
      url: 'content_url',
      content_url: 'content_url',
      overall_score: 'seo_score',
      seo_score: 'seo_score',
    };

    const sortColumn = sortFieldMap[sortParam];
    if (!sortColumn) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SORT_FIELD',
          message: 'Sort field is not supported',
        },
      });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    const { count, error: countError } = await supabase
      .from('seo_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: audits, error } = await supabase
      .from('seo_analyses')
      .select('id, content_url, seo_score, results, created_at, status')
      .eq('user_id', userId)
      .order(sortColumn, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error || countError) {
      console.error('Error listing audits:', error || countError);

      const memoryAudits = getMemoryAudits(userId);
      if (memoryAudits.length > 0) {
        return res.json({
          success: true,
          data: memoryAudits,
          meta: {
            page: 1,
            limit: memoryAudits.length,
            total: memoryAudits.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            source: 'memory',
          },
        });
      }

      return res.json({
        success: true,
        data: [],
        meta: {
          page: 1,
          limit,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          source: 'fallback',
          reason: error?.message || countError?.message || 'Database unavailable',
        },
      });
    }

    const mappedDbAudits = (audits || []).map((audit) => mapAuditRecord(audit));
    const memoryAudits = page === 1 ? getMemoryAudits(userId) : [];

    const combinedAudits = [...memoryAudits, ...mappedDbAudits].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const responseData = combinedAudits.slice(0, limit);
    const totalRecords = (count || 0) + (page === 1 ? memoryAudits.length : 0);
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    return res.json({
      success: true,
      data: responseData,
      meta: {
        page,
        limit,
        total: totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('List audits error:', error);
    const memoryAudits = getMemoryAudits(req.user?.id);
    if (memoryAudits && memoryAudits.length > 0) {
      return res.json({
        success: true,
        data: memoryAudits,
        meta: {
          page: 1,
          limit: memoryAudits.length,
          total: memoryAudits.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          source: 'memory',
        },
      });
    }
    return res.json({
      success: true,
      data: [],
      meta: {
        page: 1,
        limit: parseInt(req.query?.limit) || 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        source: 'fallback',
        reason: error?.message || 'Unexpected error (handled)',
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
    const supabase = req.supabase || createClient();
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
      const removedFromMemory = removeAuditFromMemory(userId, id);
      if (removedFromMemory) {
        return res.json({
          success: true,
          data: {
            message: 'Audit successfully deleted',
            deleted_id: id,
            source: 'memory',
          },
        });
      }

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

    removeAuditFromMemory(userId, id);

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
