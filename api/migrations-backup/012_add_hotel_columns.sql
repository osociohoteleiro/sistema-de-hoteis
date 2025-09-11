-- Migration: 012_add_hotel_columns.sql
-- Adiciona colunas na tabela hotels: accommodation_units, city, state, responsible_name
-- Data: 2025-09-01

-- Adicionar coluna para quantidade de unidades habitacionais
ALTER TABLE hotels 
ADD COLUMN accommodation_units INT DEFAULT 0 COMMENT 'Quantidade de unidades habitacionais';

-- Adicionar coluna para cidade
ALTER TABLE hotels 
ADD COLUMN city VARCHAR(100) DEFAULT NULL COMMENT 'Cidade do hotel';

-- Adicionar coluna para estado
ALTER TABLE hotels 
ADD COLUMN state VARCHAR(100) DEFAULT NULL COMMENT 'Estado do hotel';

-- Adicionar coluna para nome do responsável
ALTER TABLE hotels 
ADD COLUMN responsible_name VARCHAR(255) DEFAULT NULL COMMENT 'Nome do responsável pelo hotel';

-- Adicionar índices para otimizar consultas por cidade e estado
CREATE INDEX idx_hotels_city ON hotels(city);
CREATE INDEX idx_hotels_state ON hotels(state);
CREATE INDEX idx_hotels_city_state ON hotels(city, state);