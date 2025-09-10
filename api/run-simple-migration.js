const db = require('./config/database');

async function runSimpleMigration() {
    try {
        console.log('🚀 Executando migração simples para resolver app_configurations...');
        
        // Criar apenas tabela app_configurations (essencial para o PMS)
        await db.query(`
            CREATE TABLE IF NOT EXISTS app_configurations (
                id SERIAL PRIMARY KEY,
                hotel_id INTEGER,
                app_name VARCHAR(50) CHECK (app_name IN ('hotel-app', 'pms', 'automacao', 'site-hoteleiro')) NOT NULL,
                app_title VARCHAR(255) DEFAULT NULL,
                logo_url TEXT DEFAULT NULL,
                favicon_url TEXT DEFAULT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                shared_from_app VARCHAR(50) CHECK (shared_from_app IN ('hotel-app', 'pms', 'automacao', 'site-hoteleiro')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE (hotel_id, app_name)
            );
        `);
        console.log('✅ Tabela app_configurations criada.');
        
        // Criar tabela users básica
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
        console.log('✅ Tabela users criada.');
        
        // Criar configuração global padrão do PMS
        await db.query(`
            INSERT INTO app_configurations (hotel_id, app_name, app_title, logo_url, is_active) 
            VALUES (NULL, 'pms', 'PMS - Sistema OSH', NULL, TRUE)
            ON CONFLICT (hotel_id, app_name) DO UPDATE SET 
                app_title = EXCLUDED.app_title,
                updated_at = CURRENT_TIMESTAMP;
        `);
        console.log('✅ Configuração global PMS criada.');
        
        // Criar usuário admin
        const hashedPassword = '$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC'; // admin123
        
        await db.query(`
            INSERT INTO users (name, email, password, role, is_active) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO NOTHING
        `, ['Admin OSH', 'admin@osh.com.br', hashedPassword, 'admin', true]);
        
        console.log('✅ Usuário admin criado: admin@osh.com.br / admin123');
        
        console.log('🎉 Migração simples concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Executar migração
runSimpleMigration();