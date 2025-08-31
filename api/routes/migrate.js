const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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