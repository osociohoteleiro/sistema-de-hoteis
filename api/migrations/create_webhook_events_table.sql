-- Tabela para armazenar eventos recebidos via webhook
CREATE TABLE IF NOT EXISTS webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL COMMENT 'Tipo do evento (meta_change, whatsapp_message, etc)',
    field VARCHAR(100) COMMENT 'Campo alterado (campaigns, ads, insights, etc)',
    entry_id VARCHAR(255) COMMENT 'ID da entrada do webhook',
    data JSON NOT NULL COMMENT 'Dados completos do evento',
    processed_at TIMESTAMP NULL COMMENT 'Quando o evento foi processado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_field (field),
    INDEX idx_entry_id (entry_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;