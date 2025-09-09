const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const onenodeService = require('../services/onenodeService');

// Configuração do banco de dados
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'osh_hoteis'
};

/**
 * POST /api/onenode/cleanup-duplicates
 * Limpa workspaces duplicados mantendo apenas o mais recente por hotel
 */
router.post('/cleanup-duplicates', async (req, res) => {
    try {
        console.log('🧹 Executando limpeza: removendo workspaces duplicados...');
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Buscar hotéis com múltiplos workspaces
        const [duplicates] = await connection.execute(`
            SELECT hotel_uuid, COUNT(*) as count
            FROM onenode_workspaces 
            WHERE active = 1
            GROUP BY hotel_uuid
            HAVING count > 1
        `);
        
        let removedCount = 0;
        
        for (const duplicate of duplicates) {
            console.log(`🔍 Hotel ${duplicate.hotel_uuid} possui ${duplicate.count} workspaces`);
            
            // Buscar todos os workspaces deste hotel ordenados por data (mais recente primeiro)
            const [workspaces] = await connection.execute(
                'SELECT id, name, created_at FROM onenode_workspaces WHERE hotel_uuid = ? AND active = 1 ORDER BY created_at DESC',
                [duplicate.hotel_uuid]
            );
            
            // Manter apenas o primeiro (mais recente) e remover os outros
            for (let i = 1; i < workspaces.length; i++) {
                await connection.execute(
                    'UPDATE onenode_workspaces SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [workspaces[i].id]
                );
                console.log(`🗑️ Removido workspace ID ${workspaces[i].id} "${workspaces[i].name}"`);
                removedCount++;
            }
            
            console.log(`✅ Mantido workspace ID ${workspaces[0].id} "${workspaces[0].name}" (mais recente)`);
        }
        
        await connection.end();
        
        res.json({
            success: true,
            message: `Limpeza concluída: ${removedCount} workspaces duplicados removidos`,
            duplicateHotels: duplicates.length,
            removedWorkspaces: removedCount
        });
        
    } catch (error) {
        console.error('❌ Erro na limpeza:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao executar limpeza'
        });
    }
});

/**
 * POST /api/onenode/migrate
 * Rota temporária para adicionar coluna URL
 */
router.post('/migrate', async (req, res) => {
    try {
        console.log('🔧 Executando migração: adicionar coluna url...');
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se a coluna já existe
        const [columns] = await connection.execute(
            "SHOW COLUMNS FROM onenode_workspaces LIKE 'url'"
        );
        
        if (columns.length === 0) {
            // Adicionar coluna url
            await connection.execute(
                "ALTER TABLE onenode_workspaces ADD COLUMN url VARCHAR(255) NOT NULL DEFAULT 'https://www.uchat.com.au/api/flow/' AFTER api_key"
            );
            
            // Atualizar registros existentes
            await connection.execute(
                "UPDATE onenode_workspaces SET url = 'https://www.uchat.com.au/api/flow/' WHERE url IS NULL OR url = ''"
            );
            
            console.log('✅ Coluna url adicionada com sucesso');
            
            await connection.end();
            
            res.json({
                success: true,
                message: 'Migração executada: coluna url adicionada com sucesso'
            });
        } else {
            await connection.end();
            
            res.json({
                success: true,
                message: 'Coluna url já existe na tabela'
            });
        }
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao executar migração'
        });
    }
});

/**
 * GET /api/onenode/workspaces/:hotel_uuid
 * Lista workspaces do Onenode por hotel
 */
router.get('/workspaces/:hotel_uuid', async (req, res) => {
    try {
        const { hotel_uuid } = req.params;
        
        console.log(`📋 Endpoint: Listando workspaces Onenode para hotel ${hotel_uuid}...`);
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [rows] = await connection.execute(
            'SELECT * FROM onenode_workspaces WHERE hotel_uuid = ? AND active = 1 ORDER BY created_at DESC',
            [hotel_uuid]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            data: rows,
            count: rows.length,
            message: `${rows.length} workspace(s) encontrado(s)`
        });
        
    } catch (error) {
        console.error('❌ Erro ao listar workspaces Onenode:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao listar workspaces Onenode'
        });
    }
});

/**
 * POST /api/onenode/workspaces
 * Cria novo workspace do Onenode
 */
