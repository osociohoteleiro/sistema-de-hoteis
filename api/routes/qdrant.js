const express = require('express');
const router = express.Router();
const qdrantService = require('../services/qdrantService');

/**
 * GET /api/qdrant/test
 * Testa a conectividade com o Qdrant
 */
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Endpoint: Testando conexão com Qdrant...');
        const result = await qdrantService.testConnection();
        
        res.json(result);
    } catch (error) {
        console.error('❌ Erro no teste de conexão Qdrant:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message,
            message: 'Erro ao testar conexão com Qdrant'
        });
    }
});

/**
 * GET /api/qdrant/collections
 * Lista todas as collections (Qdrant + Base de dados)
 */
router.get('/collections', async (req, res) => {
    try {
        console.log('📋 Endpoint: Listando collections...');
        
        // Buscar collections do Qdrant
        const qdrantCollections = await qdrantService.getQdrantCollections();
        
        // Buscar collections da base de dados
        const dbCollections = await qdrantService.getDatabaseCollections();
        
        res.json({
            success: true,
            qdrant: {
                total: qdrantCollections.length,
                collections: qdrantCollections
            },
            database: {
                total: dbCollections.length,
                collections: dbCollections
            },
            message: 'Collections listadas com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao listar collections:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao listar collections'
        });
    }
});

/**
 * POST /api/qdrant/sync
 * Sincroniza collections do Qdrant com a base de dados
 */
router.post('/sync', async (req, res) => {
    try {
        console.log('🔄 Endpoint: Sincronizando collections...');
        
        const result = await qdrantService.syncCollections();
        
        res.json({
            success: true,
            ...result,
            message: 'Sincronização concluída com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao sincronizar collections'
        });
    }
});

/**
 * POST /api/qdrant/collections
 * Cria uma nova collection no Qdrant
 */
router.post('/collections', async (req, res) => {
    try {
        const { 
            collection_name, 
            vector_size = 1536, 
            distance_metric = 'Cosine', 
            hotel_id = null,
            hotel_uuid = null 
        } = req.body;

        if (!collection_name) {
            return res.status(400).json({
                success: false,
                error: 'Nome da collection é obrigatório',
                message: 'Parâmetros inválidos'
            });
        }

        console.log(`🚀 Endpoint: Criando collection ${collection_name} para hotel ${hotel_uuid || hotel_id}...`);
        
        const result = await qdrantService.createCollection(
            collection_name, 
            vector_size, 
            distance_metric, 
            hotel_id,
            hotel_uuid
        );
        
        res.json({
            success: true,
            ...result,
            message: 'Collection criada com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao criar collection:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao criar collection'
        });
    }
});

/**
 * DELETE /api/qdrant/collections/unrelate
 * Remove o relacionamento entre uma collection e um hotel
 */
router.delete('/collections/unrelate', async (req, res) => {
    try {
        const { collection_name, hotel_uuid } = req.body;

        if (!collection_name || !hotel_uuid) {
            return res.status(400).json({
                success: false,
                error: 'Nome da collection e UUID do hotel são obrigatórios',
                message: 'Parâmetros inválidos'
            });
        }

        console.log(`🔓 Endpoint: Removendo relacionamento da collection ${collection_name} do hotel ${hotel_uuid}...`);
        
        const result = await qdrantService.unrelateCollectionFromHotel(collection_name, hotel_uuid);
        
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao remover relacionamento da collection:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao remover relacionamento da collection'
        });
    }
});

/**
 * DELETE /api/qdrant/collections/:collection_name
 * Remove uma collection do Qdrant
 */
router.delete('/collections/:collection_name', async (req, res) => {
    try {
        const { collection_name } = req.params;

        if (!collection_name) {
            return res.status(400).json({
                success: false,
                error: 'Nome da collection é obrigatório',
                message: 'Parâmetros inválidos'
            });
        }

        console.log(`🗑️ Endpoint: Removendo collection ${collection_name}...`);
        
        const result = await qdrantService.deleteCollection(collection_name);
        
        res.json({
            success: true,
            ...result,
            message: 'Collection removida com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao remover collection:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao remover collection'
        });
    }
});

/**
 * GET /api/qdrant/collections/db/list
 * Lista apenas as collections da base de dados local
 */
router.get('/collections/db/list', async (req, res) => {
    try {
        console.log('📋 Endpoint: Listando collections da base de dados...');
        
        const dbCollections = await qdrantService.getDatabaseCollections();
        
        res.json({
            success: true,
            total: dbCollections.length,
            collections: dbCollections,
            message: 'Collections da base de dados listadas com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao listar collections da base de dados:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao listar collections da base de dados'
        });
    }
});

/**
 * GET /api/qdrant/collections/count/:hotel_uuid
 * Conta quantas collections um hotel específico possui
 */
