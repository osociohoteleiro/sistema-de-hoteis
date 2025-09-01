-- Migration: 014_create_workspaces.sql
-- Cria tabela workspaces relacionada aos hotéis
-- Data: 2025-09-01

-- Criar tabela workspaces
CREATE TABLE workspaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    hotel_id INT NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSON DEFAULT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key para tabela hotels
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Índices para otimização
    INDEX idx_workspace_hotel_id (hotel_id),
    INDEX idx_workspace_hotel_uuid (hotel_uuid),
    INDEX idx_workspace_uuid (workspace_uuid),
    INDEX idx_workspace_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Workspaces dos hotéis para organização de projetos';

-- Criar workspace padrão para cada hotel existente
INSERT INTO workspaces (hotel_id, hotel_uuid, name, description)
SELECT 
    h.id,
    h.hotel_uuid,
    CONCAT('Workspace Principal - ', h.hotel_nome),
    CONCAT('Workspace principal para gerenciamento de automações do hotel ', h.hotel_nome)
FROM hotels h;