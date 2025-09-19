-- Migration: Sistema de Gerenciamento de Leads
-- Adiciona funcionalidades para etiquetas e campos personalizados

-- 1. Adicionar campos extras à tabela whatsapp_contacts
ALTER TABLE whatsapp_contacts
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lead_status VARCHAR(50) DEFAULT 'NEW',
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Criar tabela de etiquetas (tags)
CREATE TABLE IF NOT EXISTS lead_tags (
    id SERIAL PRIMARY KEY,
    workspace_uuid UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_workspace_tag_name UNIQUE (workspace_uuid, name)
);

-- 3. Criar tabela de relacionamento entre leads e etiquetas
CREATE TABLE IF NOT EXISTS lead_tag_assignments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lead_tag_lead FOREIGN KEY (lead_id) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_lead_tag_tag FOREIGN KEY (tag_id) REFERENCES lead_tags(id) ON DELETE CASCADE,
    CONSTRAINT unique_lead_tag UNIQUE (lead_id, tag_id)
);

-- 4. Criar tabela de definições de campos personalizados
CREATE TABLE IF NOT EXISTS lead_custom_field_definitions (
    id SERIAL PRIMARY KEY,
    workspace_uuid UUID NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    field_name VARCHAR(200) NOT NULL,
    field_type VARCHAR(50) DEFAULT 'text', -- text, number, date, select, boolean
    field_options JSONB, -- para campos select (array de opções)
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_workspace_field_key UNIQUE (workspace_uuid, field_key)
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_tags_workspace ON lead_tags(workspace_uuid);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_lead ON lead_tag_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_tag ON lead_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_lead_custom_fields_workspace ON lead_custom_field_definitions(workspace_uuid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_lead_status ON whatsapp_contacts(lead_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_assigned_to ON whatsapp_contacts(assigned_to);

-- 6. Criar trigger para atualizar updated_at nas novas tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para as novas tabelas
DROP TRIGGER IF EXISTS update_lead_tags_updated_at ON lead_tags;
CREATE TRIGGER update_lead_tags_updated_at
    BEFORE UPDATE ON lead_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_custom_field_definitions_updated_at ON lead_custom_field_definitions;
CREATE TRIGGER update_lead_custom_field_definitions_updated_at
    BEFORE UPDATE ON lead_custom_field_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Inserir algumas etiquetas padrão para workspaces existentes
-- (Será feito via API para workspaces específicas)

-- 8. Inserir alguns campos personalizados padrão
-- (Será feito via API para workspaces específicas)

COMMENT ON TABLE lead_tags IS 'Etiquetas/tags para classificação de leads';
COMMENT ON TABLE lead_tag_assignments IS 'Relacionamento entre leads e etiquetas';
COMMENT ON TABLE lead_custom_field_definitions IS 'Definições de campos personalizados por workspace';
COMMENT ON COLUMN whatsapp_contacts.custom_fields IS 'Valores dos campos personalizados em formato JSON';
COMMENT ON COLUMN whatsapp_contacts.lead_status IS 'Status do lead: NEW, CONTACTED, QUALIFIED, CONVERTED, LOST';
COMMENT ON COLUMN whatsapp_contacts.lead_source IS 'Origem do lead: WHATSAPP, WEBSITE, REFERRAL, etc';