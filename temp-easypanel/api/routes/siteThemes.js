const express = require('express');
const Joi = require('joi');
const { authenticateToken, requireRole } = require('../middleware/auth');
const SiteTheme = require('../models/SiteTheme');

const router = express.Router();

// Validation schemas
const themeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  category: Joi.string().valid('luxury', 'resort', 'boutique', 'business', 'budget', 'eco', 'urban', 'beach').required(),
  thumbnail_url: Joi.string().uri().optional(),
  preview_url: Joi.string().uri().optional(),
  config: Joi.object().optional(),
  styles: Joi.object().optional(),
  components: Joi.array().items(Joi.string()).optional(),
  is_premium: Joi.boolean().default(false),
  price: Joi.number().min(0).default(0),
  active: Joi.boolean().default(true)
});

const updateThemeSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  category: Joi.string().valid('luxury', 'resort', 'boutique', 'business', 'budget', 'eco', 'urban', 'beach').optional(),
  thumbnail_url: Joi.string().uri().optional(),
  preview_url: Joi.string().uri().optional(),
  config: Joi.object().optional(),
  styles: Joi.object().optional(),
  components: Joi.array().items(Joi.string()).optional(),
  is_premium: Joi.boolean().optional(),
  price: Joi.number().min(0).optional(),
  active: Joi.boolean().optional()
}).min(1);

