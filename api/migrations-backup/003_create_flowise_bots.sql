-- Migration: Criar tabela flowise_bots
-- Data: 2025-08-31
-- Descrição: Adiciona tabela para cadastrar bots do Flowise

-- Criar tabela flowise_bots
CREATE TABLE IF NOT EXISTS flowise_bots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bot_name VARCHAR(255) NOT NULL,
    bot_description TEXT,
    bot_type VARCHAR(100) NOT NULL,
    prediction_url VARCHAR(500) NOT NULL,
    upsert_url VARCHAR(500) NOT NULL,
    bot_id VARCHAR(255) NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_uuid) REFERENCES hotels(hotel_uuid) ON DELETE CASCADE,
    UNIQUE KEY unique_hotel_bot (hotel_uuid, bot_id),
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_bot_id (bot_id),
    INDEX idx_bot_type (bot_type),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;