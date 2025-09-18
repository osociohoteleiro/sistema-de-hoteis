-- Migração 004: Criar tabela workspace_instances
-- Esta tabela gerencia os vínculos entre workspaces e instâncias da Evolution API

CREATE TABLE IF NOT EXISTS workspace_instances (
    id SERIAL PRIMARY KEY,
    workspace_uuid UUID NOT NULL,
    instance_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Índices e constraints
    UNIQUE(workspace_uuid, instance_name),

    -- Foreign key para workspaces (assumindo que existe uma tabela de workspaces)
    CONSTRAINT fk_workspace_instances_workspace
        FOREIGN KEY (workspace_uuid)
        REFERENCES workspaces(workspace_uuid)
        ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_workspace_instances_workspace_uuid ON workspace_instances(workspace_uuid);
CREATE INDEX IF NOT EXISTS idx_workspace_instances_instance_name ON workspace_instances(instance_name);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_workspace_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_workspace_instances_updated_at
    BEFORE UPDATE ON workspace_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_workspace_instances_updated_at();

-- Comentários para documentação
COMMENT ON TABLE workspace_instances IS 'Vínculos entre workspaces e instâncias da Evolution API';
COMMENT ON COLUMN workspace_instances.workspace_uuid IS 'UUID da workspace';
COMMENT ON COLUMN workspace_instances.instance_name IS 'Nome da instância da Evolution API vinculada';
COMMENT ON COLUMN workspace_instances.created_at IS 'Data de criação do vínculo';
COMMENT ON COLUMN workspace_instances.updated_at IS 'Data da última atualização';