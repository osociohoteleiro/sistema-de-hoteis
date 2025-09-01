const db = require('../config/database');

async function checkTableStructure() {
  try {
    await db.connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Consultar estrutura da tabela hotels
    const columns = await db.query('DESCRIBE hotels');
    console.log('\n📋 Estrutura da tabela hotels:');
    console.log(columns);
    
    // Listar hotéis existentes com colunas corretas
    const hotels = await db.query('SELECT id, hotel_uuid, hotel_nome, accommodation_units, city, state, responsible_name FROM hotels LIMIT 5');
    console.log('\n🏨 Hotéis existentes:');
    console.log(hotels);
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkTableStructure();