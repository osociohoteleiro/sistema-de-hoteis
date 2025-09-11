-- Migration: Create user_hotels table
-- Esta migration cria a tabela de relacionamento entre usuários e hotéis

CREATE TABLE IF NOT EXISTS user_hotels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    hotel_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'MANAGER',
    permissions JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, hotel_id)
);

-- Adicionar foreign keys
ALTER TABLE user_hotels 
ADD CONSTRAINT IF NOT EXISTS fk_user_hotels_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_hotels 
ADD CONSTRAINT IF NOT EXISTS fk_user_hotels_hotel_id 
FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_hotels_user_id ON user_hotels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hotels_hotel_id ON user_hotels(hotel_id);
CREATE INDEX IF NOT EXISTS idx_user_hotels_active ON user_hotels(active);