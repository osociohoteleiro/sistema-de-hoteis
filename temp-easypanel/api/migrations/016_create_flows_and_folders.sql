-- Migration: 016_create_flows_and_folders.sql
-- Cria tabelas para fluxos e pastas dos bots
-- Data: 2025-09-01

-- Criar tabela folders (pastas para organizar fluxos)
CREATE TABLE folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folder_uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    bot_id INT NOT NULL,
    bot_uuid VARCHAR(36) NOT NULL,
    workspace_id INT NOT NULL,
    workspace_uuid VARCHAR(36) NOT NULL,
    hotel_id INT NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Cor hex para identificação visual
    icon VARCHAR(50) DEFAULT 'folder', -- Ícone da pasta
    parent_folder_id INT NULL, -- Para hierarquia de pastas
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE SET NULL,
    
    -- Índices
    INDEX idx_folder_bot_id (bot_id),
    INDEX idx_folder_workspace_id (workspace_id),
    INDEX idx_folder_hotel_id (hotel_id),
    INDEX idx_folder_parent (parent_folder_id),
    INDEX idx_folder_uuid (folder_uuid),
    INDEX idx_folder_active (active),
    INDEX idx_folder_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pastas para organização de fluxos dos bots';

-- Criar tabela flows (fluxos dos bots)
CREATE TABLE flows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flow_uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    bot_id INT NOT NULL,
    bot_uuid VARCHAR(36) NOT NULL,
    workspace_id INT NOT NULL,
    workspace_uuid VARCHAR(36) NOT NULL,
    hotel_id INT NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    folder_id INT NULL, -- Pasta que contém o fluxo (pode ser NULL = raiz)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    flow_type ENUM('CONVERSATION', 'AUTOMATION', 'WEBHOOK', 'TRIGGER', 'ACTION') DEFAULT 'CONVERSATION',
    status ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'TESTING') DEFAULT 'DRAFT',
    version VARCHAR(20) DEFAULT '1.0.0',
    flow_data JSON DEFAULT NULL, -- Dados do fluxo (nodes, connections, etc.)
    variables JSON DEFAULT NULL, -- Variáveis do fluxo
    settings JSON DEFAULT NULL, -- Configurações específicas
    triggers JSON DEFAULT NULL, -- Gatilhos que ativam o fluxo
    priority INT DEFAULT 0, -- Prioridade de execução
    is_default BOOLEAN DEFAULT FALSE, -- Fluxo padrão do bot
    execution_count INT DEFAULT 0, -- Contador de execuções
    last_executed_at TIMESTAMP NULL,
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
    
    -- Índices
    INDEX idx_flow_bot_id (bot_id),
    INDEX idx_flow_workspace_id (workspace_id),
    INDEX idx_flow_hotel_id (hotel_id),
    INDEX idx_flow_folder_id (folder_id),
    INDEX idx_flow_uuid (flow_uuid),
    INDEX idx_flow_type (flow_type),
    INDEX idx_flow_status (status),
    INDEX idx_flow_active (active),
    INDEX idx_flow_priority (priority),
    INDEX idx_flow_default (is_default),
    INDEX idx_flow_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Fluxos de conversação e automação dos bots';

-- Inserir pastas de exemplo
INSERT INTO folders (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, color, icon)
SELECT 
    b.id,
    b.bot_uuid,
    b.workspace_id,
    b.workspace_uuid,
    b.hotel_id,
    b.hotel_uuid,
    'Atendimento Principal',
    'Fluxos principais de atendimento ao cliente',
    '#10B981',
    'message-circle'
FROM bots b 
WHERE b.bot_type = 'CHATBOT'
LIMIT 5;

INSERT INTO folders (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, color, icon)
SELECT 
    b.id,
    b.bot_uuid,
    b.workspace_id,
    b.workspace_uuid,
    b.hotel_id,
    b.hotel_uuid,
    'Reservas',
    'Fluxos para gerenciamento de reservas',
    '#F59E0B',
    'calendar'
