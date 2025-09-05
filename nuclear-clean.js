const db = require('./api/config/database');

async function nuclearClean() {
  try {
    console.log('💥 LIMPEZA NUCLEAR - REMOVENDO TUDO!');
    
    // Force delete - remove todos os preços (sem condições)
    const pricesResult = await db.query(`TRUNCATE TABLE rate_shopper_prices CASCADE`);
    console.log('💥 TABELA DE PREÇOS TRUNCADA');
    
    // Force delete - remove todas as buscas (sem condições)  
    const searchesResult = await db.query(`DELETE FROM rate_shopper_searches`);
    console.log('💥 TODAS AS BUSCAS REMOVIDAS');
    
    // Reset sequences if needed
    await db.query(`SELECT setval(pg_get_serial_sequence('rate_shopper_searches', 'id'), 1, false)`);
    await db.query(`SELECT setval(pg_get_serial_sequence('rate_shopper_prices', 'id'), 1, false)`);
    console.log('💥 SEQUENCES RESETADAS');
    
    // Final verification
    const finalSearches = await db.query(`SELECT COUNT(*) FROM rate_shopper_searches`);
    const finalPrices = await db.query(`SELECT COUNT(*) FROM rate_shopper_prices`);
    
    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`   Buscas: ${finalSearches.rows[0]?.count || 0}`);
    console.log(`   Preços: ${finalPrices.rows[0]?.count || 0}`);
    
    console.log('\n✅ LIMPEZA NUCLEAR CONCLUÍDA!');
    console.log('🎯 Sistema completamente limpo para testes');
    console.log('💡 Acesse: http://localhost:5173/rate-shopper');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

nuclearClean();