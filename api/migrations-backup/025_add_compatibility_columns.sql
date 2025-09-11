-- ============================================
-- RATE SHOPPER - ADICIONAR COLUNAS DE COMPATIBILIDADE
-- ============================================
-- Migração: 025 - Adicionar apenas as colunas necessárias para compatibilidade
-- Data: 2025-01-10
-- Descrição: Adicionar colunas de compatibilidade baseado no schema real de produção

-- ============================================
-- ADICIONAR COLUNAS DE COMPATIBILIDADE
-- ============================================

-- Para rate_shopper_searches: adicionar colunas alternativas se não existirem
ALTER TABLE rate_shopper_searches 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

-- Para rate_shopper_prices: adicionar colunas alternativas se não existirem  
ALTER TABLE rate_shopper_prices 
ADD COLUMN IF NOT EXISTS check_in_date DATE,
ADD COLUMN IF NOT EXISTS check_out_date DATE,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS check_in DATE,
ADD COLUMN IF NOT EXISTS check_out DATE;

-- Para rate_shopper_properties: adicionar colunas alternativas se não existirem
ALTER TABLE rate_shopper_properties 
ADD COLUMN IF NOT EXISTS booking_url TEXT,
ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'booking';

-- ============================================
-- SINCRONIZAR DADOS EXISTENTES
-- ============================================

-- Sincronizar dados entre as colunas compatíveis para searches
UPDATE rate_shopper_searches 
SET start_date = check_in,
    end_date = check_out,
    status = search_status
WHERE start_date IS NULL OR status IS NULL;

-- Sincronizar dados entre as colunas compatíveis para prices
UPDATE rate_shopper_prices 
SET check_in_date = COALESCE(check_in, captured_at::date),
    check_out_date = COALESCE(check_out, captured_at::date + interval '1 day'),
    scraped_at = captured_at,
    check_in = COALESCE(check_in, captured_at::date),
    check_out = COALESCE(check_out, captured_at::date + interval '1 day')
WHERE check_in_date IS NULL OR scraped_at IS NULL;

-- Sincronizar dados entre as colunas compatíveis para properties
UPDATE rate_shopper_properties 
SET booking_url = property_url,
    platform = CASE 
        WHEN LOWER(property_url) LIKE '%artaxnet%' THEN 'artaxnet'
        WHEN LOWER(property_url) LIKE '%booking%' THEN 'booking'
        ELSE 'booking'
    END
WHERE booking_url IS NULL;

UPDATE rate_shopper_properties 
SET property_url = booking_url
WHERE property_url IS NULL AND booking_url IS NOT NULL;

-- ============================================
-- CRIAR TRIGGERS DE SINCRONIZAÇÃO
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

-- Trigger para manter colunas de data sincronizadas em prices
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
    
    -- Atualizar platform baseado na URL
    IF NEW.property_url IS NOT NULL THEN
        NEW.platform := CASE 
            WHEN LOWER(NEW.property_url) LIKE '%artaxnet%' THEN 'artaxnet'
            WHEN LOWER(NEW.property_url) LIKE '%booking%' THEN 'booking'
            ELSE 'booking'
        END;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS sync_property_urls_trigger ON rate_shopper_properties;
CREATE TRIGGER sync_property_urls_trigger 
    BEFORE INSERT OR UPDATE ON rate_shopper_properties
    FOR EACH ROW EXECUTE FUNCTION sync_property_urls();

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índices para as novas colunas de compatibilidade
CREATE INDEX IF NOT EXISTS idx_rss_start_dates ON rate_shopper_searches (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rss_status ON rate_shopper_searches (status);

CREATE INDEX IF NOT EXISTS idx_rspr_check_in_dates ON rate_shopper_prices (check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_rspr_scraped_at ON rate_shopper_prices (scraped_at);

CREATE INDEX IF NOT EXISTS idx_rsp_platform ON rate_shopper_properties (platform);

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE rate_shopper_searches IS 'Tabela de buscas - compatível com check_in/start_date e search_status/status';
COMMENT ON TABLE rate_shopper_prices IS 'Tabela de preços - compatível com check_in/check_in_date e captured_at/scraped_at';
COMMENT ON TABLE rate_shopper_properties IS 'Tabela de propriedades - compatível com property_url/booking_url e booking_engine/platform';