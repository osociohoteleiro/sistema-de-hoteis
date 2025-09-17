-- OSH Hotel System - PostgreSQL Schema

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABELA: users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'HOTEL' CHECK (user_type IN ('ADMIN', 'HOTEL', 'STAFF', 'GUEST')),
    active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_user_type ON users(user_type);

-- TABELA: hotels
CREATE TABLE IF NOT EXISTS hotels (
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
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER hotels_updated_at BEFORE UPDATE ON hotels 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_hotels_uuid ON hotels(hotel_uuid);
CREATE INDEX idx_hotels_status ON hotels(status);
CREATE INDEX idx_hotels_name ON hotels USING gin(name gin_trgm_ops);

-- TABELA: user_hotels (relacionamento many-to-many)
CREATE TABLE IF NOT EXISTS user_hotels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'STAFF' CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'STAFF')),
    permissions JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, hotel_id)
);

CREATE TRIGGER user_hotels_updated_at BEFORE UPDATE ON user_hotels 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_user_hotels_user_id ON user_hotels(user_id);
CREATE INDEX idx_user_hotels_hotel_id ON user_hotels(hotel_id);
CREATE INDEX idx_user_hotels_role ON user_hotels(role);

-- TABELA: app_config
CREATE TABLE IF NOT EXISTS app_config (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    config_key VARCHAR(255) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'STRING' CHECK (config_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hotel_id, config_key)
);

CREATE TRIGGER app_config_updated_at BEFORE UPDATE ON app_config 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_app_config_hotel_key ON app_config(hotel_id, config_key);

-- TABELA: api_endpoints
CREATE TABLE IF NOT EXISTS api_endpoints (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    endpoint_name VARCHAR(255) NOT NULL,
    endpoint_url TEXT NOT NULL,
    method VARCHAR(10) DEFAULT 'GET',
    headers JSONB DEFAULT '{}',
    auth_type VARCHAR(50),
    auth_credentials JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER api_endpoints_updated_at BEFORE UPDATE ON api_endpoints 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_api_endpoints_hotel_id ON api_endpoints(hotel_id);

-- TABELA: ai_knowledge
CREATE TABLE IF NOT EXISTS ai_knowledge (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER ai_knowledge_updated_at BEFORE UPDATE ON ai_knowledge 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_ai_knowledge_hotel_id ON ai_knowledge(hotel_id);
CREATE INDEX idx_ai_knowledge_category ON ai_knowledge(category);
CREATE INDEX idx_ai_knowledge_question ON ai_knowledge USING gin(question gin_trgm_ops);

-- TABELA: bot_fields
CREATE TABLE IF NOT EXISTS bot_fields (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    field_key VARCHAR(255) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(20) DEFAULT 'STRING' CHECK (field_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
    category VARCHAR(100),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hotel_id, field_key)
);

CREATE TRIGGER bot_fields_updated_at BEFORE UPDATE ON bot_fields 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_bot_fields_hotel_key ON bot_fields(hotel_id, field_key);

-- TABELA: workspaces
CREATE TABLE IF NOT EXISTS workspaces (
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

CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON workspaces 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_workspaces_hotel_id ON workspaces(hotel_id);
CREATE INDEX idx_workspaces_uuid ON workspaces(uuid);

-- TABELA: bots
CREATE TABLE IF NOT EXISTS bots (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TESTING')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER bots_updated_at BEFORE UPDATE ON bots 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_bots_workspace_id ON bots(workspace_id);
CREATE INDEX idx_bots_uuid ON bots(uuid);

-- TABELA: folders
CREATE TABLE IF NOT EXISTS folders (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    path TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER folders_updated_at BEFORE UPDATE ON folders 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_folders_workspace_id ON folders(workspace_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_uuid ON folders(uuid);

-- TABELA: flows
CREATE TABLE IF NOT EXISTS flows (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    bot_id INTEGER REFERENCES bots(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    flow_data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DRAFT')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER flows_updated_at BEFORE UPDATE ON flows 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_flows_folder_id ON flows(folder_id);
CREATE INDEX idx_flows_bot_id ON flows(bot_id);
CREATE INDEX idx_flows_uuid ON flows(uuid);

-- TABELA: rate_shopper_properties
CREATE TABLE IF NOT EXISTS rate_shopper_properties (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    property_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    website VARCHAR(255),
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER rate_shopper_properties_updated_at BEFORE UPDATE ON rate_shopper_properties 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_rate_shopper_properties_hotel_id ON rate_shopper_properties(hotel_id);

-- TABELA: rate_shopper_searches
CREATE TABLE IF NOT EXISTS rate_shopper_searches (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
    search_date TIMESTAMP NOT NULL,
    checkin_date DATE NOT NULL,
    checkout_date DATE NOT NULL,
    rooms INTEGER DEFAULT 1,
    guests INTEGER DEFAULT 2,
    results JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER rate_shopper_searches_updated_at BEFORE UPDATE ON rate_shopper_searches 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_rate_shopper_searches_property_id ON rate_shopper_searches(property_id);
CREATE INDEX idx_rate_shopper_searches_dates ON rate_shopper_searches(checkin_date, checkout_date);

-- TABELA: logo_history
CREATE TABLE IF NOT EXISTS logo_history (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    logo_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logo_history_hotel_id ON logo_history(hotel_id);
CREATE INDEX idx_logo_history_current ON logo_history(hotel_id, is_current);

-- Inserir dados iniciais básicos
INSERT INTO users (name, email, password_hash, user_type, email_verified) 
VALUES ('Admin Sistema', 'admin@osh.com', '$2a$10$dummy.hash.for.initial.setup', 'ADMIN', true)
ON CONFLICT (email) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE users IS 'Usuários do sistema OSH';
COMMENT ON TABLE hotels IS 'Hotéis cadastrados no sistema';
COMMENT ON TABLE user_hotels IS 'Relacionamento entre usuários e hotéis';
COMMENT ON TABLE workspaces IS 'Espaços de trabalho para organização';
COMMENT ON TABLE bots IS 'Bots de automação';
COMMENT ON TABLE flows IS 'Fluxos de trabalho dos bots';
COMMENT ON TABLE rate_shopper_properties IS 'Propriedades para monitoramento de preços';
COMMENT ON TABLE rate_shopper_searches IS 'Histórico de pesquisas de preços';