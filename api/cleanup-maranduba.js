const mysql = require('mysql2/promise');

async function cleanupMaranduba() {
  let connection = null;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: 'ep.osociohoteleiro.com.br',
      user: 'mariadb',
      password: 'OSH4040()Xx!..n',
      database: 'osh-ia',
      port: 3306
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar searches que usam URLs incorretas
    console.log('\n🔍 Verificando searches com URLs incorretas...');
    const [searches] = await connection.execute(`
      SELECT rs.id, rs.property_id, rsp.property_name, rsp.booking_url, rs.status
      FROM rate_shopper_searches rs
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rsp.id IN (4, 7)
    `);

    if (searches.length > 0) {
      console.log('📋 Searches encontradas com URLs incorretas:');
      searches.forEach(search => {
        console.log(`   - Search #${search.id}: ${search.property_name} (${search.status})`);
        console.log(`     URL: ${search.booking_url}`);
      });

      // Deletar searches que usam URLs incorretas
      console.log('\n🗑️  Deletando searches com URLs incorretas...');
      const [deleteResult1] = await connection.execute(`
        DELETE FROM rate_shopper_searches 
        WHERE property_id IN (4, 7)
      `);
      console.log(`✅ ${deleteResult1.affectedRows} searches deletadas`);
    } else {
      console.log('✅ Nenhuma search encontrada com URLs incorretas');
    }

    // Deletar propriedades com URLs incorretas
    console.log('\n🗑️  Deletando propriedades com URLs incorretas...');
    const [deleteResult2] = await connection.execute(`
      DELETE FROM rate_shopper_properties 
      WHERE id IN (4, 7) 
      AND property_name = 'HOTEL MARANDUBA'
      AND booking_url LIKE '%maranduba.html'
    `);
    console.log(`✅ ${deleteResult2.affectedRows} propriedades deletadas`);

    // Verificar resultado final
    console.log('\n📊 Hotel Maranduba após limpeza:');
    const [finalResult] = await connection.execute(`
      SELECT id, property_name, booking_url, active
      FROM rate_shopper_properties 
      WHERE property_name = 'HOTEL MARANDUBA'
    `);

    if (finalResult.length > 0) {
      finalResult.forEach(prop => {
        console.log(`   ✅ ID ${prop.id}: ${prop.property_name}`);
        console.log(`      URL: ${prop.booking_url}`);
        console.log(`      Status: ${prop.active ? 'Ativo' : 'Inativo'}`);
      });
    } else {
      console.log('   ⚠️  Nenhum Hotel Maranduba encontrado!');
    }

    console.log('\n🎉 Limpeza concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔐 Conexão fechada');
    }
  }
}

cleanupMaranduba();