const express = require('express');
const Joi = require('joi');
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Validação schemas
const hotelSchema = Joi.object({
  hotel_nome: Joi.string().min(2).max(255).required(),
  hotel_capa: Joi.string().allow(null, '').optional(),
  hora_checkin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).default('14:00:00'),
  hora_checkout: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).default('12:00:00')
});

const updateHotelSchema = Joi.object({
  hotel_nome: Joi.string().min(2).max(255).optional(),
  hotel_capa: Joi.string().allow(null, '').optional(),
  hora_checkin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  hora_checkout: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional()
}).min(1).unknown(true); // Permitir campos desconhecidos

// GET /api/hotels - Listar hotéis
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM hotels WHERE 1=1';
    const params = [];

    // Filtro por usuário (apenas seus hotéis se não for admin)
    if (req.user.user_type === 'HOTEL') {
      query += ` AND id IN (
        SELECT hotel_id FROM user_hotels 
        WHERE user_id = ? AND active = true
      )`;
      params.push(req.user.id);
    }

    // Pesquisa
    if (search) {
      query += ' AND hotel_nome LIKE ?';
      params.push(`%${search}%`);
    }

    // Ordenação e paginação
    query += ' ORDER BY hotel_criado_em DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const hotels = await db.query(query, params);

    // Query para contar total
    let countQuery = 'SELECT COUNT(*) as total FROM hotels WHERE 1=1';
    const countParams = [];

    if (req.user.user_type === 'HOTEL') {
      countQuery += ` AND id IN (
        SELECT hotel_id FROM user_hotels 
        WHERE user_id = ? AND active = true
      )`;
      countParams.push(req.user.id);
    }

    if (search) {
      countQuery += ' AND hotel_nome LIKE ?';
      countParams.push(`%${search}%`);
    }

    const [{ total }] = await db.query(countQuery, countParams);

    res.json({
      hotels,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar hotéis:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/hotels/:id - Buscar hotel por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    
    if (isNaN(hotelId)) {
      return res.status(400).json({
        error: 'ID do hotel inválido'
      });
    }

    let query = 'SELECT * FROM hotels WHERE id = ?';
    const params = [hotelId];

    // Se não for admin, verificar se o usuário tem acesso ao hotel
    if (req.user.user_type === 'HOTEL') {
      query += ` AND id IN (
        SELECT hotel_id FROM user_hotels 
        WHERE user_id = ? AND active = true
      )`;
      params.push(req.user.id);
    }

    const [hotel] = await db.query(query, params);

    if (!hotel) {
      return res.status(404).json({
        error: 'Hotel não encontrado ou acesso negado'
      });
    }

    // Buscar usuários do hotel se for admin/proprietário
    if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.user_type)) {
      const users = await db.query(`
        SELECT u.id, u.name, u.email, u.user_type, u.active,
               uh.role, uh.permissions, uh.created_at as joined_at
        FROM users u
        JOIN user_hotels uh ON u.id = uh.user_id
        WHERE uh.hotel_id = ? AND uh.active = true
        ORDER BY uh.role, u.name
      `, [hotelId]);

      hotel.users = users;
    }

    res.json({ hotel });

  } catch (error) {
    console.error('Erro ao buscar hotel:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/hotels - Criar novo hotel
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { error, value } = hotelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { hotel_nome, hotel_capa, hora_checkin, hora_checkout } = value;

    // Verificar se já existe hotel com o mesmo nome
    const existingHotel = await db.query(
      'SELECT id FROM hotels WHERE hotel_nome = ?',
      [hotel_nome]
    );

    if (existingHotel.length > 0) {
      return res.status(409).json({
        error: 'Já existe um hotel com esse nome'
      });
    }

    // Criar hotel
    const result = await db.query(`
      INSERT INTO hotels (hotel_uuid, hotel_nome, hotel_capa, hora_checkin, hora_checkout) 
      VALUES (UUID(), ?, ?, ?, ?)
    `, [hotel_nome, hotel_capa, hora_checkin, hora_checkout]);

    const hotelId = result.insertId;

    // Buscar hotel criado
    const [newHotel] = await db.query('SELECT * FROM hotels WHERE id = ?', [hotelId]);

    res.status(201).json({
      message: 'Hotel criado com sucesso',
      hotel: newHotel
    });

  } catch (error) {
    console.error('Erro ao criar hotel:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/hotels/:id - Atualizar hotel
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    
    if (isNaN(hotelId)) {
      return res.status(400).json({
        error: 'ID do hotel inválido'
      });
    }

    console.log('Dados recebidos para atualização:', req.body);
    
    const { error, value } = updateHotelSchema.validate(req.body);
    if (error) {
      console.error('Erro de validação:', error.details[0].message);
      console.error('Dados que falharam:', req.body);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    // Verificar se hotel existe e se usuário tem acesso
    let checkQuery = 'SELECT * FROM hotels WHERE id = ?';
    const checkParams = [hotelId];

    if (req.user.user_type === 'HOTEL') {
      checkQuery += ` AND id IN (
        SELECT hotel_id FROM user_hotels 
        WHERE user_id = ? AND active = true AND role IN ('OWNER', 'MANAGER')
      )`;
      checkParams.push(req.user.id);
    }

    const [existingHotel] = await db.query(checkQuery, checkParams);

    if (!existingHotel) {
      return res.status(404).json({
        error: 'Hotel não encontrado ou sem permissão para editar'
      });
    }

    // Verificar se novo nome já existe (se estiver sendo alterado)
    if (value.hotel_nome && value.hotel_nome !== existingHotel.hotel_nome) {
      const duplicateHotel = await db.query(
        'SELECT id FROM hotels WHERE hotel_nome = ? AND id != ?',
        [value.hotel_nome, hotelId]
      );

      if (duplicateHotel.length > 0) {
        return res.status(409).json({
          error: 'Já existe um hotel com esse nome'
        });
      }
    }

    // Construir query de atualização dinamicamente
    const updateFields = [];
    const updateParams = [];

    Object.keys(value).forEach(field => {
      if (value[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateParams.push(value[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar'
      });
    }

    updateParams.push(hotelId);

    await db.query(`
      UPDATE hotels SET ${updateFields.join(', ')} 
      WHERE id = ?
    `, updateParams);

    // Buscar hotel atualizado
    const [updatedHotel] = await db.query('SELECT * FROM hotels WHERE id = ?', [hotelId]);

    res.json({
      message: 'Hotel atualizado com sucesso',
      hotel: updatedHotel
    });

  } catch (error) {
    console.error('Erro ao atualizar hotel:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/hotels/:id - Excluir hotel
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    
    if (isNaN(hotelId)) {
      return res.status(400).json({
        error: 'ID do hotel inválido'
      });
    }

    // Verificar se hotel existe
    const [existingHotel] = await db.query('SELECT * FROM hotels WHERE id = ?', [hotelId]);

    if (!existingHotel) {
      return res.status(404).json({
        error: 'Hotel não encontrado'
      });
    }

    // Excluir hotel (as FK constraints cuidarão das relações)
    await db.query('DELETE FROM hotels WHERE id = ?', [hotelId]);

    res.json({
      message: 'Hotel excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir hotel:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/hotels/:id/users - Adicionar usuário ao hotel
router.post('/:id/users', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    const { user_id, role = 'STAFF', permissions } = req.body;

    if (isNaN(hotelId) || !user_id) {
      return res.status(400).json({
        error: 'ID do hotel e ID do usuário são obrigatórios'
      });
    }

    // Verificar se hotel e usuário existem
    const [hotel] = await db.query('SELECT * FROM hotels WHERE id = ?', [hotelId]);
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [user_id]);

    if (!hotel || !user) {
      return res.status(404).json({
        error: 'Hotel ou usuário não encontrado'
      });
    }

    // Verificar se relação já existe
    const existingRelation = await db.query(
      'SELECT * FROM user_hotels WHERE user_id = ? AND hotel_id = ?',
      [user_id, hotelId]
    );

    if (existingRelation.length > 0) {
      return res.status(409).json({
        error: 'Usuário já está vinculado a este hotel'
      });
    }

    // Criar relação
    await db.query(
      'INSERT INTO user_hotels (user_id, hotel_id, role, permissions) VALUES (?, ?, ?, ?)',
      [user_id, hotelId, role, permissions ? JSON.stringify(permissions) : null]
    );

    res.status(201).json({
      message: 'Usuário adicionado ao hotel com sucesso'
    });

  } catch (error) {
    console.error('Erro ao adicionar usuário ao hotel:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/hotels/:id/users/:userId - Remover usuário do hotel
router.delete('/:id/users/:userId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    if (isNaN(hotelId) || isNaN(userId)) {
      return res.status(400).json({
        error: 'IDs inválidos'
      });
    }

    // Verificar se relação existe
    const existingRelation = await db.query(
      'SELECT * FROM user_hotels WHERE user_id = ? AND hotel_id = ?',
      [userId, hotelId]
    );

    if (existingRelation.length === 0) {
      return res.status(404).json({
        error: 'Relação usuário-hotel não encontrada'
      });
    }

    // Remover relação
    await db.query(
      'DELETE FROM user_hotels WHERE user_id = ? AND hotel_id = ?',
      [userId, hotelId]
    );

    res.json({
      message: 'Usuário removido do hotel com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover usuário do hotel:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;