// Script para sincronizar dados completos do local para produção
require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');

const localConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'osh_user',
  password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
  database: process.env.POSTGRES_DB || 'osh_db',
  max: 10
};

const API_BASE = 'https://osh-sistemas-api-backend.d32pnk.easypanel.host';

async function syncCompleteToProduction() {
  const pool = new Pool(localConfig);
  
  try {
    console.log('🚀 Iniciando sincronização completa para produção...\n');
    
    // 1. Buscar dados do usuário Giandro e seu hotel
    console.log('👤 Buscando dados do usuário Giandro...');
    const userHotelData = await pool.query(`
      SELECT 
        u.id as user_id, u.name, u.email, u.user_type,
        h.id as hotel_id, h.name as hotel_name, h.hotel_uuid,
        COUNT(rsp.id) as properties_count
      FROM users u
      JOIN user_hotels uh ON u.id = uh.user_id AND uh.active = true
      JOIN hotels h ON uh.hotel_id = h.id
      LEFT JOIN rate_shopper_properties rsp ON h.id = rsp.hotel_id AND rsp.active = true
      WHERE u.email = 'giandroft@gmail.com'
      GROUP BY u.id, u.name, u.email, u.user_type, h.id, h.name, h.hotel_uuid
    `);

    if (userHotelData.rows.length === 0) {
      console.log('❌ Usuário Giandro não encontrado ou sem hotéis vinculados');
      return;
    }

    const userData = userHotelData.rows[0];
    console.log(`✅ Usuário: ${userData.name} (${userData.email})`);
    console.log(`✅ Hotel: ${userData.hotel_name} - UUID: ${userData.hotel_uuid}`);
    console.log(`✅ Propriedades no local: ${userData.properties_count}`);

    // 2. Buscar todas as propriedades deste hotel
    console.log('\n🏨 Buscando propriedades do Rate Shopper...');
    const properties = await pool.query(`
      SELECT * FROM rate_shopper_properties 
      WHERE hotel_id = $1 AND active = true 
      ORDER BY id
    `, [userData.hotel_id]);

    console.log(`✅ Encontradas ${properties.rows.length} propriedades para sincronizar:`);
    properties.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.property_name} (${prop.platform}) ${prop.is_main_property ? '⭐ PRINCIPAL' : ''}`);
    });

    // 3. Verificar se hotel existe na produção
    console.log('\n🔍 Verificando hotel na produção...');
    try {
      const checkResponse = await axios.get(`${API_BASE}/api/rate-shopper/${userData.hotel_uuid}/properties`);
      console.log(`✅ Hotel existe na produção com ${checkResponse.data.data.length} propriedades`);
      
      if (checkResponse.data.data.length > 0) {
        console.log('⚠️ Propriedades já existem na produção:');
        checkResponse.data.data.forEach((prop, index) => {
          console.log(`   ${index + 1}. ${prop.property_name} (${prop.platform}) ${prop.is_main_property ? '⭐' : ''}`);
        });
        
        // Perguntar se deve continuar (simulando resposta sim para automação)
        console.log('\n🔄 Continuando com sincronização...');
      }
    } catch (error) {
      console.log(`❌ Erro ao verificar hotel na produção: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      return;
    }

    // 4. Sincronizar cada propriedade
    console.log('\n📡 Sincronizando propriedades para produção...');
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const prop of properties.rows) {
      try {
        console.log(`\n📝 Sincronizando: ${prop.property_name} (${prop.platform})`);
        
        const payload = {
          property_name: prop.property_name,
          booking_url: prop.booking_url,
          location: prop.location,
          category: prop.category,
          competitor_type: prop.competitor_type,
          ota_name: prop.ota_name,
          platform: prop.platform,
          max_bundle_size: prop.max_bundle_size,
          is_main_property: prop.is_main_property,
          active: prop.active
        };

        const response = await axios.post(
          `${API_BASE}/api/rate-shopper/${userData.hotel_uuid}/properties`,
          payload,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
          }
        );

        console.log(`✅ Sincronizada: ${prop.property_name} ${prop.is_main_property ? '⭐' : ''}`);
        syncedCount++;

      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
          console.log(`⚠️ Já existe: ${prop.property_name}`);
          skippedCount++;
        } else {
          console.log(`❌ Erro: ${prop.property_name} - ${error.response?.data?.error || error.message}`);
          errorCount++;
        }
      }

      // Delay entre requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 5. Verificação final
    console.log('\n🔍 Verificação final...');
    const finalCheck = await axios.get(`${API_BASE}/api/rate-shopper/${userData.hotel_uuid}/properties`);
    
    console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA!');
    console.log('📊 RESUMO:');
    console.log(`   - Propriedades no local: ${properties.rows.length}`);
    console.log(`   - Propriedades na produção: ${finalCheck.data.data.length}`);
    console.log(`   - Sincronizadas: ${syncedCount}`);
    console.log(`   - Já existiam: ${skippedCount}`);
    console.log(`   - Erros: ${errorCount}`);
    
    console.log('\n🏨 Propriedades na produção:');
    finalCheck.data.data.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.property_name} (${prop.platform}) ${prop.is_main_property ? '⭐ PRINCIPAL' : ''}`);
    });

    console.log(`\n🌐 Acesse: https://pms.osociohoteleiro.com.br/rate-shopper/properties`);
    console.log(`📱 Hotel UUID para login: ${userData.hotel_uuid}`);

  } catch (error) {
    console.error('💥 Erro na sincronização:', error.message);
  } finally {
    await pool.end();
  }
}

syncCompleteToProduction().catch(console.error);