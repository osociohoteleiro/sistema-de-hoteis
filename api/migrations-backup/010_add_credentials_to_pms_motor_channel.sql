-- Migration: Adicionar campos de credenciais dinâmicas à tabela pms_motor_channel
-- Data: 2025-08-31
-- Descrição: Adiciona campos para suportar diferentes tipos de autenticação e credenciais

ALTER TABLE pms_motor_channel 
ADD COLUMN credentials JSON COMMENT 'Credenciais de autenticação em formato JSON',
ADD COLUMN auth_type VARCHAR(50) COMMENT 'Tipo de autenticação: oauth, api_key, token, basic, etc',
ADD COLUMN endpoint_url VARCHAR(500) COMMENT 'URL base da API do sistema',
ADD COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT 'Status de ativação da integração';

-- Adicionar índices para melhor performance
ALTER TABLE pms_motor_channel
ADD INDEX idx_auth_type (auth_type),
ADD INDEX idx_is_active (is_active);