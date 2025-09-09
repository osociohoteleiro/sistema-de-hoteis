-- Migration: Criar tabela pms_motor_channel
-- Data: 2025-08-31
-- Descrição: Tabela para gerenciar canais PMS, Motor e Channel com tipos de conexão

CREATE TABLE IF NOT EXISTS pms_motor_channel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('pms', 'motor', 'channel') NOT NULL,
    type_connect ENUM('api', 'link') NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_uuid) REFERENCES hotels(hotel_uuid) ON DELETE CASCADE,
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_type (type),
    INDEX idx_type_connect (type_connect),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;