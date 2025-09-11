-- ============================================
-- RATE SHOPPER - CORREÇÃO COMPLETA DE SCHEMA
-- ============================================
-- Migração: 024 - Corrigir inconsistências entre migrations e funcionamento real
-- Data: 2025-01-10
-- Descrição: Sincronizar schema para funcionamento correto em local E produção

-- ============================================
-- PRIMEIRA PARTE: CORRIGIR ESQUEMA EM PRODUÇÃO
-- ============================================

-- Verificar e criar tabelas base se não existirem
CREATE TABLE IF NOT EXISTS rate_shopper_properties (
    id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL,
    property_name VARCHAR(255) NOT NULL,
    property_url TEXT,
    booking_url TEXT,
    booking_engine VARCHAR(100),
    platform VARCHAR(20) DEFAULT 'booking',
    is_main_property BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rate_shopper_searches (
    id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL,
    property_id INT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    adults INT DEFAULT 2,
    children INT DEFAULT 0,
    rooms INT DEFAULT 1,
    search_status VARCHAR(50) DEFAULT 'PENDING',
    total_results INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    error_message TEXT,
    search_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rate_shopper_prices (
    id SERIAL PRIMARY KEY,
    search_id INT NOT NULL,
    hotel_id INT NOT NULL,
    property_id INT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    room_type VARCHAR(255),
    rate_plan VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    availability_status VARCHAR(50),
    booking_url TEXT,
    source_engine VARCHAR(100),
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (search_id) REFERENCES rate_shopper_searches(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE SET NULL
);

-- ============================================
-- SEGUNDA PARTE: ADICIONAR COLUNAS DE COMPATIBILIDADE
-- ============================================

-- Para rate_shopper_searches: garantir compatibilidade com ambos os nomes
ALTER TABLE rate_shopper_searches 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

-- Sincronizar dados entre as colunas compatíveis
UPDATE rate_shopper_searches 
SET start_date = check_in,
    end_date = check_out,
    status = search_status
WHERE start_date IS NULL OR status IS NULL;

-- Para rate_shopper_prices: garantir compatibilidade com ambos os nomes  
ALTER TABLE rate_shopper_prices 
ADD COLUMN IF NOT EXISTS check_in_date DATE,
ADD COLUMN IF NOT EXISTS check_out_date DATE,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP;

-- Sincronizar dados entre as colunas compatíveis
UPDATE rate_shopper_prices 
SET check_in_date = check_in,
    check_out_date = check_out,
    scraped_at = captured_at
WHERE check_in_date IS NULL OR scraped_at IS NULL;

-- Para rate_shopper_properties: garantir compatibilidade
UPDATE rate_shopper_properties 
SET booking_url = property_url
WHERE booking_url IS NULL AND property_url IS NOT NULL;

UPDATE rate_shopper_properties 
SET property_url = booking_url
WHERE property_url IS NULL AND booking_url IS NOT NULL;

-- ============================================
-- TERCEIRA PARTE: CRIAR TRIGGERS DE SINCRONIZAÇÃO
-- ============================================

-- Trigger para manter check_in e start_date sincronizados em searches
CREATE OR REPLACE FUNCTION sync_search_dates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.start_date := NEW.check_in;
    NEW.end_date := NEW.check_out;
    NEW.status := NEW.search_status;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS sync_search_dates_trigger ON rate_shopper_searches;
CREATE TRIGGER sync_search_dates_trigger 
    BEFORE INSERT OR UPDATE ON rate_shopper_searches
    FOR EACH ROW EXECUTE FUNCTION sync_search_dates();

-- Trigger para manter check_in e check_in_date sincronizados em prices
CREATE OR REPLACE FUNCTION sync_price_dates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.check_in_date := NEW.check_in;
    NEW.check_out_date := NEW.check_out;
    NEW.scraped_at := NEW.captured_at;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS sync_price_dates_trigger ON rate_shopper_prices;
CREATE TRIGGER sync_price_dates_trigger 
    BEFORE INSERT OR UPDATE ON rate_shopper_prices
    FOR EACH ROW EXECUTE FUNCTION sync_price_dates();

-- Trigger para manter URLs sincronizadas em properties
CREATE OR REPLACE FUNCTION sync_property_urls()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_url IS NOT NULL THEN
        NEW.property_url := NEW.booking_url;
    ELSIF NEW.property_url IS NOT NULL THEN
        NEW.booking_url := NEW.property_url;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS sync_property_urls_trigger ON rate_shopper_properties;
CREATE TRIGGER sync_property_urls_trigger 
    BEFORE INSERT OR UPDATE ON rate_shopper_properties
    FOR EACH ROW EXECUTE FUNCTION sync_property_urls();

-- ============================================
-- QUARTA PARTE: CRIAR PRICE HISTORY CORRIGIDA
-- ============================================

-- Criar tipo ENUM se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_price_change_type') THEN
        CREATE TYPE rate_shopper_price_change_type AS ENUM ('UP', 'DOWN', 'STABLE', 'NEW');
    END IF;
END $$;

-- Tabela de histórico com nomes corretos
CREATE TABLE IF NOT EXISTS rate_shopper_price_history (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    hotel_id INT NOT NULL,
    check_in DATE NOT NULL,  -- SEM _date suffix
    check_in_date DATE,      -- COM _date para compatibilidade
    current_price DECIMAL(10,2) NOT NULL,
    previous_price DECIMAL(10,2),
    price_change DECIMAL(10,2) DEFAULT 0,
    change_percentage DECIMAL(5,2) DEFAULT 0,
    change_type rate_shopper_price_change_type DEFAULT 'NEW',
    search_id INT,
    currency VARCHAR(3) DEFAULT 'BRL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (search_id) REFERENCES rate_shopper_searches(id) ON DELETE SET NULL
);

-- Sincronizar colunas de data no histórico
UPDATE rate_shopper_price_history 
SET check_in_date = check_in
WHERE check_in_date IS NULL;

-- Trigger para sincronizar history dates
CREATE OR REPLACE FUNCTION sync_history_dates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.check_in_date := NEW.check_in;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS sync_history_dates_trigger ON rate_shopper_price_history;
CREATE TRIGGER sync_history_dates_trigger 
    BEFORE INSERT OR UPDATE ON rate_shopper_price_history
    FOR EACH ROW EXECUTE FUNCTION sync_history_dates();

-- ============================================
-- QUINTA PARTE: FUNÇÃO DE PRICE TRACKING CORRIGIDA
-- ============================================

-- Função corrigida para detectar mudanças de preços
CREATE OR REPLACE FUNCTION track_price_changes()
RETURNS TRIGGER AS $$
DECLARE
    last_price DECIMAL(10,2);
    price_diff DECIMAL(10,2);
    percent_change DECIMAL(5,2);
    change_type_val rate_shopper_price_change_type;
BEGIN
    -- Buscar o último preço registrado para a mesma propriedade e data
    SELECT current_price INTO last_price
    FROM rate_shopper_price_history 
    WHERE property_id = NEW.property_id 
      AND check_in = NEW.check_in  -- SEM _date suffix
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Calcular diferença e percentual
    IF last_price IS NOT NULL THEN
        price_diff := NEW.price - last_price;
        percent_change := ROUND(((NEW.price - last_price) / last_price) * 100, 2);
        
        -- Determinar tipo de mudança (considerar mudanças > 1% como significativas)
        IF ABS(percent_change) <= 1 THEN
            change_type_val := 'STABLE';
        ELSIF price_diff > 0 THEN
            change_type_val := 'UP';
        ELSE
            change_type_val := 'DOWN';
        END IF;
    ELSE
        -- Primeiro preço para esta propriedade/data
        last_price := NULL;
        price_diff := 0;
        percent_change := 0;
        change_type_val := 'NEW';
    END IF;
    
    -- Registrar no histórico apenas se houver mudança significativa ou for novo preço
    IF change_type_val = 'NEW' OR ABS(percent_change) > 1 THEN
        INSERT INTO rate_shopper_price_history (
            property_id,
            hotel_id,
            check_in,      -- SEM _date suffix
            current_price,
            previous_price,
            price_change,
            change_percentage,
            change_type,
            search_id
        ) VALUES (
            NEW.property_id,
            NEW.hotel_id,
            NEW.check_in,  -- SEM _date suffix
            NEW.price,
            last_price,
            price_diff,
            percent_change,
            change_type_val,
            NEW.search_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recrear trigger corrigido
DROP TRIGGER IF EXISTS track_price_changes_trigger ON rate_shopper_prices;
CREATE TRIGGER track_price_changes_trigger 
    AFTER INSERT ON rate_shopper_prices
    FOR EACH ROW EXECUTE FUNCTION track_price_changes();

-- ============================================
-- SEXTA PARTE: VIEWS CORRIGIDAS
-- ============================================

-- View para preços mais recentes (corrigida)
CREATE OR REPLACE VIEW rate_shopper_latest_prices AS
SELECT 
    p.id as property_id,
    p.property_name,
    p.hotel_id,
    rsp.check_in,      -- SEM _date suffix
    rsp.check_out,     -- SEM _date suffix
    rsp.price,
    rsp.currency,
    rsp.availability_status,
    rsp.captured_at,   -- Nome correto para produção
    s.search_status    -- Nome correto para produção
FROM rate_shopper_prices rsp
JOIN rate_shopper_properties p ON rsp.property_id = p.id
JOIN rate_shopper_searches s ON rsp.search_id = s.id
WHERE rsp.captured_at = (
    SELECT MAX(rsp2.captured_at) 
    FROM rate_shopper_prices rsp2 
    WHERE rsp2.property_id = rsp.property_id 
      AND rsp2.check_in = rsp.check_in  -- SEM _date suffix
);

-- ============================================
-- SÉTIMA PARTE: ÍNDICES OTIMIZADOS
-- ============================================

-- Índices para ambos os formatos de coluna
CREATE INDEX IF NOT EXISTS idx_rsp_hotel_id ON rate_shopper_properties (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rsp_active ON rate_shopper_properties (active);
CREATE INDEX IF NOT EXISTS idx_rsp_platform ON rate_shopper_properties (platform);

CREATE INDEX IF NOT EXISTS idx_rss_hotel_id ON rate_shopper_searches (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rss_property_id ON rate_shopper_searches (property_id);
CREATE INDEX IF NOT EXISTS idx_rss_search_status ON rate_shopper_searches (search_status);
CREATE INDEX IF NOT EXISTS idx_rss_status ON rate_shopper_searches (status);
CREATE INDEX IF NOT EXISTS idx_rss_check_dates ON rate_shopper_searches (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_rss_start_dates ON rate_shopper_searches (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_rspr_search_id ON rate_shopper_prices (search_id);
CREATE INDEX IF NOT EXISTS idx_rspr_property_id ON rate_shopper_prices (property_id);
CREATE INDEX IF NOT EXISTS idx_rspr_hotel_id ON rate_shopper_prices (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rspr_check_dates ON rate_shopper_prices (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_rspr_check_in_dates ON rate_shopper_prices (check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_rspr_captured_at ON rate_shopper_prices (captured_at);
CREATE INDEX IF NOT EXISTS idx_rspr_scraped_at ON rate_shopper_prices (scraped_at);

CREATE INDEX IF NOT EXISTS idx_rsph_property_id ON rate_shopper_price_history (property_id);
CREATE INDEX IF NOT EXISTS idx_rsph_hotel_id ON rate_shopper_price_history (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rsph_check_in ON rate_shopper_price_history (check_in);
CREATE INDEX IF NOT EXISTS idx_rsph_check_in_date ON rate_shopper_price_history (check_in_date);

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON TABLE rate_shopper_searches IS 'Tabela de buscas - compatível com check_in/start_date e search_status/status';
COMMENT ON TABLE rate_shopper_prices IS 'Tabela de preços - compatível com check_in/check_in_date e captured_at/scraped_at';
COMMENT ON TABLE rate_shopper_properties IS 'Tabela de propriedades - compatível com property_url/booking_url';

-- Esta migration garante compatibilidade total entre as diferentes versões de schema,
-- permitindo que o código funcione tanto localmente quanto em produção sem modificações.