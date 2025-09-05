const db = require('./api/config/database');

async function debugSearches() {
  try {
    console.log('🔍 Verificando searches no banco...');
    
    const searches = await db.query('SELECT * FROM rate_shopper_searches ORDER BY id DESC LIMIT 5');
    console.log('\n📋 Searches encontradas:');
    if (searches.length === 0) {
      console.log('❌ Nenhuma search encontrada!');
    } else {
      searches.forEach(search => {
        console.log(`ID: ${search.id} | Status: ${search.status} | Hotel: ${search.hotel_id} | Property: ${search.property_id}`);
        console.log(`   Período: ${search.start_date} até ${search.end_date}`);
      });
    }

    console.log('\n🏨 Verificando propriedades...');
    const properties = await db.query('SELECT * FROM rate_shopper_properties WHERE hotel_id = 2');
    console.log('Properties do hotel 2:');
    if (properties.length === 0) {
      console.log('❌ Nenhuma propriedade encontrada!');
    } else {
      properties.forEach(prop => {
        console.log(`ID: ${prop.id} | Nome: ${prop.property_name} | Ativo: ${prop.active}`);
        console.log(`   URL: ${prop.booking_url}`);
      });
    }

    // Se não há propriedade, criar uma de teste
    if (properties.length === 0) {
      console.log('\n➕ Criando propriedade de teste...');
      await db.query(`
        INSERT INTO rate_shopper_properties (
          hotel_id, property_name, booking_url, active, max_bundle_size
        ) VALUES (2, 'HOTEL MARANDUBA', 'https://www.booking.com/hotel/br/maranduba-ubatuba12.pt-br.html', true, 7)
      `);
      console.log('✅ Propriedade criada!');
    }

    // Criar nova busca PENDING
    console.log('\n➕ Criando nova busca PENDING...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startDate = today.toISOString().split('T')[0];
    const endDate = tomorrow.toISOString().split('T')[0];
    
    const result = await db.query(`
      INSERT INTO rate_shopper_searches (
        hotel_id, property_id, search_type, start_date, end_date, 
        status, total_dates, uuid
      ) VALUES (2, 1, 'MANUAL', $1, $2, 'PENDING', 1, gen_random_uuid())
      RETURNING *
    `, [startDate, endDate]);
    
    const newSearch = result[0];
    console.log(`✅ Nova busca criada: ID ${newSearch.id}, UUID: ${newSearch.uuid}`);
    console.log(`📅 Período: ${startDate} até ${endDate}`);
    
    console.log('\n🔄 Agora execute: cd extrator-rate-shopper && npm run process-database');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugSearches();