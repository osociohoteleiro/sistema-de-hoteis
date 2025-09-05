const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const router = express.Router();

// Schema de validação para template
const templateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  category: Joi.string().valid('luxury', 'boutique', 'business', 'beach', 'resort', 'urban', 'eco').required(),
  description: Joi.string().max(1000),
  preview_image: Joi.string().uri().allow(''),
  html_structure: Joi.object().required(),
  css_styles: Joi.object().required(),
  default_content: Joi.object().required(),
  features: Joi.array().items(Joi.string()).default([]),
  is_premium: Joi.boolean().default(false),
  price: Joi.number().min(0).default(0)
});

// Listar todos os templates
router.get('/', async (req, res) => {
  try {
    const { category, is_premium, active } = req.query;
    
    let query = 'SELECT * FROM site_templates WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }
    
    if (is_premium !== undefined) {
      query += ' AND is_premium = $' + (params.length + 1);
      params.push(is_premium === 'true');
    }
    
    if (active !== undefined) {
      query += ' AND is_active = $' + (params.length + 1);
      params.push(active === 'true');
    }
    
    query += ' ORDER BY category, name';
    
    const templates = await db.query(query, params);
    
    res.json({
      success: true,
      data: templates,
      total: templates.length
    });
    
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar template por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do template é obrigatório e deve ser um número'
      });
    }
    
    const templates = await db.query('SELECT * FROM site_templates WHERE id = $1', [id]);
    
    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: templates[0]
    });
    
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Criar novo template (apenas para administradores)
router.post('/', async (req, res) => {
  try {
    const { error, value } = templateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details.map(d => d.message)
      });
    }
    
    const {
      name,
      category,
      description,
      preview_image,
      html_structure,
      css_styles,
      default_content,
      features,
      is_premium,
      price
    } = value;
    
    const result = await db.query(`
      INSERT INTO site_templates 
      (name, category, description, preview_image, html_structure, css_styles, default_content, features, is_premium, price, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `, [
      name,
      category,
      description,
      preview_image,
      JSON.stringify(html_structure),
      JSON.stringify(css_styles),
      JSON.stringify(default_content),
      JSON.stringify(features),
      is_premium,
      price
    ]);
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Template criado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao criar template:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Template com esse nome já existe'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do template é obrigatório e deve ser um número'
      });
    }
    
    const { error, value } = templateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details.map(d => d.message)
      });
    }
    
    const {
      name,
      category,
      description,
      preview_image,
      html_structure,
      css_styles,
      default_content,
      features,
      is_premium,
      price
    } = value;
    
    const result = await db.query(`
      UPDATE site_templates 
      SET name = $2, category = $3, description = $4, preview_image = $5, 
          html_structure = $6, css_styles = $7, default_content = $8, 
          features = $9, is_premium = $10, price = $11, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id,
      name,
      category,
      description,
      preview_image,
      JSON.stringify(html_structure),
      JSON.stringify(css_styles),
      JSON.stringify(default_content),
      JSON.stringify(features),
      is_premium,
      price
    ]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result[0],
      message: 'Template atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do template é obrigatório e deve ser um número'
      });
    }
    
    // Verificar se o template está sendo usado
    const sitesUsingTemplate = await db.query(
      'SELECT COUNT(*) as count FROM hotel_sites WHERE template_id = $1',
      [id]
    );
    
    if (sitesUsingTemplate[0].count > 0) {
      return res.status(409).json({
        success: false,
        error: 'Template não pode ser excluído pois está sendo usado por sites'
      });
    }
    
    const result = await db.query('DELETE FROM site_templates WHERE id = $1 RETURNING *', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Template excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Ativar/desativar template
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do template é obrigatório e deve ser um número'
      });
    }
    
    const result = await db.query(`
      UPDATE site_templates 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result[0],
      message: `Template ${result[0].is_active ? 'ativado' : 'desativado'} com sucesso`
    });
    
  } catch (error) {
    console.error('Erro ao alterar status do template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar templates por categoria
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const templates = await db.query(`
      SELECT * FROM site_templates 
      WHERE category = $1 AND is_active = true 
      ORDER BY is_premium DESC, name
    `, [category]);
    
    res.json({
      success: true,
      data: templates,
      total: templates.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar templates por categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar conteúdo customizado do template (para edição inline)
router.patch('/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do template é obrigatório e deve ser um número'
      });
    }
    
    if (!content || typeof content !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo é obrigatório e deve ser um objeto'
      });
    }
    
    // Buscar template atual
    const templates = await db.query('SELECT * FROM site_templates WHERE id = $1', [id]);
    
    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }
    
    const template = templates[0];
    const currentContent = template.default_content || {};
    
    // Mesclar conteúdo atual com as alterações
    const updatedContent = {
      ...currentContent,
      ...content
    };
    
    const result = await db.query(`
      UPDATE site_templates 
      SET default_content = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, JSON.stringify(updatedContent)]);
    
    res.json({
      success: true,
      data: result[0],
      message: 'Conteúdo atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar conteúdo do template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;