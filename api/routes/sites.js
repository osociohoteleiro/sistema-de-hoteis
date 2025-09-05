const express = require('express');
const Joi = require('joi');
const { authenticateToken, requireRole } = require('../middleware/auth');
const Site = require('../models/Site');
const SitePage = require('../models/SitePage');
const SiteTheme = require('../models/SiteTheme');
const Hotel = require('../models/Hotel');

const router = express.Router();

// Validation schemas
const siteSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  hotel_id: Joi.number().integer().optional(),
  subdomain: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9-]+$/).required(),
  custom_domain: Joi.string().optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
  theme_id: Joi.number().integer().optional(),
  settings: Joi.object().optional(),
  seo_title: Joi.string().optional().allow(null, ''),
  seo_description: Joi.string().optional().allow(null, ''),
  seo_keywords: Joi.string().optional().allow(null, ''),
  seo_config: Joi.object().optional(),
  plan_type: Joi.string().valid('STARTER', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE').default('STARTER')
});

const updateSiteSchema = Joi.object({
  subdomain: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9-]+$/).optional(),
  custom_domain: Joi.string().optional().allow(null, ''),
  theme_id: Joi.number().integer().optional(),
  settings: Joi.object().optional(),
  seo_config: Joi.object().optional(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'MAINTENANCE').optional(),
  plan_type: Joi.string().valid('STARTER', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE').optional()
}).min(1);

