/**
 * Reports Controller
 * Handles report generation (PDF, CSV exports)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate PDF report for an audit
 * POST /api/reports/pdf
 */
export async function generatePDF(req, res) {
  try {
    const { audit_id, report_type = 'technical' } = req.body;
    const userId = req.user.id;

    // Validation
    if (!audit_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_AUDIT_ID',
          message: 'Audit ID is required',
        },
      });
    }

    // Verify audit ownership
    const { data: audit, error: auditError } = await supabase
      .from('seo_analyses')
      .select('*')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
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

    // PLACEHOLDER: jsPDF integration (Phase 3)
    // For now, return mock PDF generation response
    // In Phase 3, integrate: npm install jspdf, generate real PDF with charts
    const mockPDFData = {
      report_id: `report_${Date.now()}`,
      audit_id,
      report_type,
      generated_at: new Date().toISOString(),
      download_url: `https://example.com/reports/${audit_id}.pdf`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Store report generation record
    const { data: _reportRecord, error: reportError } = await supabase
      .from('report_history')
      .insert({
        user_id: userId,
        audit_id,
        report_type: 'pdf',
        report_format: report_type,
        file_url: mockPDFData.download_url,
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error storing report history:', reportError);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...mockPDFData,
        message:
          'PDF generation placeholder. Real implementation in Phase 3 with jsPDF.',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate PDF report',
      },
    });
  }
}

/**
 * Generate CSV export of audit data
 * POST /api/reports/csv
 */
export async function generateCSV(req, res) {
  try {
    const { audit_id, include_keywords = true } = req.body;
    const userId = req.user.id;

    // Validation
    if (!audit_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_AUDIT_ID',
          message: 'Audit ID is required',
        },
      });
    }

    // Verify audit ownership
    const { data: audit, error: auditError } = await supabase
      .from('seo_analyses')
      .select('*')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
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

    // Fetch keywords if requested
    let keywords = [];
    if (include_keywords) {
      const { data: keywordData } = await supabase
        .from('keywords')
        .select('*')
        .eq('audit_id', audit_id)
        .order('opportunity_score', { ascending: false });

      keywords = keywordData || [];
    }

    // Generate CSV data
    const csvData = generateCSVContent(audit, keywords);

    // Store report generation record
    await supabase.from('report_history').insert({
      user_id: userId,
      audit_id,
      report_type: 'csv',
      report_format: 'csv',
      file_url: null, // CSV returned inline
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-${audit_id}-${Date.now()}.csv"`
    );

    return res.status(200).send(csvData);
  } catch (error) {
    console.error('Error generating CSV:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate CSV export',
      },
    });
  }
}

/**
 * Get report generation history for user
 * GET /api/reports/history
 */
export async function getReportHistory(req, res) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { data: reports, error } = await supabase
      .from('report_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching report history:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch report history',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        reports: reports || [],
        total: reports?.length || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error getting report history:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch report history',
      },
    });
  }
}

/**
 * Generate CSV content from audit and keywords data
 */
function generateCSVContent(audit, keywords) {
  let csv = '';

  // Audit Summary Section
  csv += 'AUDIT SUMMARY\n';
  csv += `URL,${audit.target_url || 'N/A'}\n`;
  csv += `Overall Score,${audit.overall_score || 0}\n`;
  csv += `Meta Score,${audit.meta_score || 0}\n`;
  csv += `Content Score,${audit.content_score || 0}\n`;
  csv += `Technical Score,${audit.technical_score || 0}\n`;
  csv += `Mobile Score,${audit.mobile_score || 0}\n`;
  csv += `Performance Score,${audit.performance_score || 0}\n`;
  csv += `Security Score,${audit.security_score || 0}\n`;
  csv += `Accessibility Score,${audit.accessibility_score || 0}\n`;
  csv += `Analysis Date,${audit.created_at}\n`;
  csv += '\n';

  // Recommendations Section
  if (audit.recommendations && audit.recommendations.length > 0) {
    csv += 'RECOMMENDATIONS\n';
    csv += 'Priority,Category,Title,Description,Impact,Effort\n';

    audit.recommendations.forEach((rec) => {
      csv += `${rec.priority || 'N/A'},${rec.category || 'N/A'},"${escapeCSV(rec.title || 'N/A')}","${escapeCSV(rec.description || 'N/A')}",${rec.impact || 0},${rec.effort || 0}\n`;
    });

    csv += '\n';
  }

  // Keywords Section
  if (keywords && keywords.length > 0) {
    csv += 'KEYWORDS\n';
    csv +=
      'Keyword,Search Volume,Competition,Difficulty Score,Opportunity Score,CPC\n';

    keywords.forEach((kw) => {
      csv += `"${escapeCSV(kw.keyword)}",${kw.search_volume || 0},${kw.competition || 'N/A'},${kw.difficulty_score || 0},${kw.opportunity_score || 0},${kw.cpc || 0}\n`;
    });

    csv += '\n';
  }

  return csv;
}

/**
 * Escape special characters for CSV format
 */
function escapeCSV(value) {
  if (!value) {
    return '';
  }
  return String(value).replace(/"/g, '""');
}
