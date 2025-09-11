const { Pool } = require('pg');

const prodPool = new Pool({
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels'
});

async function clearProductionDatabase() {
  console.log('🧹 LIMPANDO BANCO DE PRODUÇÃO COMPLETAMENTE...');
  console.log('⚠️  ATENÇÃO: Isso vai apagar TODAS as tabelas e dados!');
  
  try {
    // 1. Listar todas as tabelas antes
    const beforeTables = await prodPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`📋 Encontradas ${beforeTables.rows.length} tabelas para apagar:`);
    beforeTables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 2. Dropear schema public completamente (mais seguro)
    console.log('\n🗑️  Dropando schema public...');
    
    await prodPool.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
    `);
    
    console.log('✅ Schema public apagado');
    
    // 3. Recriar schema public vazio
    console.log('🏗️  Recriando schema public...');
    
    await prodPool.query(`
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
      COMMENT ON SCHEMA public IS 'standard public schema';
    `);
    
    console.log('✅ Schema public recriado');
    
    // 4. Verificar se está limpo
    const afterTables = await prodPool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`\n📊 Verificação: ${afterTables.rows[0].count} tabelas restantes`);
    
    if (afterTables.rows[0].count == 0) {
      console.log('🎉 BANCO DE PRODUÇÃO LIMPO COM SUCESSO!');
      console.log('✅ Pronto para receber a migração completa');
    } else {
      console.log('⚠️  Ainda existem algumas tabelas');
    }
    
    console.log('\n📋 Próximos passos:');
    console.log('  1. Execute: node deploy-complete-to-production.js production');
    console.log('  2. Ou use a migration SQL diretamente');
    
  } catch (error) {
    console.error('❌ ERRO ao limpar banco:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prodPool.end();
  }
}

// Confirmação de segurança
console.log('⚠️  ATENÇÃO: Este script vai APAGAR TODOS os dados do banco de produção!');
console.log('📍 Banco: ep.osociohoteleiro.com.br:5432/osh_hotels');
console.log('⏰ Aguarde 3 segundos para executar...\n');

setTimeout(() => {
  clearProductionDatabase();
}, 3000);