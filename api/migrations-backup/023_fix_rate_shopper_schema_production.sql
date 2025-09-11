-- Migration: Fix rate shopper schema for production compatibility
-- Esta migration corrige problemas de schema do rate shopper para produção

-- Garantir que todos os tipos ENUM existam
DO $$ 
BEGIN
    -- Verificar e criar tipos ENUM se não existirem
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_search_type') THEN
        CREATE TYPE rate_shopper_search_type AS ENUM ('MANUAL', 'SCHEDULED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_status') THEN
        CREATE TYPE rate_shopper_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_availability_status') THEN
        CREATE TYPE rate_shopper_availability_status AS ENUM ('AVAILABLE', 'LIMITED', 'SOLD_OUT');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_competitor_type') THEN
        CREATE TYPE rate_shopper_competitor_type AS ENUM ('DIRECT', 'OTA');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_alert_type') THEN
        CREATE TYPE rate_shopper_alert_type AS ENUM ('PRICE_DROP', 'PRICE_INCREASE', 'AVAILABILITY_CHANGE', 'CUSTOM');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_condition_operator') THEN
        CREATE TYPE rate_shopper_condition_operator AS ENUM ('GREATER_THAN', 'LESS_THAN', 'EQUALS', 'PERCENTAGE_CHANGE');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_job_type') THEN
        CREATE TYPE rate_shopper_job_type AS ENUM ('SEARCH', 'REPORT', 'ALERT_CHECK', 'CLEANUP');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_report_type') THEN
        CREATE TYPE rate_shopper_report_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM', 'COMPETITIVE_ANALYSIS');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_report_status') THEN
        CREATE TYPE rate_shopper_report_status AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_shopper_price_change_type') THEN
        CREATE TYPE rate_shopper_price_change_type AS ENUM ('UP', 'DOWN', 'STABLE', 'NEW');
    END IF;
END $$;

-- Corrigir colunas que podem ter problemas de tipo
DO $$
BEGIN
    -- Verificar se as tabelas existem antes de alterar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_shopper_properties') THEN
        -- Garantir que a coluna platform existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'rate_shopper_properties' AND column_name = 'platform') THEN
            ALTER TABLE rate_shopper_properties ADD COLUMN platform VARCHAR(20) DEFAULT 'booking';
        END IF;
        
        -- Garantir que a coluna is_main_property existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'rate_shopper_properties' AND column_name = 'is_main_property') THEN
            ALTER TABLE rate_shopper_properties ADD COLUMN is_main_property BOOLEAN DEFAULT FALSE;
        END IF;
    END IF;
END $$;