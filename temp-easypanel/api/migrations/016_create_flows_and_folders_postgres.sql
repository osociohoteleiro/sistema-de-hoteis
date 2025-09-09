-- Migration: 016_create_flows_and_folders_postgres.sql
-- Cria tabelas para fluxos e pastas dos bots (versão PostgreSQL)
-- Data: 2025-09-08

-- Verificar se as extensões necessárias estão habilitadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela folders (pastas para organizar fluxos)
CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    folder_uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    bot_id INTEGER NOT NULL,
    bot_uuid UUID NOT NULL,
    workspace_id INTEGER NOT NULL,
    workspace_uuid UUID NOT NULL,
    hotel_id INTEGER NOT NULL,
    hotel_uuid UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Cor hex para identificação visual
    icon VARCHAR(50) DEFAULT 'folder', -- Ícone da pasta
    parent_folder_id INTEGER NULL, -- Para hierarquia de pastas
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela flows (fluxos dos bots)
CREATE TABLE flows (
    id SERIAL PRIMARY KEY,
    flow_uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    bot_id INTEGER NOT NULL,
    bot_uuid UUID NOT NULL,
    workspace_id INTEGER NOT NULL,
    workspace_uuid UUID NOT NULL,
    hotel_id INTEGER NOT NULL,
    hotel_uuid UUID NOT NULL,
    folder_id INTEGER NULL, -- Pasta que contém o fluxo (pode ser NULL = raiz)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    flow_type VARCHAR(20) DEFAULT 'CONVERSATION' CHECK (flow_type IN ('CONVERSATION', 'AUTOMATION', 'WEBHOOK', 'TRIGGER', 'ACTION')),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DRAFT', 'TESTING')),
    version VARCHAR(20) DEFAULT '1.0.0',
    flow_data JSONB DEFAULT NULL, -- Dados do fluxo (nodes, connections, etc.)
    variables JSONB DEFAULT NULL, -- Variáveis do fluxo
    settings JSONB DEFAULT NULL, -- Configurações específicas
    triggers JSONB DEFAULT NULL, -- Gatilhos que ativam o fluxo
    priority INTEGER DEFAULT 0, -- Prioridade de execução
    is_default BOOLEAN DEFAULT FALSE, -- Fluxo padrão do bot
    execution_count INTEGER DEFAULT 0, -- Contador de execuções
    last_executed_at TIMESTAMP NULL,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar foreign keys e índices
ALTER TABLE folders 
ADD CONSTRAINT fk_folders_bot_id FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_folders_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_folders_parent_folder_id FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE SET NULL;

ALTER TABLE flows
ADD CONSTRAINT fk_flows_bot_id FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_flows_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_flows_folder_id FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;

-- Criar índices para folders
CREATE INDEX idx_folder_bot_id ON folders (bot_id);
CREATE INDEX idx_folder_workspace_id ON folders (workspace_id);
CREATE INDEX idx_folder_hotel_id ON folders (hotel_id);
CREATE INDEX idx_folder_parent ON folders (parent_folder_id);
CREATE INDEX idx_folder_uuid ON folders (folder_uuid);
CREATE INDEX idx_folder_active ON folders (active);
CREATE INDEX idx_folder_sort ON folders (sort_order);

-- Criar índices para flows
CREATE INDEX idx_flow_bot_id ON flows (bot_id);
CREATE INDEX idx_flow_workspace_id ON flows (workspace_id);
CREATE INDEX idx_flow_hotel_id ON flows (hotel_id);
CREATE INDEX idx_flow_folder_id ON flows (folder_id);
CREATE INDEX idx_flow_uuid ON flows (flow_uuid);
CREATE INDEX idx_flow_type ON flows (flow_type);
CREATE INDEX idx_flow_status ON flows (status);
CREATE INDEX idx_flow_active ON flows (active);
CREATE INDEX idx_flow_priority ON flows (priority);
CREATE INDEX idx_flow_default ON flows (is_default);
CREATE INDEX idx_flow_sort ON flows (sort_order);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flows_updated_at
    BEFORE UPDATE ON flows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir pastas de exemplo
INSERT INTO folders (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, color, icon)
SELECT 
    b.id,
    b.uuid,
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
    b.uuid,
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

-- Comentário final
COMMENT ON TABLE folders IS 'Pastas para organização de fluxos dos bots';
COMMENT ON TABLE flows IS 'Fluxos de conversação e automação dos bots';