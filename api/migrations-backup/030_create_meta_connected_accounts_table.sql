-- Migration: Create meta_connected_accounts table
-- Esta migration cria a tabela de contas Meta/Facebook conectadas

CREATE TABLE IF NOT EXISTS meta_connected_accounts (
    id SERIAL PRIMARY KEY,
    hotel_uuid UUID NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    access_token TEXT,
    account_status INTEGER DEFAULT 1,
    currency VARCHAR(10),
    business_id VARCHAR(255),
    business_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hotel_uuid, account_id)
);

-- Adicionar foreign key
ALTER TABLE meta_connected_accounts 
ADD CONSTRAINT IF NOT EXISTS fk_meta_connected_accounts_hotel_uuid 
FOREIGN KEY (hotel_uuid) REFERENCES hotels(hotel_uuid) ON DELETE CASCADE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_meta_connected_accounts_hotel_uuid ON meta_connected_accounts(hotel_uuid);
CREATE INDEX IF NOT EXISTS idx_meta_connected_accounts_account_id ON meta_connected_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_meta_connected_accounts_status ON meta_connected_accounts(account_status);