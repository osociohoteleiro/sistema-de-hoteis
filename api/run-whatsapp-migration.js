#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const db = require('./config/database');

async function runWhatsAppMigration() {
  try {
    console.log('🚀 Iniciando migração WhatsApp Cloud...');
    
    await db.connect();
    console.log('✅ Conectado ao banco de dados');
    
    const migrationPath = path.join(__dirname, 'migrations', 'create_whatsapp_cloud_simple.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    console.log('📄 Lendo arquivo de migração...');
    
    // Remover comentários e dividir comandos SQL
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*'))
      .join('\n');
    
    const commands = cleanSql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 10); // Filtrar comandos muito pequenos
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`🔄 [${i + 1}/${commands.length}] ${command.substring(0, 60)}...`);
        try {
          await db.query(command);
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        } catch (error) {
          if (error.message.includes('Table') && error.message.includes('already exists')) {
            console.log(`⚠️ Tabela já existe, pulando...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('🎉 Migração WhatsApp Cloud executada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await db.close();
    console.log('🔒 Conexão com banco de dados fechada');
  }
}

runWhatsAppMigration();