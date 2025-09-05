-- Schema simplificado para teste de migração
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABELA: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'HOTEL',
    active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- TABELA: hotels
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    hotel_uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
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
);

CREATE TRIGGER hotels_updated_at BEFORE UPDATE ON hotels 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- TABELA: user_hotels
CREATE TABLE user_hotels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'STAFF',
    permissions JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, hotel_id)
);

CREATE TRIGGER user_hotels_updated_at BEFORE UPDATE ON user_hotels 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- TABELA: app_config  
CREATE TABLE app_config (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    config_key VARCHAR(255) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'STRING',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hotel_id, config_key)
);

-- TABELA: workspaces
CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    hotel_uuid UUID REFERENCES hotels(hotel_uuid) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABELA: bot_fields
CREATE TABLE bot_fields (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    field_key VARCHAR(255) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(20) DEFAULT 'STRING',
    category VARCHAR(100),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hotel_id, field_key)
);