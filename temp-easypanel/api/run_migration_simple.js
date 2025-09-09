const db = require('./config/database');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  try {
    console.log('✅ Conectando ao banco de dados...');
    
    // Ler o arquivo de migration
    const migrationPath = path.join(__dirname, 'migrations', '021_add_platform_to_rate_shopper_properties.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('🔄 Executando migration...');
    
    // Dividir em comandos individuais (algumas migrations têm múltiplos comandos)
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await db.query(command.trim());
        } catch (error) {
          // Ignorar erros de "já existe" mas mostrar outros
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Item já existe: ${error.message.split(':')[0]}`);
          } else {
            console.error(`❌ Erro: ${error.message}`);
          }
        }
      }
    }
    
    console.log('✅ Migration executada com sucesso!');

    // Verificar se a coluna foi criada
    const result = await db.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_properties' 
      AND column_name = 'platform'
    `);

    if (result.length > 0) {
      console.log('✅ Coluna platform criada:', result[0]);
    } else {
      console.log('⚠️  Coluna platform não encontrada');
    }

    // Verificar dados existentes
    const dataCheck = await db.query(`
      SELECT platform, COUNT(*) as count 
      FROM rate_shopper_properties 
      GROUP BY platform
    `);

    console.log('📊 Distribuição de plataformas:');
    dataCheck.forEach(row => {
      console.log(`   ${row.platform}: ${row.count} propriedades`);
    });

  } catch (error) {
    console.error('❌ Erro na migration:', error.message);
  }
  
  // Dar um tempo para terminar antes de finalizar
  setTimeout(() => {
    console.log('🔌 Migration finalizada');
    process.exit(0);
  }, 1000);
}

runMigration();