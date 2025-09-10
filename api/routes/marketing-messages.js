const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware para validar UUID do hotel
const validateHotelUuid = (req, res, next) => {
  const hotelUuid = req.params.hotelUuid || req.body.hotel_uuid;
  if (!hotelUuid) {
    return res.status(400).json({ error: 'UUID do hotel é obrigatório' });
  }
  next();
};

// GET /api/marketing-messages/:hotelUuid - Listar mensagens de marketing de um hotel
router.get('/:hotelUuid', authenticateToken, validateHotelUuid, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    
    console.log(`📧 Buscando mensagens de marketing para hotel: ${hotelUuid}`);

    const messages = await db.query(`
      SELECT 
        id,
        nome,
        descricao,
        offset_tempo,
        unidade_tempo,
        antes_apos,
        referencia,
        canal,
        modelo_mensagem,
        hotel_id,
        hotel_uuid
      FROM tipo_mensagem 
      WHERE hotel_uuid = $1
      ORDER BY id DESC
    `, [hotelUuid]);

    console.log(`✅ Encontradas ${messages.length} mensagens de marketing`);
    res.json(messages);

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens de marketing:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/marketing-messages - Criar nova mensagem de marketing
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      nome,
      descricao,
      offset_tempo,
      unidade_tempo,
      antes_apos,
      referencia,
      canal,
      modelo_mensagem,
      hotel_uuid
    } = req.body;

    // Validações básicas
    if (!nome || !offset_tempo || !modelo_mensagem || !hotel_uuid) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, offset_tempo, modelo_mensagem, hotel_uuid' 
      });
    }

    // Buscar hotel_id pelo hotel_uuid
    const hotel = await db.query('SELECT id FROM hotels WHERE hotel_uuid = $1', [hotel_uuid]);
    if (hotel.length === 0) {
      return res.status(404).json({ error: 'Hotel não encontrado' });
    }

    console.log(`📧 Criando nova mensagem de marketing para hotel: ${hotel_uuid}`);

    const result = await db.query(`
      INSERT INTO tipo_mensagem (
        nome, descricao, offset_tempo, unidade_tempo, antes_apos, 
        referencia, canal, modelo_mensagem, hotel_id, hotel_uuid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      nome,
      descricao || null,
      offset_tempo,
      unidade_tempo || 'horas',
      antes_apos || 'antes',
      referencia || 'checkin',
      canal || 'whatsapp',
      modelo_mensagem,
      hotel[0].id,
      hotel_uuid
    ]);

    // Buscar a mensagem criada
    const newMessage = await db.query(
      'SELECT * FROM tipo_mensagem WHERE id = $1',
      [result.insertId]
    );

    console.log(`✅ Mensagem de marketing criada com ID: ${result.insertId}`);
    res.status(201).json(newMessage[0]);

  } catch (error) {
    console.error('❌ Erro ao criar mensagem de marketing:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/marketing-messages/:id - Atualizar mensagem de marketing
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      offset_tempo,
      unidade_tempo,
      antes_apos,
      referencia,
      canal,
      modelo_mensagem,
      hotel_uuid
    } = req.body;

    // Verificar se a mensagem existe
    const existing = await db.query('SELECT * FROM tipo_mensagem WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Mensagem de marketing não encontrada' });
    }

    // Buscar hotel_id se hotel_uuid foi alterado
    let hotel_id = existing[0].hotel_id;
    if (hotel_uuid && hotel_uuid !== existing[0].hotel_uuid) {
      const hotel = await db.query('SELECT id FROM hotels WHERE hotel_uuid = $1', [hotel_uuid]);
      if (hotel.length === 0) {
        return res.status(404).json({ error: 'Hotel não encontrado' });
      }
      hotel_id = hotel[0].id;
    }

    console.log(`📧 Atualizando mensagem de marketing ID: ${id}`);

    await db.query(`
      UPDATE tipo_mensagem SET
        nome = $1,
        descricao = $2,
        offset_tempo = $3,
        unidade_tempo = $4,
        antes_apos = $5,
        referencia = $6,
        canal = $7,
        modelo_mensagem = $8,
        hotel_id = $9,
        hotel_uuid = $10
      WHERE id = $11
    `, [
      nome || existing[0].nome,
      descricao !== undefined ? descricao : existing[0].descricao,
      offset_tempo || existing[0].offset_tempo,
      unidade_tempo || existing[0].unidade_tempo,
      antes_apos || existing[0].antes_apos,
      referencia || existing[0].referencia,
      canal || existing[0].canal,
      modelo_mensagem || existing[0].modelo_mensagem,
      hotel_id,
      hotel_uuid || existing[0].hotel_uuid,
      id
    ]);

    // Buscar a mensagem atualizada
    const updatedMessage = await db.query(
      'SELECT * FROM tipo_mensagem WHERE id = $1',
      [id]
    );

    console.log(`✅ Mensagem de marketing atualizada ID: ${id}`);
    res.json(updatedMessage[0]);

  } catch (error) {
    console.error('❌ Erro ao atualizar mensagem de marketing:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/marketing-messages/:id - Excluir mensagem de marketing
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a mensagem existe
    const existing = await db.query('SELECT * FROM tipo_mensagem WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Mensagem de marketing não encontrada' });
    }

    console.log(`📧 Excluindo mensagem de marketing ID: ${id}`);

    await db.query('DELETE FROM tipo_mensagem WHERE id = $1', [id]);

    console.log(`✅ Mensagem de marketing excluída ID: ${id}`);
    res.json({ message: 'Mensagem de marketing excluída com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao excluir mensagem de marketing:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/marketing-messages/:id - Buscar mensagem específica por ID
router.get('/message/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📧 Buscando mensagem de marketing ID: ${id}`);

    const message = await db.query(
      'SELECT * FROM tipo_mensagem WHERE id = $1',
      [id]
    );

    if (message.length === 0) {
      return res.status(404).json({ error: 'Mensagem de marketing não encontrada' });
    }

    console.log(`✅ Mensagem de marketing encontrada ID: ${id}`);
    res.json(message[0]);

  } catch (error) {
    console.error('❌ Erro ao buscar mensagem de marketing:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;