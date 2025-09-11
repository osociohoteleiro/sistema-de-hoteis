-- Migration: Create onenode_bot_fields table
-- Esta migration cria a tabela de campos customizados para OneNode

CREATE TABLE IF NOT EXISTS onenode_bot_fields (
    id SERIAL PRIMARY KEY,
    hotel_uuid VARCHAR(36) NOT NULL,
    name VARCHAR(255),
    var_ns VARCHAR(32) NOT NULL,
    var_type VARCHAR(20) DEFAULT 'STRING',
    description TEXT,
    value TEXT,
    workspace_id INTEGER,
    is_required BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_uuid, var_ns)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_onenode_bot_fields_hotel_uuid ON onenode_bot_fields(hotel_uuid);
CREATE INDEX IF NOT EXISTS idx_onenode_bot_fields_var_ns ON onenode_bot_fields(var_ns);
CREATE INDEX IF NOT EXISTS idx_onenode_bot_fields_workspace_id ON onenode_bot_fields(workspace_id);
CREATE INDEX IF NOT EXISTS idx_onenode_bot_fields_active ON onenode_bot_fields(active);