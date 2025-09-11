-- Migração: Criar tabela de permissões dos usuários
-- Data: 2024-09-09
-- Descrição: Armazenar permissões individuais dos usuários do sistema

-- Criar tabela de permissões dos usuários
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    permission VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key para usuários
    CONSTRAINT fk_user_permissions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Evitar permissões duplicadas para o mesmo usuário
    CONSTRAINT uk_user_permission UNIQUE (user_id, permission)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);

-- Comentários para documentação
COMMENT ON TABLE user_permissions IS 'Armazena as permissões individuais de cada usuário do sistema';
COMMENT ON COLUMN user_permissions.user_id IS 'ID do usuário que possui a permissão';
COMMENT ON COLUMN user_permissions.permission IS 'Nome da permissão (ex: view_pms_dashboard, manage_pms_reservas)';