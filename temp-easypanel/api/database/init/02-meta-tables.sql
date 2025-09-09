-- Tabelas Meta para Facebook/Instagram Ads
-- Criadas após migração MySQL → PostgreSQL

-- TABELA: oauth_states
CREATE TABLE IF NOT EXISTS oauth_states (
    id SERIAL PRIMARY KEY,
    state VARCHAR(255) UNIQUE NOT NULL,
    hotel_uuid UUID NOT NULL REFERENCES hotels(hotel_uuid) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_oauth_states_state ON oauth_states(state);
CREATE INDEX idx_oauth_states_hotel_uuid ON oauth_states(hotel_uuid);
CREATE INDEX idx_oauth_states_expires_at ON oauth_states(expires_at);

-- TABELA: meta_connected_accounts
CREATE TABLE IF NOT EXISTS meta_connected_accounts (
    id SERIAL PRIMARY KEY,
    hotel_uuid UUID NOT NULL REFERENCES hotels(hotel_uuid) ON DELETE CASCADE,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    access_token TEXT NOT NULL,
    account_status INTEGER DEFAULT 1,
    currency VARCHAR(10),
    business_id VARCHAR(255),
    business_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hotel_uuid, account_id)
);

CREATE TRIGGER meta_connected_accounts_updated_at BEFORE UPDATE ON meta_connected_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_meta_connected_accounts_hotel_uuid ON meta_connected_accounts(hotel_uuid);
CREATE INDEX idx_meta_connected_accounts_account_id ON meta_connected_accounts(account_id);

-- TABELA: meta_available_accounts
CREATE TABLE IF NOT EXISTS meta_available_accounts (
    id SERIAL PRIMARY KEY,
    hotel_uuid UUID NOT NULL REFERENCES hotels(hotel_uuid) ON DELETE CASCADE,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    account_status INTEGER DEFAULT 1,
    currency VARCHAR(10),
    business_id VARCHAR(255),
    business_name VARCHAR(255),
    is_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(hotel_uuid, account_id)
);

CREATE TRIGGER meta_available_accounts_updated_at BEFORE UPDATE ON meta_available_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_meta_available_accounts_hotel_uuid ON meta_available_accounts(hotel_uuid);
CREATE INDEX idx_meta_available_accounts_account_id ON meta_available_accounts(account_id);

-- TABELA: meta_sync_logs
CREATE TABLE IF NOT EXISTS meta_sync_logs (
    id SERIAL PRIMARY KEY,
    hotel_uuid UUID NOT NULL REFERENCES hotels(hotel_uuid) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'ERROR')),
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER meta_sync_logs_updated_at BEFORE UPDATE ON meta_sync_logs 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_meta_sync_logs_hotel_uuid ON meta_sync_logs(hotel_uuid);
CREATE INDEX idx_meta_sync_logs_status ON meta_sync_logs(status);
CREATE INDEX idx_meta_sync_logs_sync_type ON meta_sync_logs(sync_type);

-- Comentários das tabelas
COMMENT ON TABLE oauth_states IS 'Estados temporários para OAuth do Facebook/Instagram';
COMMENT ON TABLE meta_connected_accounts IS 'Contas de anúncios do Facebook/Instagram conectadas por hotel';
COMMENT ON TABLE meta_available_accounts IS 'Contas de anúncios disponíveis após OAuth';
COMMENT ON TABLE meta_sync_logs IS 'Logs de sincronização de dados do Meta Ads API';

-- Dados de exemplo para desenvolvimento (opcional)
-- INSERT INTO oauth_states (state, hotel_uuid, expires_at) VALUES 
-- ('example-state-123', '0cf84c30-82cb-11f0-bd40-02420a0b00b1', NOW() + INTERVAL '1 hour');