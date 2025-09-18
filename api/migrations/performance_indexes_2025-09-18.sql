-- ============================================
-- ÍNDICES COMPOSTOS PARA OTIMIZAÇÃO DE PERFORMANCE
-- Criado em: 2025-09-18
-- Objetivo: Otimizar queries de relacionamentos User→Hotel→Workspace
-- ============================================

-- Índices compostos para user_hotels (relacionamento crítico)
CREATE INDEX IF NOT EXISTS idx_user_hotels_user_active ON user_hotels(user_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_user_hotels_hotel_active ON user_hotels(hotel_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_user_hotels_user_hotel_active ON user_hotels(user_id, hotel_id, active) WHERE active = true;

-- Índices compostos para workspaces
CREATE INDEX IF NOT EXISTS idx_workspaces_hotel_active ON workspaces(hotel_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_workspaces_hotel_uuid_active ON workspaces(hotel_uuid, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_workspaces_active_created ON workspaces(active, created_at DESC) WHERE active = true;

-- Índices compostos para bots
CREATE INDEX IF NOT EXISTS idx_bots_workspace_active ON bots(workspace_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_bots_workspace_uuid_active ON bots(workspace_uuid, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_bots_hotel_active ON bots(hotel_id, active) WHERE active = true;

-- Índices compostos para workspace_instances
CREATE INDEX IF NOT EXISTS idx_workspace_instances_workspace_created ON workspace_instances(workspace_uuid, created_at DESC);

-- Índices para queries de pesquisa (search)
CREATE INDEX IF NOT EXISTS idx_workspaces_name_search ON workspaces USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_workspaces_description_search ON workspaces USING gin(description gin_trgm_ops);

-- Índices para otimizar JOINs frequentes
CREATE INDEX IF NOT EXISTS idx_hotels_uuid_status ON hotels(hotel_uuid, status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_users_uuid_active ON users(uuid, active) WHERE active = true;

-- Índice para otimizar contagem de workspaces por hotel
CREATE INDEX IF NOT EXISTS idx_workspaces_hotel_count ON workspaces(hotel_id) WHERE active = true;

-- Índice para otimizar busca de workspace padrão
CREATE INDEX IF NOT EXISTS idx_workspaces_hotel_default ON workspaces(hotel_id) WHERE active = true AND settings @> '{"isDefault": true}';

-- ============================================
-- ANÁLISE DE PERFORMANCE
-- ============================================

-- Comando para analisar estatísticas das tabelas (executar após criar índices)
-- ANALYZE user_hotels, workspaces, bots, hotels, users, workspace_instances;

-- ============================================
-- CONSULTAS PARA MONITORAMENTO
-- ============================================

-- Verificar uso dos índices criados:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE indexname LIKE 'idx_%'
-- ORDER BY idx_scan DESC;

-- Verificar tamanho dos índices:
-- SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) as size
-- FROM pg_indexes
-- WHERE indexname LIKE 'idx_%'
-- ORDER BY pg_relation_size(indexname::regclass) DESC;