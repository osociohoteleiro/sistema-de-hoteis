-- Migration: Criar tabelas para WhatsApp Cloud API (versão simplificada)
-- Data: 2025-09-04
-- Descrição: Tabelas para gerenciar configurações, mensagens e contatos do WhatsApp Cloud API

-- Tabela para configurações da WhatsApp Cloud API por workspace
CREATE TABLE IF NOT EXISTS whatsapp_cloud_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_uuid VARCHAR(36) NOT NULL,
    app_id VARCHAR(100) NOT NULL,
    app_secret VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    phone_number_id VARCHAR(50) NOT NULL,
    business_account_id VARCHAR(50),
    webhook_url VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_workspace_config (workspace_uuid),
    INDEX idx_workspace_uuid (workspace_uuid),
    INDEX idx_phone_number_id (phone_number_id),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para contatos do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_uuid VARCHAR(36) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    name VARCHAR(255) DEFAULT '',
    profile_picture_url TEXT,
    is_business BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_workspace_contact (workspace_uuid, phone_number),
    INDEX idx_workspace_uuid (workspace_uuid),
    INDEX idx_phone_number (phone_number),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_uuid VARCHAR(36) NOT NULL,
    whatsapp_message_id VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_type ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'template', 'interactive') NOT NULL,
    content TEXT NOT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    status ENUM('sent', 'delivered', 'read', 'failed', 'received') DEFAULT 'sent',
    timestamp BIGINT DEFAULT 0,
    read_at TIMESTAMP NULL,
    internal_message_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workspace_uuid (workspace_uuid),
    INDEX idx_phone_number (phone_number),
    INDEX idx_whatsapp_message_id (whatsapp_message_id),
    INDEX idx_direction (direction),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_workspace_phone (workspace_uuid, phone_number),
    INDEX idx_read_status (workspace_uuid, phone_number, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para templates de mensagem aprovados
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_uuid VARCHAR(36) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_id VARCHAR(100),
    language VARCHAR(10) NOT NULL DEFAULT 'pt_BR',
    category ENUM('AUTHENTICATION', 'MARKETING', 'UTILITY') NOT NULL,
    status ENUM('APPROVED', 'PENDING', 'REJECTED') DEFAULT 'PENDING',
    components JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_workspace_template (workspace_uuid, template_name, language),
    INDEX idx_workspace_uuid (workspace_uuid),
    INDEX idx_template_name (template_name),
    INDEX idx_status (status),
    INDEX idx_language (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para sessões de atendimento/conversas
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_uuid VARCHAR(36) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255) DEFAULT '',
    assigned_to INT,
    status ENUM('open', 'closed', 'waiting', 'transferred') DEFAULT 'open',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    tags JSON,
    notes TEXT,
    last_message_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_workspace_conversation (workspace_uuid, phone_number),
    INDEX idx_workspace_uuid (workspace_uuid),
    INDEX idx_phone_number (phone_number),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_last_message_at (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para anexos/mídia
CREATE TABLE IF NOT EXISTS whatsapp_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_uuid VARCHAR(36) NOT NULL,
    message_id INT NOT NULL,
    whatsapp_media_id VARCHAR(100),
    media_type ENUM('image', 'video', 'audio', 'document') NOT NULL,
    mime_type VARCHAR(100),
    file_size INT DEFAULT 0,
    filename VARCHAR(255),
    url TEXT,
    local_path TEXT,
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workspace_uuid (workspace_uuid),
    INDEX idx_message_id (message_id),
    INDEX idx_whatsapp_media_id (whatsapp_media_id),
    INDEX idx_media_type (media_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para eventos/logs do webhook
CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_uuid VARCHAR(36),
    event_type VARCHAR(50) NOT NULL,
    event_data JSON NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workspace_uuid (workspace_uuid),
    INDEX idx_event_type (event_type),
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para respostas rápidas/atalhos
CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_uuid VARCHAR(36) NOT NULL,
    shortcut VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'geral',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_workspace_shortcut (workspace_uuid, shortcut),
    INDEX idx_workspace_uuid (workspace_uuid),
    INDEX idx_shortcut (shortcut),
    INDEX idx_category (category),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;