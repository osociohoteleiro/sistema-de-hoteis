-- Migration: Criar tabela whatsapp_messages (PostgreSQL)
-- Data: 2025-09-18
-- Descrição: Adiciona tabela para armazenar mensagens do WhatsApp recebidas via Evolution API

-- Criar tipos ENUM primeiro
DO $$ BEGIN
    CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'audio', 'video', 'document', 'location', 'contact');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE direction_enum AS ENUM ('inbound', 'outbound');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela whatsapp_messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL UNIQUE,
    instance_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),
    message_type message_type_enum DEFAULT 'text',
    content TEXT NOT NULL,
    media_url TEXT,
    direction direction_enum NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    read_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_name ON whatsapp_messages (instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON whatsapp_messages (phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages (direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages (timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_phone ON whatsapp_messages (instance_name, phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_read_at ON whatsapp_messages (read_at);

-- Criar tabela whatsapp_contacts
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id SERIAL PRIMARY KEY,
    instance_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),
    profile_pic_url TEXT,
    last_seen TIMESTAMP NULL,
    last_message_at TIMESTAMP NULL,
    message_count INT DEFAULT 0,
    unread_count INT DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_instance_phone UNIQUE (instance_name, phone_number)
);

-- Criar índices para whatsapp_contacts
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_instance_name ON whatsapp_contacts (instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone_number ON whatsapp_contacts (phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_last_message_at ON whatsapp_contacts (last_message_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_unread_count ON whatsapp_contacts (unread_count);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_whatsapp_messages_updated_at ON whatsapp_messages;
CREATE TRIGGER update_whatsapp_messages_updated_at
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_contacts_updated_at ON whatsapp_contacts;
CREATE TRIGGER update_whatsapp_contacts_updated_at
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();