const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const router = express.Router();

// Schema de validação para site
const siteSchema = Joi.object({
  hotel_id: Joi.number().integer().positive(),
  template_id: Joi.number().integer().positive().required(),
  name: Joi.string().min(1).max(255).required(),
  subdomain: Joi.string().min(3).max(100).pattern(/^[a-z0-9-]+$/).required(),
  custom_domain: Joi.string().max(255).allow(''),
  description: Joi.string().max(1000).allow(''),
  content: Joi.object().default({}),
  settings: Joi.object().default({}),
  seo_title: Joi.string().max(255).allow(''),
  seo_description: Joi.string().max(500).allow(''),
  seo_keywords: Joi.string().max(500).allow(''),
  seo_config: Joi.object().default({}),
  analytics_config: Joi.object().default({}),
  plan_type: Joi.string().valid('free', 'basic', 'premium').default('free')
});

// Listar sites
router.get('/', async (req, res) => {
  try {
    const { hotel_id, published, plan_type, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT hs.*, st.name as template_name, st.category as template_category,
             h.name as hotel_name
      FROM hotel_sites hs
      LEFT JOIN site_templates st ON hs.template_id = st.id
      LEFT JOIN hotels h ON hs.hotel_id = h.id
      WHERE 1=1
    `;
    const params = [];
    
    if (hotel_id) {
      query += ' AND hs.hotel_id = $' + (params.length + 1);
      params.push(hotel_id);
    }
    
    if (published !== undefined) {
      query += ' AND hs.published = $' + (params.length + 1);
      params.push(published === 'true');
    }
    
    if (plan_type) {
      query += ' AND hs.plan_type = $' + (params.length + 1);
      params.push(plan_type);
    }
    
    query += ' ORDER BY hs.created_at DESC';
    
    // Paginação
    const offset = (page - 1) * limit;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const sites = await db.query(query, params);
    
    // Contar total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM hotel_sites hs
      WHERE 1=1
    `;
    const countParams = [];
    
    if (hotel_id) {
      countQuery += ' AND hs.hotel_id = $' + (countParams.length + 1);
      countParams.push(hotel_id);
    }
    
    if (published !== undefined) {
      countQuery += ' AND hs.published = $' + (countParams.length + 1);
      countParams.push(published === 'true');
    }
    
    if (plan_type) {
      countQuery += ' AND hs.plan_type = $' + (countParams.length + 1);
      countParams.push(plan_type);
    }
    
    const totalResult = await db.query(countQuery, countParams);
    const total = totalResult[0].total;
    
    res.json({
      success: true,
      data: sites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar sites:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar site por ID ou UUID
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let query;
    let param;
    
    if (identifier.includes('-')) {
      // É UUID
      query = `
        SELECT hs.*, st.name as template_name, st.category as template_category,
               st.html_structure, st.css_styles, st.default_content,
               h.name as hotel_name, h.email as hotel_email, h.phone as hotel_phone
        FROM hotel_sites hs
        LEFT JOIN site_templates st ON hs.template_id = st.id
        LEFT JOIN hotels h ON hs.hotel_id = h.id
        WHERE hs.site_uuid = $1
      `;
      param = identifier;
    } else {
      // É ID numérico
      query = `
        SELECT hs.*, st.name as template_name, st.category as template_category,
               st.html_structure, st.css_styles, st.default_content,
               h.name as hotel_name, h.email as hotel_email, h.phone as hotel_phone
        FROM hotel_sites hs
        LEFT JOIN site_templates st ON hs.template_id = st.id
        LEFT JOIN hotels h ON hs.hotel_id = h.id
        WHERE hs.id = $1
      `;
      param = parseInt(identifier);
    }
    
    const sites = await db.query(query, [param]);
    
    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: sites[0]
    });
    
  } catch (error) {
    console.error('Erro ao buscar site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar site por subdomínio
router.get('/subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const sites = await db.query(`
      SELECT hs.*, st.name as template_name, st.category as template_category,
             st.html_structure, st.css_styles, st.default_content, st.features,
             h.name as hotel_name, h.email as hotel_email, h.phone as hotel_phone,
             h.address as hotel_address, h.website as hotel_website
      FROM hotel_sites hs
      LEFT JOIN site_templates st ON hs.template_id = st.id
      LEFT JOIN hotels h ON hs.hotel_id = h.id
      WHERE hs.subdomain = $1 AND hs.active = true
    `, [subdomain]);
    
    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado ou inativo'
      });
    }
    
    res.json({
      success: true,
      data: sites[0]
    });
    
  } catch (error) {
    console.error('Erro ao buscar site por subdomínio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Criar novo site
router.post('/', async (req, res) => {
  try {
    const { error, value } = siteSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details.map(d => d.message)
      });
    }
    
    const {
      hotel_id,
      template_id,
      name,
      subdomain,
      custom_domain,
      description,
      content,
      settings,
      seo_title,
      seo_description,
      seo_keywords,
      seo_config,
      analytics_config,
      plan_type
    } = value;
    
    // Verificar se o template existe
    const templates = await db.query('SELECT id FROM site_templates WHERE id = $1 AND is_active = true', [template_id]);
    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado ou inativo'
      });
    }
    
    // Verificar se o hotel existe (se hotel_id foi fornecido)
    if (hotel_id) {
      const hotels = await db.query('SELECT id FROM hotels WHERE id = $1', [hotel_id]);
      if (hotels.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Hotel não encontrado'
        });
      }
    }
    
    // Verificar se o subdomínio já existe
    const existingSubdomain = await db.query('SELECT id FROM hotel_sites WHERE subdomain = $1', [subdomain]);
    if (existingSubdomain.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Subdomínio já está em uso'
      });
    }
    
    const result = await db.query(`
      INSERT INTO hotel_sites 
      (site_uuid, hotel_id, template_id, name, subdomain, custom_domain, description, 
       content, settings, seo_title, seo_description, seo_keywords, seo_config, 
       analytics_config, plan_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *
    `, [
      uuidv4(),
      hotel_id,
      template_id,
      name,
      subdomain,
      custom_domain,
      description,
      JSON.stringify(content),
      JSON.stringify(settings),
      seo_title,
      seo_description,
      seo_keywords,
      JSON.stringify(seo_config),
      JSON.stringify(analytics_config),
      plan_type
    ]);
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Site criado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao criar site:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Subdomínio ou domínio customizado já está em uso'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar site
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do site é obrigatório e deve ser um número'
      });
    }
    
    const { error, value } = siteSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details.map(d => d.message)
      });
    }
    
    const {
      hotel_id,
      template_id,
      name,
      subdomain,
      custom_domain,
      description,
      content,
      settings,
      seo_title,
      seo_description,
      seo_keywords,
      seo_config,
      analytics_config,
      plan_type
    } = value;
    
    // Verificar se o subdomínio já existe (excluindo o site atual)
    const existingSubdomain = await db.query('SELECT id FROM hotel_sites WHERE subdomain = $1 AND id != $2', [subdomain, id]);
    if (existingSubdomain.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Subdomínio já está em uso'
      });
    }
    
    const result = await db.query(`
      UPDATE hotel_sites 
      SET hotel_id = $2, template_id = $3, name = $4, subdomain = $5, 
          custom_domain = $6, description = $7, content = $8, settings = $9,
          seo_title = $10, seo_description = $11, seo_keywords = $12, 
          seo_config = $13, analytics_config = $14, plan_type = $15, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id,
      hotel_id,
      template_id,
      name,
      subdomain,
      custom_domain,
      description,
      JSON.stringify(content),
      JSON.stringify(settings),
      seo_title,
      seo_description,
      seo_keywords,
      JSON.stringify(seo_config),
      JSON.stringify(analytics_config),
      plan_type
    ]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result[0],
      message: 'Site atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Publicar/despublicar site
router.patch('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do site é obrigatório e deve ser um número'
      });
    }
    
    const result = await db.query(`
      UPDATE hotel_sites 
      SET published = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, published]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result[0],
      message: `Site ${published ? 'publicado' : 'despublicado'} com sucesso`
    });
    
  } catch (error) {
    console.error('Erro ao alterar status de publicação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar site
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do site é obrigatório e deve ser um número'
      });
    }
    
    const result = await db.query('DELETE FROM hotel_sites WHERE id = $1 RETURNING *', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Site excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Verificar disponibilidade de subdomínio
router.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    // Validar formato do subdomínio
    if (!/^[a-z0-9-]+$/.test(subdomain) || subdomain.length < 3) {
      return res.json({
        success: true,
        available: false,
        error: 'Subdomínio deve ter pelo menos 3 caracteres e conter apenas letras minúsculas, números e hífens'
      });
    }
    
    const existing = await db.query('SELECT id FROM hotel_sites WHERE subdomain = $1', [subdomain]);
    
    res.json({
      success: true,
      available: existing.length === 0,
      subdomain: subdomain
    });
    
  } catch (error) {
    console.error('Erro ao verificar subdomínio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;