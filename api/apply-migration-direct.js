const { Pool } = require('pg');
const fs = require('fs');

const prodPool = new Pool({
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels'
});

async function applyMigrationDirect() {
  console.log('🚀 Aplicando migration diretamente linha por linha...');
  
  try {
    // 1. Ler o arquivo de migration
    const migrationFile = './migrations/complete_migration_with_data_2025-09-11.sql';
    
    if (!fs.existsSync(migrationFile)) {
      console.log('❌ Arquivo de migration não encontrado:', migrationFile);
      return;
    }
    
    const content = fs.readFileSync(migrationFile, 'utf8');
    console.log(`📁 Lendo migration: ${(content.length / 1024).toFixed(2)} KB`);
    
    // 2. Separar por linhas e limpar
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('--'));
    
    console.log(`📋 ${lines.length} linhas para processar`);
    
    // 3. Agrupar em statements SQL completos
    const statements = [];
    let currentStatement = '';
    
    for (const line of lines) {
      currentStatement += line + ' ';
      
      if (line.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    console.log(`📋 ${statements.length} statements SQL para executar`);
    
    // 4. Executar statement por statement
    let executed = 0;
    let errors = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length < 3) continue;
      
      try {
        await prodPool.query(statement);
        executed++;
        
        if (executed % 20 === 0) {
          console.log(`   ⏳ Executados ${executed}/${statements.length} statements...`);
        }
        
      } catch (error) {
        errors++;
        
        // Log apenas os primeiros 5 erros para não poluir
        if (errors <= 5) {
          console.log(`   ⚠️  Erro no statement ${i}: ${error.message}`);
          console.log(`       SQL: ${statement.substring(0, 100)}...`);
        }
        
        // Se for erro crítico, parar
        if (error.message.includes('syntax error') && 
            !error.message.includes('already exists') &&
            !error.message.includes('IF NOT EXISTS')) {
          console.log(`❌ Erro crítico de sintaxe. Parando execução.`);
          break;
        }
      }
    }
    
    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Executados: ${executed}`);
    console.log(`   ❌ Erros: ${errors}`);
    
    // 5. Verificar resultado
    const tables = await prodPool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`   📋 Tabelas criadas: ${tables.rows[0].count}`);
    
    if (tables.rows[0].count > 30) {
      console.log(`🎉 Migration aplicada com sucesso!`);
      
      // Testar algumas tabelas importantes
      const samples = [
        'SELECT COUNT(*) FROM users',
        'SELECT COUNT(*) FROM hotels', 
        'SELECT COUNT(*) FROM rate_shopper_searches',
        'SELECT COUNT(*) FROM rate_shopper_prices'
      ];
      
      console.log(`\n📊 Dados importados:`);
      for (const sql of samples) {
        try {
          const result = await prodPool.query(sql);
          const tableName = sql.match(/FROM (\w+)/)[1];
          console.log(`   ${tableName}: ${result.rows[0].count} registros`);
        } catch (err) {
          console.log(`   ${sql}: ❌ ${err.message}`);
        }
      }
      
    } else {
      console.log(`❌ Poucas tabelas criadas. Pode ter havido problemas na migration.`);
    }
    
  } catch (error) {
    console.error('❌ Erro na aplicação da migration:', error.message);
  } finally {
    await prodPool.end();
  }
}

applyMigrationDirect();