// GET /api/sites - List all sites (admin) or user sites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, plan_type, hotel_id } = req.query;
    const offset = (page - 1) * limit;

    let sites;
    if (req.user.user_type === 'SUPER_ADMIN' || req.user.user_type === 'ADMIN') {
      // Admin sees all sites
      const filters = { search, status, plan_type };
      if (hotel_id) filters.hotel_id = hotel_id;
      sites = await Site.findAll(filters);
    } else {
      // User sees only their hotel sites
      const userHotels = await Hotel.findByUser(req.user.id);
      const hotelIds = userHotels.map(h => h.id);
      
      sites = [];
      for (const hotelId of hotelIds) {
        const hotelSites = await Site.findByHotel(hotelId, { status, plan_type });
        sites.push(...hotelSites);
      }
      
      // Apply search filter
      if (search) {
        sites = sites.filter(site => 
          site.subdomain?.includes(search) || 
          site.custom_domain?.includes(search)
        );
      }
    }

    res.json({
      success: true,
      sites,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: sites.length
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

// GET /api/sites/:id - Get site by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    
    if (isNaN(siteId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do site inválido'
      });
    }

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }

    // Check if user has access to this site
    if (req.user.user_type !== 'SUPER_ADMIN' && req.user.user_type !== 'ADMIN') {
      const userHotels = await Hotel.findByUser(req.user.id);
      const hotelIds = userHotels.map(h => h.id);
      
      if (!hotelIds.includes(site.hotel_id)) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a este site'
        });
      }
    }

    // Get additional site data
    const [hotel, theme, pages] = await Promise.all([
      site.getHotel(),
      site.getTheme(),
      site.getPages({ limit: 10 })
    ]);

    res.json({
      success: true,
      site: {
        ...site,
        hotel: hotel ? {
          id: hotel.id,
          name: hotel.name,
          cover_image: hotel.cover_image
        } : null,
        theme: theme ? {
          id: theme.id,
          name: theme.name,
          category: theme.category,
          thumbnail_url: theme.thumbnail_url
        } : null,
        pages_count: pages.length,
        homepage: pages.find(p => p.is_homepage) || null
      }
    });

  } catch (error) {
    console.error('Erro ao buscar site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/sites - Create new site
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = siteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    let { hotel_id, subdomain, custom_domain, theme_id, settings, seo_config, plan_type, name, description, seo_title, seo_description, seo_keywords } = value;

    // Se hotel_id não foi fornecido, atribuir automaticamente
    if (!hotel_id) {
      if (req.user.user_type === 'SUPER_ADMIN' || req.user.user_type === 'ADMIN') {
        // Para admin/super admin, pegar o primeiro hotel disponível
        const firstHotel = await Hotel.query().first();
        if (!firstHotel) {
          return res.status(400).json({
            success: false,
            error: 'Nenhum hotel encontrado no sistema'
          });
        }
        hotel_id = firstHotel.id;
      } else {
        // Para usuários normais, pegar o primeiro hotel do usuário
        const userHotels = await Hotel.findByUser(req.user.id);
        if (userHotels.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Usuário não possui hotéis associados'
          });
        }
        hotel_id = userHotels[0].id;
      }
    } else {
      // Check if user has access to this hotel (quando hotel_id foi fornecido)
      if (req.user.user_type !== 'SUPER_ADMIN' && req.user.user_type !== 'ADMIN') {
        const userHotels = await Hotel.findByUser(req.user.id);
        const hotelIds = userHotels.map(h => h.id);
        
        if (!hotelIds.includes(hotel_id)) {
          return res.status(403).json({
            success: false,
            error: 'Acesso negado a este hotel'
          });
        }
      }
    }

    // Validate subdomain
    if (!Site.validateSubdomain(subdomain)) {
      return res.status(400).json({
        success: false,
        error: 'Subdomínio inválido. Use apenas letras, números e hífens (3-50 caracteres)'
      });
    }

    // Check if subdomain is already in use
    const existingSubdomain = await Site.findBySubdomain(subdomain);
    if (existingSubdomain) {
      return res.status(409).json({
        success: false,
        error: 'Este subdomínio já está em uso'
      });
    }

    // Check if custom domain is already in use
    if (custom_domain) {
      if (!Site.validateDomain(custom_domain)) {
        return res.status(400).json({
          success: false,
          error: 'Domínio personalizado inválido'
        });
      }
      
      const existingDomain = await Site.findByCustomDomain(custom_domain);
      if (existingDomain) {
        return res.status(409).json({
          success: false,
          error: 'Este domínio já está em uso'
        });
      }
    }

    // Verify hotel exists
    const hotel = await Hotel.findById(hotel_id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }

    // Verify theme exists if provided
    if (theme_id) {
      const theme = await SiteTheme.findById(theme_id);
      if (!theme) {
        return res.status(404).json({
          success: false,
          error: 'Tema não encontrado'
        });
      }
    }

    // Create site
    const site = new Site({
      hotel_id,
      name: name || hotel.name,
      subdomain,
      custom_domain,
      description: description || `Site oficial do ${hotel.name}`,
      theme_id,
      settings: settings || {},
      seo_title: seo_title || name || hotel.name,
      seo_description: seo_description || description || `Site oficial do ${hotel.name}`,
      seo_keywords: seo_keywords || 'hotel, hospedagem, reservas',
      seo_config: seo_config || {
        title: seo_title || name || hotel.name,
        description: seo_description || description || `Site oficial do ${hotel.name}`,
        keywords: seo_keywords || 'hotel, hospedagem, reservas'
      },
      plan_type: plan_type || 'STARTER',
      published: false,
      active: true
    });

    await site.save();

    // Create default homepage
    const homepage = new SitePage({
      site_id: site.id,
      title: `Bem-vindo ao ${hotel.name}`,
      slug: 'home',
      is_homepage: true,
      template: 'homepage',
      status: 'PUBLISHED',
      content_blocks: [
        {
          id: 'hero_1',
          type: 'hero',
          data: {
            title: `Bem-vindo ao ${hotel.name}`,
            subtitle: 'Sua experiência de hospedagem perfeita começa aqui',
            background_image: hotel.cover_image || '',
            cta_text: 'Reserve Agora',
            cta_link: '/reservas'
          },
          position: 0
        }
      ]
    });

    await homepage.save();

    res.status(201).json({
      success: true,
      message: 'Site criado com sucesso',
      site
    });

  } catch (error) {
    console.error('Erro ao criar site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/sites/:id - Update site
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    
    if (isNaN(siteId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do site inválido'
      });
    }

    const { error, value } = updateSiteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }

    // Check if user has access to this site
    if (req.user.user_type !== 'SUPER_ADMIN' && req.user.user_type !== 'ADMIN') {
      const userHotels = await Hotel.findByUser(req.user.id);
      const hotelIds = userHotels.map(h => h.id);
      
      if (!hotelIds.includes(site.hotel_id)) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a este site'
        });
      }
    }

    // Validate subdomain if changing
    if (value.subdomain && value.subdomain !== site.subdomain) {
      if (!Site.validateSubdomain(value.subdomain)) {
        return res.status(400).json({
          success: false,
          error: 'Subdomínio inválido'
        });
      }

      const existingSubdomain = await Site.findBySubdomain(value.subdomain);
      if (existingSubdomain) {
        return res.status(409).json({
          success: false,
          error: 'Este subdomínio já está em uso'
        });
      }
    }

    // Validate custom domain if changing
    if (value.custom_domain !== undefined && value.custom_domain !== site.custom_domain) {
      if (value.custom_domain && !Site.validateDomain(value.custom_domain)) {
        return res.status(400).json({
          success: false,
          error: 'Domínio personalizado inválido'
        });
      }

      if (value.custom_domain) {
        const existingDomain = await Site.findByCustomDomain(value.custom_domain);
        if (existingDomain) {
          return res.status(409).json({
            success: false,
            error: 'Este domínio já está em uso'
          });
        }
      }
    }

    // Verify theme exists if changing
    if (value.theme_id && value.theme_id !== site.theme_id) {
      const theme = await SiteTheme.findById(value.theme_id);
      if (!theme) {
        return res.status(404).json({
          success: false,
          error: 'Tema não encontrado'
        });
      }
    }

    // Update site properties
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        site[key] = value[key];
      }
    });

    await site.save();

    res.json({
      success: true,
      message: 'Site atualizado com sucesso',
      site
    });

  } catch (error) {
    console.error('Erro ao atualizar site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/sites/:id/publish - Publish site
router.post('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }

    // Check access
    if (req.user.user_type !== 'SUPER_ADMIN' && req.user.user_type !== 'ADMIN') {
      const userHotels = await Hotel.findByUser(req.user.id);
      const hotelIds = userHotels.map(h => h.id);
      
      if (!hotelIds.includes(site.hotel_id)) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a este site'
        });
      }
    }

    // Check if site has at least one page
    const pages = await site.getPages({ status: 'PUBLISHED' });
    if (pages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Site deve ter pelo menos uma página publicada'
      });
    }

    await site.publish();

    res.json({
      success: true,
      message: 'Site publicado com sucesso',
      site
    });

  } catch (error) {
    console.error('Erro ao publicar site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/sites/:id/unpublish - Unpublish site
router.post('/:id/unpublish', authenticateToken, async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }

    // Check access
    if (req.user.user_type !== 'SUPER_ADMIN' && req.user.user_type !== 'ADMIN') {
      const userHotels = await Hotel.findByUser(req.user.id);
      const hotelIds = userHotels.map(h => h.id);
      
      if (!hotelIds.includes(site.hotel_id)) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a este site'
        });
      }
    }

    await site.unpublish();

    res.json({
      success: true,
      message: 'Site despublicado com sucesso',
      site
    });

  } catch (error) {
    console.error('Erro ao despublicar site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/sites/:id - Delete site
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    
    if (isNaN(siteId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do site inválido'
      });
    }

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }

    await site.delete();

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

