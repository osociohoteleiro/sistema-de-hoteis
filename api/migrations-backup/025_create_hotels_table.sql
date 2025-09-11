-- Migration: Create hotels table
-- Esta migration cria a tabela principal de hotéis que já existe no banco

CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    hotel_uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    checkin_time TIME DEFAULT '14:00:00',
    checkout_time TIME DEFAULT '12:00:00',
    cover_image TEXT,
    description TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_hotels_uuid ON hotels(hotel_uuid);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);
CREATE INDEX IF NOT EXISTS idx_hotels_name ON hotels(name);