const express = require('express');
const Joi = require('joi');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Config, ApiEndpoint } = require('../models/Config');
const LogoHistory = require('../models/LogoHistory');
const db = require('../config/database');

const router = express.Router();

// Função auxiliar para converter UUID de hotel para ID numérico
async function getHotelIdFromUuid(hotelUuid) {
  if (!hotelUuid) return null;
  
  // Se já é um número, retornar como está
  if (/^\d+$/.test(hotelUuid)) {
    return parseInt(hotelUuid);
  }
  
  // Se é UUID, buscar o ID numérico
  const result = await db.query('SELECT id FROM hotels WHERE hotel_uuid = $1', [hotelUuid]);
  return result.length > 0 ? result[0].id : null;
}

// Validação schemas
const configSchema = Joi.object({
  config_key: Joi.string().min(1).max(100).required(),
  config_value: Joi.any().required(),
  config_type: Joi.string().valid('STRING', 'JSON', 'BOOLEAN', 'NUMBER').default('STRING'),
  description: Joi.string().max(500).allow(null, '')
});

const endpointSchema = Joi.object({
  endpoint_name: Joi.string().min(1).max(100).required(),
  url: Joi.string().uri().required(),
  method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').default('GET'),
  headers: Joi.object().default({}),
  description: Joi.string().max(500).allow(null, '')
});

// =============================================================================
// CONFIGURAÇÕES GLOBAIS E POR HOTEL
// =============================================================================

// GET /api/config - Listar configurações
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { hotel_id, type } = req.query;
    
    let configs;
    
    if (hotel_id) {
      // Converter UUID para ID numérico se necessário
      const numericHotelId = await getHotelIdFromUuid(hotel_id);
      
      if (!numericHotelId) {
        return res.status(404).json({
          error: 'Hotel não encontrado'
        });
      }
      
      // Verificar se usuário tem acesso ao hotel
      if (req.user.user_type === 'HOTEL') {
        const userHotels = await req.user.getHotels();
        const hasAccess = userHotels.some(h => h.id == numericHotelId);
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado ao hotel especificado'
          });
        }
      }
      
      configs = await Config.findAllByHotel(numericHotelId);
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(403).json({
        error: 'Usuários do tipo HOTEL devem especificar hotel_id'
      });
    } else {
      configs = await Config.findGlobal();
    }

    // Filtrar por tipo se especificado
    if (type) {
      configs = configs.filter(c => c.config_type === type.toUpperCase());
    }

    // Parsear valores
    const parsedConfigs = configs.map(config => ({
      ...config,
      config_value: config.parsedValue
    }));

    res.json({ configs: parsedConfigs });

  } catch (error) {
    console.error('Erro ao listar configurações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/config/:key - Buscar configuração específica
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { hotel_id } = req.query;
    
    // Verificar acesso ao hotel se especificado
    if (hotel_id && req.user.user_type === 'HOTEL') {
      const userHotels = await req.user.getHotels();
      const hasAccess = userHotels.some(h => h.id == hotel_id);
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Acesso negado ao hotel especificado'
        });
      }
    }

    const config = await Config.findByKey(key, hotel_id || null);

    if (!config) {
      return res.status(404).json({
        error: 'Configuração não encontrada'
      });
    }

    res.json({
      config: {
        ...config,
        config_value: config.parsedValue
      }
    });

  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/config - Criar/atualizar configuração
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = configSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { config_key, config_value, config_type, description } = value;
    const { hotel_id } = req.query;

    // Verificações de permissão
    if (!hotel_id && req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode criar configurações globais'
      });
    }

    if (hotel_id && req.user.user_type === 'HOTEL') {
      const userHotels = await req.user.getHotels();
      const hasAccess = userHotels.some(h => h.id == hotel_id && ['OWNER', 'MANAGER'].includes(h.user_role));
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Acesso negado ou permissão insuficiente'
        });
      }
    }

    // Criar/atualizar configuração
    await Config.setValue(config_key, config_value, config_type, hotel_id || null, description);

    // Buscar configuração criada/atualizada
    const savedConfig = await Config.findByKey(config_key, hotel_id || null);

    res.status(201).json({
      message: 'Configuração salva com sucesso',
      config: {
        ...savedConfig,
        config_value: savedConfig.parsedValue
      }
    });

  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/config/:key - Excluir configuração
