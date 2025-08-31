const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');
const { getSystemConfig, validateCredentials, sanitizeCredentials } = require('../config/systems');

// Função auxiliar para criptografar credenciais
function encryptCredentials(credentials) {
    if (!credentials) return null;
    
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me!', 'utf8').slice(0, 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        iv: iv.toString('hex'),
        data: encrypted
    };
}

// Função auxiliar para descriptografar credenciais
function decryptCredentials(encryptedData) {
    if (!encryptedData || !encryptedData.iv || !encryptedData.data) return null;
    
    try {
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me!', 'utf8').slice(0, 32);
        const iv = Buffer.from(encryptedData.iv, 'hex');
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Erro ao descriptografar:', error);
        return null;
    }
}

/**
 * GET /api/pms-motor-channel/systems
 * Listar sistemas disponíveis e suas configurações
 */
router.get('/systems/list', async (req, res) => {
    try {
        const { type } = req.query;
        const systems = require('../config/systems').SYSTEM_CONFIGS;
        
        let filteredSystems = {};
        
        Object.keys(systems).forEach(name => {
            if (!type || systems[name].type === type || type === 'all') {
                filteredSystems[name] = {
                    name,
                    type: systems[name].type,
                    auth_type: systems[name].auth_type,
                    required_fields: systems[name].required_fields,
                    optional_fields: systems[name].optional_fields
                };
            }
        });
        
        res.json({
            success: true,
            data: filteredSystems
        });
        
    } catch (error) {
        console.error('❌ Erro ao listar sistemas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/pms-motor-channel/:hotel_uuid
 * Buscar registros PMS/Motor/Channel do hotel
 */
router.get('/:hotel_uuid', async (req, res) => {
    try {
        const { hotel_uuid } = req.params;
        console.log(`📋 Buscando registros PMS/Motor/Channel para hotel: ${hotel_uuid}`);
        
        const query = `
            SELECT 
                id,
                name,
                type,
                type_connect,
                auth_type,
                endpoint_url,
                is_active,
                hotel_uuid,
                created_at,
                updated_at,
                credentials
            FROM pms_motor_channel 
            WHERE hotel_uuid = ?
            ORDER BY created_at DESC
        `;
        
        const results = await db.query(query, [hotel_uuid]);
        
        // Descriptografar credenciais mas não retornar valores sensíveis
        const sanitizedResults = results.map(record => {
            if (record.credentials) {
                try {
                    const decrypted = decryptCredentials(JSON.parse(record.credentials));
                    // Retornar apenas as chaves, não os valores
                    record.credentials_fields = decrypted ? Object.keys(decrypted) : [];
                    delete record.credentials;
                } catch (e) {
                    record.credentials_fields = [];
                    delete record.credentials;
                }
            }
            return record;
        });
        
        res.json({
            success: true,
            data: sanitizedResults
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar registros PMS/Motor/Channel:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/pms-motor-channel/count/:hotel_uuid
 * Contar registros PMS/Motor/Channel do hotel
 */
router.get('/count/:hotel_uuid', async (req, res) => {
    try {
        const { hotel_uuid } = req.params;
        console.log(`🔢 Contando registros PMS/Motor/Channel para hotel: ${hotel_uuid}`);
        
        const query = `
            SELECT COUNT(*) as count
            FROM pms_motor_channel 
            WHERE hotel_uuid = ?
        `;
        
        const results = await db.query(query, [hotel_uuid]);
        const count = results[0]?.count || 0;
        
        res.json({
            success: true,
            count: count
        });
        
    } catch (error) {
        console.error('❌ Erro ao contar registros PMS/Motor/Channel:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            count: 0
        });
    }
});

/**
 * POST /api/pms-motor-channel
 * Criar novo registro PMS/Motor/Channel
 */
router.post('/', async (req, res) => {
    try {
        const { name, type, type_connect, hotel_uuid, credentials, auth_type, endpoint_url } = req.body;
        
        console.log('✨ Criando registro PMS/Motor/Channel:', { name, type, type_connect, hotel_uuid, auth_type });
        
        // Validar campos obrigatórios
        if (!name || !type || !type_connect || !hotel_uuid) {
            return res.status(400).json({
                success: false,
                error: 'Nome, tipo, tipo de conexão e hotel são obrigatórios'
            });
        }
        
        // Validar credenciais baseado no sistema
        if (credentials && name !== 'Outro') {
            const validation = validateCredentials(name, credentials);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Credenciais inválidas',
                    details: validation.errors
                });
            }
        }
        
        // Validar valores enum
        const validTypes = ['pms', 'motor', 'channel'];
        const validTypeConnects = ['api', 'link'];
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo inválido. Use: pms, motor ou channel'
            });
        }
        
        if (!validTypeConnects.includes(type_connect)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de integração inválido. Use: api ou link'
            });
        }
        
        // Verificar se o hotel já tem um registro (limite de 1 por hotel)
        const checkQuery = `
            SELECT COUNT(*) as count
            FROM pms_motor_channel 
            WHERE hotel_uuid = ?
        `;
        
        const existingResults = await db.query(checkQuery, [hotel_uuid]);
        const existingCount = existingResults[0]?.count || 0;
        
        if (existingCount > 0) {
            return res.status(400).json({
                success: false,
                error: 'Este hotel já possui um registro PMS/Motor/Channel. Limite: 1 registro por hotel.'
            });
        }
        
        // Criptografar credenciais se fornecidas
        const encryptedCredentials = credentials ? encryptCredentials(sanitizeCredentials(credentials)) : null;
        
        // Obter configuração do sistema para pegar endpoint padrão
        const systemConfig = getSystemConfig(name);
        const finalEndpoint = endpoint_url || systemConfig.default_endpoint || null;
        const finalAuthType = auth_type || systemConfig.auth_type || 'custom';
        
        // Inserir novo registro
        const insertQuery = `
            INSERT INTO pms_motor_channel (name, type, type_connect, hotel_uuid, credentials, auth_type, endpoint_url, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await db.query(insertQuery, [
            name, 
            type, 
            type_connect, 
            hotel_uuid,
            encryptedCredentials ? JSON.stringify(encryptedCredentials) : null,
            finalAuthType,
            finalEndpoint,
            true
        ]);
        
        // Buscar o registro criado
        const selectQuery = `
            SELECT * FROM pms_motor_channel 
            WHERE id = ?
        `;
        
        const newRecord = await db.query(selectQuery, [result.insertId]);
        
        console.log('✅ Registro PMS/Motor/Channel criado:', newRecord[0]);
        
        res.status(201).json({
            success: true,
            message: 'Registro criado com sucesso',
            data: newRecord[0]
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar registro PMS/Motor/Channel:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/pms-motor-channel/:id
 * Atualizar registro PMS/Motor/Channel
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, type_connect, credentials, auth_type, endpoint_url, is_active } = req.body;
        
        console.log(`🔄 Atualizando registro PMS/Motor/Channel ID ${id}:`, { name, type, type_connect, auth_type });
        
        // Validar campos
        if (!name || !type || !type_connect) {
            return res.status(400).json({
                success: false,
                error: 'Nome, tipo e tipo de conexão são obrigatórios'
            });
        }
        
        // Validar credenciais se fornecidas
        if (credentials && name !== 'Outro') {
            const validation = validateCredentials(name, credentials);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Credenciais inválidas',
                    details: validation.errors
                });
            }
        }
        
        // Validar valores enum
        const validTypes = ['pms', 'motor', 'channel'];
        const validTypeConnects = ['api', 'link'];
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo inválido. Use: pms, motor ou channel'
            });
        }
        
        if (!validTypeConnects.includes(type_connect)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de integração inválido. Use: api ou link'
            });
        }
        
        // Preparar dados para atualização
        let updateFields = ['name = ?', 'type = ?', 'type_connect = ?', 'updated_at = CURRENT_TIMESTAMP'];
        let updateValues = [name, type, type_connect];
        
        // Adicionar credenciais se fornecidas
        if (credentials !== undefined) {
            const encryptedCredentials = credentials ? encryptCredentials(sanitizeCredentials(credentials)) : null;
            updateFields.push('credentials = ?');
            updateValues.push(encryptedCredentials ? JSON.stringify(encryptedCredentials) : null);
        }
        
        // Adicionar auth_type se fornecido
        if (auth_type !== undefined) {
            updateFields.push('auth_type = ?');
            updateValues.push(auth_type);
        }
        
        // Adicionar endpoint_url se fornecido
        if (endpoint_url !== undefined) {
            updateFields.push('endpoint_url = ?');
            updateValues.push(endpoint_url);
        }
        
        // Adicionar is_active se fornecido
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }
        
        // Adicionar ID ao final dos valores
        updateValues.push(id);
        
        // Atualizar registro
        const updateQuery = `
            UPDATE pms_motor_channel 
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `;
        
        const result = await db.query(updateQuery, updateValues);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Registro não encontrado'
            });
        }
        
        // Buscar o registro atualizado
        const selectQuery = `
            SELECT * FROM pms_motor_channel 
            WHERE id = ?
        `;
        
        const updatedRecord = await db.query(selectQuery, [id]);
        
        console.log('✅ Registro PMS/Motor/Channel atualizado:', updatedRecord[0]);
        
        res.json({
            success: true,
            message: 'Registro atualizado com sucesso',
            data: updatedRecord[0]
        });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar registro PMS/Motor/Channel:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/pms-motor-channel/:id
 * Deletar registro PMS/Motor/Channel
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ Deletando registro PMS/Motor/Channel ID ${id}`);
        
        const deleteQuery = `
            DELETE FROM pms_motor_channel 
            WHERE id = ?
        `;
        
        const result = await db.query(deleteQuery, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Registro não encontrado'
            });
        }
        
        console.log('✅ Registro PMS/Motor/Channel deletado');
        
        res.json({
            success: true,
            message: 'Registro deletado com sucesso'
        });
        
    } catch (error) {
        console.error('❌ Erro ao deletar registro PMS/Motor/Channel:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;