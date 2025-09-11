const express = require('express');
const db = require('../config/database');
// const { authenticateToken } = require('../middleware/auth'); // Removido temporariamente

const router = express.Router();

// Middleware de autenticação para todas as rotas
// router.use(authenticateToken); // Removido temporariamente para manter consistência

// GET /api/systems-catalog - Listar todos os sistemas cadastrados
router.get('/', async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT 
        id,
        name,
        type,
        integration_type,
        auth_fields,
        description,
        is_active,
        created_at,
        updated_at
      FROM systems_catalog 
      WHERE is_active = TRUE
      ORDER BY type, name
    `);
    
    // Converter auth_fields de JSON string para objeto
    const systems = rows.map(row => ({
      ...row,
      auth_fields: row.auth_fields ? JSON.parse(row.auth_fields) : []
    }));
    
    res.json({
      success: true,
      systems,
      message: `${systems.length} sistemas encontrados`
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar sistemas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/systems-catalog - Criar novo sistema
router.post('/', async (req, res) => {
  try {
    const { name, type, integration_type, auth_fields, description } = req.body;
    
    // Validações
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nome do sistema é obrigatório'
      });
    }
    
    if (!['pms', 'motor', 'channel'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo deve ser: pms, motor ou channel'
      });
    }
    
    if (!['api', 'link'].includes(integration_type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de integração deve ser: api ou link'
      });
    }
    
    // Validar auth_fields
    let authFieldsJson = [];
    if (auth_fields && Array.isArray(auth_fields)) {
      authFieldsJson = auth_fields;
    }
    
    const result = await db.query(`
      INSERT INTO systems_catalog (name, type, integration_type, auth_fields, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      name.trim(),
      type,
      integration_type,
      JSON.stringify(authFieldsJson),
      description || null
    ]);
    
    // Buscar o registro criado
    const newSystem = await db.query(`
      SELECT * FROM systems_catalog WHERE id = $1
    `, [result[0].id]);
    
    const system = {
      ...newSystem[0],
      auth_fields: newSystem[0].auth_fields ? JSON.parse(newSystem[0].auth_fields) : []
    };
    
    res.status(201).json({
      success: true,
      system,
      message: `Sistema "${name}" criado com sucesso!`
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar sistema:', error);
    
    if (error.code === '23505') { // PostgreSQL duplicate key error
      res.status(400).json({
        success: false,
        message: `Sistema "${req.body.name}" já existe`
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

// PUT /api/systems-catalog/:id - Atualizar sistema existente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, integration_type, auth_fields, description, is_active } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do sistema é obrigatório e deve ser um número'
      });
    }
    
    // Verificar se sistema existe
    const existing = await db.query(
      'SELECT id FROM systems_catalog WHERE id = $1',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sistema não encontrado'
      });
    }
    
    // Construir query dinâmica apenas com campos fornecidos
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name.trim());
      paramIndex++;
    }
    
    if (type !== undefined) {
      if (!['pms', 'motor', 'channel'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo deve ser: pms, motor ou channel'
        });
      }
      updates.push(`type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }
    
    if (integration_type !== undefined) {
      if (!['api', 'link'].includes(integration_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de integração deve ser: api ou link'
        });
      }
      updates.push(`integration_type = $${paramIndex}`);
      values.push(integration_type);
      paramIndex++;
    }
    
    if (auth_fields !== undefined) {
      updates.push(`auth_fields = $${paramIndex}`);
      values.push(JSON.stringify(auth_fields || []));
      paramIndex++;
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(Boolean(is_active));
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar fornecido'
      });
    }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    await db.query(`
      UPDATE systems_catalog 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, values);
    
    // Buscar sistema atualizado
    const updated = await db.query(
      'SELECT * FROM systems_catalog WHERE id = $1',
      [id]
    );
    
    const system = {
      ...updated[0],
      auth_fields: updated[0].auth_fields ? JSON.parse(updated[0].auth_fields) : []
    };
    
    res.json({
      success: true,
      system,
      message: 'Sistema atualizado com sucesso!'
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar sistema:', error);
    
    if (error.code === '23505') { // PostgreSQL duplicate key error
      res.status(400).json({
        success: false,
        message: `Sistema "${req.body.name}" já existe`
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

// DELETE /api/systems-catalog/:id - Remover sistema (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do sistema é obrigatório e deve ser um número'
      });
    }
    
    // Verificar se sistema existe
    const existing = await db.query(
      'SELECT id, name FROM systems_catalog WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sistema não encontrado'
      });
    }
    
    // Verificar se existem integrações usando este sistema
    const integrations = await db.query(
      'SELECT COUNT(*) as count FROM pms_motor_channel WHERE system_id = $1',
      [id]
    );
    
    if (integrations[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Não é possível remover o sistema "${existing[0].name}" pois existem ${integrations[0].count} integrações ativas usando este sistema`
      });
    }
    
    // Soft delete
    await db.query(
      'UPDATE systems_catalog SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [id]
    );
    
    res.json({
      success: true,
      message: `Sistema "${existing[0].name}" removido com sucesso!`
    });
    
  } catch (error) {
    console.error('❌ Erro ao remover sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/systems-catalog/types/:type - Listar sistemas por tipo
router.get('/types/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['pms', 'motor', 'channel'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo deve ser: pms, motor ou channel'
      });
    }
    
    const rows = await db.query(`
      SELECT 
        id,
        name,
        type,
        integration_type,
        auth_fields,
        description
      FROM systems_catalog 
      WHERE type = $1 AND is_active = TRUE
      ORDER BY name
    `, [type]);
    
    const systems = rows.map(row => ({
      ...row,
      auth_fields: row.auth_fields ? JSON.parse(row.auth_fields) : []
    }));
    
    res.json({
      success: true,
      systems,
      message: `${systems.length} sistemas do tipo "${type}" encontrados`
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar sistemas por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;