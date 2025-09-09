const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Validação schemas
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  email: Joi.string().email(),
  user_type: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'HOTEL'),
  active: Joi.boolean()
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().allow('').optional(),
  new_password: Joi.string().min(6).required(),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
    .messages({ 'any.only': 'Confirmação de senha não confere' })
});

const manageHotelsSchema = Joi.object({
  hotel_ids: Joi.array().items(Joi.number().integer().positive()).required()
    .messages({ 'array.base': 'hotel_ids deve ser um array de IDs de hotéis' })
});

// GET /api/users - Listar todos os usuários
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Listando usuários...');
    console.log('👤 Usuário logado:', req.user);
    console.log('👤 Tipo do usuário:', req.user.user_type);

    // Verificar se o usuário tem permissão (usar user_type em vez de userType)
    if (req.user.user_type !== 'SUPER_ADMIN' && req.user.user_type !== 'ADMIN') {
      console.log('❌ Acesso negado para tipo:', req.user.user_type);
      return res.status(403).json({
        error: 'Acesso negado. Apenas Super Admin e Admin podem listar usuários.'
      });
    }

    const filters = {};
    
    // Aplicar filtros baseados no tipo de usuário
    if (req.user.user_type === 'ADMIN') {
      // Admin só vê usuários HOTEL e outros ADMIN (não Super Admin)
      filters.user_type = ['ADMIN', 'HOTEL'];
    }

    // Parâmetros de busca
    if (req.query.search) {
      filters.search = req.query.search;
    }

    if (req.query.user_type) {
      filters.user_type = req.query.user_type;
    }

    if (req.query.active !== undefined) {
      filters.active = req.query.active === 'true';
    }

    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit);
    }

    const users = await User.findAll(filters);

    console.log(`✅ Encontrados ${users.length} usuários`);

    res.json({
      users: users.map(user => user.toJSON()),
      total: users.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const userId = parseInt(req.params.id);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões de edição
    const canEdit = canEditUser(req.user, user);
    if (!canEdit) {
      return res.status(403).json({
        error: 'Você não tem permissão para editar este usuário'
      });
    }

    // Super Admin pode alterar qualquer coisa
    // Admin e Hotel só podem alterar nome e email (não tipo ou status)
    if (req.user.user_type !== 'SUPER_ADMIN') {
      delete value.user_type;
      delete value.active;
    }

    // Verificar se email já está em uso por outro usuário
    if (value.email && value.email !== user.email) {
      const existingUser = await User.findByEmail(value.email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          error: 'Email já está em uso'
        });
      }
    }

    // Atualizar usuário
    Object.assign(user, value);
    await user.save();

    console.log('✅ Usuário atualizado:', user.id);

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/users/:id - Excluir usuário
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões de exclusão
    const canDelete = canDeleteUser(req.user, targetUser);
    if (!canDelete) {
      return res.status(403).json({
        error: 'Você não tem permissão para excluir este usuário'
      });
    }

    // Não permitir excluir a si mesmo
    if (targetUser.id === req.user.id) {
      return res.status(403).json({
        error: 'Você não pode excluir sua própria conta'
      });
    }

    await targetUser.delete();

    console.log('✅ Usuário excluído:', userId);

    res.json({
      message: 'Usuário excluído com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao excluir usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/users/:id/password - Alterar senha do usuário
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    console.log('🔐 Tentativa de alterar senha...');
    console.log('👤 Usuário logado:', req.user);
    console.log('📝 Dados recebidos:', req.body);
    
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      console.log('❌ Erro de validação:', error.details);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const userId = parseInt(req.params.id);
    const { current_password, new_password } = value;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões: usuário pode alterar própria senha, Super Admin pode alterar qualquer senha
    const canChangePassword = 
      req.user.user_type === 'SUPER_ADMIN' || 
      req.user.id === userId;

    if (!canChangePassword) {
      return res.status(403).json({
        error: 'Você não tem permissão para alterar a senha deste usuário'
      });
    }

    // Se não for Super Admin, senha atual é obrigatória e deve ser válida
    if (req.user.user_type !== 'SUPER_ADMIN') {
      if (!current_password) {
        return res.status(400).json({
          error: 'Senha atual é obrigatória'
        });
      }
      
      const isCurrentPasswordValid = await user.validatePassword(current_password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          error: 'Senha atual incorreta'
        });
      }
    }

    // Alterar senha
    await user.setPassword(new_password);
    await user.save();

    console.log('✅ Senha alterada para usuário:', userId);

    res.json({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/:id/hotels - Obter hotéis vinculados ao usuário
router.get('/:id/hotels', authenticateToken, async (req, res) => {
  try {
    console.log('🏨 Buscando hotéis do usuário...');
    
    const userId = parseInt(req.params.id);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões - Super Admin pode ver qualquer usuário
    if (req.user.user_type !== 'SUPER_ADMIN' && req.user.id !== userId) {
      return res.status(403).json({
        error: 'Você não tem permissão para ver os hotéis deste usuário'
      });
    }

    // Buscar hotéis vinculados ao usuário
    const hotelsQuery = `
      SELECT 
        uh.id as user_hotel_id,
        uh.hotel_id,
        uh.role,
        uh.active,
        uh.created_at,
        h.name as hotel_name,
        h.address as hotel_address,
        h.status as hotel_status
      FROM user_hotels uh
      JOIN hotels h ON uh.hotel_id = h.id
      WHERE uh.user_id = $1
      ORDER BY h.name
    `;

    const hotels = await db.query(hotelsQuery, [userId]);

    console.log(`✅ Encontrados ${hotels.length} hotéis para usuário ${userId}`);

    res.json({
      hotels: hotels.map(hotel => ({
        user_hotel_id: hotel.user_hotel_id,
        hotel_id: hotel.hotel_id,
        role: hotel.role,
        active: hotel.active,
        created_at: hotel.created_at,
        hotel: {
          id: hotel.hotel_id,
          name: hotel.hotel_name,
          address: hotel.hotel_address,
          status: hotel.hotel_status
        }
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao buscar hotéis do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/users/:id/hotels - Gerenciar hotéis vinculados ao usuário
router.put('/:id/hotels', authenticateToken, async (req, res) => {
  try {
    console.log('🏨 Gerenciando hotéis do usuário...');
    console.log('👤 Usuário logado:', req.user);
    console.log('📝 Dados recebidos:', req.body);
    
    const { error, value } = manageHotelsSchema.validate(req.body);
    if (error) {
      console.log('❌ Erro de validação:', error.details);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const userId = parseInt(req.params.id);
    const { hotel_ids } = value;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões - apenas Super Admin pode gerenciar vinculações
    if (req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Administradores podem gerenciar vinculações de hotéis'
      });
    }

    console.log(`🔄 Gerenciando vinculações para usuário ${userId}:`, hotel_ids);

    // Iniciar transação
    await db.query('BEGIN');

    try {
      // Remover todas as vinculações existentes
      await db.query('DELETE FROM user_hotels WHERE user_id = $1', [userId]);
      console.log(`🗑️ Removidas vinculações antigas do usuário ${userId}`);

      // Adicionar novas vinculações
      if (hotel_ids.length > 0) {
        for (const hotelId of hotel_ids) {
          // Verificar se o hotel existe
          const hotelExists = await db.query('SELECT id FROM hotels WHERE id = $1', [hotelId]);
          if (hotelExists.length === 0) {
            console.warn(`⚠️ Hotel ${hotelId} não encontrado, pulando vinculação`);
            continue;
          }

          // Criar nova vinculação
          await db.query(
            'INSERT INTO user_hotels (user_id, hotel_id, role, active) VALUES ($1, $2, $3, $4)',
            [userId, hotelId, 'STAFF', true]
          );

          console.log(`✅ Usuário ${userId} vinculado ao hotel ${hotelId}`);
        }
      }

      // Confirmar transação
      await db.query('COMMIT');

      console.log('🎉 Vinculações de hotéis atualizadas com sucesso!');

      // Buscar e retornar as novas vinculações
      const updatedHotelsQuery = `
        SELECT 
          uh.id as user_hotel_id,
          uh.hotel_id,
          uh.role,
          uh.active,
          h.name as hotel_name
        FROM user_hotels uh
        JOIN hotels h ON uh.hotel_id = h.id
        WHERE uh.user_id = $1
        ORDER BY h.name
      `;

      const updatedHotels = await db.query(updatedHotelsQuery, [userId]);

      res.json({
        message: 'Vinculações de hotéis atualizadas com sucesso',
        hotels: updatedHotels.map(hotel => ({
          hotel_id: hotel.hotel_id,
          hotel_name: hotel.hotel_name,
          role: hotel.role,
          active: hotel.active
        }))
      });

    } catch (transactionError) {
      // Desfazer transação em caso de erro
      await db.query('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Erro ao gerenciar hotéis do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Funções auxiliares de permissão
function canEditUser(currentUser, targetUser) {
  // Super Admin pode editar qualquer usuário
  if (currentUser.user_type === 'SUPER_ADMIN') {
    return true;
  }

  // Admin pode editar a si mesmo e usuários HOTEL atribuídos
  if (currentUser.user_type === 'ADMIN') {
    // Pode editar a si mesmo
    if (targetUser.id === currentUser.id) {
      return true;
    }
    // Pode editar usuários HOTEL (implementar lógica de atribuição futuramente)
    if (targetUser.user_type === 'HOTEL') {
      return true;
    }
  }

  // Hotel pode editar apenas a si mesmo
  if (currentUser.user_type === 'HOTEL') {
    return targetUser.id === currentUser.id;
  }

  return false;
}

function canDeleteUser(currentUser, targetUser) {
  // Super Admin pode excluir qualquer usuário (exceto a si mesmo)
  if (currentUser.user_type === 'SUPER_ADMIN') {
    return targetUser.id !== currentUser.id;
  }

  // Admin pode excluir usuários HOTEL atribuídos
  if (currentUser.user_type === 'ADMIN') {
    if (targetUser.id === currentUser.id) {
      return false; // Não pode excluir a si mesmo
    }
    // Pode excluir usuários HOTEL (implementar lógica de atribuição futuramente)
    if (targetUser.user_type === 'HOTEL') {
      return true;
    }
  }

  // Hotel não pode excluir usuários
  return false;
}

module.exports = router;