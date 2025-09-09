-- Migration: Atualizar tabela evolution_instances
-- Data: 2025-08-31
-- Descrição: Adiciona campos necessários para integração completa com Evolution API

-- Adicionar campos extras na tabela evolution_instances
ALTER TABLE evolution_instances
ADD COLUMN evolution_instance_id VARCHAR(255) NULL AFTER api_key,
ADD COLUMN webhook_url VARCHAR(500) NULL AFTER host_url,
ADD COLUMN settings JSON NULL AFTER webhook_url;

-- Adicionar índice para evolution_instance_id
ALTER TABLE evolution_instances
ADD INDEX idx_evolution_instance_id (evolution_instance_id);