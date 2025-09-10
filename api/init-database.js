const fs = require('fs').promises;
const path = require('path');
const db = require('./config/database');
const bcrypt = require('bcrypt');

/**
 * Cria tabelas essenciais se não existirem
 */
async function createEssentialTables() {
  console.log('🏗️ Criando tabelas essenciais...');
  
  // Criar tabela users se não existir
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uuid UUID DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      user_type VARCHAR(50) DEFAULT 'user',
      active BOOLEAN DEFAULT true,
      email_verified BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Criar tabela hotels se não existir
  await db.query(`
    CREATE TABLE IF NOT EXISTS hotels (
      id SERIAL PRIMARY KEY,
      uuid UUID DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      cnpj VARCHAR(18),
      email VARCHAR(255),
      phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(50),
      country VARCHAR(50) DEFAULT 'Brasil',
      zip_code VARCHAR(10),
      logo_url TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Criar tabela user_hotels se não existir
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_hotels (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      hotel_id INTEGER NOT NULL,
      role VARCHAR(50) DEFAULT 'viewer',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      CONSTRAINT fk_user_hotels_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
      CONSTRAINT fk_user_hotels_hotel_id 
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) 
        ON DELETE CASCADE,
      CONSTRAINT uk_user_hotel UNIQUE (user_id, hotel_id)
    );
  `);
  
  console.log('✅ Tabelas essenciais criadas');
}

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
    
    // Verificar se tabela users existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    // Se tabela não existe, criar tabelas essenciais
    if (!tableCheck[0].exists) {
      console.log('🏗️ Tabelas não encontradas, criando...');
      await createEssentialTables();
    }
    
    // Verificar se usuário admin já existe
    const existingAdmin = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', ['admin@osh.com.br']);
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log('✅ Banco já inicializado (usuário admin existe)');
      return;
    }
    
    console.log('🔄 Criando usuário administrador...');
    
    // Criar usuário admin
    const passwordHash = bcrypt.hashSync('admin123', 10);
    
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
    
    // Criar hotel demo
    await db.query(`
      INSERT INTO hotels (name, email, city, state, active) 
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'Hotel Demo OSH',
      'demo@osh.com.br',
      'São Paulo',
      'SP', 
      true
    ]);
    
    // Associar admin ao hotel
    const adminUser = await db.query('SELECT id FROM users WHERE email = $1', ['admin@osh.com.br']);
    const demoHotel = await db.query('SELECT id FROM hotels WHERE name = $1', ['Hotel Demo OSH']);
    
    if (adminUser.length > 0 && demoHotel.length > 0) {
      await db.query(`
        INSERT INTO user_hotels (user_id, hotel_id, role, active) 
        VALUES ($1, $2, $3, $4)
      `, [adminUser[0].id, demoHotel[0].id, 'admin', true]);
    }
    
    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📧 Email: admin@osh.com.br');
    console.log('🔐 Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro na inicialização do banco:', error.message);
  }
}

module.exports = { initDatabase };