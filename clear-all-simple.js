const db = require('./api/config/database');

async function clearAll() {
  try {
    console.log('🧹 LIMPANDO TUDO...');
    
    // Remove todos os preços primeiro
    await db.query(`DELETE FROM rate_shopper_prices`);
    console.log('✅ Todos os preços removidos');
    
    // Remove todas as buscas
    await db.query(`DELETE FROM rate_shopper_searches WHERE hotel_id = 2`);
    console.log('✅ Todas as buscas removidas');
    
    // Verificar
    const searches = await db.query(`SELECT COUNT(*) FROM rate_shopper_searches WHERE hotel_id = 2`);
    const prices = await db.query(`SELECT COUNT(*) FROM rate_shopper_prices`);
    
    console.log(`📊 Buscas restantes: ${searches.rows[0].count}`);
    console.log(`📊 Preços restantes: ${prices.rows[0].count}`);
    
    console.log('\n✅ SISTEMA COMPLETAMENTE LIMPO!');
    console.log('🎯 Pronto para testar do zero');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

clearAll();