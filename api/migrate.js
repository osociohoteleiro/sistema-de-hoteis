#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const db = require('./config/database');

async function runMigration(filename) {
  try {
    console.log(`🔄 Executando migração: ${filename}`);
    
    const migrationPath = path.join(__dirname, 'migrations', filename);
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    // Dividir comandos SQL por ponto e vírgula
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    // Executar cada comando
    for (const command of commands) {
      if (command.trim()) {
        console.log(`📝 Executando: ${command.substring(0, 60)}...`);
        await db.query(command);
      }
    }
    
    console.log(`✅ Migração ${filename} executada com sucesso!`);
    
  } catch (error) {
    console.error(`❌ Erro na migração ${filename}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando migrações...');
    
    await db.connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Lista de migrações para executar
    const migrations = [
      '001_create_evolution_instances.sql'
    ];
    
    for (const migration of migrations) {
      await runMigration(migration);
    }
    
    console.log('🎉 Todas as migrações foram executadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante as migrações:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Verificar se foi chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { runMigration, main };