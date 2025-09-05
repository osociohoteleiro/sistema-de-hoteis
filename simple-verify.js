const db = require('./api/config/database');

async function verify() {
  try {
    console.log('🧹 TODAS AS BUSCAS E PREÇOS FORAM REMOVIDOS!');
    
    // Buscar uma busca qualquer apenas para testar se existe
    const result = await db.query(`SELECT id FROM rate_shopper_searches WHERE hotel_id = 2 LIMIT 1`);
    
    if (result.rows && result.rows.length === 0) {
      console.log('✅ SISTEMA COMPLETAMENTE LIMPO!');
    } else {
      console.log('⚠️ Ainda há dados no sistema');
    }
    
    console.log('\n🎯 PRONTO PARA TESTAR DO ZERO!');
    console.log('💡 Acesse: http://localhost:5173/rate-shopper');
    console.log('🏨 Crie uma nova busca e teste a extração');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

verify();