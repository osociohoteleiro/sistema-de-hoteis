const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const Bot = require('../models/Bot');

// GET /api/folders - Listar todas as pastas
router.get('/', async (req, res) => {
  try {
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      bot_id: req.query.bot_id,
      bot_uuid: req.query.bot_uuid,
      workspace_id: req.query.workspace_id,
      workspace_uuid: req.query.workspace_uuid,
      hotel_id: req.query.hotel_id,
      parent_folder_id: req.query.parent_folder_id !== undefined ? 
        (req.query.parent_folder_id === 'null' ? null : parseInt(req.query.parent_folder_id)) : undefined,
      search: req.query.search,
      limit: req.query.limit
    };

    const folders = await Folder.findAll(filters);
    
    res.json({
      success: true,
      data: folders.map(f => f.toJSON()),
      count: folders.length
    });
  } catch (error) {
    console.error('Erro ao listar pastas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/folders/bot/:botId - Pastas por ID do bot
router.get('/bot/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      parent_folder_id: req.query.parent_folder_id !== undefined ? 
        (req.query.parent_folder_id === 'null' ? null : parseInt(req.query.parent_folder_id)) : undefined,
      search: req.query.search
    };

    const folders = await Folder.findByBot(parseInt(botId), filters);
    
    res.json({
      success: true,
      data: folders.map(f => f.toJSON()),
      count: folders.length
    });
  } catch (error) {
    console.error('Erro ao listar pastas do bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/folders/bot/uuid/:botUuid - Pastas por UUID do bot
router.get('/bot/uuid/:botUuid', async (req, res) => {
  try {
    const { botUuid } = req.params;
    const filters = {
      active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
      parent_folder_id: req.query.parent_folder_id !== undefined ? 
        (req.query.parent_folder_id === 'null' ? null : parseInt(req.query.parent_folder_id)) : undefined,
      search: req.query.search
    };

    const folders = await Folder.findByBotUuid(botUuid, filters);
    
    res.json({
      success: true,
      data: folders.map(f => f.toJSON()),
      count: folders.length
    });
  } catch (error) {
    console.error('Erro ao listar pastas do bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/folders/:id - Obter pasta por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findById(parseInt(id));

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    res.json({
      success: true,
      data: folder.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/folders/uuid/:uuid - Obter pasta por UUID
router.get('/uuid/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const folder = await Folder.findByUuid(uuid);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    res.json({
      success: true,
      data: folder.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/folders/:id/flows - Obter fluxos da pasta
router.get('/:id/flows', async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findById(parseInt(id));

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    const flows = await folder.getFlows();

    res.json({
      success: true,
      data: flows.map(f => f.toJSON()),
      count: flows.length
    });
  } catch (error) {
    console.error('Erro ao obter fluxos da pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/folders/icons - Ícones disponíveis
router.get('/meta/icons', async (req, res) => {
  try {
    const icons = Folder.getAvailableIcons();
    
    res.json({
      success: true,
      data: icons
    });
  } catch (error) {
    console.error('Erro ao obter ícones:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/folders/colors - Cores disponíveis
router.get('/meta/colors', async (req, res) => {
  try {
    const colors = Folder.getAvailableColors();
    
    res.json({
      success: true,
      data: colors
    });
  } catch (error) {
    console.error('Erro ao obter cores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/folders - Criar nova pasta
router.post('/', async (req, res) => {
  try {
    const { bot_id, bot_uuid, name, description, color, icon, parent_folder_id, sort_order } = req.body;

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
        message: 'Nome da pasta é obrigatório'
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

    // Validar pasta pai se fornecida
    if (parent_folder_id) {
      const parentFolder = await Folder.findById(parent_folder_id);
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Pasta pai não encontrada'
        });
      }
      if (parentFolder.bot_id !== bot.id) {
        return res.status(400).json({
          success: false,
          message: 'Pasta pai deve pertencer ao mesmo bot'
        });
      }
    }

    // Criar pasta
    const folder = new Folder({
      bot_id: bot.id,
      bot_uuid: bot.bot_uuid,
      workspace_id: bot.workspace_id,
      workspace_uuid: bot.workspace_uuid,
      hotel_id: bot.hotel_id,
      hotel_uuid: bot.hotel_uuid,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || '#3B82F6',
      icon: icon || 'folder',
      parent_folder_id: parent_folder_id || null,
      sort_order: sort_order || 0,
      active: true
    });

    await folder.save();

    res.status(201).json({
      success: true,
      message: 'Pasta criada com sucesso',
      data: folder.toJSON()
    });
  } catch (error) {
    console.error('Erro ao criar pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/folders/:id - Atualizar pasta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, parent_folder_id, sort_order, active } = req.body;

    const folder = await Folder.findById(parseInt(id));

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    // Atualizar campos
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nome da pasta não pode estar vazio'
        });
      }
      folder.name = name.trim();
    }

    if (description !== undefined) {
      folder.description = description?.trim() || null;
    }

    if (color !== undefined) {
      folder.color = color;
    }

    if (icon !== undefined) {
      folder.icon = icon;
    }

    if (parent_folder_id !== undefined) {
      // Validar pasta pai
      if (parent_folder_id && parent_folder_id !== folder.parent_folder_id) {
        const parentFolder = await Folder.findById(parent_folder_id);
        if (!parentFolder) {
          return res.status(404).json({
            success: false,
            message: 'Pasta pai não encontrada'
          });
        }
        if (parentFolder.bot_id !== folder.bot_id) {
          return res.status(400).json({
            success: false,
            message: 'Pasta pai deve pertencer ao mesmo bot'
          });
        }
        if (parentFolder.id === folder.id) {
          return res.status(400).json({
            success: false,
            message: 'Pasta não pode ser pai de si mesma'
          });
        }
      }
      folder.parent_folder_id = parent_folder_id || null;
    }

    if (sort_order !== undefined) {
      folder.sort_order = sort_order;
    }

    if (active !== undefined) {
      folder.active = Boolean(active);
    }

    await folder.save();

    res.json({
      success: true,
      message: 'Pasta atualizada com sucesso',
      data: folder.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/folders/:id - Deletar pasta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    const folder = await Folder.findById(parseInt(id));

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    try {
      if (hard_delete === 'true') {
        await folder.delete();
        res.json({
          success: true,
          message: 'Pasta deletada permanentemente'
        });
      } else {
        await folder.softDelete();
        res.json({
          success: true,
          message: 'Pasta desativada com sucesso',
          data: folder.toJSON()
        });
      }
    } catch (deleteError) {
      return res.status(400).json({
        success: false,
        message: deleteError.message
      });
    }
  } catch (error) {
    console.error('Erro ao deletar pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/folders/:id/move - Mover pasta para outra pasta pai
router.patch('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { parent_folder_id } = req.body;

    const folder = await Folder.findById(parseInt(id));

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    try {
      await folder.moveTo(parent_folder_id || null);

      res.json({
        success: true,
        message: 'Pasta movida com sucesso',
        data: folder.toJSON()
      });
    } catch (moveError) {
      return res.status(400).json({
        success: false,
        message: moveError.message
      });
    }
  } catch (error) {
    console.error('Erro ao mover pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/folders/:id/activate - Ativar pasta
router.patch('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findById(parseInt(id));

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    await folder.activate();

    res.json({
      success: true,
      message: 'Pasta ativada com sucesso',
      data: folder.toJSON()
    });
  } catch (error) {
    console.error('Erro ao ativar pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;