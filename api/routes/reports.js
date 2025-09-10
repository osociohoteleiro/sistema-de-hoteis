const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const XLSX = require('xlsx');
const moment = require('moment');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const pdfGenerator = require('../services/pdfGenerator');

const router = express.Router();

// Configuração do multer para upload de arquivos
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use .xlsx, .xls ou .csv'), false);
    }
  }
});

// Schema de validação para importação
const importReportSchema = Joi.object({
  hotel_uuid: Joi.string().uuid().required(),
  report_name: Joi.string().min(3).max(255).required(),
  report_type: Joi.string().valid('META_ADS', 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'GENERAL').default('META_ADS'),
  period_start: Joi.date().iso().optional(),
  period_end: Joi.date().iso().optional()
});

// POST /api/reports/import - Importar arquivo do Meta
router.post('/import', authenticateToken, upload.single('report_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Arquivo obrigatório'
      });
    }

    // Validar dados do formulário
    const { error, value } = importReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    const { hotel_uuid, report_name, report_type, period_start, period_end } = value;

    // Verificar se o usuário tem acesso ao hotel
    let hotelAccess;
    
    if (req.user.user_type === 'ADMIN' || req.user.user_type === 'SUPER' || req.user.user_type === 'SUPER_ADMIN') {
      // Admins e Super admins têm acesso a qualquer hotel
      hotelAccess = await db.query(`
        SELECT h.id, h.hotel_nome 
        FROM hotels h
        WHERE h.hotel_uuid = $1
      `, [hotel_uuid]);
    } else {
      // Usuários normais precisam ter acesso específico
      hotelAccess = await db.query(`
        SELECT h.id, h.hotel_nome 
        FROM hotels h
        INNER JOIN user_hotels uh ON h.id = uh.hotel_id
        WHERE h.hotel_uuid = $1 
        AND uh.user_id = $2 AND uh.active = true
      `, [hotel_uuid, req.user.id]);
    }


    if (hotelAccess.length === 0) {
      return res.status(403).json({
        error: 'Acesso negado a este hotel'
      });
    }

    // Processar arquivo Excel/CSV
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({
        error: 'Planilha vazia ou sem dados válidos'
      });
    }

    // Processar dados do Meta
    const processedData = processMetaData(jsonData);
    
    // Calcular métricas resumo
    const summaryMetrics = {
      totalImpressions: processedData.summary.totalImpressions,
      totalClicks: processedData.summary.totalClicks,
      totalConversions: processedData.summary.totalConversions,
      totalCost: processedData.summary.totalCost,
      averageCTR: processedData.summary.ctr,
      averageCPC: processedData.summary.cpc,
      averageCPM: processedData.summary.cpm,
      totalCampaigns: processedData.campaigns.length,
      topCampaignByCost: processedData.campaigns[0]?.name || null,
      importDate: new Date().toISOString(),
      rowsProcessed: jsonData.length
    };

    // Informações do arquivo
    const fileInfo = {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadDate: new Date().toISOString()
    };

    // Salvar no banco de dados
    const result = await db.query(`
      INSERT INTO manual_reports (
        hotel_uuid, report_name, report_type, report_period_start, report_period_end,
        meta_data, file_info, summary_metrics, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      hotel_uuid,
      report_name,
      report_type,
      period_start || null,
      period_end || null,
      JSON.stringify(processedData),
      JSON.stringify(fileInfo),
      JSON.stringify(summaryMetrics),
      req.user.id
    ]);

    res.status(201).json({
      success: true,
      message: 'Relatório importado com sucesso',
      data: {
        report_id: result.insertId,
        hotel_name: hotelAccess[0].hotel_nome,
        summary: summaryMetrics,
        campaigns_count: processedData.campaigns.length
      }
    });

  } catch (error) {
    console.error('Erro ao importar relatório:', error);
    
    if (error.message.includes('Tipo de arquivo')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/reports/hotel/:uuid - Listar relatórios de um hotel
router.get('/hotel/:uuid', authenticateToken, async (req, res) => {
  try {
    const hotelUuid = req.params.uuid;
    
    // Verificar acesso ao hotel
    let hotelAccess;
    
    if (req.user.user_type === 'ADMIN' || req.user.user_type === 'SUPER' || req.user.user_type === 'SUPER_ADMIN') {
      // Admins e Super admins têm acesso a qualquer hotel
      hotelAccess = await db.query(`
        SELECT h.id, h.hotel_nome 
        FROM hotels h
        WHERE h.hotel_uuid = $1
      `, [hotelUuid]);
    } else {
      // Usuários normais precisam ter acesso específico
      hotelAccess = await db.query(`
        SELECT h.id, h.hotel_nome 
        FROM hotels h
        INNER JOIN user_hotels uh ON h.id = uh.hotel_id
        WHERE h.hotel_uuid = $1 
        AND uh.user_id = $2 AND uh.active = true
      `, [hotelUuid, req.user.id]);
    }

    if (hotelAccess.length === 0) {
      return res.status(403).json({
        error: 'Acesso negado a este hotel'
      });
    }

    // Buscar relatórios
    const reports = await db.query(`
      SELECT 
        r.id, r.report_name, r.report_type, r.report_period_start, 
        r.report_period_end, r.summary_metrics, r.created_at,
        u.name as created_by_name
      FROM manual_reports r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.hotel_uuid = $1 AND r.status = 'ACTIVE'
      ORDER BY r.created_at DESC
    `, [hotelUuid]);

    // Processar summary_metrics para cada relatório
    const processedReports = reports.map(report => {
      let summary_metrics = typeof report.summary_metrics === 'string' 
        ? JSON.parse(report.summary_metrics) 
        : report.summary_metrics;

      // Normalizar summary_metrics para camelCase (mesmo código da rota individual)
      if (summary_metrics) {
        const normalizedSummary = {
          totalImpressions: summary_metrics.total_impressions || summary_metrics.totalImpressions || 0,
          totalClicks: summary_metrics.total_clicks || summary_metrics.totalClicks || 0,
          totalConversions: summary_metrics.total_conversions || summary_metrics.totalConversions || 0,
          totalCost: summary_metrics.total_spend || summary_metrics.totalCost || 0,
          averageCTR: parseFloat((summary_metrics.avg_ctr || summary_metrics.averageCTR || 0).toFixed(2)),
          averageCPC: parseFloat((summary_metrics.avg_cpc || summary_metrics.averageCPC || 0).toFixed(2)),
          conversionRate: parseFloat((summary_metrics.conversion_rate || summary_metrics.conversionRate || 0).toFixed(2))
        };
        summary_metrics = normalizedSummary;
      }

      return {
        ...report,
        summary_metrics
      };
    });

    res.json({
      success: true,
      hotel: {
        uuid: hotelUuid,
        name: hotelAccess[0].hotel_nome
      },
      reports: processedReports
    });

  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/reports/manual - Criar relatório manual
router.post('/manual', authenticateToken, async (req, res) => {
  try {
    // Schema de validação para relatório manual
    const manualReportSchema = Joi.object({
      hotel_uuid: Joi.string().uuid().required(),
      report_name: Joi.string().min(3).max(255).required(),
      report_type: Joi.string().valid('META_ADS', 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'GENERAL').default('META_ADS'),
      period_start: Joi.date().iso().required(),
      period_end: Joi.date().iso().required(),
      meta_data: Joi.object({
        campaigns: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            impressions: Joi.number().min(0).default(0),
            clicks: Joi.number().min(0).default(0),
            conversions: Joi.number().min(0).default(0),
            cost: Joi.number().min(0).default(0),
            ctr: Joi.number().min(0).default(0),
            cpc: Joi.number().min(0).default(0)
          })
        ).min(1).required(),
        period: Joi.object({
          start: Joi.date().iso().required(),
          end: Joi.date().iso().required()
        }).required(),
        created_manually: Joi.boolean().default(true)
      }).required(),
      summary_metrics: Joi.object({
        totalImpressions: Joi.number().min(0).required(),
        totalClicks: Joi.number().min(0).required(),
        totalConversions: Joi.number().min(0).required(),
        totalCost: Joi.number().min(0).required(),
        averageCTR: Joi.alternatives().try(Joi.number().min(0), Joi.string()).required(),
        averageCPC: Joi.alternatives().try(Joi.number().min(0), Joi.string()).required()
      }).required()
    });

    // Validar dados
    const { error, value } = manualReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    const { hotel_uuid, report_name, report_type, period_start, period_end, meta_data, summary_metrics } = value;

    // Verificar se o usuário tem acesso ao hotel
    let hotelAccess;
    
    if (req.user.user_type === 'ADMIN' || req.user.user_type === 'SUPER' || req.user.user_type === 'SUPER_ADMIN') {
      // Admins e Super admins têm acesso a qualquer hotel
      hotelAccess = await db.query(`
        SELECT h.id, h.hotel_nome 
        FROM hotels h
        WHERE h.hotel_uuid = $1
      `, [hotel_uuid]);
    } else {
      // Usuários normais precisam ter acesso específico
      hotelAccess = await db.query(`
        SELECT h.id, h.hotel_nome 
        FROM hotels h
        INNER JOIN user_hotels uh ON h.id = uh.hotel_id
        WHERE h.hotel_uuid = $1 
        AND uh.user_id = $2 AND uh.active = true
      `, [hotel_uuid, req.user.id]);
    }

    if (hotelAccess.length === 0) {
      return res.status(403).json({
        error: 'Acesso negado a este hotel'
      });
    }

    // Informações do arquivo (para compatibilidade)
    const fileInfo = {
      originalName: 'manual_input.json',
      size: JSON.stringify(meta_data).length,
      mimeType: 'application/json',
      uploadDate: new Date().toISOString(),
      isManual: true
    };

    // Adicionar informações adicionais às métricas
    const enhancedSummaryMetrics = {
      ...summary_metrics,
      totalCampaigns: meta_data.campaigns.length,
      topCampaignByCost: meta_data.campaigns.length > 0 ? 
        meta_data.campaigns.reduce((prev, current) => (prev.cost > current.cost) ? prev : current).name : null,
      importDate: new Date().toISOString(),
      rowsProcessed: meta_data.campaigns.length,
      createdManually: true
    };

    // Salvar no banco de dados
    const result = await db.query(`
      INSERT INTO manual_reports (
        hotel_uuid, report_name, report_type, report_period_start, report_period_end,
        meta_data, file_info, summary_metrics, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      hotel_uuid,
      report_name,
      report_type,
      period_start,
      period_end,
      JSON.stringify(meta_data),
      JSON.stringify(fileInfo),
      JSON.stringify(enhancedSummaryMetrics),
      req.user.id
    ]);

    res.status(201).json({
      success: true,
      message: 'Relatório manual criado com sucesso',
      report: {
        id: result.insertId,
        hotel_name: hotelAccess[0].hotel_nome,
        report_name,
        summary: enhancedSummaryMetrics,
        campaigns_count: meta_data.campaigns.length
      }
    });

  } catch (error) {
    console.error('Erro ao criar relatório manual:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/reports/:id - Buscar relatório específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    
    if (isNaN(reportId)) {
      return res.status(400).json({
        error: 'ID do relatório inválido'
      });
    }

    // Buscar relatório com verificação de acesso
    let query;
    let params;
    
    if (req.user.user_type === 'ADMIN' || req.user.user_type === 'SUPER' || req.user.user_type === 'SUPER_ADMIN') {
      query = `
        SELECT 
          r.*, 
          h.hotel_nome,
          u.name as created_by_name
        FROM manual_reports r
        INNER JOIN hotels h ON r.hotel_uuid = h.hotel_uuid
        LEFT JOIN users u ON r.created_by = u.id
        WHERE r.id = ? 
        AND r.status = 'ACTIVE'
      `;
      params = [reportId];
    } else {
      query = `
        SELECT 
          r.*, 
          h.hotel_nome,
          u.name as created_by_name
        FROM manual_reports r
        INNER JOIN hotels h ON r.hotel_uuid = h.hotel_uuid
        INNER JOIN user_hotels uh ON h.id = uh.hotel_id
        LEFT JOIN users u ON r.created_by = u.id
        WHERE r.id = ? 
        AND r.status = 'ACTIVE'
        AND uh.user_id = ? AND uh.active = true
      `;
      params = [reportId, req.user.id];
    }
    
    const [report] = await db.query(query, params);

    if (!report) {
      return res.status(404).json({
        error: 'Relatório não encontrado ou acesso negado'
      });
    }

    // Processar dados JSON
    let meta_data = typeof report.meta_data === 'string' ? JSON.parse(report.meta_data) : report.meta_data;
    let summary_metrics = typeof report.summary_metrics === 'string' ? JSON.parse(report.summary_metrics) : report.summary_metrics;

    // Normalizar estrutura de dados para compatibilidade frontend
    if (Array.isArray(meta_data)) {
      // Dados vindos do Meta API sync - converter array para formato esperado
      meta_data = {
        campaigns: meta_data.filter(item => item && typeof item === 'object')
      };
    }

    // Normalizar summary_metrics para camelCase
    if (summary_metrics) {
      const normalizedSummary = {
        totalImpressions: summary_metrics.total_impressions || summary_metrics.totalImpressions || 0,
        totalClicks: summary_metrics.total_clicks || summary_metrics.totalClicks || 0,
        totalConversions: summary_metrics.total_conversions || summary_metrics.totalConversions || 0,
        totalCost: summary_metrics.total_spend || summary_metrics.totalCost || 0,
        averageCTR: parseFloat((summary_metrics.avg_ctr || summary_metrics.averageCTR || 0).toFixed(2)),
        averageCPC: parseFloat((summary_metrics.avg_cpc || summary_metrics.averageCPC || 0).toFixed(2)),
        conversionRate: parseFloat((summary_metrics.conversion_rate || summary_metrics.conversionRate || 0).toFixed(2))
      };
      summary_metrics = normalizedSummary;
    }

    const processedReport = {
      ...report,
      meta_data,
      file_info: typeof report.file_info === 'string' ? JSON.parse(report.file_info) : report.file_info,
      summary_metrics
    };

    res.json({
      success: true,
      report: processedReport
    });

  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/reports/:id - Deletar relatório
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    
    if (isNaN(reportId)) {
      return res.status(400).json({
        error: 'ID do relatório inválido'
      });
    }

    // Verificar se existe e tem acesso
    let query;
    let params;
    
    if (req.user.user_type === 'ADMIN' || req.user.user_type === 'SUPER' || req.user.user_type === 'SUPER_ADMIN') {
      query = `
        SELECT r.id, r.hotel_uuid, h.hotel_nome
        FROM manual_reports r
        INNER JOIN hotels h ON r.hotel_uuid = h.hotel_uuid
        WHERE r.id = ? 
        AND r.status = 'ACTIVE'
      `;
      params = [reportId];
    } else {
      query = `
        SELECT r.id, r.hotel_uuid, h.hotel_nome
        FROM manual_reports r
        INNER JOIN hotels h ON r.hotel_uuid = h.hotel_uuid
        INNER JOIN user_hotels uh ON h.id = uh.hotel_id
        WHERE r.id = ? 
        AND r.status = 'ACTIVE'
        AND uh.user_id = ? AND uh.active = true
      `;
      params = [reportId, req.user.id];
    }
    
    const [report] = await db.query(query, params);

    if (!report) {
      return res.status(404).json({
        error: 'Relatório não encontrado ou acesso negado'
      });
    }

    // Marcar como deletado (soft delete)
    await db.query(`
      UPDATE manual_reports 
      SET status = 'DELETED', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [reportId]);

    res.json({
      success: true,
      message: 'Relatório deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/reports/:id/generate-pdf - Gerar PDF do relatório
router.post('/:id/generate-pdf', authenticateToken, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    
    if (isNaN(reportId)) {
      return res.status(400).json({
        error: 'ID do relatório inválido'
      });
    }

    // Buscar relatório com verificação de acesso
    let query;
    let params;
    
    if (req.user.user_type === 'ADMIN' || req.user.user_type === 'SUPER' || req.user.user_type === 'SUPER_ADMIN') {
      query = `
        SELECT 
          r.*, 
          h.hotel_nome, h.hotel_capa,
          u.name as created_by_name
        FROM manual_reports r
        INNER JOIN hotels h ON r.hotel_uuid = h.hotel_uuid
        LEFT JOIN users u ON r.created_by = u.id
        WHERE r.id = ? 
        AND r.status = 'ACTIVE'
      `;
      params = [reportId];
    } else {
      query = `
        SELECT 
          r.*, 
          h.hotel_nome, h.hotel_capa,
          u.name as created_by_name
        FROM manual_reports r
        INNER JOIN hotels h ON r.hotel_uuid = h.hotel_uuid
        INNER JOIN user_hotels uh ON h.id = uh.hotel_id
        LEFT JOIN users u ON r.created_by = u.id
        WHERE r.id = ? 
        AND r.status = 'ACTIVE'
        AND uh.user_id = ? AND uh.active = true
      `;
      params = [reportId, req.user.id];
    }
    
    const [report] = await db.query(query, params);

    if (!report) {
      return res.status(404).json({
        error: 'Relatório não encontrado ou acesso negado'
      });
    }

    // Processar dados JSON
    const reportData = {
      ...report,
      meta_data: typeof report.meta_data === 'string' ? JSON.parse(report.meta_data) : report.meta_data,
      file_info: typeof report.file_info === 'string' ? JSON.parse(report.file_info) : report.file_info,
      summary_metrics: typeof report.summary_metrics === 'string' ? JSON.parse(report.summary_metrics) : report.summary_metrics
    };

    const hotelData = {
      hotel_nome: report.hotel_nome,
      hotel_capa: report.hotel_capa
    };

    // Gerar PDF
    console.log('Iniciando geração de PDF para relatório:', reportId);
    console.log('Dados do relatório:', JSON.stringify(reportData, null, 2));
    console.log('Dados do hotel:', JSON.stringify(hotelData, null, 2));
    const pdfBuffer = await pdfGenerator.generateReportPDF(reportData, hotelData);

    // Configurar headers para download
    const filename = `relatorio_meta_${report.hotel_nome.replace(/[^a-zA-Z0-9]/g, '_')}_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Erro ao gerar PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Função para processar dados do Meta (movida do frontend)
function processMetaData(data) {
  // Mapear possíveis nomes de colunas do Meta
  const columnMappings = {
    campaign: ['campaign_name', 'nome_da_campanha', 'campanha', 'campaign', 'nome campanha'],
    impressions: ['impressions', 'impressoes', 'impressões', 'reach', 'alcance'],
    clicks: ['clicks', 'cliques', 'link_clicks'],
    ctr: ['ctr', 'taxa_clique', 'click_through_rate'],
    conversions: ['conversions', 'conversoes', 'conversões', 'results', 'resultados'],
    cost: ['spend', 'cost', 'custo', 'gasto', 'amount_spent'],
    cpc: ['cpc', 'cost_per_click', 'custo_por_clique'],
    cpm: ['cpm', 'cost_per_1000_impressions', 'custo_por_mil_impressoes']
  };

  // Função para encontrar a coluna correta
  const findColumn = (data, possibleNames) => {
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    for (const possible of possibleNames) {
      const found = columns.find(col => 
        col.toLowerCase().includes(possible.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  };

  // Identificar colunas
  const campaignCol = findColumn(data, columnMappings.campaign);
  const impressionsCol = findColumn(data, columnMappings.impressions);
  const clicksCol = findColumn(data, columnMappings.clicks);
  const ctrCol = findColumn(data, columnMappings.ctr);
  const conversionsCol = findColumn(data, columnMappings.conversions);
  const costCol = findColumn(data, columnMappings.cost);
  const cpcCol = findColumn(data, columnMappings.cpc);
  const cpmCol = findColumn(data, columnMappings.cpm);

  // Processar dados
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalCost = 0;
  const campaigns = [];

  data.forEach(row => {
    const impressions = parseFloat(row[impressionsCol]) || 0;
    const clicks = parseFloat(row[clicksCol]) || 0;
    const conversions = parseFloat(row[conversionsCol]) || 0;
    const cost = parseFloat(row[costCol]?.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

    totalImpressions += impressions;
    totalClicks += clicks;
    totalConversions += conversions;
    totalCost += cost;

    campaigns.push({
      name: row[campaignCol] || 'Sem nome',
      impressions,
      clicks,
      conversions,
      cost,
      ctr: clicks > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0,
      conversionRate: clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : 0,
      cpc: clicks > 0 ? (cost / clicks).toFixed(2) : 0,
      cpm: impressions > 0 ? ((cost / impressions) * 1000).toFixed(2) : 0
    });
  });

  // Calcular métricas gerais
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
  const overallConversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0;
  const overallCPC = totalClicks > 0 ? (totalCost / totalClicks).toFixed(2) : 0;
  const overallCPM = totalImpressions > 0 ? ((totalCost / totalImpressions) * 1000).toFixed(2) : 0;

  return {
    summary: {
      totalImpressions,
      totalClicks,
      totalConversions,
      totalCost,
      ctr: overallCTR,
      conversionRate: overallConversionRate,
      cpc: overallCPC,
      cpm: overallCPM
    },
    campaigns: campaigns.sort((a, b) => b.cost - a.cost),
    columnMapping: {
      campaign: campaignCol,
      impressions: impressionsCol,
      clicks: clicksCol,
      conversions: conversionsCol,
      cost: costCol
    }
  };
}

module.exports = router;