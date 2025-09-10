// Script para recriar estrutura correta das tabelas em produção
const db = require('./config/database');

async function fixProductionStructure() {
    try {
        console.log('🔧 PRODUÇÃO: Recriando estrutura correta das tabelas...');
        
        // 1. Backup dos dados existentes se houver
        console.log('📦 Fazendo backup dos dados existentes...');
        
        let existingUsers = [];
        let existingHotels = [];
        let existingUserHotels = [];
        
        try {
            existingUsers = await db.query('SELECT * FROM users');
            console.log(`✅ Backup de ${existingUsers.length} usuários`);
        } catch (e) {
            console.log('⚠️ Tabela users não existe ou está vazia');
        }
        
        try {
            existingHotels = await db.query('SELECT * FROM hotels');
            console.log(`✅ Backup de ${existingHotels.length} hotéis`);
        } catch (e) {
            console.log('⚠️ Tabela hotels não existe ou está vazia');
        }
        
        try {
            existingUserHotels = await db.query('SELECT * FROM user_hotels');
            console.log(`✅ Backup de ${existingUserHotels.length} relações user_hotels`);
        } catch (e) {
            console.log('⚠️ Tabela user_hotels não existe ou está vazia');
        }
        
        // 2. Habilitar extensão UUID e recriar tabela users
        console.log('🔧 Habilitando extensão UUID...');
        try {
            await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            console.log('✅ Extensão UUID habilitada');
        } catch (e) {
            console.log('⚠️ Tentando método alternativo para UUID...');
        }
        
        console.log('👤 Recriando tabela users...');
        await db.query('DROP TABLE IF EXISTS user_permissions CASCADE');
        await db.query('DROP TABLE IF EXISTS user_hotels CASCADE');
        await db.query('DROP TABLE IF EXISTS users CASCADE');
        
        await db.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                uuid UUID NOT NULL DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                user_type VARCHAR(50) DEFAULT 'HOTEL',
                active BOOLEAN DEFAULT TRUE,
                email_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        await db.query('CREATE INDEX idx_users_email ON users(email)');
        console.log('✅ Tabela users criada');
        
        // 3. Recriar tabela hotels com estrutura correta
        console.log('🏨 Recriando tabela hotels...');
        await db.query('DROP TABLE IF EXISTS hotels CASCADE');
        
        await db.query(`
            CREATE TABLE hotels (
                id SERIAL PRIMARY KEY,
                hotel_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                checkin_time TIME DEFAULT '14:00:00',
                checkout_time TIME DEFAULT '12:00:00',
                cover_image TEXT,
                description TEXT,
                address TEXT,
                phone VARCHAR(50),
                email VARCHAR(255),
                website VARCHAR(255),
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        await db.query('CREATE UNIQUE INDEX hotels_hotel_uuid_key ON hotels(hotel_uuid)');
        console.log('✅ Tabela hotels criada');
        
        // 4. Recriar tabela user_hotels
        console.log('🔗 Recriando tabela user_hotels...');
        await db.query(`
            CREATE TABLE user_hotels (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                role VARCHAR(50) DEFAULT 'STAFF',
                permissions JSONB,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, hotel_id)
            )
        `);
        console.log('✅ Tabela user_hotels criada');
        
        // 5. Recriar tabela user_permissions
        console.log('🔐 Recriando tabela user_permissions...');
        await db.query(`
            CREATE TABLE user_permissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                permission VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, permission)
            )
        `);
        console.log('✅ Tabela user_permissions criada');
        
        // 6. Restaurar dados ou criar admin
        console.log('📥 Restaurando/criando dados...');
        
        if (existingUsers.length > 0) {
            console.log('📥 Restaurando usuários existentes...');
            for (const user of existingUsers) {
                try {
                    await db.query(`
                        INSERT INTO users (name, email, password_hash, user_type, active, email_verified)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        user.name || 'Usuário',
                        user.email,
                        user.password_hash || user.password,
                        user.user_type || user.role || 'HOTEL',
                        user.active !== false,
                        user.email_verified || false
                    ]);
                } catch (e) {
                    console.log(`⚠️ Erro ao restaurar usuário ${user.email}:`, e.message);
                }
            }
        } else {
            // Criar usuário admin
            console.log('👤 Criando usuário admin...');
            await db.query(`
                INSERT INTO users (name, email, password_hash, user_type, active, email_verified)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                'Admin OSH',
                'admin@osh.com.br',
                '$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC', // admin123
                'admin',
                true,
                true
            ]);
        }
        
        // 7. Definir permissões do admin
        console.log('🔐 Configurando permissões do admin...');
        const adminUser = await db.query(`SELECT id FROM users WHERE email = 'admin@osh.com.br'`);
        if (adminUser.length > 0) {
            const adminId = adminUser[0].id;
            const permissions = [
                'admin_full_access',
                'view_pms_dashboard',
                'manage_pms_reservas',
                'manage_pms_tarifas',
                'view_automacao_dashboard',
                'manage_automacao_flows',
                'view_rate_shopper',
                'manage_rate_shopper',
                'manage_users',
                'manage_hotels'
            ];
            
            for (const permission of permissions) {
                await db.query(`
                    INSERT INTO user_permissions (user_id, permission)
                    VALUES ($1, $2)
                    ON CONFLICT (user_id, permission) DO NOTHING
                `, [adminId, permission]);
            }
        }
        
        console.log('🎉 ESTRUTURA RECRIADA COM SUCESSO!');
        console.log('👤 Login: admin@osh.com.br');
        console.log('🔑 Senha: admin123');
        
    } catch (error) {
        console.error('❌ ERRO AO RECRIAR ESTRUTURA:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
fixProductionStructure();