const express = require('express');
const router = express.Router();
const db = require('../config/database');

console.log('🔗 Workspace-instances routes loaded - UPDATED v2');

/**
 * GET /api/workspace-instances/test-migration
 * Rota para testar e executar migração da coluna custom_name
 */
router.get('/test-migration', async (req, res) => {
    try {
        console.log('🔧 Testando migração da coluna custom_name...');

        // Executar migração diretamente
        try {
            await db.query(`ALTER TABLE workspace_instances ADD COLUMN custom_name VARCHAR(255)`);
            console.log('✅ Coluna custom_name adicionada com sucesso');
            res.json({
                success: true,
                message: 'Coluna custom_name adicionada com sucesso'
            });
        } catch (alterError) {
            if (alterError.code === '42701') {
                console.log('ℹ️ Coluna custom_name já existe');
                res.json({
                    success: true,
                    message: 'Coluna custom_name já existe'
                });
            } else {
                throw alterError;
            }
        }
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na migração',
            error: error.message
        });
    }
});

/**
 * GET /api/workspace-instances/:workspaceUuid
 * Listar todas as instâncias vinculadas a uma workspace
 */
router.get('/:workspaceUuid', async (req, res) => {
    try {
        const { workspaceUuid } = req.params;

        console.log(`🔗 Buscando instâncias vinculadas à workspace: ${workspaceUuid}`);

        // Criar tabela se não existir (fallback para desenvolvimento)
        await createTableIfNotExists();

        // Verificar se coluna custom_name existe antes de incluí-la na query
        let query;
        try {
            const columnCheck = await db.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'workspace_instances'
                AND column_name = 'custom_name'
            `);

            if (columnCheck && columnCheck.length > 0) {
                // Coluna existe, usar query completa
                query = `
                    SELECT
                        instance_name,
                        custom_name,
                        created_at,
                        updated_at
                    FROM workspace_instances
                    WHERE workspace_uuid = $1
                    ORDER BY created_at DESC
                `;
            } else {
                // Coluna não existe, usar query sem custom_name
                query = `
                    SELECT
                        instance_name,
                        NULL as custom_name,
                        created_at,
                        updated_at
                    FROM workspace_instances
                    WHERE workspace_uuid = $1
                    ORDER BY created_at DESC
                `;

                // Tentar adicionar a coluna
                try {
                    await db.query(`ALTER TABLE workspace_instances ADD COLUMN custom_name VARCHAR(255)`);
                    console.log('✅ Coluna custom_name adicionada automaticamente');
                } catch (alterError) {
                    if (alterError.code !== '42701') { // Não é erro de coluna já existir
                        console.error('❌ Erro ao adicionar coluna custom_name:', alterError.message);
                    }
                }
            }
        } catch (checkError) {
            console.error('❌ Erro ao verificar coluna custom_name:', checkError.message);
            // Fallback para query sem custom_name
            query = `
                SELECT
                    instance_name,
                    NULL as custom_name,
                    created_at,
                    updated_at
                FROM workspace_instances
                WHERE workspace_uuid = $1
                ORDER BY created_at DESC
            `;
        }

        // Debug: verificar se há dados na tabela
        const countQuery = `SELECT COUNT(*) as total FROM workspace_instances`;
        const countResult = await db.query(countQuery);
        console.log(`🔍 Total de registros na tabela: ${countResult?.[0]?.total || 0}`);

        console.log(`🔍 Executando query com UUID: ${workspaceUuid}`);
        let result;
        try {
            result = await db.query(query, [workspaceUuid]);
            console.log(`🔍 Query executada. Rows length: ${result?.length || 0}`);
            if (result?.length > 0) {
                console.log(`🔍 Primeiro resultado:`, result[0]);
            }
        } catch (queryError) {
            console.error(`❌ Erro na query:`, queryError);
            throw queryError;
        }

        console.log(`✅ Encontradas ${result?.length || 0} instâncias vinculadas`);

        res.json({
            success: true,
            data: result || [],
            count: result?.length || 0
        });

    } catch (error) {
        console.error('❌ Erro ao buscar instâncias vinculadas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

/**
 * POST /api/workspace-instances
 * Vincular uma instância a uma workspace
 */
router.post('/', async (req, res) => {
    try {
        const { workspace_uuid, instance_name, custom_name } = req.body;

        if (!workspace_uuid || !instance_name) {
            return res.status(400).json({
                success: false,
                message: 'workspace_uuid e instance_name são obrigatórios'
            });
        }

        console.log(`🔗 Vinculando instância ${instance_name} à workspace ${workspace_uuid}`);

        // Criar tabela se não existir (fallback para desenvolvimento)
        await createTableIfNotExists();

        // Verificar se o vínculo já existe
        const checkQuery = `
            SELECT id FROM workspace_instances
            WHERE workspace_uuid = $1 AND instance_name = $2
        `;
        const existing = await db.query(checkQuery, [workspace_uuid, instance_name]);

        if (existing?.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Instância já está vinculada a esta workspace'
            });
        }

        // Criar o vínculo
        const insertQuery = `
            INSERT INTO workspace_instances (workspace_uuid, instance_name, custom_name)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await db.query(insertQuery, [workspace_uuid, instance_name, custom_name || null]);
        console.log(`🔍 Resultado da inserção:`, result);

        console.log(`✅ Instância ${instance_name} vinculada com sucesso`);

        res.status(201).json({
            success: true,
            message: 'Instância vinculada com sucesso',
            data: result?.[0] || {}
        });

    } catch (error) {
        console.error('❌ Erro ao vincular instância:', error);

        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({
                success: false,
                message: 'Workspace não encontrada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

/**
 * PUT /api/workspace-instances/update-custom-name
 * Atualizar o nome personalizado de uma instância (endpoint alternativo)
 */
router.put('/update-custom-name', async (req, res) => {
    try {
        const { workspaceUuid, instanceName, custom_name } = req.body;

        if (!workspaceUuid || !instanceName) {
            return res.status(400).json({
                success: false,
                message: 'workspaceUuid e instanceName são obrigatórios'
            });
        }

        console.log(`🏷️ [ALTERNATIVO] Atualizando nome personalizado da instância ${instanceName} para: ${custom_name}`);

        // Criar tabela se não existir (fallback para desenvolvimento)
        await createTableIfNotExists();

        const updateQuery = `
            UPDATE workspace_instances
            SET custom_name = $1, updated_at = CURRENT_TIMESTAMP
            WHERE workspace_uuid = $2 AND instance_name = $3
            RETURNING *
        `;

        const result = await db.query(updateQuery, [custom_name || null, workspaceUuid, instanceName]);

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vínculo não encontrado'
            });
        }

        console.log(`✅ [ALTERNATIVO] Nome personalizado atualizado com sucesso`);

        res.json({
            success: true,
            message: 'Nome personalizado atualizado com sucesso',
            data: result[0]
        });

    } catch (error) {
        console.error('❌ [ALTERNATIVO] Erro ao atualizar nome personalizado:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

/**
 * PUT /api/workspace-instances/:workspaceUuid/:instanceName/custom-name
 * Atualizar o nome personalizado de uma instância
 */
router.put('/:workspaceUuid/:instanceName/custom-name', async (req, res) => {
    try {
        const { workspaceUuid, instanceName } = req.params;
        const { custom_name } = req.body;

        console.log(`🏷️ Atualizando nome personalizado da instância ${instanceName} para: ${custom_name}`);

        // Criar tabela se não existir (fallback para desenvolvimento)
        await createTableIfNotExists();

        const updateQuery = `
            UPDATE workspace_instances
            SET custom_name = $1, updated_at = CURRENT_TIMESTAMP
            WHERE workspace_uuid = $2 AND instance_name = $3
            RETURNING *
        `;

        const result = await db.query(updateQuery, [custom_name || null, workspaceUuid, instanceName]);

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vínculo não encontrado'
            });
        }

        console.log(`✅ Nome personalizado atualizado com sucesso`);

        res.json({
            success: true,
            message: 'Nome personalizado atualizado com sucesso',
            data: result[0]
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar nome personalizado:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

/**
 * DELETE /api/workspace-instances/:workspaceUuid/:instanceName
 * Desvincular uma instância de uma workspace
 */
router.delete('/:workspaceUuid/:instanceName', async (req, res) => {
    try {
        const { workspaceUuid, instanceName } = req.params;

        console.log(`🔗 Desvinculando instância ${instanceName} da workspace ${workspaceUuid}`);

        // Criar tabela se não existir (fallback para desenvolvimento)
        await createTableIfNotExists();

        const deleteQuery = `
            DELETE FROM workspace_instances
            WHERE workspace_uuid = $1 AND instance_name = $2
            RETURNING *
        `;

        const result = await db.query(deleteQuery, [workspaceUuid, instanceName]);

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vínculo não encontrado'
            });
        }

        console.log(`✅ Instância ${instanceName} desvinculada com sucesso`);

        res.json({
            success: true,
            message: 'Instância desvinculada com sucesso',
            data: result?.[0] || {}
        });

    } catch (error) {
        console.error('❌ Erro ao desvincular instância:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

/**
 * Função helper para criar a tabela se não existir
 * Útil para desenvolvimento quando as migrações não foram executadas
 */
async function createTableIfNotExists() {
    try {
        console.log('🔧 Criando tabela workspace_instances se não existir...');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS workspace_instances (
                id SERIAL PRIMARY KEY,
                workspace_uuid UUID NOT NULL,
                instance_name VARCHAR(255) NOT NULL,
                custom_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(workspace_uuid, instance_name)
            );

            CREATE INDEX IF NOT EXISTS idx_workspace_instances_workspace_uuid ON workspace_instances(workspace_uuid);
            CREATE INDEX IF NOT EXISTS idx_workspace_instances_instance_name ON workspace_instances(instance_name);
        `;

        await db.query(createTableQuery);
        console.log('✅ Tabela workspace_instances criada/verificada com sucesso');

        // Verificar se a coluna custom_name existe, e adicionar se necessário
        console.log('🔧 Verificando se coluna custom_name existe...');
        try {
            // Verificar se a coluna existe
            const columnCheck = await db.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'workspace_instances'
                AND column_name = 'custom_name'
            `);

            if (!columnCheck || columnCheck.length === 0) {
                console.log('🔧 Coluna custom_name não existe, adicionando...');
                await db.query(`ALTER TABLE workspace_instances ADD COLUMN custom_name VARCHAR(255)`);
                console.log('✅ Coluna custom_name adicionada com sucesso');
            } else {
                console.log('ℹ️ Coluna custom_name já existe');
            }
        } catch (alterError) {
            // Se o erro for porque a coluna já existe, não é problema
            if (alterError.code === '42701') {
                console.log('ℹ️ Coluna custom_name já existe (erro capturado)');
            } else {
                console.error('❌ Erro ao verificar/adicionar coluna custom_name:', alterError.message);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao criar tabela workspace_instances:', error.message);
        throw error;
    }
}

module.exports = router;