router.delete('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { hotel_id } = req.query;

    // Verificações de permissão
    if (!hotel_id && req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode excluir configurações globais'
      });
    }

    if (hotel_id && req.user.user_type === 'HOTEL') {
      const userHotels = await req.user.getHotels();
      const hasAccess = userHotels.some(h => h.id == hotel_id && ['OWNER', 'MANAGER'].includes(h.user_role));
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Acesso negado ou permissão insuficiente'
        });
      }
    }

    const result = await Config.delete(key, hotel_id || null);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Configuração não encontrada'
      });
    }

    res.json({
      message: 'Configuração excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir configuração:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// =============================================================================
// ENDPOINTS DA API
// =============================================================================

// GET /api/config/endpoints - Listar endpoints
router.get('/endpoints/list', authenticateToken, async (req, res) => {
  try {
    const { hotel_id, active } = req.query;
    
    const filters = {};
    
    if (hotel_id) {
      if (req.user.user_type === 'HOTEL') {
        const userHotels = await req.user.getHotels();
        const hasAccess = userHotels.some(h => h.id == hotel_id);
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado ao hotel especificado'
          });
        }
      }
      filters.hotel_id = hotel_id;
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(403).json({
        error: 'Usuários do tipo HOTEL devem especificar hotel_id'
      });
    } else {
      filters.hotel_id = null; // Endpoints globais
    }

    if (active !== undefined) {
      filters.active = active === 'true';
    }

    const endpoints = await ApiEndpoint.findAll(filters);

    res.json({ endpoints });

  } catch (error) {
    console.error('Erro ao listar endpoints:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/config/endpoints/:id - Buscar endpoint específico
router.get('/endpoints/:id', authenticateToken, async (req, res) => {
  try {
    const endpointId = parseInt(req.params.id);
    
    if (isNaN(endpointId)) {
      return res.status(400).json({
        error: 'ID do endpoint inválido'
      });
    }

    const endpoint = await ApiEndpoint.findById(endpointId);

    if (!endpoint) {
      return res.status(404).json({
        error: 'Endpoint não encontrado'
      });
    }

    // Verificar acesso
    if (endpoint.hotel_id && req.user.user_type === 'HOTEL') {
      const userHotels = await req.user.getHotels();
      const hasAccess = userHotels.some(h => h.id == endpoint.hotel_id);
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Acesso negado'
        });
      }
    }

    res.json({ 
      endpoint: {
        ...endpoint,
        headers: endpoint.parsedHeaders
      }
    });

  } catch (error) {
    console.error('Erro ao buscar endpoint:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/config/endpoints - Criar endpoint
router.post('/endpoints', authenticateToken, async (req, res) => {
  try {
    const { error, value } = endpointSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { endpoint_name, url, method, headers, description } = value;
    const { hotel_id } = req.query;

    // Verificações de permissão
    if (!hotel_id && req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode criar endpoints globais'
      });
    }

    if (hotel_id && req.user.user_type === 'HOTEL') {
      const userHotels = await req.user.getHotels();
      const hasAccess = userHotels.some(h => h.id == hotel_id && ['OWNER', 'MANAGER'].includes(h.user_role));
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Acesso negado ou permissão insuficiente'
        });
      }
    }

    // Verificar se já existe endpoint com mesmo nome
    const existingEndpoint = await ApiEndpoint.findByName(endpoint_name, hotel_id || null);
    if (existingEndpoint) {
      return res.status(409).json({
        error: 'Já existe um endpoint com esse nome'
      });
    }

    // Criar endpoint
    const endpoint = new ApiEndpoint({
      hotel_id: hotel_id || null,
      endpoint_name,
      url,
      method,
      headers,
      description
    });

    await endpoint.save();

    res.status(201).json({
      message: 'Endpoint criado com sucesso',
      endpoint: {
        ...endpoint,
        headers: endpoint.parsedHeaders
      }
    });

  } catch (error) {
    console.error('Erro ao criar endpoint:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/config/endpoints/:id - Atualizar endpoint
router.put('/endpoints/:id', authenticateToken, async (req, res) => {
  try {
    const endpointId = parseInt(req.params.id);
    
    if (isNaN(endpointId)) {
      return res.status(400).json({
        error: 'ID do endpoint inválido'
      });
    }

    const { error, value } = endpointSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const endpoint = await ApiEndpoint.findById(endpointId);
    if (!endpoint) {
      return res.status(404).json({
        error: 'Endpoint não encontrado'
      });
    }

    // Verificar permissões
    if (!endpoint.hotel_id && req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode editar endpoints globais'
      });
    }

    if (endpoint.hotel_id && req.user.user_type === 'HOTEL') {
      const userHotels = await req.user.getHotels();
      const hasAccess = userHotels.some(h => h.id == endpoint.hotel_id && ['OWNER', 'MANAGER'].includes(h.user_role));
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Acesso negado ou permissão insuficiente'
        });
      }
    }

    // Atualizar campos
    Object.assign(endpoint, value);
    await endpoint.save();

    res.json({
      message: 'Endpoint atualizado com sucesso',
      endpoint: {
        ...endpoint,
        headers: endpoint.parsedHeaders
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar endpoint:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/config/endpoints/:id - Excluir endpoint
router.delete('/endpoints/:id', authenticateToken, async (req, res) => {
  try {
    const endpointId = parseInt(req.params.id);
    
    if (isNaN(endpointId)) {
      return res.status(400).json({
        error: 'ID do endpoint inválido'
      });
    }

    const endpoint = await ApiEndpoint.findById(endpointId);
    if (!endpoint) {
      return res.status(404).json({
        error: 'Endpoint não encontrado'
      });
    }

    // Verificar permissões
    if (!endpoint.hotel_id && req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode excluir endpoints globais'
      });
    }

    if (endpoint.hotel_id && req.user.user_type === 'HOTEL') {
      const userHotels = await req.user.getHotels();
      const hasAccess = userHotels.some(h => h.id == endpoint.hotel_id && ['OWNER', 'MANAGER'].includes(h.user_role));
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Acesso negado ou permissão insuficiente'
        });
      }
    }

    await endpoint.delete();

    res.json({
      message: 'Endpoint excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir endpoint:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// =============================================================================
// ROTA ESPECIAL PARA CONFIGURAÇÕES COM LOGOTIPO
// =============================================================================

// Validação para configurações completas (incluindo logotipo)
const fullConfigSchema = Joi.object({
  hotel_uuid: Joi.string().allow(null, ''),
  configurations: Joi.object({
    logo: Joi.string().uri().allow(null, ''),
    company_name: Joi.string().min(1).max(255),
    upload_config: Joi.object().allow(null),
    system_config: Joi.object().allow(null)
  }).required()
});

// POST /api/config/save - Salvar configurações completas (incluindo logotipo no histórico)
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { error, value } = fullConfigSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { hotel_uuid, configurations } = value;
    let hotelId = null;

    // Resolver hotel_id a partir do uuid se fornecido
    if (hotel_uuid) {
      const Hotel = require('../models/Hotel');
      const hotel = await Hotel.findByUuid(hotel_uuid);
      if (!hotel) {
        return res.status(404).json({
          error: 'Hotel não encontrado'
        });
      }
      hotelId = hotel.id;

      // Verificar se usuário tem acesso ao hotel
      if (req.user.user_type === 'HOTEL') {
        const userHotels = await req.user.getHotels();
        const hasAccess = userHotels.some(h => h.id == hotelId);
        
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado ao hotel especificado'
          });
        }
      }
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(400).json({
        error: 'hotel_uuid é obrigatório para usuários de hotel'
      });
    }

    const { logo, company_name, upload_config, system_config } = configurations;
    
    // Salvar configurações tradicionais
    const promises = [];
    
    if (company_name) {
      promises.push(Config.setValue('company_name', company_name, 'STRING', hotelId, 'Nome da empresa'));
    }
    
    if (upload_config) {
      promises.push(Config.setValue('upload_config', upload_config, 'JSON', hotelId, 'Configurações de upload'));
    }
    
    if (system_config) {
      promises.push(Config.setValue('system_config', system_config, 'JSON', hotelId, 'Configurações do sistema'));
    }

    // Se há um logotipo, salvar no histórico E na configuração tradicional
    if (logo && logo.trim() !== '') {
      // Adicionar ao histórico de logotipos
      const logoHistoryItem = await LogoHistory.create(hotelId, logo, true); // Definir como ativo
      
      if (logoHistoryItem) {
        // Também salvar na configuração tradicional para compatibilidade
        promises.push(Config.setValue('logo_patch', logo, 'STRING', hotelId, 'Logotipo da empresa'));
      } else {
        console.warn('Falha ao salvar logotipo no histórico, salvando apenas na configuração tradicional');
        promises.push(Config.setValue('logo_patch', logo, 'STRING', hotelId, 'Logotipo da empresa'));
      }
    }

    // Executar todas as operações de salvamento
    await Promise.all(promises);

    res.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      data: {
        hotel_id: hotelId,
        configurations_saved: Object.keys(configurations).length,
        logo_saved_to_history: !!(logo && logo.trim() !== '')
      }
    });

  } catch (error) {
    console.error('Erro ao salvar configurações completas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

module.exports = router;