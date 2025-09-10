// Script para corrigir estrutura do banco em produção
const db = require('./config/database');

async function fixProductionDB() {
    try {
        console.log('🔧 PRODUÇÃO: Corrigindo estrutura do banco...');
        
        // 1. Verificar e corrigir tabela users
        console.log('👤 Verificando estrutura da tabela users...');
        
        // Adicionar coluna password se não existir
        try {
            await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`);
            console.log('✅ Coluna password adicionada à tabela users');
        } catch (error) {
            console.log('⚠️ Coluna password já existe ou erro:', error.message);
        }
        
        // Adicionar coluna role se não existir
        try {
            await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'`);
            console.log('✅ Coluna role adicionada à tabela users');
        } catch (error) {
            console.log('⚠️ Coluna role já existe ou erro:', error.message);
        }
        
        // Adicionar coluna is_active se não existir
        try {
            await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
            console.log('✅ Coluna is_active adicionada à tabela users');
        } catch (error) {
            console.log('⚠️ Coluna is_active já existe ou erro:', error.message);
        }
        
        // 2. Criar/corrigir tabela app_configurations
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
        console.log('✅ Tabela app_configurations criada/verificada');
        
        // 3. Criar/atualizar usuário admin
        console.log('👤 Criando usuário admin...');
        
        // Primeiro, verificar se já existe
        const existing = await db.query(`SELECT id FROM users WHERE email = 'admin@osh.com.br'`);
        
        if (existing.rows.length > 0) {
            // Atualizar usuário existente
            await db.query(`
                UPDATE users 
                SET password = $1, role = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
                WHERE email = $4
            `, [
                '$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC', // admin123
                'admin',
                true,
                'admin@osh.com.br'
            ]);
            console.log('✅ Usuário admin atualizado');
        } else {
            // Criar novo usuário
            await db.query(`
                INSERT INTO users (name, email, password, role, is_active) 
                VALUES ($1, $2, $3, $4, $5)
            `, [
                'Admin OSH',
                'admin@osh.com.br',
                '$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC', // admin123
                'admin',
                true
            ]);
            console.log('✅ Usuário admin criado');
        }
        
        // 4. Criar configuração PMS
        console.log('⚙️ Criando configuração PMS...');
        await db.query(`
            INSERT INTO app_configurations (hotel_id, app_name, app_title, is_active) 
            VALUES (NULL, 'pms', 'PMS - Sistema OSH', TRUE)
            ON CONFLICT (hotel_id, app_name) DO UPDATE SET 
                app_title = EXCLUDED.app_title,
                updated_at = CURRENT_TIMESTAMP
        `);
        console.log('✅ Configuração PMS criada/atualizada');
        
        console.log('🎉 BANCO DE DADOS CORRIGIDO COM SUCESSO!');
        console.log('👤 Login: admin@osh.com.br');
        console.log('🔑 Senha: admin123');
        
    } catch (error) {
        console.error('❌ ERRO AO CORRIGIR BANCO:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
fixProductionDB();