router.post('/workspaces', async (req, res) => {
    try {
        const { name, api_key, hotel_uuid, url } = req.body;
        
        if (!name || !api_key || !hotel_uuid) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: name, api_key, hotel_uuid',
                message: 'Dados incompletos'
            });
        }
        
        // URL padrão se não fornecida
        const workspaceUrl = url || 'https://www.uchat.com.au/api/flow/';
        
        console.log(`✨ Endpoint: Criando workspace Onenode "${name}" para hotel ${hotel_uuid}...`);
        
        const connection = await mysql.createConnection(dbConfig);
        
        // REGRA: Um hotel só pode ter um workspace Onenode (relacionamento 1:1)
        const [existing] = await connection.execute(
            'SELECT id FROM onenode_workspaces WHERE hotel_uuid = ? AND active = 1',
            [hotel_uuid]
        );
        
        if (existing.length > 0) {
            await connection.end();
            return res.status(400).json({
                success: false,
                error: 'Este hotel já possui um workspace Onenode ativo',
                message: 'Apenas um workspace por hotel é permitido'
            });
        }
        
        // Verificar se o hotel existe
        const [hotelRows] = await connection.execute(
            'SELECT hotel_uuid FROM hotels WHERE hotel_uuid = ?',
            [hotel_uuid]
        );
        
        if (hotelRows.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado',
                message: 'Hotel UUID inválido'
            });
        }
        
        // Inserir novo workspace
        const [result] = await connection.execute(
            'INSERT INTO onenode_workspaces (name, api_key, url, hotel_uuid, active) VALUES (?, ?, ?, ?, 1)',
            [name, api_key, workspaceUrl, hotel_uuid]
        );
        
        // Buscar o workspace criado
        const [newWorkspace] = await connection.execute(
            'SELECT * FROM onenode_workspaces WHERE id = ?',
            [result.insertId]
        );
        
        await connection.end();
        
        // Criar integração OneNode automaticamente
        try {
            await onenodeService.createOnenodeIntegration(hotel_uuid, name, api_key, workspaceUrl);
            console.log('✅ Integração OneNode criada automaticamente');
        } catch (integrationError) {
            console.warn('⚠️ Aviso: Erro ao criar integração OneNode automaticamente:', integrationError.message);
            // Não interrompe o processo, apenas registra o aviso
        }
        
        // Sincronizar campos personalizados do OneNode automaticamente
        try {
            console.log('🔄 Sincronizando campos personalizados do OneNode...');
            
            // Chamar endpoint interno de sincronização
            const syncResponse = await fetch('http://localhost:3001/api/bot-fields/sync-from-onenode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hotel_uuid: hotel_uuid,
                    workspace_id: result.insertId
                })
            });
            
            if (syncResponse.ok) {
                const syncResult = await syncResponse.json();
                console.log('✅ Campos do OneNode sincronizados automaticamente:', syncResult.inserted_count, 'campos');
            } else {
                console.warn('⚠️ Aviso: Erro ao sincronizar campos do OneNode automaticamente');
            }
        } catch (syncError) {
            console.warn('⚠️ Aviso: Erro ao sincronizar campos do OneNode automaticamente:', syncError.message);
            // Não interrompe o processo, apenas registra o aviso
        }
        
        res.status(201).json({
            success: true,
            data: newWorkspace[0],
            message: `Workspace "${name}" criado com sucesso`
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar workspace Onenode:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao criar workspace Onenode'
        });
    }
});

/**
 * PUT /api/onenode/workspaces/:id
 * Atualiza workspace do Onenode
 */
router.put('/workspaces/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, api_key, url } = req.body;
        
        if (!name || !api_key) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: name, api_key',
                message: 'Dados incompletos'
            });
        }
        
        // URL padrão se não fornecida
        const workspaceUrl = url || 'https://www.uchat.com.au/api/flow/';
        
        console.log(`🔄 Endpoint: Atualizando workspace Onenode ID ${id}...`);
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se o workspace existe
        const [existing] = await connection.execute(
            'SELECT * FROM onenode_workspaces WHERE id = ? AND active = 1',
            [id]
        );
        
        if (existing.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                error: 'Workspace não encontrado',
                message: 'Workspace não existe'
            });
        }
        
        // Como há apenas um workspace por hotel (1:1), não há necessidade de validar duplicatas
        // O workspace já foi validado na consulta anterior
        
        // Atualizar workspace
        await connection.execute(
            'UPDATE onenode_workspaces SET name = ?, api_key = ?, url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, api_key, workspaceUrl, id]
        );
        
        // Buscar o workspace atualizado
        const [updatedWorkspace] = await connection.execute(
            'SELECT * FROM onenode_workspaces WHERE id = ?',
            [id]
        );
        
        await connection.end();
        
        // Atualizar integração OneNode automaticamente
        try {
            if (updatedWorkspace[0] && updatedWorkspace[0].hotel_uuid) {
                await onenodeService.createOnenodeIntegration(updatedWorkspace[0].hotel_uuid, name, api_key, workspaceUrl);
                console.log('✅ Integração OneNode atualizada automaticamente');
            }
        } catch (integrationError) {
            console.warn('⚠️ Aviso: Erro ao atualizar integração OneNode automaticamente:', integrationError.message);
            // Não interrompe o processo, apenas registra o aviso
        }
        
        res.json({
            success: true,
            data: updatedWorkspace[0],
            message: `Workspace "${name}" atualizado com sucesso`
        });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar workspace Onenode:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao atualizar workspace Onenode'
        });
    }
});

/**
 * DELETE /api/onenode/workspaces/:id
 * Remove workspace do Onenode (soft delete)
 */
router.delete('/workspaces/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ Endpoint: Removendo workspace Onenode ID ${id}...`);
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Verificar se o workspace existe
        const [existing] = await connection.execute(
            'SELECT name FROM onenode_workspaces WHERE id = ? AND active = 1',
            [id]
        );
        
        if (existing.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                error: 'Workspace não encontrado',
                message: 'Workspace não existe'
            });
        }
        
        // Soft delete (marcar como inativo)
        await connection.execute(
            'UPDATE onenode_workspaces SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            message: `Workspace "${existing[0].name}" removido com sucesso`
        });
        
    } catch (error) {
        console.error('❌ Erro ao remover workspace Onenode:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao remover workspace Onenode'
        });
    }
});

module.exports = router;