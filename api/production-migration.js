// Script de migração para produção EasyPanel
// ULTRA SIMPLES - apenas o essencial para PMS funcionar

const db = require('./config/database');

async function runProductionMigration() {
    try {
        console.log('🚀 PRODUÇÃO: Executando migração mínima...');
        
        // 1. Criar tabela users
        console.log('👤 Criando tabela users...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // 2. Criar tabela app_configurations
        console.log('⚙️ Criando tabela app_configurations...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS app_configurations (
                id SERIAL PRIMARY KEY,
                hotel_id INTEGER,
                app_name VARCHAR(50) NOT NULL,
                app_title VARCHAR(255) DEFAULT NULL,
                logo_url TEXT DEFAULT NULL,
                favicon_url TEXT DEFAULT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (hotel_id, app_name)
            );
        `);
        
        // 3. Criar usuário admin
        console.log('👤 Criando usuário admin...');
        await db.query(`
            INSERT INTO users (name, email, password, role, is_active) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO UPDATE SET
                password = EXCLUDED.password,
                role = EXCLUDED.role,
                updated_at = CURRENT_TIMESTAMP
        `, [
            'Admin OSH', 
            'admin@osh.com.br', 
            '$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC', // admin123
            'admin', 
            true
        ]);
        
        // 4. Criar configuração PMS global
        console.log('⚙️ Criando configuração PMS...');
        await db.query(`
            INSERT INTO app_configurations (hotel_id, app_name, app_title, is_active) 
            VALUES (NULL, 'pms', 'PMS - Sistema OSH', TRUE)
            ON CONFLICT (hotel_id, app_name) DO UPDATE SET 
                app_title = EXCLUDED.app_title,
                updated_at = CURRENT_TIMESTAMP
        `);
        
        console.log('✅ MIGRAÇÃO CONCLUÍDA!');
        console.log('👤 Login: admin@osh.com.br');
        console.log('🔑 Senha: admin123');
        
    } catch (error) {
        console.error('❌ ERRO NA MIGRAÇÃO:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
runProductionMigration();