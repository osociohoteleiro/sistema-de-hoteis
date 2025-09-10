const fs = require('fs').promises;
const path = require('path');
const db = require('./config/database');
const bcrypt = require('bcrypt');

/**
 * Inicializa o banco de dados com as tabelas e usuário admin
 * Executa automaticamente quando a API inicia
 */
async function initDatabase() {
  try {
    console.log('🔄 Verificando inicialização do banco de dados...');
    
    // Só executar se for PostgreSQL
    if (process.env.DB_MODE !== 'postgres') {
      console.log('⚠️ Não é PostgreSQL, pulando inicialização');
      return;
    }

    await db.connect();
    
    // Verificar se usuário admin já existe
    const existingAdmin = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', ['admin@osh.com.br']);
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log('✅ Banco já inicializado (usuário admin existe)');
      return;
    }
    
    console.log('🔄 Inicializando banco de dados pela primeira vez...');
    
    // Verificar se tabela users existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck[0].exists) {
      console.log('❌ Tabela users não existe. Execute as migrações primeiro.');
      return;
    }
    
    // Verificar estrutura da tabela users
    const columns = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    
    const columnNames = columns.map(col => col.column_name);
    console.log('📋 Colunas da tabela users:', columnNames.join(', '));
    
    // Criar usuário admin baseado na estrutura existente
    const passwordHash = bcrypt.hashSync('admin123', 10);
    
    if (columnNames.includes('password_hash') && columnNames.includes('user_type')) {
      // Estrutura nova (PostgreSQL)
      await db.query(`
        INSERT INTO users (name, email, password_hash, user_type, active, email_verified) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'Administrador OSH',
        'admin@osh.com.br',
        passwordHash,
        'admin',
        true,
        true
      ]);
    } else if (columnNames.includes('password') && columnNames.includes('role')) {
      // Estrutura antiga (MySQL/MariaDB)
      await db.query(`
        INSERT INTO users (name, email, password, role, is_active) 
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'Administrador OSH',
        'admin@osh.com.br',
        passwordHash,
        'admin',
        true
      ]);
    } else {
      console.log('⚠️ Estrutura da tabela users não reconhecida');
      return;
    }
    
    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📧 Email: admin@osh.com.br');
    console.log('🔐 Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro na inicialização do banco:', error.message);
  }
}

module.exports = { initDatabase };