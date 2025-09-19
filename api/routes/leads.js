const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/leads/:workspaceUuid
 * Listar todos os contatos (leads) de uma workspace
 */
router.get('/:workspaceUuid', async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const { limit = 100, search = '' } = req.query;

    console.log(`👥 Buscando leads para workspace: ${workspaceUuid}`);
    console.log('🔍 Query includes ID field - check logs for response');

    // Query para buscar contatos de todas as instâncias vinculadas à workspace
    let query = `
      SELECT DISTINCT
        c.id,
        c.phone_number,
        c.contact_name,
        c.profile_pic_url,
        c.last_message_at,
        c.message_count,
        c.unread_count,
        c.is_blocked,
        c.instance_name,
        wi.custom_name as instance_custom_name,
        m.content as last_message_content,
        m.message_type as last_message_type,
        m.direction as last_message_direction,
        c.created_at,
        c.updated_at,
        c.description,
        c.lead_status,
        c.lead_source,
        c.assigned_to,
        c.notes,
        c.custom_fields
      FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      LEFT JOIN whatsapp_messages m ON (
        c.instance_name = m.instance_name
        AND c.phone_number = m.phone_number
        AND m.timestamp = c.last_message_at
      )
      WHERE wi.workspace_uuid = $1
        AND c.phone_number NOT LIKE '%@g.us'
        AND LENGTH(c.phone_number) <= 15
        AND c.phone_number ~ '^[0-9]+$'
    `;

    const queryParams = [workspaceUuid];

    // Adicionar filtro de busca se fornecido
    if (search.trim()) {
      query += ` AND (
        c.contact_name ILIKE $${queryParams.length + 1}
        OR c.phone_number ILIKE $${queryParams.length + 1}
      )`;
      queryParams.push(`%${search.trim()}%`);
    }

    query += `
      ORDER BY c.last_message_at DESC NULLS LAST
      LIMIT $${queryParams.length + 1}
    `;
    queryParams.push(parseInt(limit));

    const leads = await db.query(query, queryParams);

    // Buscar tags para cada lead
    if (leads.length > 0) {
      const leadIds = leads.map(lead => lead.id);
      const tagsQuery = `
        SELECT
          lta.lead_id,
          lt.id as tag_id,
          lt.name as tag_name,
          lt.color as tag_color
        FROM lead_tag_assignments lta
        INNER JOIN lead_tags lt ON lta.tag_id = lt.id
        WHERE lta.lead_id = ANY($1)
      `;

      const tagsResult = await db.query(tagsQuery, [leadIds]);

      // Agrupar tags por lead_id
      const tagsByLead = {};
      tagsResult.forEach(tag => {
        if (!tagsByLead[tag.lead_id]) {
          tagsByLead[tag.lead_id] = [];
        }
        tagsByLead[tag.lead_id].push({
          id: tag.tag_id,
          name: tag.tag_name,
          color: tag.tag_color
        });
      });

      // Adicionar tags a cada lead
      leads.forEach(lead => {
        lead.tags = tagsByLead[lead.id] || [];
      });
    }

    // Contar total de leads da workspace
    let countQuery = `
      SELECT COUNT(DISTINCT c.phone_number) as total
      FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      WHERE wi.workspace_uuid = $1
        AND c.phone_number NOT LIKE '%@g.us'
        AND LENGTH(c.phone_number) <= 15
        AND c.phone_number ~ '^[0-9]+$'
    `;

    const countParams = [workspaceUuid];

    if (search.trim()) {
      countQuery += ` AND (
        c.contact_name ILIKE $2
        OR c.phone_number ILIKE $2
      )`;
      countParams.push(`%${search.trim()}%`);
    }

    const totalResult = await db.query(countQuery, countParams);
    const total = parseInt(totalResult[0]?.total || 0);

    // Contar total de mensagens não lidas
    const unreadQuery = `
      SELECT SUM(c.unread_count) as total_unread
      FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      WHERE wi.workspace_uuid = $1
        AND c.phone_number NOT LIKE '%@g.us'
        AND LENGTH(c.phone_number) <= 15
        AND c.phone_number ~ '^[0-9]+$'
    `;

    const unreadResult = await db.query(unreadQuery, [workspaceUuid]);
    const totalUnread = parseInt(unreadResult[0]?.total_unread || 0);

    console.log(`👥 Encontrados ${leads.length} leads (${total} total) para workspace ${workspaceUuid}`);

    res.json({
      success: true,
      data: {
        leads,
        summary: {
          total,
          totalUnread,
          showing: leads.length,
          hasSearch: !!search.trim()
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar leads:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/leads/:workspaceUuid/summary
 * Obter resumo dos leads da workspace
 */
router.get('/:workspaceUuid/summary', async (req, res) => {
  try {
    const { workspaceUuid } = req.params;

    console.log(`📊 Buscando resumo de leads para workspace: ${workspaceUuid}`);

    // Buscar estatísticas dos leads
    const summaryQuery = `
      SELECT
        COUNT(DISTINCT c.phone_number) as total_leads,
        SUM(c.unread_count) as total_unread,
        SUM(c.message_count) as total_messages,
        COUNT(DISTINCT c.instance_name) as instances_with_contacts,
        COUNT(DISTINCT CASE WHEN c.last_message_at >= NOW() - INTERVAL '24 hours' THEN c.phone_number END) as active_today,
        COUNT(DISTINCT CASE WHEN c.last_message_at >= NOW() - INTERVAL '7 days' THEN c.phone_number END) as active_week
      FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      WHERE wi.workspace_uuid = $1
        AND c.phone_number NOT LIKE '%@g.us'
        AND LENGTH(c.phone_number) <= 15
        AND c.phone_number ~ '^[0-9]+$'
    `;

    const summaryResult = await db.query(summaryQuery, [workspaceUuid]);
    const summary = summaryResult[0] || {};

    // Buscar top 5 leads mais ativos
    const topLeadsQuery = `
      SELECT
        c.phone_number,
        c.contact_name,
        c.message_count,
        c.unread_count,
        c.last_message_at,
        c.instance_name,
        wi.custom_name as instance_custom_name
      FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      WHERE wi.workspace_uuid = $1
        AND c.phone_number NOT LIKE '%@g.us'
        AND LENGTH(c.phone_number) <= 15
        AND c.phone_number ~ '^[0-9]+$'
      ORDER BY c.message_count DESC, c.last_message_at DESC
      LIMIT 5
    `;

    const topLeads = await db.query(topLeadsQuery, [workspaceUuid]);

    res.json({
      success: true,
      data: {
        summary: {
          totalLeads: parseInt(summary.total_leads || 0),
          totalUnread: parseInt(summary.total_unread || 0),
          totalMessages: parseInt(summary.total_messages || 0),
          instancesWithContacts: parseInt(summary.instances_with_contacts || 0),
          activeToday: parseInt(summary.active_today || 0),
          activeWeek: parseInt(summary.active_week || 0)
        },
        topLeads
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar resumo de leads:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/leads/:workspaceUuid
 * Criar um novo lead manualmente
 */
router.post('/:workspaceUuid', async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const {
      phone_number,
      contact_name,
      description,
      lead_status = 'NEW',
      lead_source = 'MANUAL',
      assigned_to,
      notes,
      custom_fields = {},
      tags = [],
      instance_name
    } = req.body;

    console.log(`📝 Criando lead manual para workspace: ${workspaceUuid}`);

    // Validações básicas
    if (!phone_number) {
      return res.status(400).json({
        success: false,
        error: 'Número de telefone é obrigatório'
      });
    }

    if (!instance_name) {
      return res.status(400).json({
        success: false,
        error: 'Nome da instância é obrigatório'
      });
    }

    // Verificar se a instância pertence ao workspace
    const instanceCheck = await db.query(
      'SELECT id FROM workspace_instances WHERE workspace_uuid = $1 AND instance_name = $2',
      [workspaceUuid, instance_name]
    );

    if (instanceCheck.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Instância não encontrada neste workspace'
      });
    }

    // Verificar se o lead já existe
    const existingLead = await db.query(
      'SELECT id FROM whatsapp_contacts WHERE instance_name = $1 AND phone_number = $2',
      [instance_name, phone_number]
    );

    if (existingLead.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Lead já existe para este número e instância'
      });
    }

    // Criar o lead
    const leadResult = await db.query(`
      INSERT INTO whatsapp_contacts (
        instance_name, phone_number, contact_name, description,
        lead_status, lead_source, assigned_to, notes, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      instance_name, phone_number, contact_name, description,
      lead_status, lead_source, assigned_to, notes, JSON.stringify(custom_fields)
    ]);

    const lead = leadResult[0];

    // Adicionar tags se fornecidas
    if (tags.length > 0) {
      for (const tagId of tags) {
        await db.query(
          'INSERT INTO lead_tag_assignments (lead_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [lead.id, tagId]
        );
      }
    }

    console.log(`✅ Lead criado com sucesso: ${lead.id}`);

    res.json({
      success: true,
      data: { lead },
      message: 'Lead criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar lead:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * PUT /api/leads/:workspaceUuid/:leadId
 * Atualizar um lead existente
 */
router.put('/:workspaceUuid/:leadId', async (req, res) => {
  try {
    const { workspaceUuid, leadId } = req.params;
    const {
      contact_name,
      description,
      lead_status,
      lead_source,
      assigned_to,
      notes,
      custom_fields,
      tags = []
    } = req.body;

    console.log(`📝 Atualizando lead ${leadId} para workspace: ${workspaceUuid}`);

    // Verificar se o lead existe e pertence ao workspace
    const leadCheck = await db.query(`
      SELECT c.id FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      WHERE wi.workspace_uuid = $1 AND c.id = $2
    `, [workspaceUuid, leadId]);

    if (leadCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
    }

    // Atualizar o lead
    const updateResult = await db.query(`
      UPDATE whatsapp_contacts
      SET
        contact_name = COALESCE($1, contact_name),
        description = COALESCE($2, description),
        lead_status = COALESCE($3, lead_status),
        lead_source = COALESCE($4, lead_source),
        assigned_to = COALESCE($5, assigned_to),
        notes = COALESCE($6, notes),
        custom_fields = COALESCE($7::jsonb, custom_fields),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      contact_name, description, lead_status, lead_source,
      assigned_to, notes, custom_fields ? JSON.stringify(custom_fields) : null, leadId
    ]);

    // Atualizar tags
    // Primeiro, remover todas as tags existentes
    await db.query('DELETE FROM lead_tag_assignments WHERE lead_id = $1', [leadId]);

    // Adicionar as novas tags
    if (tags.length > 0) {
      for (const tagId of tags) {
        await db.query(
          'INSERT INTO lead_tag_assignments (lead_id, tag_id) VALUES ($1, $2)',
          [leadId, tagId]
        );
      }
    }

    console.log(`✅ Lead atualizado com sucesso: ${leadId}`);

    res.json({
      success: true,
      data: { lead: updateResult[0] },
      message: 'Lead atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar lead:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * DELETE /api/leads/:workspaceUuid/:leadId
 * Deletar um lead
 */
router.delete('/:workspaceUuid/:leadId', async (req, res) => {
  try {
    const { workspaceUuid, leadId } = req.params;

    console.log(`🗑️ Deletando lead ${leadId} do workspace: ${workspaceUuid}`);

    // Verificar se o lead existe e pertence ao workspace
    const leadCheck = await db.query(`
      SELECT c.id FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      WHERE wi.workspace_uuid = $1 AND c.id = $2
    `, [workspaceUuid, leadId]);

    if (leadCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
    }

    // Deletar o lead (as tags serão removidas automaticamente devido ao CASCADE)
    await db.query('DELETE FROM whatsapp_contacts WHERE id = $1', [leadId]);

    console.log(`✅ Lead deletado com sucesso: ${leadId}`);

    res.json({
      success: true,
      message: 'Lead deletado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar lead:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/leads/:workspaceUuid/tags
 * Listar tags do workspace
 */
router.get('/:workspaceUuid/tags', async (req, res) => {
  try {
    const { workspaceUuid } = req.params;

    console.log(`🏷️ Buscando tags para workspace: ${workspaceUuid}`);

    const tags = await db.query(
      'SELECT * FROM lead_tags WHERE workspace_uuid = $1 ORDER BY name ASC',
      [workspaceUuid]
    );

    res.json({
      success: true,
      data: { tags }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar tags:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/leads/:workspaceUuid/tags
 * Criar uma nova tag
 */
router.post('/:workspaceUuid/tags', async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const { name, color = '#3B82F6', description } = req.body;

    console.log(`🏷️ Criando tag para workspace: ${workspaceUuid}`);

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Nome da tag é obrigatório'
      });
    }

    const tagResult = await db.query(`
      INSERT INTO lead_tags (workspace_uuid, name, color, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [workspaceUuid, name.trim(), color, description]);

    res.json({
      success: true,
      data: { tag: tagResult[0] },
      message: 'Tag criada com sucesso'
    });

  } catch (error) {
    if (error.constraint === 'unique_workspace_tag_name') {
      return res.status(400).json({
        success: false,
        error: 'Uma tag com este nome já existe neste workspace'
      });
    }

    console.error('❌ Erro ao criar tag:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/leads/:workspaceUuid/custom-fields
 * Listar definições de campos personalizados do workspace
 */
router.get('/:workspaceUuid/custom-fields', async (req, res) => {
  try {
    const { workspaceUuid } = req.params;

    console.log(`📋 Buscando campos personalizados para workspace: ${workspaceUuid}`);

    const fields = await db.query(`
      SELECT * FROM lead_custom_field_definitions
      WHERE workspace_uuid = $1 AND active = true
      ORDER BY sort_order ASC, field_name ASC
    `, [workspaceUuid]);

    res.json({
      success: true,
      data: { fields }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar campos personalizados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/leads/:workspaceUuid/custom-fields
 * Criar uma nova definição de campo personalizado
 */
router.post('/:workspaceUuid/custom-fields', async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const {
      field_key,
      field_name,
      field_type = 'text',
      field_options,
      is_required = false,
      default_value,
      description,
      sort_order = 0
    } = req.body;

    console.log(`📋 Criando campo personalizado para workspace: ${workspaceUuid}`);

    if (!field_key || !field_name) {
      return res.status(400).json({
        success: false,
        error: 'Chave e nome do campo são obrigatórios'
      });
    }

    const fieldResult = await db.query(`
      INSERT INTO lead_custom_field_definitions (
        workspace_uuid, field_key, field_name, field_type,
        field_options, is_required, default_value, description, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      workspaceUuid, field_key, field_name, field_type,
      field_options ? JSON.stringify(field_options) : null,
      is_required, default_value, description, sort_order
    ]);

    res.json({
      success: true,
      data: { field: fieldResult[0] },
      message: 'Campo personalizado criado com sucesso'
    });

  } catch (error) {
    if (error.constraint === 'unique_workspace_field_key') {
      return res.status(400).json({
        success: false,
        error: 'Um campo com esta chave já existe neste workspace'
      });
    }

    console.error('❌ Erro ao criar campo personalizado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/leads/:workspaceUuid/:leadId/details
 * Obter detalhes de um lead específico pelo ID
 */
router.get('/:workspaceUuid/:leadId/details', async (req, res) => {
  try {
    const { workspaceUuid, leadId } = req.params;

    console.log(`🔍 Buscando detalhes do lead ${leadId} para workspace: ${workspaceUuid}`);

    // Query para buscar o lead específico
    const query = `
      SELECT DISTINCT
        c.id,
        c.phone_number,
        c.contact_name,
        c.profile_pic_url,
        c.last_message_at,
        c.message_count,
        c.unread_count,
        c.is_blocked,
        c.instance_name,
        wi.custom_name as instance_custom_name,
        c.created_at,
        c.updated_at,
        c.description,
        c.lead_status,
        c.lead_source,
        c.assigned_to,
        c.notes,
        c.custom_fields
      FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      WHERE wi.workspace_uuid = $1
        AND c.id = $2
        AND c.phone_number NOT LIKE '%@g.us'
        AND LENGTH(c.phone_number) <= 15
        AND c.phone_number ~ '^[0-9]+$'
    `;

    const leads = await db.query(query, [workspaceUuid, leadId]);

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
    }

    const lead = leads[0];

    // Buscar tags para o lead
    const tagsQuery = `
      SELECT
        lt.id as tag_id,
        lt.name as tag_name,
        lt.color as tag_color
      FROM lead_tag_assignments lta
      INNER JOIN lead_tags lt ON lta.tag_id = lt.id
      WHERE lta.lead_id = $1
    `;

    const tagsResult = await db.query(tagsQuery, [lead.id]);
    lead.tags = tagsResult.map(tag => ({
      id: tag.tag_id,
      name: tag.tag_name,
      color: tag.tag_color
    }));

    console.log(`✅ Lead encontrado: ${lead.contact_name || lead.phone_number}`);

    res.json({
      success: true,
      data: { lead },
      message: 'Lead encontrado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar detalhes do lead:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * 🚀 NOVO ENDPOINT: POST /api/leads/:workspaceUuid/:leadId/sync-whatsapp
 * Sincronizar dados do lead com Evolution API (atualizar foto de perfil e nome)
 */
router.post('/:workspaceUuid/:leadId/sync-whatsapp', async (req, res) => {
  try {
    const { workspaceUuid, leadId } = req.params;

    console.log(`🔄 Sincronizando dados do WhatsApp para lead ${leadId}`);

    // Verificar se o lead existe e obter informações básicas
    const leadQuery = await db.query(`
      SELECT c.id, c.instance_name, c.phone_number, c.contact_name, c.profile_picture_url, c.last_sync_at
      FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      WHERE wi.workspace_uuid = $1 AND c.id = $2
    `, [workspaceUuid, leadId]);

    if (leadQuery.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
    }

    const lead = leadQuery[0];
    const { instance_name, phone_number } = lead;

    // Usar ContactsCacheService para buscar dados atualizados (respeitando rate limiting)
    const ContactsCacheService = require('../services/contactsCacheService');
    const cacheService = new ContactsCacheService();

    const contactInfo = await cacheService.getContactInfo(instance_name, phone_number);

    if (!contactInfo.success) {
      return res.status(400).json({
        success: false,
        error: contactInfo.error || 'Não foi possível obter dados do WhatsApp',
        rateLimited: contactInfo.rateLimited || false
      });
    }

    // Verificar se há dados novos para atualizar
    const newData = contactInfo.data;
    let hasUpdates = false;
    const updates = [];
    const updateValues = [];
    let paramCount = 1;

    // Verificar se o nome mudou
    if (newData.name && newData.name !== lead.contact_name) {
      updates.push(`contact_name = $${paramCount++}`);
      updateValues.push(newData.name);
      hasUpdates = true;
    }

    // Verificar se a foto mudou
    if (newData.picture && newData.picture !== lead.profile_picture_url) {
      updates.push(`profile_picture_url = $${paramCount++}`);
      updateValues.push(newData.picture);
      hasUpdates = true;
    }

    // Sempre atualizar o timestamp de sincronização
    updates.push(`last_sync_at = NOW()`);
    updateValues.push(leadId);

    let updatedLead = lead;

    if (hasUpdates || true) { // Sempre atualizar last_sync_at
      const updateQuery = `
        UPDATE whatsapp_contacts
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const updateResult = await db.query(updateQuery, updateValues);
      updatedLead = updateResult[0];

      console.log(`✅ Lead sincronizado: ${leadId}`, {
        nameUpdated: newData.name !== lead.contact_name,
        pictureUpdated: newData.picture !== lead.profile_picture_url,
        cached: contactInfo.cached
      });
    }

    res.json({
      success: true,
      data: {
        lead: updatedLead,
        changes: {
          nameUpdated: newData.name && newData.name !== lead.contact_name,
          pictureUpdated: newData.picture && newData.picture !== lead.profile_picture_url,
          lastSyncAt: updatedLead.last_sync_at
        },
        cached: contactInfo.cached,
        cacheAge: contactInfo.cacheAge
      },
      message: hasUpdates ? 'Dados atualizados com sucesso' : 'Dados já estão atualizados'
    });

  } catch (error) {
    console.error('❌ Erro ao sincronizar lead:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * 🚀 NOVO ENDPOINT: POST /api/leads/auto-sync-outdated
 * Sincronização automática de contatos com dados desatualizados
 */
router.post('/auto-sync-outdated', async (req, res) => {
  try {
    const { daysOld = 7, maxContacts = 50 } = req.body;

    console.log(`🔄 Iniciando sincronização automática de contatos antigos (>${daysOld} dias)`);

    // Buscar contatos que não foram sincronizados há X dias
    const outdatedContacts = await db.query(`
      SELECT
        c.id, c.instance_name, c.phone_number, c.contact_name,
        c.profile_picture_url, c.last_sync_at,
        wi.workspace_uuid,
        EXTRACT(EPOCH FROM (NOW() - COALESCE(c.last_sync_at, c.created_at))) / 86400 as days_old
      FROM whatsapp_contacts c
      INNER JOIN workspace_instances wi ON c.instance_name = wi.instance_name
      WHERE
        (c.last_sync_at IS NULL OR c.last_sync_at < NOW() - INTERVAL '${daysOld} days')
        AND c.phone_number NOT LIKE '%@g.us'
        AND LENGTH(c.phone_number) BETWEEN 8 AND 15
      ORDER BY COALESCE(c.last_sync_at, c.created_at) ASC
      LIMIT $1
    `, [maxContacts]);

    if (outdatedContacts.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum contato precisa de sincronização',
        data: {
          processed: 0,
          updated: 0,
          errors: 0
        }
      });
    }

    console.log(`📋 Encontrados ${outdatedContacts.length} contatos para sincronização`);

    // Processar contatos em lotes para evitar sobrecarga
    const ContactsCacheService = require('../services/contactsCacheService');
    const cacheService = new ContactsCacheService();

    const results = {
      processed: 0,
      updated: 0,
      errors: 0,
      details: []
    };

    for (let i = 0; i < outdatedContacts.length; i++) {
      const contact = outdatedContacts[i];

      try {
        console.log(`🔄 Processando ${i + 1}/${outdatedContacts.length}: ${contact.phone_number}`);

        // Usar ContactsCacheService para buscar dados atualizados
        const contactInfo = await cacheService.getContactInfo(contact.instance_name, contact.phone_number);

        if (contactInfo.success && contactInfo.data) {
          const newData = contactInfo.data;
          let hasUpdates = false;
          const updates = [];
          const updateValues = [];
          let paramCount = 1;

          // Verificar se o nome mudou
          if (newData.name && newData.name !== contact.contact_name) {
            updates.push(`contact_name = $${paramCount++}`);
            updateValues.push(newData.name);
            hasUpdates = true;
          }

          // Verificar se a foto mudou
          if (newData.picture && newData.picture !== contact.profile_picture_url) {
            updates.push(`profile_picture_url = $${paramCount++}`);
            updateValues.push(newData.picture);
            hasUpdates = true;
          }

          // Sempre atualizar timestamp de sincronização
          updates.push(`last_sync_at = NOW()`);
          updateValues.push(contact.id);

          if (updates.length > 0) {
            const updateQuery = `
              UPDATE whatsapp_contacts
              SET ${updates.join(', ')}
              WHERE id = $${paramCount}
            `;

            await db.query(updateQuery, updateValues);

            if (hasUpdates) {
              results.updated++;
              console.log(`✅ Contato atualizado: ${contact.phone_number}`);
            }
          }

          results.details.push({
            phone_number: contact.phone_number,
            instance_name: contact.instance_name,
            nameUpdated: newData.name && newData.name !== contact.contact_name,
            pictureUpdated: newData.picture && newData.picture !== contact.profile_picture_url,
            daysOld: Math.round(contact.days_old),
            cached: contactInfo.cached
          });

        } else if (contactInfo.rateLimited) {
          console.log(`⏳ Rate limited para ${contact.phone_number}, pulando`);
          results.details.push({
            phone_number: contact.phone_number,
            instance_name: contact.instance_name,
            error: 'Rate limited',
            daysOld: Math.round(contact.days_old)
          });
        } else {
          console.log(`❌ Erro ao sincronizar ${contact.phone_number}: ${contactInfo.error}`);
          results.errors++;
          results.details.push({
            phone_number: contact.phone_number,
            instance_name: contact.instance_name,
            error: contactInfo.error,
            daysOld: Math.round(contact.days_old)
          });
        }

        results.processed++;

        // Delay entre requisições para respeitar rate limits (apenas se não veio do cache)
        if (!contactInfo.cached && i < outdatedContacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
        }

      } catch (error) {
        console.error(`❌ Erro ao processar contato ${contact.phone_number}:`, error);
        results.errors++;
        results.details.push({
          phone_number: contact.phone_number,
          instance_name: contact.instance_name,
          error: error.message,
          daysOld: Math.round(contact.days_old)
        });
      }
    }

    console.log(`✅ Sincronização automática concluída:`, {
      processed: results.processed,
      updated: results.updated,
      errors: results.errors
    });

    res.json({
      success: true,
      message: `Sincronização concluída: ${results.updated} contatos atualizados de ${results.processed} processados`,
      data: results
    });

  } catch (error) {
    console.error('❌ Erro na sincronização automática:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

module.exports = router;