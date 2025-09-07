const db = require('./config/database');

async function createTestPriceHistory() {
  try {
    console.log('🧪 Criando dados de teste para histórico de preços...');
    
    // Conectar ao banco
    await db.connect();
    
    // Inserir alguns dados de teste
    const testData = [
      {
        property_id: 13,
        hotel_id: 17,
        check_in_date: '2025-09-07',
        current_price: 250.00,
        previous_price: null,
        price_change: 0,
        change_percentage: 0,
        change_type: 'NEW'
      },
      {
        property_id: 13,
        hotel_id: 17,
        check_in_date: '2025-09-07',
        current_price: 275.00,
        previous_price: 250.00,
        price_change: 25.00,
        change_percentage: 10.00,
        change_type: 'UP'
      },
      {
        property_id: 12,
        hotel_id: 17,
        check_in_date: '2025-09-08',
        current_price: 180.00,
        previous_price: 200.00,
        price_change: -20.00,
        change_percentage: -10.00,
        change_type: 'DOWN'
      }
    ];
    
    for (const data of testData) {
      console.log(`Inserindo: ${data.property_id}, ${data.check_in_date}, R$ ${data.current_price}`);
      await db.query(`
        INSERT INTO rate_shopper_price_history 
        (property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        data.property_id, 
        data.hotel_id, 
        data.check_in_date, 
        data.current_price, 
        data.previous_price, 
        data.price_change, 
        data.change_percentage, 
        data.change_type
      ]);
    }
    
    console.log('✅ Dados de teste criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
  } finally {
    await db.close();
  }
}

createTestPriceHistory();