router.get('/collections/count/:hotel_uuid', async (req, res) => {
    try {
        const { hotel_uuid } = req.params;

        if (!hotel_uuid) {
            return res.status(400).json({
                success: false,
                error: 'UUID do hotel é obrigatório',
                message: 'Parâmetros inválidos'
            });
        }

        console.log(`🔢 Endpoint: Contando collections do hotel ${hotel_uuid}...`);
        
        const result = await qdrantService.getHotelCollectionsCount(hotel_uuid);
        
        res.json({
            success: true,
            ...result,
            message: 'Contagem de collections realizada com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao contar collections do hotel:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao contar collections do hotel'
        });
    }
});

/**
 * GET /api/qdrant/collections/available
 * Lista todas as collections disponíveis para relacionar
 */
router.get('/collections/available', async (req, res) => {
    try {
        console.log('📋 Endpoint: Listando collections disponíveis...');
        
        const result = await qdrantService.getAvailableCollections();
        
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao listar collections disponíveis:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao listar collections disponíveis'
        });
    }
});

/**
 * POST /api/qdrant/collections/relate
 * Relaciona uma collection a um hotel específico
 */
router.post('/collections/relate', async (req, res) => {
    try {
        const { collection_name, hotel_uuid } = req.body;

        if (!collection_name || !hotel_uuid) {
            return res.status(400).json({
                success: false,
                error: 'Nome da collection e UUID do hotel são obrigatórios',
                message: 'Parâmetros inválidos'
            });
        }

        console.log(`🔗 Endpoint: Relacionando collection ${collection_name} ao hotel ${hotel_uuid}...`);
        
        const result = await qdrantService.relateCollectionToHotel(collection_name, hotel_uuid);
        
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao relacionar collection ao hotel:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao relacionar collection ao hotel'
        });
    }
});

/**
 * GET /api/qdrant/collections/hotel/:hotel_uuid
 * Lista collections relacionadas a um hotel específico
 */
router.get('/collections/hotel/:hotel_uuid', async (req, res) => {
    try {
        const { hotel_uuid } = req.params;

        if (!hotel_uuid) {
            return res.status(400).json({
                success: false,
                error: 'UUID do hotel é obrigatório',
                message: 'Parâmetros inválidos'
            });
        }

        console.log(`🔍 Endpoint: Listando collections do hotel ${hotel_uuid}...`);
        
        const result = await qdrantService.getHotelCollections(hotel_uuid);
        
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao listar collections do hotel:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao listar collections do hotel'
        });
    }
});

/**
 * GET /api/qdrant/collections/:collection_name
 * Obtém informações detalhadas de uma collection específica
 */
router.get('/collections/:collection_name', async (req, res) => {
    try {
        const { collection_name } = req.params;

        if (!collection_name) {
            return res.status(400).json({
                success: false,
                error: 'Nome da collection é obrigatório',
                message: 'Parâmetros inválidos'
            });
        }

        console.log(`🔍 Endpoint: Buscando informações da collection ${collection_name}...`);
        
        const collectionInfo = await qdrantService.getCollectionInfo(collection_name);
        
        res.json({
            success: true,
            collection_name,
            info: collectionInfo,
            message: 'Informações da collection obtidas com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao buscar informações da collection:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao buscar informações da collection'
        });
    }
});

/**
 * GET /api/qdrant/integrations/:hotel_uuid
 * Lista integrações Qdrant de um hotel específico
 */
router.get('/integrations/:hotel_uuid', async (req, res) => {
    try {
        const { hotel_uuid } = req.params;

        if (!hotel_uuid) {
            return res.status(400).json({
                success: false,
                error: 'UUID do hotel é obrigatório',
                message: 'Parâmetros inválidos'
            });
        }

        console.log(`🔍 Endpoint: Buscando integrações Qdrant do hotel ${hotel_uuid}...`);
        
        const db = require('../config/database');
        const integrations = await db.query(`
            SELECT 
                id,
                integration_name,
                hotel_uuid,
                apikey,
                instancia_name,
                url_api
            FROM Integracoes 
            WHERE hotel_uuid = ? AND integration_name = 'Qdrant'
        `, [hotel_uuid]);
        
        res.json({
            success: true,
            hotel_uuid,
            total: integrations.length,
            integrations: integrations,
            message: 'Integrações Qdrant listadas com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao listar integrações Qdrant:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao listar integrações Qdrant'
        });
    }
});

/**
 * GET /api/qdrant/integrations
 * Lista todas as integrações Qdrant do sistema
 */
router.get('/integrations', async (req, res) => {
    try {
        console.log('📋 Endpoint: Listando todas as integrações Qdrant...');
        
        const db = require('../config/database');
        const integrations = await db.query(`
            SELECT 
                i.id,
                i.integration_name,
                i.hotel_uuid,
                i.apikey,
                i.instancia_name,
                i.url_api,
                h.hotel_nome
            FROM Integracoes i
            LEFT JOIN hotels h ON i.hotel_uuid = h.hotel_uuid
            WHERE i.integration_name = 'Qdrant'
            ORDER BY h.hotel_nome
        `);
        
        res.json({
            success: true,
            total: integrations.length,
            integrations: integrations,
            message: 'Todas as integrações Qdrant listadas com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao listar todas as integrações Qdrant:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao listar integrações Qdrant'
        });
    }
});

module.exports = router;