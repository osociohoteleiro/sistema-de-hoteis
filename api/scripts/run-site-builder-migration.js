const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runSiteBuilderMigration() {
  try {
    console.log('🚀 Executando migration do Site Builder SaaS...');
    
    // Conectar ao banco
    await db.connect();
    const status = db.getStatus();
    console.log('📊 Status do banco:', status);
    
    // Ler o arquivo de migration
    const migrationPath = path.join(__dirname, '..', 'migrations', '018_site_builder_saas.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Separar CREATE TABLE statements dos outros
    const allStatements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    const createTableStatements = allStatements.filter(stmt => 
      stmt.toUpperCase().includes('CREATE TABLE')
    );
    
    const insertStatements = allStatements.filter(stmt => 
      stmt.toUpperCase().includes('INSERT INTO')
    );
    
    const indexStatements = allStatements.filter(stmt => 
      stmt.toUpperCase().includes('CREATE INDEX')
    );
    
    const commentStatements = allStatements.filter(stmt => 
      stmt.toUpperCase().includes('COMMENT ON')
    );
    
    console.log(`📄 Encontradas ${createTableStatements.length} tabelas, ${insertStatements.length} inserts, ${indexStatements.length} índices`);
    
    // Executar CREATE TABLE primeiro
    console.log('📊 Criando tabelas...');
    for (let i = 0; i < createTableStatements.length; i++) {
      const statement = createTableStatements[i];
      try {
        console.log(`⏳ Criando tabela ${i + 1}/${createTableStatements.length}...`);
        await db.query(statement);
        console.log(`✅ Tabela ${i + 1} criada com sucesso`);
      } catch (error) {
        console.error(`❌ Erro na tabela ${i + 1}:`, error.message);
        if (!error.message.includes('already exists') && 
            !error.message.includes('já existe')) {
          throw error;
        }
      }
    }
    
    // Executar INSERTs
    console.log('📝 Inserindo dados padrão...');
    for (let i = 0; i < insertStatements.length; i++) {
      const statement = insertStatements[i];
      try {
        console.log(`⏳ Insert ${i + 1}/${insertStatements.length}...`);
        await db.query(statement);
        console.log(`✅ Insert ${i + 1} executado com sucesso`);
      } catch (error) {
        console.error(`❌ Erro no insert ${i + 1}:`, error.message);
        // Continuar mesmo com erro (dados podem já existir)
      }
    }
    
    // Executar índices
    console.log('🔍 Criando índices...');
    for (let i = 0; i < indexStatements.length; i++) {
      const statement = indexStatements[i];
      try {
        console.log(`⏳ Índice ${i + 1}/${indexStatements.length}...`);
        await db.query(statement);
        console.log(`✅ Índice ${i + 1} criado com sucesso`);
      } catch (error) {
        console.error(`❌ Erro no índice ${i + 1}:`, error.message);
        // Continuar mesmo com erro (índice pode já existir)
      }
    }
    
    console.log('✅ Migration do Site Builder executada com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const tables = ['site_templates', 'hotel_sites', 'site_media', 'site_pages', 'site_form_submissions'];
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) as count FROM ${table} LIMIT 1`);
        console.log(`✓ Tabela ${table}: ${result[0].count || 0} registros`);
      } catch (error) {
        console.log(`❌ Tabela ${table}: Erro - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runSiteBuilderMigration()
    .then(() => {
      console.log('🎉 Migration concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration falhou:', error);
      process.exit(1);
    });
}

module.exports = runSiteBuilderMigration;