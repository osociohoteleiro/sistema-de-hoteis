// Script para criar propriedades manualmente via API existente
require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

const API_BASE = 'https://osh-sistemas-api-backend.d32pnk.easypanel.host';

// Configuração do banco local
const localConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'osh_user',
  password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
  database: process.env.POSTGRES_DB || 'osh_db',
  max: 10
};

async function main() {
  const localPool = new Pool(localConfig);
  
  try {
    console.log('🔄 Conectando ao banco local...');
    await localPool.connect();
    console.log('✅ Conectado ao banco local');

    // 1. Buscar hotéis disponíveis na produção
    console.log('\n📋 Verificando hotéis na produção...');
    const hotelsResponse = await axios.get(`${API_BASE}/api/list-tables`);
    console.log('API Response:', hotelsResponse.data);

    // 2. Buscar propriedades do banco local
    console.log('\n📋 Buscando propriedades do banco local...');
    const localProperties = await localPool.query(`
      SELECT 
        rsp.*,
        h.name as hotel_name,
        h.hotel_uuid
      FROM rate_shopper_properties rsp
      JOIN hotels h ON rsp.hotel_id = h.id
      WHERE rsp.active = true
      ORDER BY rsp.property_name
    `);

    console.log(`✅ Encontradas ${localProperties.rows.length} propriedades:`);
    localProperties.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.property_name} (${prop.hotel_name})`);
      console.log(`      URL: ${prop.booking_url}`);
      console.log(`      Platform: ${prop.platform || 'booking'}`);
      console.log(`      Main Property: ${prop.is_main_property ? 'SIM' : 'NÃO'}`);
      console.log('');
    });

    // 3. Tentar buscar hotel específico (usando UUID conhecido)
    // Vamos assumir um hotel padrão que provavelmente existe
    const testHotelUuid = localProperties.rows[0]?.hotel_uuid;
    if (testHotelUuid) {
      console.log(`\n🔍 Testando acesso às propriedades do hotel ${testHotelUuid}...`);
      
      try {
        const propertiesResponse = await axios.get(`${API_BASE}/api/rate-shopper/${testHotelUuid}/properties`);
        console.log(`✅ Hotel encontrado na produção! Propriedades atuais: ${propertiesResponse.data.data.length}`);
        
        if (propertiesResponse.data.data.length === 0) {
          console.log('\n🎯 Nenhuma propriedade encontrada na produção. Vamos criar!');
          
          // Criar cada propriedade
          for (const prop of localProperties.rows.slice(0, 3)) { // Criar apenas as 3 primeiras como teste
            console.log(`\n📝 Criando propriedade: ${prop.property_name}`);
            
            try {
              const createResponse = await axios.post(`${API_BASE}/api/rate-shopper/${testHotelUuid}/properties`, {
                property_name: prop.property_name,
                booking_url: prop.booking_url,
                location: prop.location,
                category: prop.category,
                max_bundle_size: prop.max_bundle_size || 7,
                is_main_property: prop.is_main_property || false
              });
              
              console.log(`✅ Propriedade criada: ${prop.property_name}`);
              
            } catch (createError) {
              console.log(`❌ Erro ao criar ${prop.property_name}:`, createError.response?.data || createError.message);
            }
          }
          
        } else {
          console.log('✅ Propriedades já existem na produção:');
          propertiesResponse.data.data.forEach((prop, index) => {
            console.log(`   ${index + 1}. ${prop.property_name}`);
          });
        }
        
      } catch (propertiesError) {
        console.log(`❌ Erro ao acessar propriedades:`, propertiesError.response?.data || propertiesError.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await localPool.end();
  }
}

main().catch(console.error);