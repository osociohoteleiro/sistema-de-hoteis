-- ============================================
-- RATE SHOPPER - ADICIONAR STATUS PAUSED E CAMPOS DE CHECKPOINT
-- ============================================
-- Migração: 034 - Adicionar status PAUSED e campos de checkpoint
-- Data: 2025-09-17
-- Descrição: Implementar sistema de pause/resume para extrações

-- ============================================
-- 1. ATUALIZAR ENUM PARA INCLUIR STATUS PAUSED
-- ============================================

-- Adicionar PAUSED ao enum rate_shopper_status
ALTER TYPE rate_shopper_status ADD VALUE IF NOT EXISTS 'PAUSED';

-- ============================================
-- 2. ADICIONAR CAMPOS DE CHECKPOINT
-- ============================================

-- Adicionar campo para armazenar a última data processada com sucesso
ALTER TABLE rate_shopper_searches
ADD COLUMN IF NOT EXISTS last_processed_date DATE;

-- Adicionar campo JSON para armazenar estado detalhado do checkpoint
ALTER TABLE rate_shopper_searches
ADD COLUMN IF NOT EXISTS pause_checkpoint JSONB;

-- Adicionar campo para timestamp de quando foi pausado
ALTER TABLE rate_shopper_searches
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP;

-- Adicionar campo para razão do pause (automático, manual, erro, etc.)
ALTER TABLE rate_shopper_searches
ADD COLUMN IF NOT EXISTS pause_reason VARCHAR(255);

-- ============================================
-- 3. CRIAR ÍNDICES PARA OTIMIZAÇÃO
-- ============================================

-- Índice para buscas pausadas
CREATE INDEX IF NOT EXISTS idx_rss_status_paused
ON rate_shopper_searches (status)
WHERE status = 'PAUSED';

-- Índice para checkpoint de data
CREATE INDEX IF NOT EXISTS idx_rss_last_processed_date
ON rate_shopper_searches (last_processed_date);

-- Índice composto para queries de resume
CREATE INDEX IF NOT EXISTS idx_rss_resume_lookup
ON rate_shopper_searches (hotel_id, status, last_processed_date)
WHERE status IN ('PAUSED', 'PENDING');

-- ============================================
-- 4. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN rate_shopper_searches.last_processed_date IS
'Última data processada com sucesso antes do pause. Usada para resume de onde parou.';

COMMENT ON COLUMN rate_shopper_searches.pause_checkpoint IS
'Estado detalhado do checkpoint em JSON. Inclui: processed_dates, current_date_batch, bundle_progress, etc.';

COMMENT ON COLUMN rate_shopper_searches.paused_at IS
'Timestamp de quando a busca foi pausada.';

COMMENT ON COLUMN rate_shopper_searches.pause_reason IS
'Razão do pause: MANUAL_USER (usuário), AUTO_ERROR (erro recuperável), AUTO_SYSTEM (sistema), etc.';

-- ============================================
-- 5. FUNÇÕES HELPER PARA CHECKPOINT (REMOVIDAS)
-- ============================================

-- As funções helper foram removidas devido a problemas de compatibilidade
-- com o driver Node.js PostgreSQL. A lógica será implementada diretamente
-- no código da aplicação Node.js

-- ============================================
-- 6. VIEW PARA BUSCAS PAUSADAS
-- ============================================

-- View para facilitar consultas de buscas pausadas
CREATE OR REPLACE VIEW rate_shopper_paused_searches AS
SELECT
    rs.*,
    rsp.property_name,
    rsp.platform,
    h.name as hotel_name,
    -- Calcular dias restantes para processar
    (rs.end_date - COALESCE(rs.last_processed_date, rs.start_date)) as days_remaining,
    -- Calcular progresso até o pause
    CASE
        WHEN rs.total_dates > 0 THEN
            ROUND((rs.processed_dates::DECIMAL / rs.total_dates::DECIMAL) * 100, 2)
        ELSE 0
    END as progress_percentage_at_pause
FROM rate_shopper_searches rs
LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
LEFT JOIN hotels h ON rs.hotel_id = h.id
WHERE rs.status = 'PAUSED';

-- Comentário na view
COMMENT ON VIEW rate_shopper_paused_searches IS
'View com informações completas de buscas pausadas, incluindo progresso e dias restantes.';

-- ============================================
-- 7. MIGRAÇÃO DE DADOS EXISTENTES (REMOVIDA)
-- ============================================

-- A migração de dados existentes foi removida por segurança.
-- Se necessário, pode ser executada manualmente após análise dos dados.

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================