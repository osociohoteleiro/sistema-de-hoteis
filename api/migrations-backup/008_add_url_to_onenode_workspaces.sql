-- Migration: Adicionar coluna url à tabela onenode_workspaces
-- Data: 2025-08-31
-- Descrição: Adiciona coluna url com valor padrão "https://www.uchat.com.au/api/flow/"

ALTER TABLE onenode_workspaces 
ADD COLUMN url VARCHAR(255) NOT NULL DEFAULT 'https://www.uchat.com.au/api/flow/' 
AFTER api_key;

-- Atualizar registros existentes com a URL padrão (se houver)
UPDATE onenode_workspaces 
SET url = 'https://www.uchat.com.au/api/flow/' 
WHERE url IS NULL OR url = '';

-- Adicionar índice na coluna url para melhor performance
CREATE INDEX idx_onenode_url ON onenode_workspaces(url);