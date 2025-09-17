/**
 * Script para executar migração 036
 * Adiciona coluna hotel_uuid à tabela active_extractions
 */

const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  console.log('🔄 Iniciando migração 036 - Adicionar hotel_uuid à active_extractions...');

  try {
    // Conectar ao banco
    const db = require('./config/database');

    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, 'migrations', '036_add_hotel_uuid_to_active_extractions.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📄 Executando SQL da migração...');

    // Executar migração
    await db.query(migrationSQL);

    console.log('✅ Migração 036 executada com sucesso!');
    console.log('📋 Coluna hotel_uuid adicionada à tabela active_extractions');

    // Verificar resultado
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'active_extractions'
      AND column_name IN ('hotel_id', 'hotel_uuid')
      ORDER BY column_name
    `);

    console.log('\n📊 Estrutura atual da tabela active_extractions:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Verificar se há registros
    const countResult = await db.query('SELECT COUNT(*) as total FROM active_extractions');
    console.log(`\n📈 Total de registros na tabela: ${countResult.rows[0].total}`);

    if (countResult.rows[0].total > 0) {
      const sampleResult = await db.query(`
        SELECT hotel_id, hotel_uuid, status, created_at
        FROM active_extractions
        LIMIT 3
      `);

      console.log('\n📋 Amostra dos registros:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. hotel_id: ${row.hotel_id}, hotel_uuid: ${row.hotel_uuid}, status: ${row.status}`);
      });
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro na migração 036:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;