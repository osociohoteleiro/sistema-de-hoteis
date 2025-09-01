const express = require('express');
const router = express.Router();
const Flow = require('../models/Flow');
const Bot = require('../models/Bot');
const Folder = require('../models/Folder');

// GET /api/flows - Listar todos os fluxos
router.get('/', async (req, res) => {
  try {
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      bot_id: req.query.bot_id,
      bot_uuid: req.query.bot_uuid,
      workspace_id: req.query.workspace_id,
      folder_id: req.query.folder_id !== undefined ? 
        (req.query.folder_id === 'null' ? null : parseInt(req.query.folder_id)) : undefined,
      flow_type: req.query.flow_type,
      status: req.query.status,
      is_default: req.query.is_default !== undefined ? req.query.is_default === 'true' : undefined,
      search: req.query.search,
      limit: req.query.limit
    };

    const flows = await Flow.findAll(filters);
    
    res.json({
      success: true,
      data: flows.map(f => f.toJSON()),
      count: flows.length
    });
  } catch (error) {
    console.error('Erro ao listar fluxos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/flows/stats - Estatísticas dos fluxos
router.get('/stats', async (req, res) => {
  try {
    const stats = await Flow.getStats();
    
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

// GET /api/flows/types - Tipos de fluxo disponíveis
router.get('/types', async (req, res) => {
  try {
    const types = Flow.getFlowTypes();
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Erro ao obter tipos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/flows/statuses - Status de fluxo disponíveis
router.get('/statuses', async (req, res) => {
  try {
    const statuses = Flow.getFlowStatuses();
    
    res.json({
      success: true,
      data: statuses
    });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/flows/bot/:botId - Fluxos por ID do bot
router.get('/bot/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      folder_id: req.query.folder_id !== undefined ? 
        (req.query.folder_id === 'null' ? null : parseInt(req.query.folder_id)) : undefined,
      flow_type: req.query.flow_type,
      status: req.query.status,
      search: req.query.search
    };

    const flows = await Flow.findByBot(parseInt(botId), filters);
    
    res.json({
      success: true,
      data: flows.map(f => f.toJSON()),
      count: flows.length
    });
  } catch (error) {
    console.error('Erro ao listar fluxos do bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/flows/bot/uuid/:botUuid - Fluxos por UUID do bot
router.get('/bot/uuid/:botUuid', async (req, res) => {
  try {
    const { botUuid } = req.params;
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      folder_id: req.query.folder_id !== undefined ? 
        (req.query.folder_id === 'null' ? null : parseInt(req.query.folder_id)) : undefined,
      flow_type: req.query.flow_type,
      status: req.query.status,
      search: req.query.search
    };

    const flows = await Flow.findByBotUuid(botUuid, filters);
    
    res.json({
      success: true,
      data: flows.map(f => f.toJSON()),
      count: flows.length
    });
  } catch (error) {
    console.error('Erro ao listar fluxos do bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/flows/folder/:folderId - Fluxos por pasta
router.get('/folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      flow_type: req.query.flow_type,
      status: req.query.status,
      search: req.query.search
    };

    const flows = await Flow.findByFolder(parseInt(folderId), filters);
    
    res.json({
      success: true,
      data: flows.map(f => f.toJSON()),
      count: flows.length
    });
  } catch (error) {
    console.error('Erro ao listar fluxos da pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/flows/:id - Obter fluxo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const flow = await Flow.findById(parseInt(id));

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Fluxo não encontrado'
      });
    }

    res.json({
      success: true,
      data: flow.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter fluxo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/flows/uuid/:uuid - Obter fluxo por UUID
router.get('/uuid/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const flow = await Flow.findByUuid(uuid);

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Fluxo não encontrado'
      });
    }

    res.json({
      success: true,
      data: flow.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter fluxo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/flows - Criar novo fluxo
router.post('/', async (req, res) => {
  try {
    const { 
      bot_id, bot_uuid, folder_id, name, description, flow_type, status, 
      version, flow_data, variables, settings, triggers, priority, is_default, sort_order 
    } = req.body;

    // Validações básicas
    if (!bot_id && !bot_uuid) {
      return res.status(400).json({
        success: false,
        message: 'ID ou UUID do bot é obrigatório'
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nome do fluxo é obrigatório'
      });
    }

    // Validar se bot existe
    let bot;
    if (bot_id) {
      bot = await Bot.findById(bot_id);
    } else {
      bot = await Bot.findByUuid(bot_uuid);
    }

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot não encontrado'
      });
    }

    // Validar pasta se fornecida
    if (folder_id) {
      const folder = await Folder.findById(folder_id);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Pasta não encontrada'
        });
      }
      if (folder.bot_id !== bot.id) {
        return res.status(400).json({
          success: false,
          message: 'Pasta deve pertencer ao mesmo bot'
        });
      }
    }

    // Validar tipos e status
    if (flow_type && !Flow.getFlowTypes().includes(flow_type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de fluxo inválido'
      });
    }

    if (status && !Flow.getFlowStatuses().includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status de fluxo inválido'
      });
    }

    // Criar fluxo
    const flow = new Flow({
      bot_id: bot.id,
      bot_uuid: bot.bot_uuid,
      workspace_id: bot.workspace_id,
      workspace_uuid: bot.workspace_uuid,
      hotel_id: bot.hotel_id,
      hotel_uuid: bot.hotel_uuid,
      folder_id: folder_id || null,
      name: name.trim(),
      description: description?.trim() || null,
      flow_type: flow_type || 'CONVERSATION',
      status: status || 'DRAFT',
      version: version || '1.0.0',
      flow_data: flow_data || {},
      variables: variables || {},
      settings: settings || {},
      triggers: triggers || [],
      priority: priority || 0,
      is_default: is_default || false,
      sort_order: sort_order || 0,
      active: true
    });

    await flow.save();

    // Se é padrão, remover padrão de outros fluxos
    if (flow.is_default) {
      await flow.setAsDefault();
    }

    res.status(201).json({
      success: true,
      message: 'Fluxo criado com sucesso',
      data: flow.toJSON()
    });
  } catch (error) {
    console.error('Erro ao criar fluxo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/flows/:id - Atualizar fluxo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, description, flow_type, status, version, flow_data, variables, 
      settings, triggers, priority, is_default, sort_order, active, folder_id 
    } = req.body;

    const flow = await Flow.findById(parseInt(id));

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Fluxo não encontrado'
      });
    }

    // Atualizar campos
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nome do fluxo não pode estar vazio'
        });
      }
      flow.name = name.trim();
    }

    if (description !== undefined) {
      flow.description = description?.trim() || null;
    }

    if (flow_type !== undefined) {
      if (!Flow.getFlowTypes().includes(flow_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de fluxo inválido'
        });
      }
      flow.flow_type = flow_type;
    }

    if (status !== undefined) {
      if (!Flow.getFlowStatuses().includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status de fluxo inválido'
        });
      }
      flow.status = status;
    }

    if (version !== undefined) flow.version = version;
    if (flow_data !== undefined) flow.flow_data = flow_data;
    if (variables !== undefined) flow.variables = variables;
    if (settings !== undefined) flow.settings = settings;
    if (triggers !== undefined) flow.triggers = triggers;
    if (priority !== undefined) flow.priority = priority;
    if (sort_order !== undefined) flow.sort_order = sort_order;
    if (active !== undefined) flow.active = Boolean(active);
    if (folder_id !== undefined) flow.folder_id = folder_id;

    if (is_default !== undefined) {
      flow.is_default = Boolean(is_default);
    }

    await flow.save();

    // Se é padrão, remover padrão de outros fluxos
    if (flow.is_default) {
      await flow.setAsDefault();
    }

    res.json({
      success: true,
      message: 'Fluxo atualizado com sucesso',
      data: flow.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar fluxo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/flows/:id/flow-data - Atualizar dados do fluxo
router.patch('/:id/flow-data', async (req, res) => {
  try {
    const { id } = req.params;
    const flowData = req.body;

    const flow = await Flow.findById(parseInt(id));

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Fluxo não encontrado'
      });
    }

    await flow.updateFlowData(flowData);

    res.json({
      success: true,
      message: 'Dados do fluxo atualizados com sucesso',
      data: flow.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar dados do fluxo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/flows/:id/activate - Ativar fluxo
router.patch('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const flow = await Flow.findById(parseInt(id));

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Fluxo não encontrado'
      });
    }

    await flow.activate();

    res.json({
      success: true,
      message: 'Fluxo ativado com sucesso',
      data: flow.toJSON()
    });
  } catch (error) {
    console.error('Erro ao ativar fluxo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/flows/:id/deactivate - Desativar fluxo
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const flow = await Flow.findById(parseInt(id));

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Fluxo não encontrado'
      });
    }

    await flow.deactivate();

    res.json({
      success: true,
      message: 'Fluxo desativado com sucesso',
      data: flow.toJSON()
    });
  } catch (error) {
    console.error('Erro ao desativar fluxo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/flows/:id/set-default - Definir como fluxo padrão
router.patch('/:id/set-default', async (req, res) => {
  try {
    const { id } = req.params;

    const flow = await Flow.findById(parseInt(id));

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Fluxo não encontrado'
      });
    }

    await flow.setAsDefault();

    res.json({
      success: true,
      message: 'Fluxo definido como padrão com sucesso',
      data: flow.toJSON()
    });
  } catch (error) {
    console.error('Erro ao definir fluxo padrão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/flows/:id/move - Mover fluxo para outra pasta
router.patch('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_id } = req.body;

    const flow = await Flow.findById(parseInt(id));

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Fluxo não encontrado'
      });
    }

    try {
      await flow.moveToFolder(folder_id || null);

      res.json({
        success: true,
        message: 'Fluxo movido com sucesso',
        data: flow.toJSON()
      });
    } catch (moveError) {
      return res.status(400).json({
        success: false,
        message: moveError.message
      });
    }
  } catch (error) {
    console.error('Erro ao mover fluxo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/flows/:id - Deletar fluxo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    const flow = await Flow.findById(parseInt(id));

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'Fluxo não encontrado'
      });
    }

    if (hard_delete === 'true') {
      await flow.delete();
      res.json({
        success: true,
        message: 'Fluxo deletado permanentemente'
      });
    } else {
      await flow.softDelete();
      res.json({
        success: true,
        message: 'Fluxo desativado com sucesso',
        data: flow.toJSON()
      });
    }
  } catch (error) {
    console.error('Erro ao deletar fluxo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;