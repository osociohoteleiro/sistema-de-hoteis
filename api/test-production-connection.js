// Script para testar conexão com banco de produção
const { Pool } = require('pg');

const productionConfig = {
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels',
  ssl: false,
  connectionTimeoutMillis: 10000,
  max: 1
};

async function testProductionConnection() {
  console.log('🔄 Testando conexão com banco de produção...');
  console.log('📍 Host: ep.osociohoteleiro.com.br:5432');
  console.log('🗄️  Database: osh_hotels');
  console.log('👤 User: postgres');
  console.log('');

  const pool = new Pool(productionConfig);
  
  try {
    // Testar conexão básica
    console.log('1️⃣ Testando conexão básica...');
    const client = await pool.connect();
    
    // Testar query simples
    console.log('2️⃣ Testando query básica...');
    const testResult = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Conexão bem-sucedida!');
    console.log(`⏰ Hora do servidor: ${testResult.rows[0].current_time}`);
    console.log(`🐘 Versão PostgreSQL: ${testResult.rows[0].postgres_version.split(' ')[0]}`);
    
    // Verificar se tabelas principais existem
    console.log('\n3️⃣ Verificando tabelas principais...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('hotels', 'rate_shopper_properties', 'users', 'user_hotels')
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // Verificar estrutura da tabela rate_shopper_properties
    console.log('\n4️⃣ Verificando estrutura da tabela rate_shopper_properties...');
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_properties'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Colunas da tabela rate_shopper_properties:');
    schemaResult.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Verificar se o hotel existe
    console.log('\n5️⃣ Verificando hotel alvo...');
    const hotelResult = await client.query(`
      SELECT id, name, hotel_uuid 
      FROM hotels 
      WHERE hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1'
    `);
    
    if (hotelResult.rows.length > 0) {
      const hotel = hotelResult.rows[0];
      console.log(`✅ Hotel encontrado: ${hotel.name} (ID: ${hotel.id})`);
      console.log(`🆔 UUID: ${hotel.hotel_uuid}`);
      
      // Verificar propriedades existentes
      const propsResult = await client.query(`
        SELECT COUNT(*) as total 
        FROM rate_shopper_properties 
        WHERE hotel_id = $1
      `, [hotel.id]);
      
      console.log(`📊 Propriedades existentes: ${propsResult.rows[0].total}`);
    } else {
      console.log('❌ Hotel não encontrado com UUID: 3e74f4e5-8763-11f0-bd40-02420a0b00b1');
    }
    
    client.release();
    console.log('\n🎉 TESTE DE CONEXÃO CONCLUÍDO COM SUCESSO!');
    console.log('✅ Posso prosseguir com a sincronização dos dados.');
    
  } catch (error) {
    console.error('\n❌ ERRO NA CONEXÃO:');
    console.error(`📋 Tipo: ${error.code || 'Desconhecido'}`);
    console.error(`💬 Mensagem: ${error.message}`);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('\n🔧 POSSÍVEIS SOLUÇÕES:');
      console.error('   1. Verificar se o hostname está correto');
      console.error('   2. Verificar se o banco está rodando');
      console.error('   3. Verificar se há firewall bloqueando');
      console.error('   4. Tentar conectar de dentro da mesma rede/container');
    }
    
  } finally {
    await pool.end();
  }
}

testProductionConnection().catch(console.error);