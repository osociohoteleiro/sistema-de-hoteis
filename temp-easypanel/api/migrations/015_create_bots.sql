-- Migration: 015_create_bots.sql
-- Cria tabela bots relacionada aos workspaces
-- Data: 2025-09-01

-- Criar tabela bots
CREATE TABLE bots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bot_uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    workspace_id INT NOT NULL,
    workspace_uuid VARCHAR(36) NOT NULL,
    hotel_id INT NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bot_type ENUM('CHATBOT', 'AUTOMATION', 'WEBHOOK', 'SCHEDULER', 'INTEGRATION') DEFAULT 'CHATBOT',
    status ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'ERROR') DEFAULT 'DRAFT',
    configuration JSON DEFAULT NULL,
    settings JSON DEFAULT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Índices para otimização
    INDEX idx_bot_workspace_id (workspace_id),
    INDEX idx_bot_workspace_uuid (workspace_uuid),
    INDEX idx_bot_hotel_id (hotel_id),
    INDEX idx_bot_hotel_uuid (hotel_uuid),
    INDEX idx_bot_uuid (bot_uuid),
    INDEX idx_bot_type (bot_type),
    INDEX idx_bot_status (status),
    INDEX idx_bot_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bots dos workspaces para automação';

-- Criar alguns bots de exemplo para demonstração
INSERT INTO bots (workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings)
SELECT 
    w.id as workspace_id,
    w.workspace_uuid,
    w.hotel_id,
    w.hotel_uuid,
    CONCAT('Bot Recepção - ', h.hotel_nome) as name,
    CONCAT('Bot para atendimento automatizado da recepção do hotel ', h.hotel_nome) as description,
    'CHATBOT' as bot_type,
    'ACTIVE' as status,
    JSON_OBJECT(
        'welcome_message', 'Olá! Bem-vindo ao nosso hotel. Como posso ajudá-lo?',
        'language', 'pt-BR',
        'max_response_time', 5000,
        'fallback_message', 'Desculpe, não entendi. Pode reformular sua pergunta?'
    ) as configuration,
    JSON_OBJECT(
        'auto_response', true,
        'business_hours', JSON_OBJECT('start', '08:00', 'end', '22:00'),
        'notification_email', CONCAT('bot@', LOWER(REPLACE(h.hotel_nome, ' ', '')), '.com')
    ) as settings
FROM workspaces w 
JOIN hotels h ON w.hotel_id = h.id 
LIMIT 5;

-- Criar bot de automação de exemplo
INSERT INTO bots (workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings)
SELECT 
    w.id as workspace_id,
    w.workspace_uuid,
    w.hotel_id,
    w.hotel_uuid,
    CONCAT('Bot Check-in - ', h.hotel_nome) as name,
    CONCAT('Bot para automatizar processo de check-in do hotel ', h.hotel_nome) as description,
    'AUTOMATION' as bot_type,
    'DRAFT' as status,
    JSON_OBJECT(
        'trigger_event', 'reservation_confirmed',
        'actions', JSON_ARRAY(
            JSON_OBJECT('type', 'send_email', 'template', 'checkin_instructions'),
            JSON_OBJECT('type', 'send_sms', 'template', 'checkin_reminder')
        ),
        'conditions', JSON_OBJECT('hours_before_checkin', 24)
    ) as configuration,
    JSON_OBJECT(
        'enabled', false,
        'test_mode', true,
        'retry_attempts', 3
    ) as settings
FROM workspaces w 
JOIN hotels h ON w.hotel_id = h.id 
LIMIT 3;