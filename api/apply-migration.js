const fs = require('fs');
const db = require('./config/database');

async function applyMigration() {
  try {
    console.log('📝 Aplicando migração 004_user_permissions...');
    
    // Ler arquivo de migração
    const migrationSQL = fs.readFileSync('./migrations/004_user_permissions.sql', 'utf8');
    
    // Executar migração
    await db.query(migrationSQL);
    
    console.log('✅ Migração aplicada com sucesso!');
    
    // Verificar se a tabela foi criada
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_permissions'
      ORDER BY ordinal_position
    `);
    
    console.log('🔍 Estrutura da tabela user_permissions:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    process.exit(1);
  }
}

applyMigration();