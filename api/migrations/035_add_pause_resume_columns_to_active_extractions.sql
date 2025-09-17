-- ============================================
-- ACTIVE EXTRACTIONS - ADICIONAR COLUNAS PAUSE/RESUME
-- ============================================
-- Migração: 035 - Adicionar colunas para pause/resume na tabela active_extractions
-- Data: 2025-09-17
-- Descrição: Adicionar campos para tracking de pause/resume em extrações ativas

-- ============================================
-- ADICIONAR COLUNAS DE PAUSE/RESUME
-- ============================================

-- Adicionar coluna para timestamp de quando foi pausado
ALTER TABLE active_extractions
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP;

-- Adicionar coluna para timestamp de quando foi retomado
ALTER TABLE active_extractions
ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP;

-- ============================================
-- CRIAR ÍNDICES PARA OTIMIZAÇÃO
-- ============================================

-- Índice para buscas pausadas
CREATE INDEX IF NOT EXISTS idx_active_extractions_paused
ON active_extractions (status, paused_at)
WHERE status = 'PAUSED';

-- Índice para status de extrações
CREATE INDEX IF NOT EXISTS idx_active_extractions_status
ON active_extractions (status, updated_at);

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN active_extractions.paused_at IS
'Timestamp de quando a extração foi pausada.';

COMMENT ON COLUMN active_extractions.resumed_at IS
'Timestamp de quando a extração foi retomada após pause.';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================