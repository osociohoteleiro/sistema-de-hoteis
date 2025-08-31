-- Migration: Criar tabela onenode_workspaces
-- Data: 2025-08-31
-- Descrição: Tabela para gerenciar workspaces do OneNode com chaves de API por hotel

CREATE TABLE IF NOT EXISTS onenode_workspaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    hotel_id INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hotel_workspace (hotel_id, name),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_name (name),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;