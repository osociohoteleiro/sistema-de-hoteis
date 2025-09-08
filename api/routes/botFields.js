const express = require('express');
const router = express.Router();
const pgDb = require('../config/postgres');

/**
 * GET /api/bot-fields/:hotel_uuid
 * Buscar campos do bot por hotel (compatível com N8N)
 */
router.get('/:hotel_uuid', async (req, res) => {
    try {
        const { hotel_uuid } = req.params;
        
        console.log(`📋 Endpoint: Buscando campos do bot para hotel ${hotel_uuid}...`);
        
        // Buscar campos do OneNode para o hotel usando a estrutura real da tabela
        const onenodeFields = await pgDb.query(`
            SELECT 
                obf.id,
                obf.name,
                obf.var_ns,
                obf.var_type,
                obf.description,
                obf.value,
                obf.hotel_uuid,
                'onenode' as source
            FROM onenode_bot_fields obf
            WHERE obf.hotel_uuid = $1
            ORDER BY obf.name
        `, [hotel_uuid]);
        
        // Buscar campos gerais do bot (tabela bot_fields existente)
        const generalFields = await pgDb.query(`
            SELECT 
                bf.id,
                bf.field_key,
                bf.field_value,
                bf.field_type,
                bf.description,
                bf.category,
                bf.created_at,
                bf.updated_at,
                'general' as source
            FROM bot_fields bf
            JOIN hotels h ON h.id = bf.hotel_id
            WHERE h.hotel_uuid = $1 AND bf.active = true
            ORDER BY bf.category, bf.field_key
        `, [hotel_uuid]);
        
        // Combinar os campos
        const allFields = [
            ...onenodeFields,
            ...generalFields
        ];
        
        // Formatar resposta compatível com frontend
        const formattedFields = allFields.map(field => ({
            id: field.id,
            key: field.var_ns || field.field_key,
            name: field.name || field.field_key,
            value: field.value || field.field_value,
            type: field.var_type || field.field_type,
            description: field.description,
            category: field.category || 'General',
            is_required: field.is_required || false,
            is_custom: field.is_custom !== undefined ? field.is_custom : true,
            source: field.source,
            created_at: field.created_at,
            updated_at: field.updated_at
        }));
        
        console.log(`✅ ${formattedFields.length} campos encontrados para hotel ${hotel_uuid}`);
        
        res.json({
            success: true,
            data: formattedFields,
            count: formattedFields.length,
            hotel_uuid: hotel_uuid
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar campos do bot:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao buscar campos do bot'
        });
    }
});

/**
 * POST /api/bot-fields/update
 * Atualizar campo do bot (compatível com N8N)
 */
