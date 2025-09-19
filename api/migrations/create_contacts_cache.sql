-- Criar tabela para cache de dados de contatos
CREATE TABLE IF NOT EXISTS contacts_cache (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    instance_name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(255),
    profile_picture_url TEXT,
    contact_exists BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Índices únicos para evitar duplicação
    UNIQUE(phone_number, instance_name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contacts_cache_phone ON contacts_cache(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_cache_instance ON contacts_cache(instance_name);
CREATE INDEX IF NOT EXISTS idx_contacts_cache_updated ON contacts_cache(last_updated);

-- Comentários na tabela
COMMENT ON TABLE contacts_cache IS 'Cache de dados de contatos do WhatsApp para evitar requisições excessivas à Evolution API';
COMMENT ON COLUMN contacts_cache.phone_number IS 'Número de telefone do contato (apenas números)';
COMMENT ON COLUMN contacts_cache.instance_name IS 'Nome da instância Evolution API';
COMMENT ON COLUMN contacts_cache.contact_name IS 'Nome do contato obtido via Evolution API';
COMMENT ON COLUMN contacts_cache.profile_picture_url IS 'URL da foto de perfil do contato';
COMMENT ON COLUMN contacts_cache.contact_exists IS 'Se o contato existe no WhatsApp';
COMMENT ON COLUMN contacts_cache.last_updated IS 'Última atualização dos dados do contato';