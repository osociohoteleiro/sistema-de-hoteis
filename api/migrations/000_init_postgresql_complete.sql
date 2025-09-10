-- Migração completa inicial para PostgreSQL
-- Cria todas as tabelas essenciais para o sistema de hotéis OSH

-- ===================================
-- 1. TABELA DE USUÁRIOS
-- ===================================
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

-- ===================================
-- 2. TABELA DE HOTÉIS
-- ===================================
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Brasil',
    zip_code VARCHAR(10),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- 3. RELAÇÃO USUÁRIOS-HOTÉIS
-- ===================================
CREATE TABLE IF NOT EXISTS user_hotels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    hotel_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_hotels_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_hotels_hotel_id 
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) 
        ON DELETE CASCADE,
    CONSTRAINT uk_user_hotel UNIQUE (user_id, hotel_id)
);

-- ===================================
-- 4. TABELA DE PERMISSÕES
-- ===================================
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    permission VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_permissions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT uk_user_permission UNIQUE (user_id, permission)
);

-- ===================================
-- 5. CONFIGURAÇÕES DA APLICAÇÃO
-- ===================================
CREATE TABLE IF NOT EXISTS app_configurations (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER,
    config_key VARCHAR(255) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_app_config_hotel_id 
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) 
        ON DELETE CASCADE,
    CONSTRAINT uk_hotel_config_key UNIQUE (hotel_id, config_key)
);

-- ===================================
-- ÍNDICES PARA PERFORMANCE
-- ===================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_hotels_cnpj ON hotels(cnpj);
CREATE INDEX IF NOT EXISTS idx_user_hotels_user_id ON user_hotels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hotels_hotel_id ON user_hotels(hotel_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_app_config_hotel_id ON app_configurations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_configurations(config_key);

-- ===================================
-- INSERIR USUÁRIO ADMINISTRADOR PADRÃO
-- ===================================
-- Senha: admin123 (hash bcrypt)
INSERT INTO users (name, email, password, role, is_active) 
VALUES (
    'Administrador OSH',
    'admin@osh.com.br',
    '$2b$10$klncbTSp3rT3lmH4e1bu6.TeiuVaRWnCEmD7BfDRkFjvFUSRq.wwa',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- ===================================
-- INSERIR HOTEL DEMO
-- ===================================
INSERT INTO hotels (name, email, city, state, is_active) 
VALUES (
    'Hotel Demo OSH',
    'demo@osh.com.br', 
    'São Paulo',
    'SP',
    true
) ON CONFLICT (cnpj) DO NOTHING;

-- ===================================
-- ASSOCIAR ADMIN AO HOTEL DEMO
-- ===================================
INSERT INTO user_hotels (user_id, hotel_id, role, is_active)
SELECT u.id, h.id, 'admin', true
FROM users u, hotels h
WHERE u.email = 'admin@osh.com.br' 
  AND h.name = 'Hotel Demo OSH'
ON CONFLICT (user_id, hotel_id) DO NOTHING;

-- ===================================
-- PERMISSÕES PARA ADMINISTRADOR
-- ===================================
INSERT INTO user_permissions (user_id, permission)
SELECT u.id, perm
FROM users u, (
    VALUES 
    ('admin_full_access'),
    ('view_pms_dashboard'),
    ('manage_pms_reservas'),
    ('manage_pms_tarifas'),
    ('view_automacao_dashboard'),
    ('manage_automacao_flows'),
    ('view_rate_shopper'),
    ('manage_rate_shopper'),
    ('manage_users'),
    ('manage_hotels')
) AS perms(perm)
WHERE u.email = 'admin@osh.com.br'
ON CONFLICT (user_id, permission) DO NOTHING;

-- ===================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ===================================
COMMENT ON TABLE users IS 'Usuários do sistema OSH';
COMMENT ON TABLE hotels IS 'Hotéis cadastrados no sistema';
COMMENT ON TABLE user_hotels IS 'Relacionamento entre usuários e hotéis';
COMMENT ON TABLE user_permissions IS 'Permissões específicas dos usuários';
COMMENT ON TABLE app_configurations IS 'Configurações da aplicação por hotel';

-- ===================================
-- FINALIZAÇÃO
-- ===================================