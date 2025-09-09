const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * POST /api/setup/create-vector-collections-table
 * Cria a tabela vector_collections na base de dados
 */
router.post('/create-vector-collections-table', async (req, res) => {
    try {
        console.log('🚀 Setup: Criando tabela vector_collections...');
        
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS vector_collections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                collection_name VARCHAR(255) NOT NULL,
                hotel_id INT NULL,
                description TEXT,
                vector_size INT DEFAULT 1536,
                distance_metric ENUM('Cosine', 'Euclidean', 'Dot') DEFAULT 'Cosine',
                qdrant_status ENUM('ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING') DEFAULT 'INACTIVE',
                total_vectors INT DEFAULT 0,
                last_sync TIMESTAMP NULL,
                config JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
                UNIQUE KEY unique_collection_name (collection_name),
                INDEX idx_hotel_id (hotel_id),
                INDEX idx_status (qdrant_status),
                INDEX idx_collection_name (collection_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await db.query(createTableSQL);
        
        console.log('✅ Tabela vector_collections criada com sucesso!');
        
        res.json({
            success: true,
            message: 'Tabela vector_collections criada com sucesso',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erro ao criar tabela vector_collections:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao criar tabela vector_collections'
        });
    }
});

/**
 * GET /api/setup/check-tables
 * Verifica se as tabelas necessárias existem
 */
router.get('/check-tables', async (req, res) => {
    try {
        console.log('🔍 Setup: Verificando tabelas...');
        
        const tables = await db.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            ORDER BY TABLE_NAME
        `);
        
        const tableNames = tables.map(table => table.TABLE_NAME);
        const hasVectorCollections = tableNames.includes('vector_collections');
        
        console.log('📋 Tabelas encontradas:', tableNames.length);
        
        res.json({
            success: true,
            tables: tableNames,
            has_vector_collections: hasVectorCollections,
            total_tables: tableNames.length,
            message: 'Tabelas verificadas com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao verificar tabelas:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro ao verificar tabelas'
        });
    }
});

module.exports = router;