-- Migration: Create bot_fields table
-- Esta migration cria a tabela de campos personalizados para bots

CREATE TABLE IF NOT EXISTS bot_fields (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER,
    field_key VARCHAR(255) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(20) DEFAULT 'STRING',
    category VARCHAR(100),
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hotel_id, field_key)
);

-- Adicionar foreign key
ALTER TABLE bot_fields 
ADD CONSTRAINT IF NOT EXISTS fk_bot_fields_hotel_id 
FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_bot_fields_hotel_id ON bot_fields(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bot_fields_key ON bot_fields(field_key);
CREATE INDEX IF NOT EXISTS idx_bot_fields_category ON bot_fields(category);
CREATE INDEX IF NOT EXISTS idx_bot_fields_active ON bot_fields(active);