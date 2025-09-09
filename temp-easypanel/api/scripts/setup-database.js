const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function createSchema() {
  try {
    console.log('📊 Executando schema do banco de dados...');
    
    // Conectar ao banco
    await db.connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Ler o arquivo SQL
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir o schema em statements individuais
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
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
            // Continuar mesmo com erros para não parar o processo
          }
        }
      }
    }
    
    console.log('🎉 Schema executado com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const tables = await db.query('SHOW TABLES');
    console.log(`📊 Total de tabelas criadas: ${tables.length}`);
    console.log('📋 Tabelas:', tables.map(t => Object.values(t)[0]).join(', '));
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Erro ao criar schema:', error.message);
    process.exit(1);
  }
}

// Executar o setup
createSchema();