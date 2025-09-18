-- Migration: Criar tabela whatsapp_messages
-- Data: 2025-09-18
-- Descrição: Adiciona tabela para armazenar mensagens do WhatsApp recebidas via Evolution API

-- Criar tabela whatsapp_messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL UNIQUE,
    instance_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),
    message_type ENUM('text', 'image', 'audio', 'video', 'document', 'location', 'contact') DEFAULT 'text',
    content TEXT NOT NULL,
    media_url TEXT,
    direction ENUM('inbound', 'outbound') NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    read_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_instance_name (instance_name),
    INDEX idx_phone_number (phone_number),
    INDEX idx_direction (direction),
    INDEX idx_timestamp (timestamp),
    INDEX idx_message_id (message_id),
    INDEX idx_instance_phone (instance_name, phone_number),
    INDEX idx_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela whatsapp_contacts para armazenar informações dos contatos
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instance_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),
    profile_pic_url TEXT,
    last_seen TIMESTAMP NULL,
    last_message_at TIMESTAMP NULL,
    message_count INT DEFAULT 0,
    unread_count INT DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_instance_phone (instance_name, phone_number),
    INDEX idx_instance_name (instance_name),
    INDEX idx_phone_number (phone_number),
    INDEX idx_last_message_at (last_message_at),
    INDEX idx_unread_count (unread_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;