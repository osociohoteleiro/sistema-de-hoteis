const db = require('./api/config/database');

async function createCopacabanaSearch() {
  try {
    console.log('🏨 Criando propriedade e busca para Copacabana Palace...');
    
    // 1. Verificar se a propriedade já existe
    let properties = await db.query('SELECT * FROM rate_shopper_properties WHERE booking_url LIKE $1', ['%copacabana-palace%']);
    
    let propertyId;
    if (properties.length === 0) {
      // Criar nova propriedade
      console.log('➕ Criando nova propriedade: Copacabana Palace');
      const propResult = await db.query(`
        INSERT INTO rate_shopper_properties (
          hotel_id, property_name, booking_url, active, max_bundle_size,
          city, country, star_rating
        ) VALUES (2, 'COPACABANA PALACE', 'https://www.booking.com/hotel/br/copacabana-palace.pt-br.html', 
                  true, 3, 'Rio de Janeiro', 'BR', 5)
        RETURNING id
      `);
      propertyId = propResult[0].id;
      console.log(`✅ Propriedade criada com ID: ${propertyId}`);
    } else {
      propertyId = properties[0].id;
      console.log(`✅ Propriedade já existe com ID: ${propertyId}`);
    }

    // 2. Criar busca para próximo final de semana
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (6 - startDate.getDay() + 7)); // Próximo sábado
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // Segunda-feira
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Criando busca: ${startDateStr} → ${endDateStr}`);
    
    const searchResult = await db.query(`
      INSERT INTO rate_shopper_searches (
        hotel_id, property_id, search_type, start_date, end_date, 
        status, total_dates, uuid, created_at
      ) VALUES (2, $1, 'MANUAL', $2, $3, 'PENDING', 3, gen_random_uuid(), NOW())
      RETURNING *
    `, [propertyId, startDateStr, endDateStr]);
    
    const search = searchResult[0];
    console.log(`✅ Busca criada: ID ${search.id}, UUID: ${search.uuid}`);
    
    // 3. Mostrar resumo
    console.log('\n📋 RESUMO:');
    console.log('=========');
    console.log(`🏨 Hotel: Copacabana Palace (5 estrelas)`);
    console.log(`📍 Localização: Rio de Janeiro, BR`);
    console.log(`🔗 URL: https://www.booking.com/hotel/br/copacabana-palace.pt-br.html`);
    console.log(`📅 Período: ${startDate.toLocaleDateString('pt-BR')} → ${endDate.toLocaleDateString('pt-BR')}`);
    console.log(`🆔 Search ID: ${search.id}`);
    console.log(`🏷️  Property ID: ${propertyId}`);
    
    console.log('\n🚀 PRONTO! Execute agora:');
    console.log('cd extrator-rate-shopper && npm run process-database');
    console.log('\nOs preços serão salvos DIRETAMENTE NO BANCO DE DADOS! 💾');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createCopacabanaSearch();