// Script para analisar estrutura completa do banco local
require('dotenv').config();
const { Pool } = require('pg');

const localConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'osh_user',
  password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
  database: process.env.POSTGRES_DB || 'osh_db',
  max: 10
};

async function analyzeLocalStructure() {
  const pool = new Pool(localConfig);
  
  try {
    console.log('🔍 Analisando estrutura completa do banco local...\n');
    
    // 1. Usuários
    console.log('👥 === USUÁRIOS ===');
    const users = await pool.query(`
      SELECT id, name, email, user_type, active, created_at 
      FROM users 
      ORDER BY id
    `);
    users.rows.forEach(user => {
      console.log(`   ${user.id}. ${user.name} (${user.email}) - ${user.user_type} - ${user.active ? 'ATIVO' : 'INATIVO'}`);
    });

    // 2. Hotéis
    console.log('\n🏨 === HOTÉIS ===');
    const hotels = await pool.query(`
      SELECT id, name, hotel_uuid, created_at 
      FROM hotels 
      ORDER BY id
    `);
    hotels.rows.forEach(hotel => {
      console.log(`   ${hotel.id}. ${hotel.name} - UUID: ${hotel.hotel_uuid}`);
    });

    // 3. Relacionamentos usuário-hotel
    console.log('\n🔗 === RELACIONAMENTOS USUÁRIO-HOTEL ===');
    const userHotels = await pool.query(`
      SELECT uh.*, u.name as user_name, u.email, h.name as hotel_name, h.hotel_uuid
      FROM user_hotels uh
      JOIN users u ON uh.user_id = u.id
      JOIN hotels h ON uh.hotel_id = h.id
      ORDER BY uh.user_id, uh.hotel_id
    `);
    userHotels.rows.forEach(rel => {
      console.log(`   User ${rel.user_id} (${rel.user_name}) <-> Hotel ${rel.hotel_id} (${rel.hotel_name}) - ${rel.active ? 'ATIVO' : 'INATIVO'}`);
      console.log(`      UUID: ${rel.hotel_uuid}`);
    });

    // 4. Propriedades Rate Shopper
    console.log('\n🏨 === PROPRIEDADES RATE SHOPPER ===');
    const properties = await pool.query(`
      SELECT rsp.*, h.name as hotel_name, h.hotel_uuid
      FROM rate_shopper_properties rsp
      JOIN hotels h ON rsp.hotel_id = h.id
      ORDER BY rsp.hotel_id, rsp.id
    `);
    properties.rows.forEach(prop => {
      console.log(`   ${prop.id}. ${prop.property_name} (${prop.platform}) - Hotel: ${prop.hotel_name}`);
      console.log(`      URL: ${prop.booking_url}`);
      console.log(`      Hotel UUID: ${prop.hotel_uuid} - Main: ${prop.is_main_property ? 'SIM' : 'NÃO'}`);
    });

    // 5. Qual usuário acessa qual hotel com Rate Shopper
    console.log('\n🎯 === ACESSO AO RATE SHOPPER POR USUÁRIO ===');
    const accessAnalysis = await pool.query(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        u.user_type,
        h.id as hotel_id,
        h.name as hotel_name,
        h.hotel_uuid,
        COUNT(rsp.id) as properties_count,
        uh.active as relationship_active
      FROM users u
      LEFT JOIN user_hotels uh ON u.id = uh.user_id AND uh.active = true
      LEFT JOIN hotels h ON uh.hotel_id = h.id
      LEFT JOIN rate_shopper_properties rsp ON h.id = rsp.hotel_id AND rsp.active = true
      WHERE u.active = true
      GROUP BY u.id, u.name, u.email, u.user_type, h.id, h.name, h.hotel_uuid, uh.active
      ORDER BY u.id, h.id
    `);
    
    accessAnalysis.rows.forEach(access => {
      if (access.hotel_id) {
        console.log(`   👤 ${access.user_name} (${access.user_type}) -> 🏨 ${access.hotel_name}`);
        console.log(`      UUID: ${access.hotel_uuid} - Propriedades: ${access.properties_count}`);
      } else {
        console.log(`   👤 ${access.user_name} (${access.user_type}) -> ❌ Sem hotéis vinculados`);
      }
    });

    console.log('\n📊 === RESUMO ===');
    console.log(`   - Total usuários: ${users.rows.length}`);
    console.log(`   - Total hotéis: ${hotels.rows.length}`);
    console.log(`   - Total relacionamentos: ${userHotels.rows.length}`);
    console.log(`   - Total propriedades Rate Shopper: ${properties.rows.length}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeLocalStructure().catch(console.error);