-- Migration: Create app_config table
-- Esta migration cria a tabela de configurações da aplicação

CREATE TABLE IF NOT EXISTS app_config (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER,
    config_key VARCHAR(255) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'STRING',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hotel_id, config_key)
);

-- Adicionar foreign key
ALTER TABLE app_config 
ADD CONSTRAINT IF NOT EXISTS fk_app_config_hotel_id 
FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_app_config_hotel_id ON app_config(hotel_id);
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(config_key);
CREATE INDEX IF NOT EXISTS idx_app_config_type ON app_config(config_type);