// GET /api/site-themes - List all themes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, is_premium, max_price, search, limit } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (is_premium !== undefined) filters.is_premium = is_premium === 'true';
    if (max_price) filters.max_price = parseFloat(max_price);
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit);

    const themes = await SiteTheme.findAll(filters);

    res.json({
      success: true,
      themes
    });

  } catch (error) {
    console.error('Erro ao listar temas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/site-themes/categories - Get theme categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await SiteTheme.getCategories();

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/site-themes/free - Get free themes
router.get('/free', authenticateToken, async (req, res) => {
  try {
    const { category, limit } = req.query;
    
    const filters = { is_premium: false };
    if (category) filters.category = category;
    if (limit) filters.limit = parseInt(limit);

    const themes = await SiteTheme.findAll(filters);

    res.json({
      success: true,
      themes
    });

  } catch (error) {
    console.error('Erro ao buscar temas gratuitos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/site-themes/premium - Get premium themes
router.get('/premium', authenticateToken, async (req, res) => {
  try {
    const { category, max_price, limit } = req.query;
    
    const filters = { is_premium: true };
    if (category) filters.category = category;
    if (max_price) filters.max_price = parseFloat(max_price);
    if (limit) filters.limit = parseInt(limit);

    const themes = await SiteTheme.findAll(filters);

    res.json({
      success: true,
      themes
    });

  } catch (error) {
    console.error('Erro ao buscar temas premium:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/site-themes/:id - Get theme by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    if (isNaN(themeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do tema inválido'
      });
    }

    const theme = await SiteTheme.findById(themeId);
    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Tema não encontrado'
      });
    }

    // Get usage statistics
    const usageCount = await theme.getUsageCount();
    const sitesUsingTheme = await theme.getSitesUsingTheme();

    res.json({
      success: true,
      theme: {
        ...theme.toObject(),
        usage_count: usageCount,
        sites: sitesUsingTheme.slice(0, 5) // Only show first 5 sites
      }
    });

  } catch (error) {
    console.error('Erro ao buscar tema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/site-themes - Create new theme (Admin only)
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { error, value } = themeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    // Check if theme name already exists
    const existingTheme = await SiteTheme.findByName(value.name);
    if (existingTheme) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um tema com esse nome'
      });
    }

    // Additional validation
    const validationErrors = SiteTheme.validateThemeData(value);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationErrors.join(', ')
      });
    }

    const theme = new SiteTheme(value);
    await theme.save();

    res.status(201).json({
      success: true,
      message: 'Tema criado com sucesso',
      theme
    });

  } catch (error) {
    console.error('Erro ao criar tema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/site-themes/:id - Update theme (Admin only)
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    if (isNaN(themeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do tema inválido'
      });
    }

    const { error, value } = updateThemeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const theme = await SiteTheme.findById(themeId);
    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Tema não encontrado'
      });
    }

    // Check if new name already exists (if changing name)
    if (value.name && value.name !== theme.name) {
      const existingTheme = await SiteTheme.findByName(value.name);
      if (existingTheme) {
        return res.status(409).json({
          success: false,
          error: 'Já existe um tema com esse nome'
        });
      }
    }

    // Additional validation
    const validationErrors = SiteTheme.validateThemeData({ ...theme.toObject(), ...value });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationErrors.join(', ')
      });
    }

    // Update theme properties
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        theme[key] = value[key];
      }
    });

    await theme.save();

    res.json({
      success: true,
      message: 'Tema atualizado com sucesso',
      theme
    });

  } catch (error) {
    console.error('Erro ao atualizar tema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/site-themes/:id/clone - Clone theme
router.post('/:id/clone', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const { name, customizations } = req.body;
    
    if (isNaN(themeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do tema inválido'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome do novo tema é obrigatório'
      });
    }

    const originalTheme = await SiteTheme.findById(themeId);
    if (!originalTheme) {
      return res.status(404).json({
        success: false,
        error: 'Tema original não encontrado'
      });
    }

    // Check if new name already exists
    const existingTheme = await SiteTheme.findByName(name);
    if (existingTheme) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um tema com esse nome'
      });
    }

    const clonedTheme = await originalTheme.clone(name, customizations || {});

    res.status(201).json({
      success: true,
      message: 'Tema clonado com sucesso',
      theme: clonedTheme
    });

  } catch (error) {
    console.error('Erro ao clonar tema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/site-themes/:id/activate - Activate theme
router.post('/:id/activate', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    const theme = await SiteTheme.findById(themeId);
    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Tema não encontrado'
      });
    }

    await theme.activate();

    res.json({
      success: true,
      message: 'Tema ativado com sucesso',
      theme
    });

  } catch (error) {
    console.error('Erro ao ativar tema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/site-themes/:id/deactivate - Deactivate theme
router.post('/:id/deactivate', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    const theme = await SiteTheme.findById(themeId);
    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Tema não encontrado'
      });
    }

    await theme.deactivate();

    res.json({
      success: true,
      message: 'Tema desativado com sucesso',
      theme
    });

  } catch (error) {
    console.error('Erro ao desativar tema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/site-themes/:id - Delete theme (Admin only)
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    if (isNaN(themeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do tema inválido'
      });
    }

    const theme = await SiteTheme.findById(themeId);
    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Tema não encontrado'
      });
    }

    try {
      await theme.delete();
      
      res.json({
        success: true,
        message: 'Tema excluído com sucesso'
      });
    } catch (deleteError) {
      if (deleteError.message.includes('being used by sites')) {
        return res.status(400).json({
          success: false,
          error: 'Não é possível excluir tema que está sendo usado por sites. Desative o tema ao invés de excluí-lo.'
        });
      }
      throw deleteError;
    }

  } catch (error) {
    console.error('Erro ao excluir tema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/site-themes/:id/sites - Get sites using this theme
router.get('/:id/sites', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    
    const theme = await SiteTheme.findById(themeId);
    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Tema não encontrado'
      });
    }

    const sites = await theme.getSitesUsingTheme();

    res.json({
      success: true,
      sites
    });

  } catch (error) {
    console.error('Erro ao buscar sites que usam o tema:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/site-themes/create-defaults - Create default themes (Admin only)
router.post('/create-defaults', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const createdThemes = await SiteTheme.createDefaultThemes();

    res.json({
      success: true,
      message: `${createdThemes.length} temas padrão criados com sucesso`,
      themes: createdThemes
    });

  } catch (error) {
    console.error('Erro ao criar temas padrão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;