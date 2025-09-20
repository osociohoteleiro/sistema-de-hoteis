const express = require('express');
const router = express.Router();
const Bot = require('../models/Bot');
const Workspace = require('../models/Workspace');

// GET /api/bots - Listar todos os bots
router.get('/', async (req, res) => {
  try {
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      workspace_id: req.query.workspace_id,
      workspace_uuid: req.query.workspace_uuid,
      hotel_id: req.query.hotel_id,
      hotel_uuid: req.query.hotel_uuid,
      bot_type: req.query.bot_type,
      status: req.query.status,
      search: req.query.search,
      limit: req.query.limit
    };

    const bots = await Bot.findAll(filters);
    
    res.json({
      success: true,
      data: bots.map(b => b.toJSON()),
      count: bots.length
    });
  } catch (error) {
    console.error('Erro ao listar bots:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/bots/stats - Estatísticas dos bots
router.get('/stats', async (req, res) => {
  try {
    const stats = await Bot.getStats();
    
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

// GET /api/bots/types - Tipos de bots disponíveis
router.get('/types', async (req, res) => {
  try {
    const types = Bot.getBotTypes();
    
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

// GET /api/bots/statuses - Status de bots disponíveis
router.get('/statuses', async (req, res) => {
  try {
    const statuses = Bot.getBotStatuses();
    
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

// GET /api/bots/workspace/:workspaceIdentifier - Bots por ID ou UUID do workspace
router.get('/workspace/:workspaceIdentifier', async (req, res) => {
  try {
    const { workspaceIdentifier } = req.params;

    if (!workspaceIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'ID ou UUID do workspace é obrigatório',
        error: `workspaceIdentifier recebido: ${workspaceIdentifier}`
      });
    }

    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      bot_type: req.query.bot_type,
      status: req.query.status,
      search: req.query.search
    };

    let bots;
    let isUuid = isNaN(parseInt(workspaceIdentifier)) || workspaceIdentifier.includes('-');

    if (isUuid) {
      // É um UUID, usar findByWorkspaceUuid
      console.log('Buscando bots para workspace UUID:', workspaceIdentifier);
      bots = await Bot.findByWorkspaceUuid(workspaceIdentifier, filters);
    } else {
      // É um ID numérico, usar findByWorkspace
      const workspaceIdNum = parseInt(workspaceIdentifier);
      console.log('Buscando bots para workspace ID:', workspaceIdNum);
      bots = await Bot.findByWorkspace(workspaceIdNum, filters);
    }

    console.log(`Encontrados ${bots.length} bots para workspace ${workspaceIdentifier}`);

    res.json({
      success: true,
      data: bots.map(b => b.toJSON()),
      count: bots.length,
      workspace_identifier: workspaceIdentifier,
      identifier_type: isUuid ? 'uuid' : 'id'
    });
  } catch (error) {
    console.error('Erro ao listar bots do workspace:', error);

    // Verificar se é erro de workspace não encontrado
    if (error.message && error.message.includes('não encontrado')) {
      res.status(404).json({
        success: false,
        message: `Workspace com identificador ${req.params.workspaceIdentifier} não foi encontrado`,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
});

// GET /api/bots/workspace/uuid/:workspaceUuid - Bots por UUID do workspace
router.get('/workspace/uuid/:workspaceUuid', async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      bot_type: req.query.bot_type,
      status: req.query.status,
      search: req.query.search
    };

    const bots = await Bot.findByWorkspaceUuid(workspaceUuid, filters);
    
    res.json({
      success: true,
      data: bots.map(b => b.toJSON()),
      count: bots.length
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

// GET /api/bots/:id - Obter bot por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bot = await Bot.findById(parseInt(id));

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot não encontrado'
      });
    }

    res.json({
      success: true,
      data: bot.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/bots/uuid/:uuid - Obter bot por UUID
router.get('/uuid/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const bot = await Bot.findByUuid(uuid);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot não encontrado'
      });
    }

    res.json({
      success: true,
      data: bot.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/bots - Criar novo bot
router.post('/', async (req, res) => {
  try {
    const { workspace_id, workspace_uuid, name, description, bot_type, status, configuration, settings } = req.body;

    // Validações básicas
    if (!workspace_id && !workspace_uuid) {
      return res.status(400).json({
        success: false,
        message: 'ID ou UUID do workspace é obrigatório'
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nome do bot é obrigatório'
      });
    }

    // Validar se workspace existe
    let workspace;
    if (workspace_id) {
      workspace = await Workspace.findById(workspace_id);
    } else {
      workspace = await Workspace.findByUuid(workspace_uuid);
    }

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace não encontrado'
      });
    }

    // Validar bot_type se fornecido
    if (bot_type && !Bot.getBotTypes().includes(bot_type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de bot inválido'
      });
    }

    // Validar status se fornecido
    if (status && !Bot.getBotStatuses().includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status de bot inválido'
      });
    }

    // Criar bot
    const bot = new Bot({
      workspace_id: workspace.id,
      workspace_uuid: workspace.workspace_uuid,
      hotel_id: workspace.hotel_id,
      hotel_uuid: workspace.hotel_uuid,
      name: name.trim(),
      description: description?.trim() || null,
      bot_type: bot_type || 'CHATBOT',
      status: status || 'DRAFT',
      configuration: configuration || {},
      settings: settings || {},
      active: true
    });

    await bot.save();

    res.status(201).json({
      success: true,
      message: 'Bot criado com sucesso',
      data: bot.toJSON()
    });
  } catch (error) {
    console.error('Erro ao criar bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/bots/:id - Atualizar bot
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, bot_type, status, configuration, settings, active } = req.body;

    const bot = await Bot.findById(parseInt(id));

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot não encontrado'
      });
    }

    // Atualizar campos
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nome do bot não pode estar vazio'
        });
      }
      bot.name = name.trim();
    }

    if (description !== undefined) {
      bot.description = description?.trim() || null;
    }

    if (bot_type !== undefined) {
      if (!Bot.getBotTypes().includes(bot_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de bot inválido'
        });
      }
      bot.bot_type = bot_type;
    }

    if (status !== undefined) {
      if (!Bot.getBotStatuses().includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status de bot inválido'
        });
      }
      bot.status = status;
    }

    if (configuration !== undefined) {
      bot.configuration = configuration;
    }

    if (settings !== undefined) {
      bot.settings = settings;
    }

    if (active !== undefined) {
      bot.active = Boolean(active);
    }

    await bot.save();

    res.json({
      success: true,
      message: 'Bot atualizado com sucesso',
      data: bot.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/bots/:id/configuration - Atualizar configuração específica
router.patch('/:id/configuration', async (req, res) => {
  try {
    const { id } = req.params;
    const newConfiguration = req.body;

    const bot = await Bot.findById(parseInt(id));

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot não encontrado'
      });
    }

    await bot.updateConfiguration(newConfiguration);

    res.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: bot.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/bots/:id/settings - Atualizar configurações específicas
router.patch('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const newSettings = req.body;

    const bot = await Bot.findById(parseInt(id));

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot não encontrado'
      });
    }

    await bot.updateSettings(newSettings);

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: bot.toJSON()
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

// PATCH /api/bots/:id/activate - Ativar bot
router.patch('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findById(parseInt(id));

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot não encontrado'
      });
    }

    await bot.activate();

    res.json({
      success: true,
      message: 'Bot ativado com sucesso',
      data: bot.toJSON()
    });
  } catch (error) {
    console.error('Erro ao ativar bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/bots/:id/deactivate - Desativar bot
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findById(parseInt(id));

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot não encontrado'
      });
    }

    await bot.deactivate();

    res.json({
      success: true,
      message: 'Bot desativado com sucesso',
      data: bot.toJSON()
    });
  } catch (error) {
    console.error('Erro ao desativar bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/bots/:id - Deletar bot (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    const bot = await Bot.findById(parseInt(id));

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot não encontrado'
      });
    }

    if (hard_delete === 'true') {
      await bot.delete();
      res.json({
        success: true,
        message: 'Bot deletado permanentemente'
      });
    } else {
      await bot.softDelete();
      res.json({
        success: true,
        message: 'Bot desativado com sucesso',
        data: bot.toJSON()
      });
    }
  } catch (error) {
    console.error('Erro ao deletar bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;