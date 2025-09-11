-- ============================================
-- RATE SHOPPER - HISTÓRICO DE PREÇOS
-- ============================================
-- Migração: 020 - Tabela de histórico de variações de preços
-- Data: 2025-09-07
-- Descrição: Sistema de rastreamento de mudanças de preços com indicadores visuais

-- Criar enum para tipos de mudança de preço
CREATE TYPE rate_shopper_price_change_type AS ENUM ('UP', 'DOWN', 'STABLE', 'NEW');

-- Tabela de histórico de preços
CREATE TABLE IF NOT EXISTS rate_shopper_price_history (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    hotel_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    previous_price DECIMAL(10,2),
    price_change DECIMAL(10,2) DEFAULT 0, -- Diferença absoluta (atual - anterior)
    change_percentage DECIMAL(5,2) DEFAULT 0, -- Percentual de mudança
    change_type rate_shopper_price_change_type DEFAULT 'NEW',
    search_id INT, -- ID da busca que gerou essa mudança
    currency VARCHAR(3) DEFAULT 'BRL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (search_id) REFERENCES rate_shopper_searches(id) ON DELETE SET NULL
);

-- Índices para rate_shopper_price_history
CREATE INDEX IF NOT EXISTS idx_rsph_property_id ON rate_shopper_price_history (property_id);
CREATE INDEX IF NOT EXISTS idx_rsph_hotel_id ON rate_shopper_price_history (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rsph_check_in_date ON rate_shopper_price_history (check_in_date);
CREATE INDEX IF NOT EXISTS idx_rsph_change_type ON rate_shopper_price_history (change_type);
CREATE INDEX IF NOT EXISTS idx_rsph_created_at ON rate_shopper_price_history (created_at);
CREATE INDEX IF NOT EXISTS idx_rsph_property_date ON rate_shopper_price_history (property_id, check_in_date);

-- ============================================
-- FUNCTION E TRIGGER PARA DETECTAR MUDANÇAS
-- ============================================

-- Função para detectar e registrar mudanças de preços
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
      AND check_in_date = NEW.check_in_date
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
            check_in_date,
            current_price,
            previous_price,
            price_change,
            change_percentage,
            change_type,
            search_id
        ) VALUES (
            NEW.property_id,
            NEW.hotel_id,
            NEW.check_in_date,
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

-- Criar trigger para monitorar inserções de preços
CREATE TRIGGER track_price_changes_trigger 
    AFTER INSERT ON rate_shopper_prices
    FOR EACH ROW EXECUTE FUNCTION track_price_changes();

-- ============================================
-- VIEWS ÚTEIS PARA HISTÓRICO
-- ============================================

-- View para últimas variações por propriedade
CREATE OR REPLACE VIEW rate_shopper_latest_price_changes AS
SELECT 
    ph.*,
    p.property_name,
    p.booking_url,
    CASE 
        WHEN ph.change_type = 'UP' THEN '↑'
        WHEN ph.change_type = 'DOWN' THEN '↓'
        WHEN ph.change_type = 'STABLE' THEN '→'
        ELSE '★'
    END as trend_indicator,
    CASE 
        WHEN ph.change_type = 'UP' THEN 'text-green-600'
        WHEN ph.change_type = 'DOWN' THEN 'text-red-600'
        WHEN ph.change_type = 'STABLE' THEN 'text-gray-500'
        ELSE 'text-blue-600'
    END as trend_color
FROM rate_shopper_price_history ph
JOIN rate_shopper_properties p ON ph.property_id = p.id
WHERE ph.created_at = (
    SELECT MAX(ph2.created_at)
    FROM rate_shopper_price_history ph2
    WHERE ph2.property_id = ph.property_id 
      AND ph2.check_in_date = ph.check_in_date
);

-- View para resumo de tendências por hotel
CREATE OR REPLACE VIEW rate_shopper_trend_summary AS
SELECT 
    ph.hotel_id,
    ph.check_in_date,
    COUNT(*) as total_properties,
    COUNT(CASE WHEN ph.change_type = 'UP' THEN 1 END) as prices_up,
    COUNT(CASE WHEN ph.change_type = 'DOWN' THEN 1 END) as prices_down,
    COUNT(CASE WHEN ph.change_type = 'STABLE' THEN 1 END) as prices_stable,
    COUNT(CASE WHEN ph.change_type = 'NEW' THEN 1 END) as new_prices,
    AVG(ph.change_percentage) as avg_change_percentage,
    MAX(ph.change_percentage) as max_increase,
    MIN(ph.change_percentage) as max_decrease
FROM rate_shopper_price_history ph
WHERE ph.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY ph.hotel_id, ph.check_in_date
ORDER BY ph.check_in_date DESC;

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE rate_shopper_price_history IS 'Histórico de variações de preços para rastreamento de tendências';
COMMENT ON COLUMN rate_shopper_price_history.change_type IS 'Tipo de mudança: UP (subiu), DOWN (desceu), STABLE (estável), NEW (novo preço)';
COMMENT ON COLUMN rate_shopper_price_history.price_change IS 'Diferença absoluta entre preço atual e anterior (R$)';
COMMENT ON COLUMN rate_shopper_price_history.change_percentage IS 'Percentual de mudança em relação ao preço anterior';
COMMENT ON FUNCTION track_price_changes() IS 'Detecta e registra automaticamente mudanças significativas de preços';