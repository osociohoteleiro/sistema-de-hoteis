const express = require('express');
const Joi = require('joi');
const { authenticateToken, requireRole } = require('../middleware/auth');
const LogoHistory = require('../models/LogoHistory');

const router = express.Router();

// Validação schemas
const logoSchema = Joi.object({
  logo_url: Joi.string().uri().required(),
  is_active: Joi.boolean().default(false)
});

const activateLogoSchema = Joi.object({
  logo_id: Joi.number().integer().positive().required()
});

// =============================================================================
// ENDPOINTS PARA HISTÓRICO DE LOGOTIPOS
// =============================================================================

// GET /api/logos - Listar todos os logotipos históricos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { hotel_id } = req.query;
    let hotelId = null;
    
    if (hotel_id) {
      // Resolver hotel_id (pode ser UUID ou ID numérico)
      if (isNaN(hotel_id)) {
        // É um UUID, precisa converter para ID
        const Hotel = require('../models/Hotel');
        const hotel = await Hotel.findByUuid(hotel_id);
        if (!hotel) {
          return res.status(404).json({
            error: 'Hotel não encontrado'
          });
        }
        hotelId = hotel.id;
      } else {
        // É um ID numérico
        hotelId = parseInt(hotel_id);
      }
      
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
      // Usuário de hotel deve especificar hotel_id
      return res.status(400).json({
        error: 'hotel_id é obrigatório para usuários de hotel'
      });
    }

    const logos = await LogoHistory.findAllByHotel(hotelId);
    const totalLogos = await LogoHistory.countByHotel(hotelId);
    
    res.json({
      success: true,
      data: {
        logos,
        total: totalLogos
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de logotipos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// GET /api/logos/active - Buscar logotipo ativo
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const { hotel_id } = req.query;
    let hotelId = null;
    
    if (hotel_id) {
      // Resolver hotel_id (pode ser UUID ou ID numérico)
      if (isNaN(hotel_id)) {
        // É um UUID, precisa converter para ID
        const Hotel = require('../models/Hotel');
        const hotel = await Hotel.findByUuid(hotel_id);
        if (!hotel) {
          return res.status(404).json({
            error: 'Hotel não encontrado'
          });
        }
        hotelId = hotel.id;
      } else {
        // É um ID numérico
        hotelId = parseInt(hotel_id);
      }
      
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
        error: 'hotel_id é obrigatório para usuários de hotel'
      });
    }

    const activeLogo = await LogoHistory.findActiveByHotel(hotelId);
    
    res.json({
      success: true,
      data: {
        active_logo: activeLogo
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logotipo ativo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// POST /api/logos - Adicionar novo logotipo ao histórico
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = logoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { logo_url, is_active } = value;
    const { hotel_id } = req.query;
    let hotelId = null;

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
      hotelId = hotel_id;
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(400).json({
        error: 'hotel_id é obrigatório para usuários de hotel'
      });
    }

    const newLogo = await LogoHistory.create(hotelId, logo_url, is_active);
    
    if (!newLogo) {
      return res.status(500).json({
        error: 'Erro ao salvar logotipo no histórico'
      });
    }

    // Se marcado como ativo, desativar outros logotipos
    if (is_active) {
      await LogoHistory.setActive(newLogo.id, hotelId);
    }

    res.status(201).json({
      success: true,
      message: 'Logotipo adicionado ao histórico com sucesso',
      data: { logo: newLogo }
    });
  } catch (error) {
    console.error('Erro ao adicionar logotipo ao histórico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// PUT /api/logos/:id/activate - Definir logotipo como ativo
router.put('/:id/activate', authenticateToken, async (req, res) => {
  try {
    const logoId = parseInt(req.params.id);
    if (isNaN(logoId)) {
      return res.status(400).json({
        error: 'ID do logotipo inválido'
      });
    }

    const { hotel_id } = req.query;
    let hotelId = null;

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
      hotelId = hotel_id;
    } else if (req.user.user_type === 'HOTEL') {
      return res.status(400).json({
        error: 'hotel_id é obrigatório para usuários de hotel'
      });
    }

    // Verificar se o logotipo existe e pertence ao hotel
    const logo = await LogoHistory.findById(logoId);
    if (!logo) {
      return res.status(404).json({
        error: 'Logotipo não encontrado'
      });
    }

    if (logo.hotel_id != hotelId) {
      return res.status(403).json({
        error: 'Acesso negado ao logotipo especificado'
      });
    }

    const success = await LogoHistory.setActive(logoId, hotelId);
    
    if (!success) {
      return res.status(500).json({
        error: 'Erro ao ativar logotipo'
      });
    }

    res.json({
      success: true,
      message: 'Logotipo ativado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao ativar logotipo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// DELETE /api/logos/:id - Deletar logotipo (apenas se não estiver ativo)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const logoId = parseInt(req.params.id);
    if (isNaN(logoId)) {
      return res.status(400).json({
        error: 'ID do logotipo inválido'
      });
    }

    // Verificar se o logotipo existe
    const logo = await LogoHistory.findById(logoId);
    if (!logo) {
      return res.status(404).json({
        error: 'Logotipo não encontrado'
      });
    }

    // Verificar se usuário tem acesso ao hotel
    if (req.user.user_type === 'HOTEL') {
      const userHotels = await req.user.getHotels();
      const hasAccess = userHotels.some(h => h.id == logo.hotel_id);
      
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Acesso negado ao logotipo especificado'
        });
      }
    }

    if (logo.is_active) {
      return res.status(400).json({
        error: 'Não é possível deletar o logotipo ativo'
      });
    }

    const success = await LogoHistory.delete(logoId);
    
    if (!success) {
      return res.status(500).json({
        error: 'Erro ao deletar logotipo'
      });
    }

    res.json({
      success: true,
      message: 'Logotipo deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar logotipo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

module.exports = router;