FROM bots b 
WHERE b.bot_type = 'CHATBOT'
LIMIT 5;

-- Inserir fluxos de exemplo
INSERT INTO flows (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, folder_id, name, description, flow_type, status, flow_data, variables, settings, triggers)
SELECT 
    b.id,
    b.bot_uuid,
    b.workspace_id,
    b.workspace_uuid,
    b.hotel_id,
    b.hotel_uuid,
    f.id,
    'Saudação Inicial',
    'Fluxo de saudação e apresentação do hotel',
    'CONVERSATION',
    'ACTIVE',
    JSON_OBJECT(
        'nodes', JSON_ARRAY(
            JSON_OBJECT('id', 'start', 'type', 'trigger', 'data', JSON_OBJECT('message', 'Olá! Bem-vindo ao nosso hotel!')),
            JSON_OBJECT('id', 'menu', 'type', 'menu', 'data', JSON_OBJECT('options', JSON_ARRAY('Fazer reserva', 'Informações', 'Falar com atendente')))
        ),
        'edges', JSON_ARRAY(
            JSON_OBJECT('id', 'e1', 'source', 'start', 'target', 'menu')
        )
    ),
    JSON_OBJECT(
        'hotel_name', CONCAT('{{hotel.name}}'),
        'welcome_message', 'Seja bem-vindo!'
    ),
    JSON_OBJECT(
        'timeout', 30000,
        'fallback_enabled', true,
        'typing_delay', 1500
    ),
    JSON_ARRAY(
        JSON_OBJECT('type', 'message_received', 'conditions', JSON_ARRAY('first_interaction'))
    )
FROM bots b 
JOIN folders f ON b.id = f.bot_id AND f.name = 'Atendimento Principal'
WHERE b.bot_type = 'CHATBOT'
LIMIT 5;

INSERT INTO flows (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, folder_id, name, description, flow_type, status, flow_data, triggers, is_default)
SELECT 
    b.id,
    b.bot_uuid,
    b.workspace_id,
    b.workspace_uuid,
    b.hotel_id,
    b.hotel_uuid,
    f.id,
    'Consultar Disponibilidade',
    'Fluxo para consulta de disponibilidade de quartos',
    'CONVERSATION',
    'DRAFT',
    JSON_OBJECT(
        'nodes', JSON_ARRAY(
            JSON_OBJECT('id', 'ask_dates', 'type', 'input', 'data', JSON_OBJECT('message', 'Para qual data você gostaria de fazer a reserva?')),
            JSON_OBJECT('id', 'check_availability', 'type', 'api', 'data', JSON_OBJECT('endpoint', '/api/rooms/availability'))
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT('type', 'keyword', 'keywords', JSON_ARRAY('reserva', 'disponibilidade', 'quarto'))
    ),
    false
FROM bots b 
JOIN folders f ON b.id = f.bot_id AND f.name = 'Reservas'
WHERE b.bot_type = 'CHATBOT'
LIMIT 3;

-- Inserir fluxo de automação para bots de automação
INSERT INTO flows (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, flow_type, status, flow_data, triggers)
SELECT 
    b.id,
    b.bot_uuid,
    b.workspace_id,
    b.workspace_uuid,
    b.hotel_id,
    b.hotel_uuid,
    'Check-in Automático',
    'Automação para envio de instruções de check-in',
    'AUTOMATION',
    'DRAFT',
    JSON_OBJECT(
        'actions', JSON_ARRAY(
            JSON_OBJECT('type', 'send_email', 'template', 'checkin_instructions', 'delay', 0),
            JSON_OBJECT('type', 'send_sms', 'message', 'Seu check-in está confirmado!', 'delay', 300)
        ),
        'conditions', JSON_OBJECT('hours_before', 24, 'status', 'confirmed')
    ),
    JSON_ARRAY(
        JSON_OBJECT('type', 'reservation_confirmed', 'conditions', JSON_OBJECT('status', 'confirmed'))
    )
FROM bots b 
WHERE b.bot_type = 'AUTOMATION'
LIMIT 3;