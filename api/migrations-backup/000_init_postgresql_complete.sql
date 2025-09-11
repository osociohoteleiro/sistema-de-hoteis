-- Migration: Complete PostgreSQL initialization
-- Esta é a migration base que define toda a estrutura fundamental

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tipos ENUM necessários
CREATE TYPE IF NOT EXISTS rate_shopper_search_type AS ENUM ('MANUAL', 'SCHEDULED');
CREATE TYPE IF NOT EXISTS rate_shopper_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE IF NOT EXISTS rate_shopper_availability_status AS ENUM ('AVAILABLE', 'LIMITED', 'SOLD_OUT');
CREATE TYPE IF NOT EXISTS rate_shopper_competitor_type AS ENUM ('DIRECT', 'OTA');
CREATE TYPE IF NOT EXISTS rate_shopper_alert_type AS ENUM ('PRICE_DROP', 'PRICE_INCREASE', 'AVAILABILITY_CHANGE', 'CUSTOM');
CREATE TYPE IF NOT EXISTS rate_shopper_condition_operator AS ENUM ('GREATER_THAN', 'LESS_THAN', 'EQUALS', 'PERCENTAGE_CHANGE');
CREATE TYPE IF NOT EXISTS rate_shopper_job_type AS ENUM ('SEARCH', 'REPORT', 'ALERT_CHECK', 'CLEANUP');
CREATE TYPE IF NOT EXISTS rate_shopper_report_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM', 'COMPETITIVE_ANALYSIS');
CREATE TYPE IF NOT EXISTS rate_shopper_report_status AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');
CREATE TYPE IF NOT EXISTS rate_shopper_price_change_type AS ENUM ('UP', 'DOWN', 'STABLE', 'NEW');

-- Função para atualizar timestamps automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Esta migration serve como base e não deve ser executada novamente se já existir
-- Ela define a estrutura fundamental que todas as outras migrations dependem