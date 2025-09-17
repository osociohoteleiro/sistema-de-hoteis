/**
 * Teste de conectividade do extrator com banco de produção
 * Simula exatamente o que o auto-processor faz
 */

// Simular ambiente de produção
process.env.NODE_ENV = 'production';
process.env.POSTGRES_HOST = 'ep.osociohoteleiro.com.br';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_USER = 'postgres';
process.env.POSTGRES_PASSWORD = 'OSH4040()Xx!..nn';
process.env.POSTGRES_DB = 'osh_sistemas';
process.env.PGSSLDISABLE = 'true';

console.log('🧪 TESTE DE CONECTIVIDADE DO EXTRATOR COM PRODUÇÃO\n');

async function testExtractorConnection() {
  try {
    console.log('📋 1. TESTANDO VARIÁVEIS DE AMBIENTE:');
    console.log(`   POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
    console.log(`   POSTGRES_PORT: ${process.env.POSTGRES_PORT}`);
    console.log(`   POSTGRES_DB: ${process.env.POSTGRES_DB}`);
    console.log(`   POSTGRES_USER: ${process.env.POSTGRES_USER}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PGSSLDISABLE: ${process.env.PGSSLDISABLE}`);

    console.log('\n🔌 2. TESTANDO DATABASE INTEGRATION:');

    // Usar o DatabaseIntegration do extrator
    const DatabaseIntegration = require('./extrator-rate-shopper/src/database-integration');
    const db = new DatabaseIntegration();

    console.log('   Conectando...');
    await db.connect();
    console.log('   ✅ Conectado com sucesso!');

    console.log('\n📊 3. TESTANDO QUERY DE SEARCHES PENDING:');
    const hotelUuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1';

    try {
      const pendingSearches = await db.getPendingSearches(hotelUuid);
      console.log(`   ✅ Query executada com sucesso!`);
      console.log(`   📋 Searches PENDING encontradas: ${pendingSearches.length}`);

      if (pendingSearches.length > 0) {
        console.log('\n   📋 DETALHES DAS SEARCHES:');
        pendingSearches.forEach((search, index) => {
          console.log(`   ${index + 1}. Search ID: ${search.id}`);
          console.log(`      Hotel: ${search.hotel_name} (UUID: ${search.hotel_uuid})`);
          console.log(`      Property: ${search.property_name}`);
          console.log(`      Período: ${search.start_date} a ${search.end_date}`);
          console.log(`      URL: ${search.booking_url?.substring(0, 60)}...`);
          console.log('');
        });
      }
    } catch (queryError) {
      console.error('   ❌ Erro na query:', queryError.message);
      throw queryError;
    }

    console.log('\n🔄 4. TESTANDO DATABASE PROCESSOR:');

    // Testar o DatabaseProcessor
    const DatabaseProcessor = require('./extrator-rate-shopper/src/database-processor');
    const processor = new DatabaseProcessor();

    console.log('   Executando processamento de teste...');
    await processor.start();
    console.log('   ✅ Database processor executado com sucesso!');

    console.log('\n🎯 RESULTADO DO TESTE:');
    console.log('✅ CONEXÃO COM BANCO: OK');
    console.log('✅ QUERIES FUNCIONANDO: OK');
    console.log('✅ DATABASE PROCESSOR: OK');
    console.log('\n💡 O auto-processor DEVERIA estar funcionando em produção!');
    console.log('🔧 Verificar logs do container em produção para identificar o problema.');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('Stack:', error.stack);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (error.message.includes('connect') || error.message.includes('timeout')) {
      console.log('💡 PROBLEMA: Conectividade com banco de dados');
      console.log('🔧 SOLUÇÃO: Verificar configurações de rede/firewall em produção');
    } else if (error.message.includes('authentication') || error.message.includes('password')) {
      console.log('💡 PROBLEMA: Credenciais de banco incorretas');
      console.log('🔧 SOLUÇÃO: Verificar variáveis de ambiente em produção');
    } else {
      console.log('💡 PROBLEMA: Erro no código do extrator');
      console.log('🔧 SOLUÇÃO: Corrigir código e fazer redeploy');
    }
  }
}

testExtractorConnection().then(() => {
  console.log('\n✅ Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});