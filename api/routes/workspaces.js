const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const Hotel = require('../models/Hotel');
const Bot = require('../models/Bot');

// GET /api/workspaces - Listar todos os workspaces
router.get('/', async (req, res) => {
  try {
    // Usar query direta para garantir que os dados corretos sejam retornados
    const db = require('../config/database');
    let query = `
      SELECT w.*, h.name as hotel_nome 
      FROM workspaces w 
      LEFT JOIN hotels h ON w.hotel_id = h.id 
      WHERE 1=1
    `;
    const params = [];

    if (req.query.active !== undefined) {
      query += ' AND w.active = $' + (params.length + 1);
      params.push(req.query.active === 'true');
    }

    if (req.query.hotel_id) {
      query += ' AND w.hotel_id = $' + (params.length + 1);
      params.push(parseInt(req.query.hotel_id));
    }

    if (req.query.hotel_uuid) {
      query += ' AND w.hotel_uuid = $' + (params.length + 1);
      params.push(req.query.hotel_uuid);
    }

    if (req.query.search) {
      query += ' AND (w.name LIKE $' + (params.length + 1) + ' OR w.description LIKE $' + (params.length + 2) + ' OR h.name LIKE $' + (params.length + 3) + ')';
      params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
    }

    query += ' ORDER BY w.created_at DESC';

    if (req.query.limit) {
      query += ' LIMIT $' + (params.length + 1);
      params.push(parseInt(req.query.limit));
    }

    const workspaces = await db.query(query, params);
    
    res.json({
      success: true,
      data: workspaces.map(w => ({
        id: w.id,
        workspace_uuid: w.uuid, // Mapear corretamente o UUID
        hotel_id: w.hotel_id,
        hotel_uuid: w.hotel_uuid,
        name: w.name,
        description: w.description,
        settings: w.settings || {},
        active: w.active,
        created_at: w.created_at,
        updated_at: w.updated_at,
        hotel_nome: w.hotel_nome
      })),
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

// GET /api/workspaces/:id/bots - Listar bots do workspace por ID
router.get('/:id/bots', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar workspace primeiro (por ID numérico)
    const workspace = await Workspace.findById(parseInt(id));
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace não encontrado'
      });
    }
    
    // Buscar bots do workspace diretamente, sem usar o modelo Bot por enquanto
    let query = `
      SELECT b.*, w.name as workspace_name
      FROM bots b 
      LEFT JOIN workspaces w ON b.workspace_id = w.id 
      WHERE b.workspace_id = $1
    `;
    const params = [workspace.id];
    
    if (req.query.active !== undefined) {
      query += ' AND b.active = $' + (params.length + 1);
      params.push(req.query.active === 'true');
    }
    
    if (req.query.bot_type) {
      query += ' AND b.bot_type = $' + (params.length + 1);
      params.push(req.query.bot_type);
    }
    
    if (req.query.status) {
      query += ' AND b.status = $' + (params.length + 1);
      params.push(req.query.status);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const db = require('../config/database');
    const bots = await db.query(query, params);
    
    res.json({
      success: true,
      data: bots.map(b => ({
        id: b.id,
        uuid: b.uuid,
        workspace_id: b.workspace_id,
        workspace_uuid: b.workspace_uuid,
        hotel_id: b.hotel_id,
        hotel_uuid: b.hotel_uuid,
        name: b.name,
        description: b.description,
        bot_type: b.bot_type,
        status: b.status,
        configuration: b.configuration,
        settings: b.settings,
        active: b.active,
        created_at: b.created_at,
        updated_at: b.updated_at,
        workspace_name: b.workspace_name
      })),
      count: bots.length,
      workspace: {
        id: workspace.id,
        uuid: workspace.workspace_uuid,
        name: workspace.name
      }
    });
  } catch (error) {
    console.error('Erro ao listar bots do workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
console.log('DEBUG: Workspace route loaded');
 
