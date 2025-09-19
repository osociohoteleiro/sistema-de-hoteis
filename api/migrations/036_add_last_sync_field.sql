-- Migration: Adicionar campo last_sync_at para controle de sincronização
-- Data: 2025-09-19
-- Descrição: Adiciona campo para controlar última sincronização de dados com Evolution API

-- Adicionar campo last_sync_at à tabela whatsapp_contacts
ALTER TABLE whatsapp_contacts
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Criar índice para performance em consultas de sincronização
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_last_sync ON whatsapp_contacts(last_sync_at);

-- Comentário no campo
COMMENT ON COLUMN whatsapp_contacts.last_sync_at IS 'Última sincronização de dados com Evolution API para controle de atualizações automáticas';

-- Atualizar registros existentes com timestamp atual
UPDATE whatsapp_contacts
SET last_sync_at = CURRENT_TIMESTAMP
WHERE last_sync_at IS NULL;