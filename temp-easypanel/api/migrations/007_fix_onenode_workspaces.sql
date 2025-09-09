-- Migration: Corrigir tabela onenode_workspaces para usar hotel_uuid
-- Data: 2025-08-31
-- Descrição: Dropar e recriar tabela onenode_workspaces com hotel_uuid

-- Dropar a tabela criada incorretamente
DROP TABLE IF EXISTS onenode_workspaces;

-- Recriar com a estrutura correta
CREATE TABLE IF NOT EXISTS onenode_workspaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_hotel_workspace (hotel_uuid, name),
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_name (name),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;