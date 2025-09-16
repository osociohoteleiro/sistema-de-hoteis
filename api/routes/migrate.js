const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const router = express.Router();

// Rota para criar tabelas folders e flows no PostgreSQL
router.post('/create-folders-flows', async (req, res) => {
  try {
    console.log('Criando tabelas folders e flows...');

    // Criar tabela folders
    const createFoldersSQL = `
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        folder_uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
        bot_id INTEGER NOT NULL,
        bot_uuid UUID NOT NULL,
        workspace_id INTEGER NOT NULL,
        workspace_uuid UUID NOT NULL,
        hotel_id INTEGER NOT NULL,
        hotel_uuid UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icon VARCHAR(50) DEFAULT 'folder',
        parent_folder_id INTEGER NULL,
        sort_order INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.query(createFoldersSQL);
    console.log('✅ Tabela folders criada');

    // Criar tabela flows
    const createFlowsSQL = `
      CREATE TABLE IF NOT EXISTS flows (
        id SERIAL PRIMARY KEY,
        flow_uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
        bot_id INTEGER NOT NULL,
        bot_uuid UUID NOT NULL,
        workspace_id INTEGER NOT NULL,
        workspace_uuid UUID NOT NULL,
        hotel_id INTEGER NOT NULL,
        hotel_uuid UUID NOT NULL,
        folder_id INTEGER NULL,
        folder_uuid UUID NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'conversation',
        status VARCHAR(50) DEFAULT 'draft',
        triggers TEXT,
        actions TEXT,
        conditions TEXT,
        variables TEXT,
        sort_order INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
      );
    `;

    await db.query(createFlowsSQL);
    console.log('✅ Tabela flows criada');

    res.json({
      success: true,
      message: 'Tabelas folders e flows criadas com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para executar migrations SQL
router.post('/run-migration', async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Nome do arquivo de migration é obrigatório'
      });
    }

    const migrationPath = path.join(__dirname, '../database/migrations', filename);

    if (!fs.existsSync(migrationPath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo de migration não encontrado'
      });
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Executar migration
    await db.query(sql);

    console.log(`✅ Migration ${filename} executada com sucesso`);

    res.json({
      success: true,
      message: `Migration ${filename} executada com sucesso`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na migration:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para listar migrations disponíveis
router.get('/list-migrations', (req, res) => {
  try {
    const migrationsDir = path.join(__dirname, '../database/migrations');

    if (!fs.existsSync(migrationsDir)) {
      return res.json({
        success: true,
        migrations: [],
        message: 'Diretório de migrations não encontrado'
      });
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    res.json({
      success: true,
      migrations: files,
      count: files.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar migrations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rota para verificar status das tabelas
router.get('/check-tables', async (req, res) => {
  try {
    const tables = [
      'hotels',
      'users',
      'folders',
      'flows',
      'rate_shopper_searches',
      'rate_shopper_prices',
      'rate_shopper_properties'
    ];

    const results = {};

    for (const table of tables) {
      try {
        const result = await db.query(`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_name = $1 AND table_schema = 'public'
        `, [table]);

        const exists = parseInt(result[0].count) > 0;
        results[table] = {
          exists,
          status: exists ? 'OK' : 'NOT_FOUND'
        };

        // Se a tabela existe, contar registros
        if (exists) {
          const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
          results[table].records = parseInt(countResult[0].count);
        }

      } catch (error) {
        results[table] = {
          exists: false,
          status: 'ERROR',
          error: error.message
        };
      }
    }

    res.json({
      success: true,
      database: 'PostgreSQL',
      tables: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;