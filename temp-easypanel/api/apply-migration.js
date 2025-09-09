const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migration de histórico de preços...');
    
    // Conectar ao banco
    await db.connect();
    
    // Ler o arquivo da migration
    const migrationPath = path.join(__dirname, 'migrations', '020_price_history.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar todo o SQL de uma vez para preservar estruturas complexas como functions
    try {
      console.log('Executando migration completa...');
      await db.query(migrationSQL);
      console.log('✅ Migration executada com sucesso');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️ Alguns recursos já existem, continuando...');
      } else {
        console.error('❌ Erro na migration:', error.message);
        throw error;
      }
    }
    
    console.log('✅ Migration aplicada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  applyMigration();
}

module.exports = applyMigration;