router.post('/update', async (req, res) => {
    try {
        const { hotel_uuid, var_ns, name, value, var_type = 'STRING', description, source = 'onenode' } = req.body;
        
        if (!hotel_uuid || !var_ns || !name) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: hotel_uuid, var_ns, name',
                message: 'Dados incompletos'
            });
        }
        
        console.log(`🔄 Endpoint: Atualizando campo "${var_ns}" (${name}) para hotel ${hotel_uuid}...`);
        
        if (source === 'onenode') {
            // Atualizar na tabela onenode_bot_fields usando INSERT ON CONFLICT (UPSERT)
            const result = await pgDb.query(`
                INSERT INTO onenode_bot_fields 
                (hotel_uuid, name, var_ns, var_type, description, value) 
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (hotel_uuid, var_ns) 
                DO UPDATE SET 
                name = EXCLUDED.name,
                var_type = EXCLUDED.var_type,
                description = EXCLUDED.description,
                value = EXCLUDED.value
                RETURNING id
            `, [hotel_uuid, name, var_ns, var_type, description, value]);
            
            console.log(`✅ Campo OneNode "${var_ns}" (${name}) atualizado. Result: ${result.length > 0 ? 'Success' : 'Failed'}`);
        } else {
            // Atualizar na tabela bot_fields (requer hotel_id)
            const hotelRows = await pgDb.query(
                'SELECT id FROM hotels WHERE hotel_uuid = $1',
                [hotel_uuid]
            );
            
            if (hotelRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Hotel não encontrado',
                    message: 'Hotel UUID inválido'
                });
            }
            
            const hotel_id = hotelRows[0].id;
            
            const result = await pgDb.query(`
                INSERT INTO bot_fields 
                (hotel_id, field_key, field_value, field_type, category, description, active) 
                VALUES ($1, $2, $3, $4, $5, $6, true)
                ON CONFLICT (hotel_id, field_key) 
                DO UPDATE SET 
                field_value = EXCLUDED.field_value,
                field_type = EXCLUDED.field_type,
                category = EXCLUDED.category,
                description = EXCLUDED.description,
                updated_at = CURRENT_TIMESTAMP
                RETURNING id
            `, [hotel_id, var_ns, value, var_type, 'General', description]);
            
            console.log(`✅ Campo geral "${var_ns}" atualizado. Result: ${result.length > 0 ? 'Success' : 'Failed'}`);
        }
        
        res.json({
            success: true,
            message: `Campo "${var_ns}" (${name}) atualizado com sucesso`,
            var_ns: var_ns,
            name: name,
            value: value,
            hotel_uuid: hotel_uuid
        });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar campo do bot:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao atualizar campo do bot'
        });
    }
});

/**
 * POST /api/bot-fields/update-all
 * Atualizar múltiplos campos do bot (compatível com N8N)
 */
router.post('/update-all', async (req, res) => {
    try {
        const { hotel_uuid, fields } = req.body;
        
        if (!hotel_uuid || !fields || !Array.isArray(fields)) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: hotel_uuid, fields (array)',
                message: 'Dados incompletos'
            });
        }
        
        console.log(`🔄 Endpoint: Atualizando ${fields.length} campos para hotel ${hotel_uuid}...`);
        
        const result = await pgDb.transaction(async (client) => {
            let updatedCount = 0;
            let errors = [];
            
            for (const field of fields) {
                const { var_ns, name, value, var_type = 'STRING', description, source = 'onenode' } = field;
                
                if (!var_ns || !name) {
                    errors.push(`Campo sem var_ns ou name: ${JSON.stringify(field)}`);
                    continue;
                }
                
                try {
                    if (source === 'onenode') {
                        // Atualizar na tabela onenode_bot_fields usando INSERT ON CONFLICT (UPSERT)
                        const result = await client.query(`
                            INSERT INTO onenode_bot_fields 
                            (hotel_uuid, name, var_ns, var_type, description, value) 
                            VALUES ($1, $2, $3, $4, $5, $6)
                            ON CONFLICT (hotel_uuid, var_ns) 
                            DO UPDATE SET 
                            name = EXCLUDED.name,
                            var_type = EXCLUDED.var_type,
                            description = EXCLUDED.description,
                            value = EXCLUDED.value
                            RETURNING id
                        `, [hotel_uuid, name, var_ns, var_type, description, value]);
                        
                        if (result.rows.length > 0) {
                            updatedCount++;
                        }
                    } else {
                        // Atualizar na tabela bot_fields (requer hotel_id)
                        const hotelRows = await client.query(
                            'SELECT id FROM hotels WHERE hotel_uuid = $1',
                            [hotel_uuid]
                        );
                        
                        if (hotelRows.rows.length === 0) {
                            errors.push(`Hotel não encontrado para UUID: ${hotel_uuid}`);
                            continue;
                        }
                        
                        const hotel_id = hotelRows.rows[0].id;
                        
                        const result = await client.query(`
                            INSERT INTO bot_fields 
                            (hotel_id, field_key, field_value, field_type, category, description, active) 
                            VALUES ($1, $2, $3, $4, $5, $6, true)
                            ON CONFLICT (hotel_id, field_key) 
                            DO UPDATE SET 
                            field_value = EXCLUDED.field_value,
                            field_type = EXCLUDED.field_type,
                            category = EXCLUDED.category,
                            description = EXCLUDED.description,
                            updated_at = CURRENT_TIMESTAMP
                            RETURNING id
                        `, [hotel_id, var_ns, value, var_type, 'General', description]);
                        
                        if (result.rows.length > 0) {
                            updatedCount++;
                        }
                    }
                } catch (fieldError) {
                    errors.push(`Erro no campo ${var_ns}: ${fieldError.message}`);
                }
            }
            
            console.log(`✅ ${updatedCount} campos atualizados para hotel ${hotel_uuid}`);
            if (errors.length > 0) {
                console.warn(`⚠️ ${errors.length} erros durante atualização:`, errors);
            }
            
            return { updatedCount, errors };
        });
        
        res.json({
            success: true,
            message: `${result.updatedCount} campos atualizados com sucesso`,
            updated_count: result.updatedCount,
            total_fields: fields.length,
            errors: result.errors.length > 0 ? result.errors : undefined,
            hotel_uuid: hotel_uuid
        });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar campos do bot:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao atualizar campos do bot'
        });
    }
});

