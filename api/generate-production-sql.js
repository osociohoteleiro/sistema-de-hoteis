// Script para gerar SQLs de inserção para produção
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const localConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'osh_user',
  password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
  database: process.env.POSTGRES_DB || 'osh_db',
  max: 10
};

async function generateProductionSQL() {
  const pool = new Pool(localConfig);
  
  try {
    console.log('🔍 Analisando dados locais para gerar SQLs de produção...\n');
    
    let sqlStatements = [];
    
    // Adicionar header
    sqlStatements.push('-- SQLs para sincronizar Rate Shopper para produção');
    sqlStatements.push('-- Gerado automaticamente em ' + new Date().toISOString());
    sqlStatements.push('');

    // 1. Buscar hotel do Giandro
    const userHotelData = await pool.query(`
      SELECT 
        u.id as user_id, u.name, u.email, u.user_type,
        h.id as hotel_id, h.name as hotel_name, h.hotel_uuid
      FROM users u
      JOIN user_hotels uh ON u.id = uh.user_id AND uh.active = true
      JOIN hotels h ON uh.hotel_id = h.id
      WHERE u.email = 'giandroft@gmail.com'
    `);

    if (userHotelData.rows.length === 0) {
      console.log('❌ Usuário Giandro não encontrado');
      return;
    }

    const userData = userHotelData.rows[0];
    console.log(`✅ Hotel: ${userData.hotel_name} - UUID: ${userData.hotel_uuid}`);

    // 2. Buscar propriedades
    const properties = await pool.query(`
      SELECT * FROM rate_shopper_properties 
      WHERE hotel_id = $1 AND active = true 
      ORDER BY id
    `, [userData.hotel_id]);

    console.log(`✅ Encontradas ${properties.rows.length} propriedades`);

    // 3. Gerar comentário explicativo
    sqlStatements.push('-- Hotel: ' + userData.hotel_name);
    sqlStatements.push('-- UUID: ' + userData.hotel_uuid);
    sqlStatements.push('-- Propriedades: ' + properties.rows.length);
    sqlStatements.push('');

    // 4. Gerar SQLs para cada propriedade
    sqlStatements.push('-- Inserção de propriedades Rate Shopper');
    sqlStatements.push('DO $$');
    sqlStatements.push('DECLARE');
    sqlStatements.push('    hotel_id_var INTEGER;');
    sqlStatements.push('BEGIN');
    sqlStatements.push('    -- Buscar ID do hotel pelo UUID');
    sqlStatements.push(`    SELECT id INTO hotel_id_var FROM hotels WHERE hotel_uuid = '${userData.hotel_uuid}';`);
    sqlStatements.push('    ');
    sqlStatements.push('    IF hotel_id_var IS NOT NULL THEN');
    sqlStatements.push('        -- Deletar propriedades existentes para evitar duplicatas');
    sqlStatements.push('        DELETE FROM rate_shopper_properties WHERE hotel_id = hotel_id_var;');
    sqlStatements.push('        ');

    properties.rows.forEach((prop, index) => {
      const escapedName = prop.property_name.replace(/'/g, "''");
      const escapedUrl = prop.booking_url.replace(/'/g, "''");
      const escapedLocation = (prop.location || '').replace(/'/g, "''");
      const escapedCategory = (prop.category || '').replace(/'/g, "''");
      const escapedOtaName = prop.ota_name.replace(/'/g, "''");

      sqlStatements.push(`        -- ${index + 1}. ${prop.property_name} (${prop.platform}) ${prop.is_main_property ? '⭐' : ''}`);
      sqlStatements.push('        INSERT INTO rate_shopper_properties (');
      sqlStatements.push('            hotel_id, property_name, booking_url, location, category,');
      sqlStatements.push('            competitor_type, ota_name, platform, max_bundle_size,');
      sqlStatements.push('            is_main_property, active, created_at, updated_at');
      sqlStatements.push('        ) VALUES (');
      sqlStatements.push('            hotel_id_var,');
      sqlStatements.push(`            '${escapedName}',`);
      sqlStatements.push(`            '${escapedUrl}',`);
      sqlStatements.push(`            '${escapedLocation}',`);
      sqlStatements.push(`            '${escapedCategory}',`);
      sqlStatements.push(`            '${prop.competitor_type}',`);
      sqlStatements.push(`            '${escapedOtaName}',`);
      sqlStatements.push(`            '${prop.platform}',`);
      sqlStatements.push(`            ${prop.max_bundle_size},`);
      sqlStatements.push(`            ${prop.is_main_property},`);
      sqlStatements.push(`            ${prop.active},`);
      sqlStatements.push(`            NOW(),`);
      sqlStatements.push(`            NOW()`);
      sqlStatements.push('        );');
      sqlStatements.push('        ');
    });

    sqlStatements.push('        RAISE NOTICE \'Inseridas % propriedades para hotel %\', ' + properties.rows.length + ', hotel_id_var;');
    sqlStatements.push('    ELSE');
    sqlStatements.push('        RAISE EXCEPTION \'Hotel não encontrado com UUID: ' + userData.hotel_uuid + '\';');
    sqlStatements.push('    END IF;');
    sqlStatements.push('END $$;');
    sqlStatements.push('');

    // 5. Adicionar verificação
    sqlStatements.push('-- Verificação das propriedades inseridas');
    sqlStatements.push('SELECT ');
    sqlStatements.push('    h.name as hotel_name,');
    sqlStatements.push('    COUNT(rsp.id) as total_properties,');
    sqlStatements.push('    COUNT(CASE WHEN rsp.is_main_property = true THEN 1 END) as main_properties');
    sqlStatements.push('FROM hotels h');
    sqlStatements.push('LEFT JOIN rate_shopper_properties rsp ON h.id = rsp.hotel_id AND rsp.active = true');
    sqlStatements.push(`WHERE h.hotel_uuid = '${userData.hotel_uuid}'`);
    sqlStatements.push('GROUP BY h.id, h.name;');

    // 6. Salvar arquivo
    const sqlContent = sqlStatements.join('\n');
    const filename = 'production-rate-shopper-sync.sql';
    fs.writeFileSync(filename, sqlContent);

    console.log(`\n📁 SQL gerado: ${filename}`);
    console.log('📊 Conteúdo:');
    console.log(`   - ${properties.rows.length} propriedades Rate Shopper`);
    console.log(`   - Hotel: ${userData.hotel_name}`);
    console.log(`   - UUID: ${userData.hotel_uuid}`);
    
    console.log('\n🚀 Para executar na produção:');
    console.log('   1. Conecte ao banco de produção');
    console.log(`   2. Execute: \\i ${filename}`);
    console.log('   3. Verifique: SELECT * FROM rate_shopper_properties WHERE hotel_id = (SELECT id FROM hotels WHERE hotel_uuid = \'' + userData.hotel_uuid + '\');');
    
    // Mostrar algumas linhas do arquivo
    console.log('\n📋 Preview do SQL:');
    const lines = sqlContent.split('\n');
    lines.slice(0, 20).forEach(line => console.log('   ' + line));
    if (lines.length > 20) {
      console.log('   ... (mais ' + (lines.length - 20) + ' linhas)');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

generateProductionSQL().catch(console.error);