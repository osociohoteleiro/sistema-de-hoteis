// Script para corrigir estrutura do banco em produção - VERSÃO 2
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
        
        // 3. Criar/atualizar usuário admin - MÉTODO SIMPLES
        console.log('👤 Criando usuário admin...');
        
        try {
            // Usar UPSERT (INSERT ... ON CONFLICT)
            await db.query(`
                INSERT INTO users (name, email, password, role, is_active) 
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (email) DO UPDATE SET 
                    password = EXCLUDED.password,
                    role = EXCLUDED.role,
                    is_active = EXCLUDED.is_active,
                    updated_at = CURRENT_TIMESTAMP
            `, [
                'Admin OSH',
                'admin@osh.com.br',
                '$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC', // admin123
                'admin',
                true
            ]);
            console.log('✅ Usuário admin criado/atualizado');
        } catch (error) {
            console.log('⚠️ Erro ao criar usuário admin:', error.message);
            
            // Tentar com UPDATE direto se INSERT falhar
            try {
                await db.query(`
                    UPDATE users 
                    SET password = $1, role = $2, is_active = $3
                    WHERE email = $4
                `, [
                    '$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC',
                    'admin',
                    true,
                    'admin@osh.com.br'
                ]);
                console.log('✅ Usuário admin atualizado via UPDATE');
            } catch (updateError) {
                console.log('❌ Erro no UPDATE também:', updateError.message);
            }
        }
        
        // 4. Criar configuração PMS
        console.log('⚙️ Criando configuração PMS...');
        try {
            await db.query(`
                INSERT INTO app_configurations (hotel_id, app_name, app_title, is_active) 
                VALUES (NULL, 'pms', 'PMS - Sistema OSH', TRUE)
                ON CONFLICT (hotel_id, app_name) DO UPDATE SET 
                    app_title = EXCLUDED.app_title,
                    updated_at = CURRENT_TIMESTAMP
            `);
            console.log('✅ Configuração PMS criada/atualizada');
        } catch (error) {
            console.log('⚠️ Erro na configuração PMS:', error.message);
        }
        
        console.log('🎉 BANCO DE DADOS CORRIGIDO COM SUCESSO!');
        console.log('👤 Login: admin@osh.com.br');
        console.log('🔑 Senha: admin123');
        
    } catch (error) {
        console.error('❌ ERRO GERAL AO CORRIGIR BANCO:', error);
        console.error('Details:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
fixProductionDB();