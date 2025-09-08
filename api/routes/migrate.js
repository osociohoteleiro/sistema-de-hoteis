const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const router = express.Router();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

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
        name VARCHAR(255) NOT NULL,
        description TEXT,
        flow_type VARCHAR(20) DEFAULT 'CONVERSATION',
        status VARCHAR(20) DEFAULT 'DRAFT',
        version VARCHAR(20) DEFAULT '1.0.0',
        flow_data JSONB DEFAULT NULL,
        variables JSONB DEFAULT NULL,
        settings JSONB DEFAULT NULL,
        triggers JSONB DEFAULT NULL,
        priority INTEGER DEFAULT 0,
        is_default BOOLEAN DEFAULT FALSE,
        execution_count INTEGER DEFAULT 0,
        last_executed_at TIMESTAMP NULL,
        sort_order INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await db.query(createFlowsSQL);
    console.log('✅ Tabela flows criada');

    // Criar índices
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_folder_bot_id ON folders (bot_id);
      CREATE INDEX IF NOT EXISTS idx_flow_bot_id ON flows (bot_id);
      CREATE INDEX IF NOT EXISTS idx_flow_folder_id ON flows (folder_id);
    `;
    
    await db.query(createIndexes);
    console.log('✅ Índices criados');

    res.json({
      success: true,
      message: 'Tabelas folders e flows criadas com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tabelas',
      error: error.message
    });
  }
});

// Rota para criar flows de exemplo
router.post('/create-sample-flows', async (req, res) => {
  try {
    console.log('Criando flows de exemplo...');
    
    // Buscar alguns bots existentes
    const bots = await db.query('SELECT * FROM bots WHERE active = true LIMIT 3');
    
    if (bots.length === 0) {
      return res.json({
        success: false,
        message: 'Nenhum bot ativo encontrado para criar flows'
      });
    }
    
    console.log(`Encontrados ${bots.length} bots ativos`);
    
    for (let i = 0; i < bots.length; i++) {
      const bot = bots[i];
      
      // Criar uma pasta exemplo
      const folderSQL = `
        INSERT INTO folders (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, color, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id;
      `;
      
      const folderResult = await db.query(folderSQL, [
        bot.id,
        bot.uuid,
        bot.workspace_id,
        bot.workspace_uuid,
        bot.hotel_id,
        bot.hotel_uuid,
        'Fluxos Principais',
        'Pasta com os fluxos principais do bot',
        '#10B981',
        'folder'
      ]);
      
      const folderId = folderResult[0].id;
      console.log(`✅ Pasta criada para bot ${bot.name} - Folder ID: ${folderId}`);
      
      // Criar um flow de exemplo com estrutura React Flow
      const sampleFlowData = {
        nodes: [
          {
            id: 'start_node_1',
            type: 'startNode',
            position: { x: 100, y: 250 },
            data: { 
              label: 'Início',
              config: { message: 'Bem-vindo ao ' + bot.name + '!' }
            }
          },
          {
            id: 'message_node_1',
            type: 'messageNode',
            position: { x: 300, y: 250 },
            data: {
              label: 'Saudação',
              config: { 
                messages: ['Olá! Como posso ajudá-lo hoje?'] 
              }
            }
          },
          {
            id: 'question_node_1',
            type: 'questionNode',
            position: { x: 500, y: 250 },
            data: {
              label: 'Qual serviço?',
              config: {
                question: 'Qual serviço você precisa?',
                variable: 'servico_escolhido',
                validation: 'none'
              }
            }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'start_node_1',
            target: 'message_node_1',
            type: 'custom-edge'
          },
          {
            id: 'e2',
            source: 'message_node_1',
            target: 'question_node_1',
            type: 'custom-edge'
          }
        ],
        viewport: { x: 0, y: 0, zoom: 1 }
      };
      
      const flowSQL = `
        INSERT INTO flows (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, folder_id, name, description, flow_type, status, flow_data, variables, settings, triggers, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
      `;
      
      await db.query(flowSQL, [
        bot.id,
        bot.uuid,
        bot.workspace_id,
        bot.workspace_uuid,
        bot.hotel_id,
        bot.hotel_uuid,
        folderId,
        'Fluxo de Atendimento Principal',
        'Fluxo principal para atendimento inicial do cliente',
        'CONVERSATION',
        'ACTIVE',
        JSON.stringify(sampleFlowData),
        JSON.stringify({
          servico_escolhido: '',
          cliente_nome: ''
        }),
        JSON.stringify({
          timeout: 30000,
          fallback_enabled: true,
          typing_delay: 1500
        }),
        JSON.stringify([
          { type: 'message_received', conditions: ['first_interaction'] }
        ]),
        true
      ]);
      
      console.log(`✅ Flow criado para bot ${bot.name}`);
    }

    res.json({
      success: true,
      message: `${bots.length} flows de exemplo criados com sucesso!`,
      created_flows: bots.length
    });

  } catch (error) {
    console.error('Erro ao criar flows de exemplo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar flows de exemplo',
      error: error.message
    });
  }
});

// Rota para executar migração específica (remover após uso)
router.post('/run/:filename', async (req, res) => {
  const { filename } = req.params;
  let connection;
  
  try {
    const migrationPath = path.join(__dirname, '../migrations', filename);
    
    if (!fs.existsSync(migrationPath)) {
      return res.status(404).json({
        success: false,
        message: `Arquivo de migração '${filename}' não encontrado`
      });
    }
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📄 Conteúdo do arquivo:', migrationSql.substring(0, 200));
    
    // Dividir por queries (separadas por ;)
    const allParts = migrationSql.split(';');
    console.log('📝 Partes após split por ";":', allParts.length);
    
    // Processar cada parte removendo comentários e extraindo SQL
    const queries = [];
    
    for (const part of allParts) {
      const lines = part.split('\n');
      const sqlLines = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Pular linhas de comentário e vazias
        if (trimmedLine && !trimmedLine.startsWith('--')) {
          sqlLines.push(trimmedLine);
        }
      }
      
      if (sqlLines.length > 0) {
        const sqlQuery = sqlLines.join(' ').trim();
        if (sqlQuery) {
          queries.push(sqlQuery);
          console.log(`✅ Query encontrada: ${sqlQuery.substring(0, 100)}...`);
        }
      }
    }
    
    const results = [];
    
    console.log('🔍 Queries encontradas:', queries.length);
    
    for (const query of queries) {
      try {
        console.log('🚀 Executando query:', query.substring(0, 100));
        const [result] = await connection.execute(query);
        results.push({ query: query.substring(0, 100) + '...', success: true, result });
        console.log('✅ Query executada com sucesso');
      } catch (error) {
        console.error('❌ Erro na query:', error.message);
        results.push({ query: query.substring(0, 100) + '...', success: false, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: `Migração '${filename}' executada`,
      results
    });
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar migração',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router;