/**
 * POST /api/bot-fields/sync-from-onenode
 * Buscar campos personalizados do OneNode via API real da Uchat
 */
router.post('/sync-from-onenode', async (req, res) => {
    try {
        const { hotel_uuid, workspace_id } = req.body;
        
        if (!hotel_uuid || !workspace_id) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: hotel_uuid, workspace_id',
                message: 'Dados incompletos'
            });
        }
        
        console.log(`🔄 Sincronizando campos do OneNode para hotel ${hotel_uuid}, workspace ${workspace_id}...`);
        
        // Buscar credenciais do OneNode na tabela Integracoes
        const integrationRows = await pgDb.query(`
            SELECT apikey, url_api, instancia_name 
            FROM Integracoes 
            WHERE hotel_uuid = $1 AND integration_name = 'onenode'
        `, [hotel_uuid]);
        
        if (integrationRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Integração OneNode não encontrada',
                message: 'Configure primeiro a integração OneNode para este hotel'
            });
        }
        
        const integration = integrationRows[0];
        console.log(`🔑 Credenciais OneNode encontradas: ${integration.instancia_name}`);
        
        // Buscar dados do workspace (para validação)
        const workspaceRows = await pgDb.query(
            'SELECT * FROM onenode_workspaces WHERE id = $1 AND hotel_uuid = $2 AND active = true',
            [workspace_id, hotel_uuid]
        );
        
        if (workspaceRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Workspace não encontrado',
                message: 'Workspace inválido para este hotel'
            });
        }
        
        let apiFields = [];
        
        try {
            // Chamar API da Uchat com paginação (limite de 100 como N8N)
            const baseApiUrl = 'https://www.uchat.com.au/api/flow/bot-fields';
            console.log(`🌐 Conectando à API Uchat: ${baseApiUrl}`);
            
            // Limpar e formatar API Key corretamente
            let cleanApiKey = integration.apikey.trim();
            if (cleanApiKey.startsWith('Bearer ')) {
                cleanApiKey = cleanApiKey.replace(/^Bearer\s+/, ''); // Remove "Bearer" e espaços extras
            }
            console.log(`🔑 Usando API Key: Bearer ${cleanApiKey.substring(0, 10)}...`);
            
            const headers = {
                'Authorization': `Bearer ${cleanApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            let currentPage = 1;
            let totalFields = 0;
            const maxPages = 10; // Limite de segurança
            const perPageLimit = 100; // Mesmo limite do N8N
            
            console.log(`📄 Buscando todos os campos (limite ${perPageLimit} por página)...`);
            
            while (currentPage <= maxPages) {
                const apiUrl = `${baseApiUrl}?page=${currentPage}&per_page=${perPageLimit}`;
                console.log(`📄 Página ${currentPage}: ${apiUrl}`);
                
                const response = await fetch(apiUrl, { method: 'GET', headers });
                console.log(`📡 Status da resposta página ${currentPage}: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Erro desconhecido');
                    console.error(`❌ Erro na API Uchat página ${currentPage}: ${response.status} - ${errorText}`);
                    throw new Error(`API Uchat retornou ${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                
                // Extrair campos da resposta
                let pageFields = [];
                if (Array.isArray(data)) {
                    pageFields = data;
                } else if (data.data && Array.isArray(data.data)) {
                    pageFields = data.data;
                } else if (data.bot_fields && Array.isArray(data.bot_fields)) {
                    pageFields = data.bot_fields;
                } else if (data.fields && Array.isArray(data.fields)) {
                    pageFields = data.fields;
                }
                
                if (pageFields.length > 0) {
                    apiFields.push(...pageFields);
                    totalFields += pageFields.length;
                    console.log(`✅ Página ${currentPage}: ${pageFields.length} campos adicionados (total: ${totalFields})`);
                }
                
                // Verificar se há mais páginas
                const hasNextPage = data.meta && data.meta.current_page < data.meta.last_page;
                
                if (!hasNextPage) {
                    console.log(`🏁 Última página alcançada (${currentPage})`);
                    break;
                }
                
                currentPage++;
            }
            
            console.log(`✅ Total de ${apiFields.length} campos coletados de ${currentPage} páginas`);
            
        } catch (apiError) {
            console.error('❌ Erro ao conectar com API Uchat:', apiError.message);
        }
        
        // Se não conseguiu buscar da API, não inserir campos fictícios
        if (apiFields.length === 0) {
            console.log('❌ Nenhum campo retornado da API Uchat - não inserindo dados fictícios');
            
            return res.status(400).json({
                success: false,
                error: 'API Uchat não retornou campos válidos',
                message: 'Verifique as credenciais OneNode ou tente novamente',
                inserted_count: 0,
                hotel_uuid: hotel_uuid,
                workspace_id: workspace_id,
                integration: integration.instancia_name
            });
        }
        
        // Normalizar campos para formato interno
        const normalizedFields = apiFields.map(field => {
            // Mapear tipos da API para tipos internos
            let fieldType = 'STRING';
            const type = (field.var_type || field.type || field.field_type || 'text').toLowerCase();
            
            if (type.includes('number') || type.includes('integer')) {
                fieldType = 'NUMBER';
            } else if (type.includes('boolean') || type.includes('bool')) {
                fieldType = 'BOOLEAN';
            } else if (type.includes('date')) {
                fieldType = 'DATE';
            } else if (type.includes('time')) {
                fieldType = 'TIME';
            } else if (type.includes('json') || type.includes('object') || type.includes('array')) {
                fieldType = 'JSON';
            }
            
            // Determinar categoria baseada no nome do campo
            let category = 'General';
            const fieldName = (field.name || field.key || field.field_key || '').toLowerCase();
            
            if (fieldName.includes('guest') || fieldName.includes('name') || fieldName.includes('user')) {
                category = 'Guest Info';
            } else if (fieldName.includes('reservation') || fieldName.includes('booking') || fieldName.includes('check')) {
                category = 'Booking';
            } else if (fieldName.includes('room')) {
                category = 'Room';
            } else if (fieldName.includes('contact') || fieldName.includes('email') || fieldName.includes('phone')) {
                category = 'Contact';
            }
            
            return {
                name: field.name || field.key || field.field_key,
                var_ns: field.name || field.key || field.field_key, // var_ns é a chave única
                value: field.default_value || field.value || '',
                var_type: fieldType,
                description: field.description || field.label || `Campo ${field.name || field.key}`,
                source: 'onenode'
            };
        });
        
        // Inserir campos no banco
        let insertedCount = 0;
        
        for (const field of normalizedFields) {
            if (!field.var_ns || !field.name) {
                console.warn('⚠️ Campo sem var_ns/name, pulando...');
                continue;
            }
            
            // Verificar se var_ns excede o limite de 32 caracteres
            if (field.var_ns.length > 32) {
                console.warn(`⚠️ Campo ${field.name} tem var_ns muito longo (${field.var_ns.length} chars): ${field.var_ns}`);
                console.warn(`🔧 Truncando var_ns para 32 caracteres...`);
                field.var_ns = field.var_ns.substring(0, 32);
            }
            
            try {
                // Usar INSERT ON CONFLICT (UPSERT)
                await pgDb.query(`
                    INSERT INTO onenode_bot_fields 
                    (hotel_uuid, name, var_ns, var_type, description, value) 
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (hotel_uuid, var_ns) 
                    DO UPDATE SET 
                    name = EXCLUDED.name,
                    var_type = EXCLUDED.var_type,
                    description = EXCLUDED.description,
                    value = EXCLUDED.value
                `, [hotel_uuid, field.name, field.var_ns, field.var_type, field.description, field.value]);
                
                insertedCount++;
                console.log(`✅ Campo ${field.name} inserido com sucesso`);
            } catch (fieldError) {
                console.warn(`⚠️ Erro ao inserir campo ${field.var_ns}:`, fieldError.message);
            }
        }
        
        console.log(`✅ ${insertedCount} campos sincronizados do OneNode para hotel ${hotel_uuid}`);
        
        res.json({
            success: true,
            message: `${insertedCount} campos sincronizados do OneNode`,
            inserted_count: insertedCount,
            hotel_uuid: hotel_uuid,
            workspace_id: workspace_id,
            integration: integration.instancia_name
        });
        
    } catch (error) {
        console.error('❌ Erro ao sincronizar campos do OneNode:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao sincronizar campos do OneNode'
        });
    }
});

/**
 * DELETE /api/bot-fields/:hotel_uuid/:field_id
 * Deletar campo do bot
 */
router.delete('/:hotel_uuid/:field_id', async (req, res) => {
    try {
        const { hotel_uuid, field_id } = req.params;
        
        if (!hotel_uuid || !field_id) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros obrigatórios: hotel_uuid, field_id',
                message: 'Dados incompletos'
            });
        }
        
        console.log(`🗑️ Endpoint: Deletando campo ${field_id} do hotel ${hotel_uuid}...`);
        
        // Tentar deletar da tabela onenode_bot_fields primeiro
        const onenodeResult = await pgDb.query(
            'DELETE FROM onenode_bot_fields WHERE id = $1 AND hotel_uuid = $2 RETURNING id',
            [field_id, hotel_uuid]
        );
        
        let deletedFrom = null;
        let affectedRows = onenodeResult.length;
        
        if (affectedRows > 0) {
            deletedFrom = 'onenode_bot_fields';
            console.log(`✅ Campo deletado da tabela onenode_bot_fields`);
        } else {
            // Se não encontrou em onenode_bot_fields, tentar na bot_fields
            const hotelRows = await pgDb.query(
                'SELECT id FROM hotels WHERE hotel_uuid = $1',
                [hotel_uuid]
            );
            
            if (hotelRows.length > 0) {
                const hotel_id = hotelRows[0].id;
                
                const generalResult = await pgDb.query(
                    'DELETE FROM bot_fields WHERE id = $1 AND hotel_id = $2 RETURNING id',
                    [field_id, hotel_id]
                );
                
                affectedRows = generalResult.length;
                if (affectedRows > 0) {
                    deletedFrom = 'bot_fields';
                    console.log(`✅ Campo deletado da tabela bot_fields`);
                }
            }
        }
        
        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Campo não encontrado',
                message: 'Campo não existe ou não pertence a este hotel'
            });
        }
        
        console.log(`✅ Campo ${field_id} deletado com sucesso da tabela ${deletedFrom}`);
        
        res.json({
            success: true,
            message: `Campo deletado com sucesso`,
            field_id: field_id,
            hotel_uuid: hotel_uuid,
            deleted_from: deletedFrom,
            affected_rows: affectedRows
        });
        
    } catch (error) {
        console.error('❌ Erro ao deletar campo do bot:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao deletar campo do bot'
        });
    }
});

module.exports = router;