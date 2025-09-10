const express = require('express');
const Joi = require('joi');
const { authenticateToken, requireRole } = require('../middleware/auth');
const AppConfiguration = require('../models/AppConfiguration');

const router = express.Router();

// Validação schemas
const appConfigSchema = Joi.object({
  app_title: Joi.string().min(1).max(255).required(),
  logo_url: Joi.string().uri().allow(null, ''),
  favicon_url: Joi.string().uri().allow(null, ''),
  description: Joi.string().max(1000).allow(null, ''),
  shared_from_app: Joi.string().valid(...AppConfiguration.VALID_APPS).allow(null),
  is_active: Joi.boolean().default(true)
});

const shareLogoSchema = Joi.object({
  source_app: Joi.string().valid(...AppConfiguration.VALID_APPS).required(),
  target_apps: Joi.array().items(Joi.string().valid(...AppConfiguration.VALID_APPS)).min(1).required()
});

// =============================================================================
// ROTAS PARA CONFIGURAÇÕES DE APLICAÇÕES
// =============================================================================

// GET /api/app-configurations - Listar todas as configurações por hotel
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { hotel_id } = req.query;
    
    let hotelIdToUse = null;
    
    if (hotel_id) {
      // Verificar se usuário tem acesso ao hotel
      if (req.user.user_type === 'HOTEL') {
        const userHotels = await req.user.getHotels();
        const hasAccess = userHotels.some(h => h.id == hotel_id);
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado ao hotel especificado'
          });
        }
      }
      hotelIdToUse = hotel_id;
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(403).json({
        error: 'Usuários do tipo HOTEL devem especificar hotel_id'
      });
    }

    const configurations = await AppConfiguration.getAppConfigurations(hotelIdToUse);

    res.json({ 
      configurations,
      available_apps: AppConfiguration.VALID_APPS
    });

  } catch (error) {
    console.error('Erro ao listar configurações de aplicações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/app-configurations/:appName - Buscar configuração específica de uma aplicação
router.get('/:appName', authenticateToken, async (req, res) => {
  try {
    const { appName } = req.params;
    const { hotel_id } = req.query;

    // Validar nome da aplicação
    if (!AppConfiguration.VALID_APPS.includes(appName)) {
      return res.status(400).json({
        error: 'Nome de aplicação inválido',
        valid_apps: AppConfiguration.VALID_APPS
      });
    }
    
    let hotelIdToUse = null;
    
    if (hotel_id) {
      // Verificar acesso ao hotel se especificado
      if (req.user.user_type === 'HOTEL') {
        const userHotels = await req.user.getHotels();
        const hasAccess = userHotels.some(h => h.id == hotel_id);
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado ao hotel especificado'
          });
        }
      }
      hotelIdToUse = hotel_id;
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(403).json({
        error: 'Usuários do tipo HOTEL devem especificar hotel_id'
      });
    }

    const configuration = await AppConfiguration.findByAppAndHotel(appName, hotelIdToUse);

    if (!configuration) {
      return res.status(404).json({
        error: 'Configuração não encontrada para esta aplicação'
      });
    }

    res.json({ configuration });

  } catch (error) {
    console.error('Erro ao buscar configuração de aplicação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/app-configurations/:appName - Criar/atualizar configuração de aplicação
router.post('/:appName', authenticateToken, async (req, res) => {
  try {
    const { appName } = req.params;
    const { hotel_id } = req.query;

    // Validar nome da aplicação
    if (!AppConfiguration.VALID_APPS.includes(appName)) {
      return res.status(400).json({
        error: 'Nome de aplicação inválido',
        valid_apps: AppConfiguration.VALID_APPS
      });
    }

    const { error, value } = appConfigSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    let hotelIdToUse = null;
    
    if (hotel_id) {
      // Verificações de permissão
      if (req.user.user_type === 'HOTEL') {
        const userHotels = await req.user.getHotels();
        const hasAccess = userHotels.some(h => h.id == hotel_id && ['OWNER', 'MANAGER'].includes(h.user_role));
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado ou permissão insuficiente'
          });
        }
      }
      hotelIdToUse = hotel_id;
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(400).json({
        error: 'hotel_id é obrigatório para usuários de hotel'
      });
    } else if (req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode criar configurações globais'
      });
    }

    // Criar/atualizar configuração
    const configuration = await AppConfiguration.createOrUpdate(appName, hotelIdToUse, value);

    res.status(201).json({
      message: 'Configuração da aplicação salva com sucesso',
      configuration
    });

  } catch (error) {
    console.error('Erro ao salvar configuração de aplicação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/app-configurations/:appName - Excluir configuração de aplicação
router.delete('/:appName', authenticateToken, async (req, res) => {
  try {
    const { appName } = req.params;
    const { hotel_id } = req.query;

    // Validar nome da aplicação
    if (!AppConfiguration.VALID_APPS.includes(appName)) {
      return res.status(400).json({
        error: 'Nome de aplicação inválido',
        valid_apps: AppConfiguration.VALID_APPS
      });
    }

    let hotelIdToUse = null;
    
    if (hotel_id) {
      // Verificações de permissão
      if (req.user.user_type === 'HOTEL') {
        const userHotels = await req.user.getHotels();
        const hasAccess = userHotels.some(h => h.id == hotel_id && ['OWNER', 'MANAGER'].includes(h.user_role));
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado ou permissão insuficiente'
          });
        }
      }
      hotelIdToUse = hotel_id;
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(400).json({
        error: 'hotel_id é obrigatório para usuários de hotel'
      });
    } else if (req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode excluir configurações globais'
      });
    }

    const result = await AppConfiguration.deleteByAppAndHotel(appName, hotelIdToUse);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Configuração não encontrada'
      });
    }

    res.json({
      message: 'Configuração da aplicação excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir configuração de aplicação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/app-configurations/share-logo - Compartilhar logo entre aplicações
router.post('/share-logo', authenticateToken, async (req, res) => {
  try {
    const { hotel_id } = req.query;

    const { error, value } = shareLogoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { source_app, target_apps } = value;

    let hotelIdToUse = null;
    
    if (hotel_id) {
      // Verificações de permissão
      if (req.user.user_type === 'HOTEL') {
        const userHotels = await req.user.getHotels();
        const hasAccess = userHotels.some(h => h.id == hotel_id && ['OWNER', 'MANAGER'].includes(h.user_role));
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado ou permissão insuficiente'
          });
        }
      }
      hotelIdToUse = hotel_id;
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(400).json({
        error: 'hotel_id é obrigatório para usuários de hotel'
      });
    } else if (req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode compartilhar logos globais'
      });
    }

    const results = [];
    const errors = [];

    // Compartilhar logo com cada aplicação de destino
    for (const targetApp of target_apps) {
      try {
        const result = await AppConfiguration.shareLogoFromApp(source_app, targetApp, hotelIdToUse);
        results.push({
          app: targetApp,
          success: true,
          configuration: result
        });
      } catch (error) {
        errors.push({
          app: targetApp,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: `Logo compartilhado de ${source_app}`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: target_apps.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Erro ao compartilhar logo entre aplicações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/app-configurations/bulk-update - Atualizar múltiplas configurações de uma vez
router.post('/bulk-update', authenticateToken, async (req, res) => {
  try {
    const { hotel_id } = req.query;
    const { configurations } = req.body;

    if (!configurations || typeof configurations !== 'object') {
      return res.status(400).json({
        error: 'Campo configurations é obrigatório e deve ser um objeto'
      });
    }

    let hotelIdToUse = null;
    
    if (hotel_id) {
      // Verificações de permissão
      if (req.user.user_type === 'HOTEL') {
        const userHotels = await req.user.getHotels();
        const hasAccess = userHotels.some(h => h.id == hotel_id && ['OWNER', 'MANAGER'].includes(h.user_role));
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado ou permissão insuficiente'
          });
        }
      }
      hotelIdToUse = hotel_id;
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(400).json({
        error: 'hotel_id é obrigatório para usuários de hotel'
      });
    } else if (req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode atualizar configurações globais'
      });
    }

    const results = [];
    const errors = [];

    // Processar cada configuração
    for (const [appName, configData] of Object.entries(configurations)) {
      // Validar nome da aplicação
      if (!AppConfiguration.VALID_APPS.includes(appName)) {
        errors.push({
          app: appName,
          success: false,
          error: 'Nome de aplicação inválido'
        });
        continue;
      }

      // Validar dados da configuração
      const { error, value } = appConfigSchema.validate(configData);
      if (error) {
        errors.push({
          app: appName,
          success: false,
          error: error.details[0].message
        });
        continue;
      }

      try {
        const result = await AppConfiguration.createOrUpdate(appName, hotelIdToUse, value);
        results.push({
          app: appName,
          success: true,
          configuration: result
        });
      } catch (error) {
        errors.push({
          app: appName,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Atualização em lote processada',
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: Object.keys(configurations).length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações em lote:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// =============================================================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// =============================================================================

// GET /api/app-configurations/public/:appName - Buscar configuração pública de uma aplicação
router.get('/public/:appName', async (req, res) => {
  try {
    const { appName } = req.params;
    const { hotel_id } = req.query;

    // Validar nome da aplicação
    if (!AppConfiguration.VALID_APPS.includes(appName)) {
      return res.status(400).json({
        error: 'Nome de aplicação inválido',
        valid_apps: AppConfiguration.VALID_APPS
      });
    }

    let configuration = null;

    // Se hotel_id for fornecido, tentar buscar configuração específica do hotel primeiro
    if (hotel_id) {
      try {
        configuration = await AppConfiguration.findByAppAndHotel(appName, hotel_id);
      } catch (error) {
        console.log('Erro ao buscar configuração do hotel, tentando configuração global:', error.message);
      }
    }

    // Se não encontrou configuração do hotel, buscar configuração global (hotel_id = null)
    if (!configuration) {
      try {
        configuration = await AppConfiguration.findByAppAndHotel(appName, null);
      } catch (error) {
        console.log('Erro ao buscar configuração global:', error.message);
      }
    }

    // Se não encontrou configuração global, buscar qualquer configuração disponível da aplicação
    if (!configuration) {
      try {
        const AppConfigurationModel = require('../models/AppConfiguration');
        configuration = await AppConfigurationModel.findFirstByApp(appName);
        console.log('📋 Usando configuração de fallback para login:', configuration ? 'encontrada' : 'não encontrada');
      } catch (error) {
        console.log('Erro ao buscar configuração de fallback:', error.message);
      }
    }

    if (!configuration) {
      // Se não encontrar nenhuma configuração, retornar configuração padrão
      return res.json({
        app_title: `${appName.toUpperCase()} - Sistema OSH`,
        logo_url: null,
        favicon_url: null,
        description: null
      });
    }

    // Retornar apenas informações básicas (não sensíveis) para página de login
    res.json({
      app_title: configuration.app_title,
      logo_url: configuration.logo_url,
      favicon_url: configuration.favicon_url,
      description: configuration.description
    });

  } catch (error) {
    console.error('Erro ao buscar configuração pública:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;