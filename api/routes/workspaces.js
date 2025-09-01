const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const Hotel = require('../models/Hotel');

// GET /api/workspaces - Listar todos os workspaces
router.get('/', async (req, res) => {
  try {
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      hotel_id: req.query.hotel_id,
      hotel_uuid: req.query.hotel_uuid,
      search: req.query.search,
      limit: req.query.limit
    };

    const workspaces = await Workspace.findAll(filters);
    
    res.json({
      success: true,
      data: workspaces.map(w => w.toJSON()),
      count: workspaces.length
    });
  } catch (error) {
    console.error('Erro ao listar workspaces:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/workspaces/stats - Estatísticas dos workspaces
router.get('/stats', async (req, res) => {
  try {
    const stats = await Workspace.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/workspaces/hotel/:hotelId - Workspaces por ID do hotel
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      search: req.query.search
    };

    const workspaces = await Workspace.findByHotel(parseInt(hotelId), filters);
    
    res.json({
      success: true,
      data: workspaces.map(w => w.toJSON()),
      count: workspaces.length
    });
  } catch (error) {
    console.error('Erro ao listar workspaces do hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/workspaces/hotel/uuid/:hotelUuid - Workspaces por UUID do hotel
router.get('/hotel/uuid/:hotelUuid', async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      search: req.query.search
    };

    const workspaces = await Workspace.findByHotelUuid(hotelUuid, filters);
    
    res.json({
      success: true,
      data: workspaces.map(w => w.toJSON()),
      count: workspaces.length
    });
  } catch (error) {
    console.error('Erro ao listar workspaces do hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/workspaces/:id - Obter workspace por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(parseInt(id));

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace não encontrado'
      });
    }

    res.json({
      success: true,
      data: workspace.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/workspaces/uuid/:uuid - Obter workspace por UUID
router.get('/uuid/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const workspace = await Workspace.findByUuid(uuid);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace não encontrado'
      });
    }

    res.json({
      success: true,
      data: workspace.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/workspaces - Criar novo workspace
router.post('/', async (req, res) => {
  try {
    const { hotel_id, hotel_uuid, name, description, settings } = req.body;

    // Validações básicas
    if (!hotel_id && !hotel_uuid) {
      return res.status(400).json({
        success: false,
        message: 'ID ou UUID do hotel é obrigatório'
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nome do workspace é obrigatório'
      });
    }

    // Validar se hotel existe
    let hotel;
    if (hotel_id) {
      hotel = await Hotel.findById(hotel_id);
    } else {
      hotel = await Hotel.findByUuid(hotel_uuid);
    }

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel não encontrado'
      });
    }

    // Criar workspace
    const workspace = new Workspace({
      hotel_id: hotel.id,
      hotel_uuid: hotel.hotel_uuid,
      name: name.trim(),
      description: description?.trim() || null,
      settings: settings || {},
      active: true
    });

    await workspace.save();

    res.status(201).json({
      success: true,
      message: 'Workspace criado com sucesso',
      data: workspace.toJSON()
    });
  } catch (error) {
    console.error('Erro ao criar workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/workspaces/:id - Atualizar workspace
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, settings, active } = req.body;

    const workspace = await Workspace.findById(parseInt(id));

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace não encontrado'
      });
    }

    // Atualizar campos
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nome do workspace não pode estar vazio'
        });
      }
      workspace.name = name.trim();
    }

    if (description !== undefined) {
      workspace.description = description?.trim() || null;
    }

    if (settings !== undefined) {
      workspace.settings = settings;
    }

    if (active !== undefined) {
      workspace.active = Boolean(active);
    }

    await workspace.save();

    res.json({
      success: true,
      message: 'Workspace atualizado com sucesso',
      data: workspace.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/workspaces/:id/settings - Atualizar configurações específicas
router.patch('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const newSettings = req.body;

    const workspace = await Workspace.findById(parseInt(id));

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace não encontrado'
      });
    }

    await workspace.updateSettings(newSettings);

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: workspace.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/workspaces/:id - Deletar workspace (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    const workspace = await Workspace.findById(parseInt(id));

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace não encontrado'
      });
    }

    if (hard_delete === 'true') {
      await workspace.delete();
      res.json({
        success: true,
        message: 'Workspace deletado permanentemente'
      });
    } else {
      await workspace.softDelete();
      res.json({
        success: true,
        message: 'Workspace desativado com sucesso',
        data: workspace.toJSON()
      });
    }
  } catch (error) {
    console.error('Erro ao deletar workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/workspaces/:id/activate - Reativar workspace
router.patch('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(parseInt(id));

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace não encontrado'
      });
    }

    await workspace.activate();

    res.json({
      success: true,
      message: 'Workspace reativado com sucesso',
      data: workspace.toJSON()
    });
  } catch (error) {
    console.error('Erro ao reativar workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;