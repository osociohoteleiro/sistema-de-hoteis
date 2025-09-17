const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function executeMigrationInProduction() {
  const client = new Client({
    host: 'ep.osociohoteleiro.com.br',
    port: 5432,
    user: 'postgres',
    password: 'OSH4040()Xx!..nn',
    database: 'osh_sistemas',
    ssl: false
  });

  try {
    console.log('🔄 EXECUTANDO MIGRAÇÃO 036 NO BANCO DE PRODUÇÃO...');
    console.log('   Host: ep.osociohoteleiro.com.br:5432');
    console.log('   Database: osh_sistemas');

    await client.connect();
    console.log('✅ Conectado ao banco de PRODUÇÃO!');

    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, 'migrations', '036_add_hotel_uuid_to_active_extractions.sql');
    console.log(`📄 Lendo migração: ${migrationPath}`);

    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    console.log('📄 SQL da migração carregado');

    // EXECUTAR A MIGRAÇÃO
    console.log('\n🚀 EXECUTANDO MIGRAÇÃO SQL...');
    await client.query(migrationSQL);
    console.log('✅ MIGRAÇÃO 036 EXECUTADA COM SUCESSO NO BANCO DE PRODUÇÃO!');

    // Verificar resultado
    console.log('\n🔍 VERIFICANDO SE A COLUNA FOI CRIADA...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'active_extractions'
      AND column_name IN ('hotel_id', 'hotel_uuid')
      ORDER BY column_name
    `);

    console.log('📊 Colunas da tabela active_extractions:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Verificar especificamente hotel_uuid
    const hasHotelUuid = result.rows.find(row => row.column_name === 'hotel_uuid');
    console.log(`\n🎯 RESULTADO: hotel_uuid ${hasHotelUuid ? '✅ CRIADA COM SUCESSO!' : '❌ NÃO FOI CRIADA'}`);

    if (hasHotelUuid) {
      console.log(`   Tipo: ${hasHotelUuid.data_type}`);
      console.log(`   Nullable: ${hasHotelUuid.is_nullable}`);
    }

    // Verificar se há registros e como foram populados
    const count = await client.query('SELECT COUNT(*) as total FROM active_extractions');
    console.log(`\n📊 Total de registros: ${count.rows[0].total}`);

    if (count.rows[0].total > 0) {
      console.log('\n📋 Verificando como os registros foram populados:');
      const sample = await client.query(`
        SELECT id, hotel_id, hotel_uuid, status, created_at
        FROM active_extractions
        ORDER BY created_at DESC
        LIMIT 3
      `);

      sample.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ID: ${row.id}, hotel_id: ${row.hotel_id}, hotel_uuid: ${row.hotel_uuid || 'NULL'}, status: ${row.status}`);
      });
    }

    // Verificar constraints criadas
    console.log('\n🔍 Verificando constraints criadas:');
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'active_extractions'
      AND constraint_name LIKE '%hotel_uuid%'
    `);

    if (constraints.rows.length > 0) {
      constraints.rows.forEach(constraint => {
        console.log(`   ✅ ${constraint.constraint_name} (${constraint.constraint_type})`);
      });
    } else {
      console.log('   ℹ️  Nenhuma constraint específica para hotel_uuid encontrada');
    }

  } catch (error) {
    console.error('\n❌ ERRO AO EXECUTAR MIGRAÇÃO:', error.message);
    console.error('   Code:', error.code);
    console.error('   Detail:', error.detail || 'N/A');

    if (error.message.includes('already exists')) {
      console.log('\n✅ A coluna pode já existir - verificando...');

      try {
        const checkResult = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'active_extractions'
          AND column_name = 'hotel_uuid'
        `);

        if (checkResult.rows.length > 0) {
          console.log('✅ Coluna hotel_uuid JÁ EXISTE!');
        } else {
          console.log('❌ Coluna hotel_uuid NÃO EXISTE!');
        }
      } catch (checkError) {
        console.error('❌ Erro ao verificar:', checkError.message);
      }
    }

  } finally {
    await client.end();
    console.log('\n🔌 Conexão com banco de produção fechada');
  }
}

console.log('🎯 MIGRAÇÃO 036 - ADICIONAR hotel_uuid NO BANCO DE PRODUÇÃO');
console.log('=' * 80);

executeMigrationInProduction().then(() => {
  console.log('\n✅ PROCESSO CONCLUÍDO');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 ERRO FATAL:', error);
  process.exit(1);
});