// GET /api/sites/:id/pages - Get site pages
router.get('/:id/pages', authenticateToken, async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    const { status, is_homepage, template, search, limit } = req.query;
    
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }

    // Check access
    if (req.user.user_type !== 'SUPER_ADMIN' && req.user.user_type !== 'ADMIN') {
      const userHotels = await Hotel.findByUser(req.user.id);
      const hotelIds = userHotels.map(h => h.id);
      
      if (!hotelIds.includes(site.hotel_id)) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a este site'
        });
      }
    }

    const filters = {};
    if (status) filters.status = status;
    if (is_homepage !== undefined) filters.is_homepage = is_homepage === 'true';
    if (template) filters.template = template;
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit);

    const pages = await site.getPages(filters);

    res.json({
      success: true,
      pages
    });

  } catch (error) {
    console.error('Erro ao buscar páginas do site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/sites/:id/analytics - Get site analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    const { start_date, end_date } = req.query;
    
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site não encontrado'
      });
    }

    // Check access
    if (req.user.user_type !== 'SUPER_ADMIN' && req.user.user_type !== 'ADMIN') {
      const userHotels = await Hotel.findByUser(req.user.id);
      const hotelIds = userHotels.map(h => h.id);
      
      if (!hotelIds.includes(site.hotel_id)) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a este site'
        });
      }
    }

    const analytics = await site.getAnalytics(start_date, end_date);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Erro ao buscar analytics do site:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;