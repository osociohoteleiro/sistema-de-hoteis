-- Schema do Sistema de Hotéis OSH-IA
-- Base de dados: osh-ia
-- Charset: utf8mb4 (suporte completo a emoji e caracteres especiais)

-- ============================================
-- USUÁRIOS E AUTENTICAÇÃO
-- ============================================

-- Tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('SUPER_ADMIN', 'ADMIN', 'HOTEL') NOT NULL DEFAULT 'HOTEL',
    active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de permissões por usuário
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_permission (user_id, permission),
    INDEX idx_permission (permission)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de sessões/tokens JWT
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- HOTÉIS
-- ============================================

-- Tabela principal de hotéis
CREATE TABLE IF NOT EXISTS hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    checkin_time TIME DEFAULT '14:00:00',
    checkout_time TIME DEFAULT '12:00:00',
    cover_image TEXT,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_uuid (uuid),
    INDEX idx_status (status),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relação usuários-hotéis (muitos para muitos)
CREATE TABLE IF NOT EXISTS user_hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hotel_id INT NOT NULL,
    role ENUM('OWNER', 'MANAGER', 'STAFF') DEFAULT 'STAFF',
    permissions TEXT, -- JSON com permissões específicas do hotel
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_hotel (user_id, hotel_id),
    INDEX idx_user_id (user_id),
    INDEX idx_hotel_id (hotel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONFIGURAÇÕES
-- ============================================

-- Configurações globais e por hotel
CREATE TABLE IF NOT EXISTS app_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NULL, -- NULL = configuração global
    config_key VARCHAR(100) NOT NULL,
    config_value LONGTEXT,
    config_type ENUM('STRING', 'JSON', 'BOOLEAN', 'NUMBER') DEFAULT 'STRING',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hotel_key (hotel_id, config_key),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Endpoints da API configuráveis
CREATE TABLE IF NOT EXISTS api_endpoints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NULL, -- NULL = configuração global
    endpoint_name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') DEFAULT 'GET',
    headers JSON,
    active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_endpoint_name (endpoint_name),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SISTEMA DE IA
-- ============================================

-- Tabela para instâncias da Evolution API
CREATE TABLE IF NOT EXISTS evolution_instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instance_name VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    host_url VARCHAR(500) DEFAULT 'https://osh-ia-evolution-api.d32pnk.easypanel.host/',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_uuid) REFERENCES hotels(uuid) ON DELETE CASCADE,
    UNIQUE KEY unique_hotel_instance (hotel_uuid, instance_name),
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_instance_name (instance_name),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para gerenciar Collections do Qdrant
CREATE TABLE IF NOT EXISTS vector_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection_name VARCHAR(255) NOT NULL,
    hotel_id INT NULL, -- NULL = collection global
    hotel_uuid VARCHAR(36) NULL, -- UUID do hotel para facilitar relacionamento
    description TEXT,
    vector_size INT DEFAULT 1536, -- Tamanho do vetor (OpenAI embeddings = 1536)
    distance_metric ENUM('Cosine', 'Euclidean', 'Dot') DEFAULT 'Cosine',
    qdrant_status ENUM('ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING') DEFAULT 'INACTIVE',
    total_vectors INT DEFAULT 0,
    last_sync TIMESTAMP NULL,
    config JSON, -- Configurações específicas da collection
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_collection_name (collection_name),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_status (qdrant_status),
    INDEX idx_collection_name (collection_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Base de conhecimento da IA
CREATE TABLE IF NOT EXISTS ai_knowledge (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    priority INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_category (category),
    INDEX idx_active (active),
    FULLTEXT idx_question_answer (question, answer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Integrações de IA (WhatsApp, OpenAI, etc.)
CREATE TABLE IF NOT EXISTS ai_integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    integration_name VARCHAR(100) NOT NULL,
    integration_type ENUM('WHATSAPP', 'OPENAI', 'FACEBOOK', 'INSTAGRAM', 'OTHER') NOT NULL,
    api_key TEXT,
    client_id VARCHAR(255),
    client_secret TEXT,
    webhook_url VARCHAR(500),
    config JSON,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hotel_integration (hotel_id, integration_name),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_integration_type (integration_type),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campos do bot configuráveis
CREATE TABLE IF NOT EXISTS bot_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    field_value TEXT,
    field_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE', 'TIME') DEFAULT 'STRING',
    description TEXT,
    category VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hotel_field (hotel_id, field_key),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_field_key (field_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Templates de mensagens de marketing
CREATE TABLE IF NOT EXISTS marketing_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    template_content TEXT NOT NULL,
    channel ENUM('WHATSAPP', 'EMAIL', 'SMS', 'FACEBOOK', 'INSTAGRAM') NOT NULL,
    category VARCHAR(100),
    variables JSON, -- Variáveis do template
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_channel (channel),
    INDEX idx_active (active),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RELATÓRIOS E ANALYTICS
-- ============================================

-- Dados de relatórios
CREATE TABLE IF NOT EXISTS reports_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    report_type ENUM('FINANCIAL', 'OPERATIONAL', 'MARKETING', 'SATISFACTION') NOT NULL,
    report_period ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data JSON NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_report_type (report_type),
    INDEX idx_period (period_start, period_end),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NULL,
    user_id INT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir usuário Super Admin padrão
INSERT IGNORE INTO users (uuid, name, email, password_hash, user_type, email_verified) 
VALUES (
    UUID(), 
    'Super Administrador', 
    'admin@osociohoteleiro.com.br', 
    '$2a$12$dummyHashForDevelopment.Only.NotSecure',
    'SUPER_ADMIN', 
    TRUE
);

-- Inserir configurações globais padrão
INSERT IGNORE INTO app_config (config_key, config_value, config_type, description) VALUES
('companyName', 'OSócio Hoteleiro', 'STRING', 'Nome da empresa'),
('logo', '', 'STRING', 'URL do logo da empresa'),
('theme', 'dark', 'STRING', 'Tema da aplicação'),
('version', '1.0.0', 'STRING', 'Versão do sistema');

-- Inserir hotéis de exemplo
INSERT IGNORE INTO hotels (uuid, name, checkin_time, checkout_time, cover_image, description, status) VALUES
(UUID(), 'Hotel Exemplo 1', '14:00:00', '12:00:00', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center', 'Hotel de exemplo para desenvolvimento', 'ACTIVE'),
(UUID(), 'Hotel Exemplo 2', '15:00:00', '11:00:00', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&crop=center', 'Segundo hotel de exemplo', 'ACTIVE'),
(UUID(), 'Hotel Teste S3', '16:00:00', '10:00:00', NULL, 'Hotel para testes de upload S3', 'ACTIVE');

-- Inserir instância padrão da Evolution API para Hotel Exemplo 1
INSERT IGNORE INTO evolution_instances (instance_name, api_key, hotel_uuid, host_url, active) 
SELECT 'instancia-principal', '429683C4C977415CAAFCCE10F7D57E11', uuid, 'https://osh-ia-evolution-api.d32pnk.easypanel.host/', TRUE 
FROM hotels WHERE name = 'Hotel Exemplo 1' LIMIT 1;