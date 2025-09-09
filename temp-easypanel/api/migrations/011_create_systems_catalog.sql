-- Migration: Criar tabela systems_catalog
-- Data: 2025-08-31
-- Descrição: Tabela para cadastrar sistemas PMS, Motor e Channel disponíveis

CREATE TABLE IF NOT EXISTS systems_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('pms', 'motor', 'channel') NOT NULL,
    integration_type ENUM('api', 'link') NOT NULL,
    auth_fields JSON COMMENT 'Campos de autenticação dinâmicos',
    description TEXT COMMENT 'Descrição do sistema',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_integration_type (integration_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar coluna system_id na tabela pms_motor_channel
ALTER TABLE pms_motor_channel 
ADD COLUMN system_id INT AFTER id,
ADD CONSTRAINT fk_system_id FOREIGN KEY (system_id) REFERENCES systems_catalog(id) ON DELETE RESTRICT,
ADD INDEX idx_system_id (system_id);

-- Inserir alguns sistemas padrão como exemplo
INSERT INTO systems_catalog (name, type, integration_type, auth_fields, description) VALUES
('Artaxnet', 'pms', 'api', '[{"name": "client_id", "label": "Client ID", "type": "text", "required": true}, {"name": "client_secret", "label": "Client Secret", "type": "password", "required": true}]', 'Sistema PMS Artaxnet'),
('Omnibees', 'pms', 'api', '[{"name": "api_key", "label": "API Key", "type": "password", "required": true}, {"name": "hotel_id", "label": "Hotel ID", "type": "text", "required": true}]', 'Sistema PMS Omnibees'),
('Asksuite', 'motor', 'link', '[]', 'Motor de reservas Asksuite'),
('SiteMinder', 'channel', 'api', '[{"name": "api_key", "label": "API Key", "type": "password", "required": true}, {"name": "property_key", "label": "Property Key", "type": "text", "required": true}]', 'Channel Manager SiteMinder');