const express = require('express');
const router = express.Router();
const db = require('../config/database');
const onenodeService = require('../services/onenodeService');

/**
 * POST /api/onenode/cleanup-duplicates
 * Limpa workspaces duplicados mantendo apenas o mais recente por hotel
 */
router.post('/cleanup-duplicates', async (req, res) => {
    try {
        console.log('🧹 Executando limpeza: removendo workspaces duplicados...');

        // Buscar hotéis com múltiplos workspaces
        const duplicates = await db.query(`
            SELECT hotel_uuid, COUNT(*) as count
            FROM onenode_workspaces
            WHERE active = true
            GROUP BY hotel_uuid
            HAVING COUNT(*) > 1
        `);

        let removedCount = 0;

        for (const duplicate of duplicates) {
            console.log(`🔍 Hotel ${duplicate.hotel_uuid} possui ${duplicate.count} workspaces`);

            // Buscar todos os workspaces deste hotel ordenados por data (mais recente primeiro)
            const workspaces = await db.query(
                'SELECT id, name, created_at FROM onenode_workspaces WHERE hotel_uuid = $1 AND active = true ORDER BY created_at DESC',
                [duplicate.hotel_uuid]
            );

            // Manter apenas o primeiro (mais recente) e remover os outros
            for (let i = 1; i < workspaces.length; i++) {
                await db.query(
                    'UPDATE onenode_workspaces SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [workspaces[i].id]
                );
                console.log(`🗑️ Removido workspace ID ${workspaces[i].id} "${workspaces[i].name}"`);
                removedCount++;
            }
        }

        res.json({
            success: true,
            message: `Limpeza concluída: ${removedCount} workspaces duplicados removidos`,
            duplicates_found: duplicates.length,
            workspaces_removed: removedCount
        });

    } catch (error) {
        console.error('❌ Erro na limpeza:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/onenode/sync-bots
 * Sincroniza bots do OneNode com o banco local
 */
router.post('/sync-bots', async (req, res) => {
    try {
        console.log('🔄 Sincronizando bots do OneNode...');

        const { hotel_uuid } = req.body;

        if (!hotel_uuid) {
            return res.status(400).json({
                success: false,
                error: 'hotel_uuid é obrigatório'
            });
        }

        // Buscar dados do hotel
        const hotels = await db.query('SELECT * FROM hotels WHERE hotel_uuid = $1', [hotel_uuid]);

        if (hotels.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }

        const hotel = hotels[0];

        // Sincronizar via service
        const result = await onenodeService.syncBotsFromOneNode(hotel);

        res.json({
            success: true,
            message: 'Sincronização concluída',
            hotel: hotel.name,
            ...result
        });

    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/onenode/workspaces/:hotel_uuid
 * Lista workspaces do hotel
 */
router.get('/workspaces/:hotel_uuid', async (req, res) => {
    try {
        const { hotel_uuid } = req.params;

        const workspaces = await db.query(`
            SELECT
                id,
                workspace_uuid,
                name,
                description,
                onenode_workspace_id,
                active,
                created_at,
                updated_at
            FROM onenode_workspaces
            WHERE hotel_uuid = $1
            ORDER BY created_at DESC
        `, [hotel_uuid]);

        res.json({
            success: true,
            hotel_uuid,
            workspaces,
            total: workspaces.length
        });

    } catch (error) {
        console.error('❌ Erro ao listar workspaces:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/onenode/bots/:hotel_uuid
 * Lista bots do hotel
 */
router.get('/bots/:hotel_uuid', async (req, res) => {
    try {
        const { hotel_uuid } = req.params;

        const bots = await db.query(`
            SELECT
                b.id,
                b.bot_uuid,
                b.name,
                b.description,
                b.onenode_bot_id,
                b.active,
                b.created_at,
                w.name as workspace_name
            FROM onenode_bots b
            LEFT JOIN onenode_workspaces w ON b.workspace_id = w.id
            WHERE b.hotel_uuid = $1
            ORDER BY b.created_at DESC
        `, [hotel_uuid]);

        res.json({
            success: true,
            hotel_uuid,
            bots,
            total: bots.length
        });

    } catch (error) {
        console.error('❌ Erro ao listar bots:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/onenode/create-workspace
 * Cria workspace no OneNode e sincroniza com banco local
 */
router.post('/create-workspace', async (req, res) => {
    try {
        const { hotel_uuid, name, description } = req.body;

        if (!hotel_uuid || !name) {
            return res.status(400).json({
                success: false,
                error: 'hotel_uuid e name são obrigatórios'
            });
        }

        // Verificar se hotel existe
        const hotels = await db.query('SELECT * FROM hotels WHERE hotel_uuid = $1', [hotel_uuid]);

        if (hotels.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hotel não encontrado'
            });
        }

        const hotel = hotels[0];

        // Criar workspace via service
        const result = await onenodeService.createWorkspace(hotel, name, description);

        res.json({
            success: true,
            message: 'Workspace criado com sucesso',
            workspace: result
        });

    } catch (error) {
        console.error('❌ Erro ao criar workspace:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/onenode/status
 * Verifica status geral do OneNode
 */
router.get('/status', async (req, res) => {
    try {
        // Contar workspaces e bots
        const workspacesResult = await db.query('SELECT COUNT(*) as count FROM onenode_workspaces WHERE active = true');
        const botsResult = await db.query('SELECT COUNT(*) as count FROM onenode_bots WHERE active = true');

        // Verificar conexão com OneNode (se disponível)
        let onenodeStatus = 'unknown';
        try {
            // Aqui você pode adicionar uma verificação de status do OneNode
            onenodeStatus = 'connected';
        } catch {
            onenodeStatus = 'disconnected';
        }

        res.json({
            success: true,
            status: {
                database: 'PostgreSQL',
                onenode_connection: onenodeStatus,
                total_workspaces: parseInt(workspacesResult[0].count),
                total_bots: parseInt(botsResult[0].count)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;