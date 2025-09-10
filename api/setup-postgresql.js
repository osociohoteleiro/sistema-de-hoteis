#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const db = require('./config/database');

async function setupPostgreSQL() {
  try {
    console.log('🚀 Configurando PostgreSQL para OSH Hotel System...');
    
    // Configurar para usar PostgreSQL
    process.env.DB_MODE = 'postgres';
    
    // Conectar ao banco
    await db.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Executar migração completa
    console.log('🔄 Executando migração inicial completa...');
    
    const migrationPath = path.join(__dirname, 'migrations', '000_init_postgresql_complete.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    // Dividir comandos SQL por ponto e vírgula
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando
    for (const command of commands) {
      if (command.trim()) {
        try {
          await db.query(command);
          console.log(`✅ OK: ${command.substring(0, 50)}...`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️  SKIP: ${command.substring(0, 50)}... (já existe)`);
          } else {
            console.error(`❌ ERRO: ${command.substring(0, 50)}...`);
            console.error(`   Detalhes: ${error.message}`);
          }
        }
      }
    }
    
    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...');
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas disponíveis:');
    result.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
    // Verificar usuário administrador
    console.log('👤 Verificando usuário administrador...');
    const userResult = await db.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE email = 'admin@osh.com.br'
    `);
    
    if (userResult.length > 0) {
      console.log('✅ Usuário administrador encontrado:');
      console.log(`   📧 Email: ${userResult[0].email}`);
      console.log(`   👤 Nome: ${userResult[0].name}`);
      console.log(`   🔑 Papel: ${userResult[0].role}`);
      console.log('   🔐 Senha padrão: admin123');
    }
    
    console.log('🎉 PostgreSQL configurado com sucesso!');
    console.log('');
    console.log('🔗 Credenciais de acesso:');
    console.log('   Email: admin@osh.com.br');
    console.log('   Senha: admin123');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Verificar se foi chamado diretamente
if (require.main === module) {
  setupPostgreSQL();
}

module.exports = { setupPostgreSQL };