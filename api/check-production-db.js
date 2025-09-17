const { Client } = require('pg');

async function checkProductionDB() {
  const client = new Client({
    host: 'ep.osociohoteleiro.com.br',
    port: 5432,
    user: 'postgres',
    password: 'OSH4040()Xx!..nn',
    database: 'osh_sistemas',
    ssl: false
  });

  try {
    console.log('🔄 Conectando ao banco de PRODUÇÃO...');
    console.log('   Host: ep.osociohoteleiro.com.br:5432');
    console.log('   Database: osh_sistemas');
    console.log('   User: postgres');

    await client.connect();
    console.log('✅ CONECTADO AO BANCO DE PRODUÇÃO!');

    // Verificar se a tabela existe
    console.log('\n📋 Verificando se tabela active_extractions existe...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'active_extractions'
      )
    `);

    console.log(`   Tabela existe: ${tableExists.rows[0].exists}`);

    if (tableExists.rows[0].exists) {
      // Verificar estrutura da tabela
      console.log('\n🔍 ESTRUTURA DA TABELA active_extractions:');
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'active_extractions'
        ORDER BY ordinal_position
      `);

      console.log(`   Total de colunas: ${columns.rows.length}`);
      columns.rows.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      // Verificar especificamente se hotel_uuid existe
      const hasHotelUuid = columns.rows.find(col => col.column_name === 'hotel_uuid');
      const hasHotelId = columns.rows.find(col => col.column_name === 'hotel_id');

      console.log(`\n🎯 VERIFICAÇÃO DE COLUNAS CRÍTICAS:`);
      console.log(`   hotel_id: ${hasHotelId ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
      console.log(`   hotel_uuid: ${hasHotelUuid ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);

      if (hasHotelUuid) {
        console.log(`      - Tipo: ${hasHotelUuid.data_type}`);
        console.log(`      - Nullable: ${hasHotelUuid.is_nullable}`);
        console.log(`      - Default: ${hasHotelUuid.column_default || 'NULL'}`);
      }

      // Verificar registros
      const count = await client.query('SELECT COUNT(*) as total FROM active_extractions');
      console.log(`\n📊 TOTAL DE REGISTROS: ${count.rows[0].total}`);

      if (count.rows[0].total > 0) {
        console.log('\n📋 ÚLTIMOS 3 REGISTROS:');
        const sample = await client.query(`
          SELECT id, hotel_id, hotel_uuid, status, created_at
          FROM active_extractions
          ORDER BY created_at DESC
          LIMIT 3
        `);

        sample.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ID: ${row.id}, hotel_id: ${row.hotel_id}, hotel_uuid: ${row.hotel_uuid || 'NULL'}, status: ${row.status}`);
        });
      } else {
        console.log('   ℹ️  Tabela está vazia (sem registros)');
      }

      // Verificar constraints e índices
      console.log('\n🔍 CONSTRAINTS E ÍNDICES:');
      const constraints = await client.query(`
        SELECT constraint_name, constraint_type, column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'active_extractions'
        ORDER BY constraint_type, constraint_name
      `);

      if (constraints.rows.length > 0) {
        constraints.rows.forEach((constraint, index) => {
          console.log(`   ${index + 1}. ${constraint.constraint_name} (${constraint.constraint_type}) - ${constraint.column_name}`);
        });
      } else {
        console.log('   ℹ️  Nenhuma constraint encontrada');
      }

    } else {
      console.log('❌ TABELA active_extractions NÃO EXISTE NO BANCO DE PRODUÇÃO!');

      // Verificar se existe alguma tabela similar
      console.log('\n🔍 Procurando tabelas similares...');
      const similarTables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name LIKE '%extraction%' OR table_name LIKE '%active%'
        ORDER BY table_name
      `);

      if (similarTables.rows.length > 0) {
        console.log('   Tabelas encontradas:');
        similarTables.rows.forEach((table, index) => {
          console.log(`   ${index + 1}. ${table.table_name}`);
        });
      } else {
        console.log('   ℹ️  Nenhuma tabela similar encontrada');
      }
    }

    // Verificar outras tabelas importantes
    console.log('\n📋 VERIFICANDO OUTRAS TABELAS IMPORTANTES:');
    const importantTables = ['hotels', 'rate_shopper_searches', 'rate_shopper_properties'];

    for (const tableName of importantTables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        )
      `, [tableName]);

      console.log(`   ${tableName}: ${exists.rows[0].exists ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
    }

  } catch (error) {
    console.error('❌ ERRO AO CONECTAR/CONSULTAR BANCO:', error.message);
    console.error('   Code:', error.code);
    console.error('   Detail:', error.detail || 'N/A');
    console.error('   Host tentado: ep.osociohoteleiro.com.br:5432');
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Conexão fechada');
    } catch (e) {
      console.log('\n🔌 Conexão já estava fechada');
    }
  }
}

console.log('🔍 VERIFICAÇÃO DO BANCO DE PRODUÇÃO - TABELA active_extractions');
console.log('=' * 80);
checkProductionDB().then(() => {
  console.log('\n✅ Verificação concluída');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});