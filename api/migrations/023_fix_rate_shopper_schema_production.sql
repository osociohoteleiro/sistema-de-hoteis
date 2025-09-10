-- ============================================
-- RATE SHOPPER - CORREÇÃO DE SCHEMA PRODUÇÃO
-- ============================================
-- Migração: 023 - Sincronizar schema de produção com migration original
-- Data: 2025-01-10
-- Descrição: Corrigir diferenças entre local e produção no schema Rate Shopper

-- ============================================
-- CORRIGIR TABELA rate_shopper_searches
-- ============================================

-- 1. Adicionar colunas que estão na migration original mas não em produção
ALTER TABLE rate_shopper_searches 
ADD COLUMN IF NOT EXISTS uuid UUID UNIQUE DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS search_type VARCHAR(50) DEFAULT 'MANUAL',
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS total_dates INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS processed_dates INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_prices_found INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 2. Migrar dados de check_in/check_out para start_date/end_date
UPDATE rate_shopper_searches 
SET start_date = check_in, 
    end_date = check_out,
    started_at = created_at,
    completed_at = CASE WHEN search_status = 'COMPLETED' THEN updated_at ELSE NULL END
WHERE start_date IS NULL;

-- 3. Renomear coluna search_status para status (compatibilidade com migration original)
ALTER TABLE rate_shopper_searches 
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

UPDATE rate_shopper_searches 
SET status = search_status 
WHERE status IS NULL;

-- ============================================
-- CORRIGIR TABELA rate_shopper_prices
-- ============================================

-- 1. Adicionar colunas que estão na migration original
ALTER TABLE rate_shopper_prices 
ADD COLUMN IF NOT EXISTS check_in_date DATE,
ADD COLUMN IF NOT EXISTS check_out_date DATE,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS max_guests INT DEFAULT 2,
ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bundle_size INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'JS_VARS';

-- 2. Migrar dados de check_in para check_in_date (se necessário)
-- Verificar se a coluna check_in existe e migrar dados
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_prices' AND column_name = 'check_in') THEN
        UPDATE rate_shopper_prices 
        SET check_in_date = check_in,
            check_out_date = check_out,
            scraped_at = captured_at
        WHERE check_in_date IS NULL;
    END IF;
END $$;

-- ============================================
-- CORRIGIR TABELA rate_shopper_properties  
-- ============================================

-- 1. Adicionar colunas que estão na migration original
ALTER TABLE rate_shopper_properties 
ADD COLUMN IF NOT EXISTS uuid UUID UNIQUE DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS booking_url TEXT,
ADD COLUMN IF NOT EXISTS competitor_type VARCHAR(50) DEFAULT 'OTA',
ADD COLUMN IF NOT EXISTS ota_name VARCHAR(100) DEFAULT 'Booking.com',
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS max_bundle_size INT DEFAULT 7;

-- 2. Migrar dados de property_url para booking_url
UPDATE rate_shopper_properties 
SET booking_url = property_url 
WHERE booking_url IS NULL AND property_url IS NOT NULL;

-- 3. Renomear booking_engine para platform (manter compatibilidade)
ALTER TABLE rate_shopper_properties 
ADD COLUMN IF NOT EXISTS platform VARCHAR(100);

UPDATE rate_shopper_properties 
SET platform = booking_engine 
WHERE platform IS NULL;

-- ============================================
-- CRIAR TIPOS ENUM SE NÃO EXISTEM
-- ============================================

DO $$
BEGIN
    -- Criar ENUMs se não existirem
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_competitor_type') THEN
        CREATE TYPE rate_shopper_competitor_type AS ENUM ('DIRECT', 'OTA');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_search_type') THEN
        CREATE TYPE rate_shopper_search_type AS ENUM ('MANUAL', 'SCHEDULED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_status') THEN
        CREATE TYPE rate_shopper_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_availability_status') THEN
        CREATE TYPE rate_shopper_availability_status AS ENUM ('AVAILABLE', 'LIMITED', 'SOLD_OUT');
    END IF;
END $$;

-- ============================================
-- CRIAR TABELAS AUXILIARES SE NÃO EXISTEM
-- ============================================

-- Tabela de configurações do Rate Shopper por hotel
CREATE TABLE IF NOT EXISTS rate_shopper_configs (
    id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL,
    auto_search_enabled BOOLEAN DEFAULT FALSE,
    search_frequency_hours INT DEFAULT 8,
    date_range_days INT DEFAULT 90,
    max_bundle_size INT DEFAULT 7,
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_emails TEXT,
    price_alert_threshold DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE (hotel_id)
);

-- ============================================
-- CRIAR ÍNDICES SE NÃO EXISTEM
-- ============================================

-- Índices para rate_shopper_searches
CREATE INDEX IF NOT EXISTS idx_rss_hotel_id ON rate_shopper_searches (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rss_property_id ON rate_shopper_searches (property_id);
CREATE INDEX IF NOT EXISTS idx_rss_status ON rate_shopper_searches (status);
CREATE INDEX IF NOT EXISTS idx_rss_search_status ON rate_shopper_searches (search_status);
CREATE INDEX IF NOT EXISTS idx_rss_date_range ON rate_shopper_searches (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rss_check_range ON rate_shopper_searches (check_in, check_out);

-- Índices para rate_shopper_prices  
CREATE INDEX IF NOT EXISTS idx_rspr_search_id ON rate_shopper_prices (search_id);
CREATE INDEX IF NOT EXISTS idx_rspr_property_id ON rate_shopper_prices (property_id);
CREATE INDEX IF NOT EXISTS idx_rspr_hotel_id ON rate_shopper_prices (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rspr_dates ON rate_shopper_prices (check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_rspr_check_dates ON rate_shopper_prices (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_rspr_price ON rate_shopper_prices (price);
CREATE INDEX IF NOT EXISTS idx_rspr_scraped_at ON rate_shopper_prices (scraped_at);
CREATE INDEX IF NOT EXISTS idx_rspr_captured_at ON rate_shopper_prices (captured_at);

-- Índices para rate_shopper_properties
CREATE INDEX IF NOT EXISTS idx_rsp_hotel_id ON rate_shopper_properties (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rsp_active ON rate_shopper_properties (active);

-- ============================================
-- CRIAR CONFIGURAÇÕES PADRÃO PARA HOTÉIS
-- ============================================

-- Inserir configuração padrão para hotéis existentes
INSERT INTO rate_shopper_configs (hotel_id, auto_search_enabled, search_frequency_hours, date_range_days) 
SELECT id, FALSE, 8, 90 FROM hotels 
WHERE id NOT IN (SELECT hotel_id FROM rate_shopper_configs WHERE hotel_id IS NOT NULL)
ON CONFLICT (hotel_id) DO NOTHING;

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

-- Esta migration sincroniza o schema de produção com a migration original,
-- garantindo que tanto as colunas antigas (check_in, captured_at, search_status)
-- quanto as novas (check_in_date, scraped_at, status) estejam disponíveis
-- para máxima compatibilidade durante a transição.