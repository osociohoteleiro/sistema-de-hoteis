-- Migração para criar tabela de histórico de logotipos
-- Arquivo: create_logo_history_table.sql
-- Data: 2025-09-02

-- Criar tabela para histórico de logotipos
CREATE TABLE IF NOT EXISTS logo_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NULL, -- NULL = logotipo global
    logo_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_is_active (is_active),
    INDEX idx_upload_date (upload_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir logotipos existentes na nova tabela (migração dos dados atuais)
INSERT INTO logo_history (hotel_id, logo_url, is_active)
SELECT 
    ac.hotel_id,
    ac.config_value as logo_url,
    TRUE as is_active
FROM app_config ac 
WHERE ac.config_key = 'logo_patch' 
AND ac.config_value IS NOT NULL 
AND ac.config_value != '';

-- Criar índice único para garantir apenas um logotipo ativo por hotel
CREATE UNIQUE INDEX idx_unique_active_logo_per_hotel ON logo_history (hotel_id, is_active) 
WHERE is_active = TRUE;