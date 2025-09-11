const express = require('express');
const Joi = require('joi');
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Validação schemas
const hotelSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  cover_image: Joi.string().allow(null, '').optional(),
  checkin_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).default('14:00:00'),
  checkout_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).default('12:00:00'),
  description: Joi.string().allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  phone: Joi.string().allow(null, '').optional(),
  email: Joi.string().email().allow(null, '').optional(),
  website: Joi.string().allow(null, '').optional()
});

const updateHotelSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  cover_image: Joi.string().allow(null, '').optional(),
  checkin_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  checkout_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  description: Joi.string().allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  phone: Joi.string().allow(null, '').optional(),
  email: Joi.string().email().allow(null, '').optional(),
  website: Joi.string().allow(null, '').optional()
}).min(1).unknown(true); // Permitir campos desconhecidos

// GET /api/hotels - Listar hotéis
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM hotels WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtro por usuário (apenas seus hotéis se não for admin)
    if (req.user.user_type && req.user.user_type.toUpperCase() === 'HOTEL') {
      query += ` AND id IN (
        SELECT hotel_id FROM user_hotels 
        WHERE user_id = $${paramIndex} AND active = true
      )`;
      params.push(req.user.id);
      paramIndex++;
    }

    // Pesquisa
    if (search) {
      query += ` AND name LIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Ordenação e paginação
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const hotels = await db.query(query, params);

    // Query para contar total
    let countQuery = 'SELECT COUNT(*) as total FROM hotels WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (req.user.user_type && req.user.user_type.toUpperCase() === 'HOTEL') {
      countQuery += ` AND id IN (
        SELECT hotel_id FROM user_hotels 
        WHERE user_id = $${countParamIndex} AND active = true
      )`;
      countParams.push(req.user.id);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND name LIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = countResult[0].total;

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

// GET /api/hotels/my-hotels - Listar hotéis do usuário logado
router.get('/my-hotels', authenticateToken, async (req, res) => {
  try {
    console.log('🏨 [my-hotels] User:', req.user);
    
    let query;
    let params = [];

    if ((req.user.user_type && req.user.user_type.toUpperCase() === 'SUPER_ADMIN') || (req.user.user_type && req.user.user_type.toUpperCase() === 'ADMIN')) {
      // Admin vê todos os hotéis
      console.log('🏨 [my-hotels] Admin user - showing all hotels');
      query = 'SELECT * FROM hotels ORDER BY created_at DESC';
    } else {
      // Usuário comum vê apenas seus hotéis
      console.log('🏨 [my-hotels] Regular user - showing user hotels for user ID:', req.user.id);
      query = `
        SELECT h.* FROM hotels h
        INNER JOIN user_hotels uh ON h.id = uh.hotel_id
        WHERE uh.user_id = $1 AND uh.active = true
        ORDER BY h.created_at DESC
      `;
      params = [req.user.id];
    }

    console.log('🏨 [my-hotels] Query:', query);
    console.log('🏨 [my-hotels] Params:', params);

    const hotels = await db.query(query, params);
    
    console.log('🏨 [my-hotels] Found hotels:', hotels.length);

    res.json({
      success: true,
      hotels
    });

  } catch (error) {
    console.error('🚨 [my-hotels] Erro ao listar meus hotéis:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
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

    let query = 'SELECT * FROM hotels WHERE id = $1';
    const params = [hotelId];

    // Se não for admin, verificar se o usuário tem acesso ao hotel
    if (req.user.user_type && req.user.user_type.toUpperCase() === 'HOTEL') {
      query += ` AND id IN (
        SELECT hotel_id FROM user_hotels 
        WHERE user_id = $2 AND active = true
      )`;
      params.push(req.user.id);
    }

    const hotels = await db.query(query, params);
    const hotel = hotels[0];

    if (!hotel) {
      return res.status(404).json({
        error: 'Hotel não encontrado ou acesso negado'
      });
    }

    // Buscar usuários do hotel se for admin/proprietário
    if (req.user.user_type && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.user_type.toUpperCase())) {
      const users = await db.query(`
        SELECT u.id, u.name, u.email, u.user_type, u.active,
               uh.role, uh.permissions, uh.created_at as joined_at
        FROM users u
        JOIN user_hotels uh ON u.id = uh.user_id
        WHERE uh.hotel_id = $1 AND uh.active = true
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
    console.log('🏨 [POST /hotels] Dados recebidos:', req.body);
    console.log('🖼️ [POST /hotels] cover_image recebida:', req.body.cover_image);
    
    const { error, value } = hotelSchema.validate(req.body);
    if (error) {
      console.log('❌ [POST /hotels] Erro de validação:', error.details[0].message);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    console.log('✅ [POST /hotels] Dados validados:', value);
    const { name, cover_image, checkin_time, checkout_time } = value;
    console.log('🖼️ [POST /hotels] URL da imagem após validação:', cover_image);

    // Verificar se já existe hotel com o mesmo nome
    const existingHotel = await db.query(
      'SELECT id FROM hotels WHERE name = $1',
      [name]
    );

    if (existingHotel.length > 0) {
      return res.status(409).json({
        error: 'Já existe um hotel com esse nome'
      });
    }

    // Criar hotel
    const result = await db.query(`
      INSERT INTO hotels (hotel_uuid, name, cover_image, checkin_time, checkout_time) 
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING *
    `, [name, cover_image, checkin_time, checkout_time]);

    const newHotel = result[0];

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
    let checkQuery = 'SELECT * FROM hotels WHERE id = $1';
    const checkParams = [hotelId];

    if (req.user.user_type && req.user.user_type.toUpperCase() === 'HOTEL') {
      checkQuery += ` AND id IN (
        SELECT hotel_id FROM user_hotels 
        WHERE user_id = $2 AND active = true AND role IN ('OWNER', 'MANAGER')
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
    if (value.name && value.name !== existingHotel.name) {
      const duplicateHotel = await db.query(
        'SELECT id FROM hotels WHERE name = $1 AND id != $2',
        [value.name, hotelId]
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
        updateFields.push(`${field} = $${updateParams.length + 1}`);
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
      WHERE id = $${updateParams.length}
    `, updateParams);

    // Buscar hotel atualizado
    const [updatedHotel] = await db.query('SELECT * FROM hotels WHERE id = $1', [hotelId]);

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
    const [existingHotel] = await db.query('SELECT * FROM hotels WHERE id = $1', [hotelId]);

    if (!existingHotel) {
      return res.status(404).json({
        error: 'Hotel não encontrado'
      });
    }

    // Excluir hotel (as FK constraints cuidarão das relações)
    await db.query('DELETE FROM hotels WHERE id = $1', [hotelId]);

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
    const [hotel] = await db.query('SELECT * FROM hotels WHERE id = $1', [hotelId]);
    const [user] = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);

    if (!hotel || !user) {
      return res.status(404).json({
        error: 'Hotel ou usuário não encontrado'
      });
    }

    // Verificar se relação já existe
    const existingRelation = await db.query(
      'SELECT * FROM user_hotels WHERE user_id = $1 AND hotel_id = $2',
      [user_id, hotelId]
    );

    if (existingRelation.length > 0) {
      return res.status(409).json({
        error: 'Usuário já está vinculado a este hotel'
      });
    }

    // Criar relação
    await db.query(
      'INSERT INTO user_hotels (user_id, hotel_id, role, permissions) VALUES ($1, $2, $3, $4)',
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
      'SELECT * FROM user_hotels WHERE user_id = $1 AND hotel_id = $2',
      [userId, hotelId]
    );

    if (existingRelation.length === 0) {
      return res.status(404).json({
        error: 'Relação usuário-hotel não encontrada'
      });
    }

    // Remover relação
    await db.query(
      'DELETE FROM user_hotels WHERE user_id = $1 AND hotel_id = $2',
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