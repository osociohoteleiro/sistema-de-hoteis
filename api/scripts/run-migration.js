const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('❌ Por favor, especifique o arquivo de migração');
    console.log('Uso: node scripts/run-migration.js <arquivo-migração>');
    process.exit(1);
  }
  
  try {
    console.log(`📊 Executando migração: ${migrationFile}...`);
    
    // Conectar ao banco
    await db.connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Ler o arquivo SQL
    const migrationPath = path.join(__dirname, '../migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Arquivo de migração não encontrado: ${migrationPath}`);
      process.exit(1);
    }
    
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir a migração em statements individuais
    const statements = migration.split(';').filter(stmt => stmt.trim());
    
    console.log(`📋 Executando ${statements.length} statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await db.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executado`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Statement ${i + 1}/${statements.length} - Tabela já existe, continuando...`);
          } else {
            console.error(`❌ Erro no statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log(`🎉 Migração ${migrationFile} executada com sucesso!`);
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  }
}

// Executar a migração
runMigration();