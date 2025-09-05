const db = require('./api/config/database');

async function verifyClean() {
  try {
    console.log('🔍 Verificando se o sistema está limpo...');
    
    const searches = await db.query(`SELECT COUNT(*) FROM rate_shopper_searches WHERE hotel_id = 2`);
    const prices = await db.query(`SELECT COUNT(*) FROM rate_shopper_prices`);
    
    console.log(`📊 Buscas no sistema: ${searches.rows[0].count}`);
    console.log(`📊 Preços no sistema: ${prices.rows[0].count}`);
    
    if (searches.rows[0].count == 0 && prices.rows[0].count == 0) {
      console.log('\n✅ SISTEMA COMPLETAMENTE LIMPO!');
      console.log('🎯 Pronto para criar novas buscas do zero');
      console.log('💡 Acesse: http://localhost:5173/rate-shopper');
    } else {
      console.log('\n⚠️ Ainda há dados no sistema');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

verifyClean();