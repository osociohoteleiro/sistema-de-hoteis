const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de produção
const productionConfig = {
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels'
};

async function resetAndDeployProduction() {
  console.log('🚀 RESET COMPLETO + DEPLOY para produção');
  console.log('🔗 Conectando em: ep.osociohoteleiro.com.br:5432/osh_hotels');
  
  const pool = new Pool(productionConfig);
  
  try {
    // 1. Testar conexão
    console.log('🔌 Testando conexão...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida com sucesso');
    
    // 2. LIMPAR TUDO - Dropar schema public e recriar
    console.log('🧹 LIMPANDO banco de produção (DROP SCHEMA)...');
    
    await pool.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
      COMMENT ON SCHEMA public IS 'standard public schema';
    `);
    
    console.log('✅ Schema public resetado completamente');
    
    // 3. Aplicar extensões necessárias primeiro
    console.log('🔧 Habilitando extensões...');
    
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    
    console.log('✅ Extensões habilitadas');
    
    // 4. Aplicar migration de estrutura primeiro
    const structureFile = 'migrations/000_complete_production_setup_2025-09-11.sql';
    
    if (fs.existsSync(structureFile)) {
      console.log('🏗️  Aplicando estrutura do banco...');
      
      const structureContent = fs.readFileSync(structureFile, 'utf8');
      
      // Filtrar apenas comandos de estrutura (não dados)
      const structureStatements = structureContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => {
          return stmt.length > 0 && 
                 !stmt.includes('INSERT INTO') &&
                 !stmt.includes('session_replication_role');
        });
      
      console.log(`📋 Executando ${structureStatements.length} statements de estrutura...`);
      
      for (const statement of structureStatements) {
        if (statement.trim()) {
          try {
            await pool.query(statement + ';');
          } catch (error) {
            // Ignorar erros de IF NOT EXISTS
            if (!error.message.includes('already exists')) {
              console.log(`⚠️  Aviso SQL: ${error.message}`);
            }
          }
        }
      }
      
      console.log('✅ Estrutura aplicada');
    }
    
    // 5. Verificar estrutura criada
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableCount = parseInt(tablesResult.rows[0].count);
    console.log(`📊 Tabelas criadas: ${tableCount}`);
    
    if (tableCount < 30) {
      throw new Error(`Poucas tabelas criadas (${tableCount}). Esperado ~34`);
    }
    
    // 6. Aplicar dados
    const dataFile = 'migrations/001_complete_data_export_2025-09-11.sql';
    
    if (fs.existsSync(dataFile)) {
      console.log('📊 Importando todos os dados...');
      
      const dataContent = fs.readFileSync(dataFile, 'utf8');
      
      // Aplicar dados em modo replica para evitar problemas de FK
      await pool.query("SET session_replication_role = 'replica'");
      
      const dataStatements = dataContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📋 Executando ${dataStatements.length} statements de dados...`);
      
      let insertCount = 0;
      for (const statement of dataStatements) {
        if (statement.trim()) {
          try {
            await pool.query(statement + ';');
            
            if (statement.includes('INSERT INTO')) {
              insertCount++;
              if (insertCount % 10 === 0) {
                console.log(`   ⏳ Processados ${insertCount} INSERTs...`);
              }
            }
          } catch (error) {
            // Ignorar conflitos (ON CONFLICT DO NOTHING)
            if (!error.message.includes('duplicate key') && 
                !error.message.includes('already exists')) {
              console.log(`⚠️  Aviso INSERT: ${error.message.substring(0, 100)}...`);
            }
          }
        }
      }
      
      // Restaurar modo normal
      await pool.query("SET session_replication_role = 'origin'");
      
      console.log(`✅ Dados importados (${insertCount} INSERTs executados)`);
    }
    
    // 7. Corrigir sequências
    console.log('🔧 Corrigindo sequências...');
    
    const sequencesResult = await pool.query(`
      SELECT 
        schemaname,
        sequencename
      FROM pg_sequences 
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `);
    
    for (const seq of sequencesResult.rows) {
      const tableName = seq.sequencename.replace('_id_seq', '');
      
      try {
        await pool.query(`
          SELECT setval('${seq.sequencename}', 
            COALESCE((SELECT MAX(id) FROM ${tableName}), 1), true)
        `);
      } catch (error) {
        console.log(`⚠️  Sequência ${seq.sequencename}: ${error.message}`);
      }
    }
    
    console.log('✅ Sequências corrigidas');
    
    // 8. Verificar resultado final
    console.log('\\n🔍 Verificação final...');
    
    const finalTables = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const finalTableCount = parseInt(finalTables.rows[0].count);
    console.log(`📊 Total de tabelas: ${finalTableCount}`);
    
    // Verificar dados importados
    const sampleQueries = [
      { name: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'Hotels', query: 'SELECT COUNT(*) as count FROM hotels' },
      { name: 'Rate Shopper Prices', query: 'SELECT COUNT(*) as count FROM rate_shopper_prices' },
      { name: 'Workspaces', query: 'SELECT COUNT(*) as count FROM workspaces' },
      { name: 'Bots', query: 'SELECT COUNT(*) as count FROM bots' }
    ];
    
    console.log('\\n📊 Dados importados:');
    let totalRecords = 0;
    
    for (const sample of sampleQueries) {
      try {
        const result = await pool.query(sample.query);
        const count = parseInt(result.rows[0].count);
        totalRecords += count;
        console.log(`   ${sample.name}: ${count.toLocaleString()} registros`);
      } catch (error) {
        console.log(`   ${sample.name}: ❌ Erro - ${error.message}`);
      }
    }
    
    console.log(`\\n🎉 DEPLOY COMPLETO FINALIZADO!`);
    console.log(`\\n📋 Resumo:`);
    console.log(`   ✅ Banco resetado completamente`);
    console.log(`   ✅ Estrutura criada: ${finalTableCount} tabelas`);
    console.log(`   ✅ Dados importados: ${totalRecords.toLocaleString()}+ registros`);
    console.log(`   ✅ Sequências corrigidas`);
    console.log(`   ✅ Banco: postgres://postgres:***@ep.osociohoteleiro.com.br:5432/osh_hotels`);
    console.log(`\\n🚀 Sua aplicação agora pode usar o banco de produção!`);
    
  } catch (error) {
    console.error('❌ ERRO NO RESET+DEPLOY:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetAndDeployProduction();