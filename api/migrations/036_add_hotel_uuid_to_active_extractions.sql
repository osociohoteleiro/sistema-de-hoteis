-- ============================================
-- ACTIVE EXTRACTIONS - ADICIONAR COLUNA HOTEL_UUID
-- ============================================
-- Migração: 036 - Adicionar coluna hotel_uuid para compatibilidade com novo sistema
-- Data: 2025-09-17
-- Descrição: Adicionar coluna hotel_uuid na tabela active_extractions para suporte completo a UUIDs

-- ============================================
-- VERIFICAR E ADICIONAR COLUNA HOTEL_UUID
-- ============================================

-- Adicionar coluna hotel_uuid se não existir
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'active_extractions'
        AND column_name = 'hotel_uuid'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE active_extractions
        ADD COLUMN hotel_uuid VARCHAR(36);

        -- Popular com UUIDs dos hotéis existentes baseado no hotel_id
        UPDATE active_extractions
        SET hotel_uuid = h.hotel_uuid
        FROM hotels h
        WHERE active_extractions.hotel_id = h.id
        AND active_extractions.hotel_uuid IS NULL;

        -- Tornar a coluna NOT NULL após popular
        ALTER TABLE active_extractions
        ALTER COLUMN hotel_uuid SET NOT NULL;

        -- Adicionar constraint UNIQUE
        ALTER TABLE active_extractions
        ADD CONSTRAINT unique_hotel_uuid UNIQUE (hotel_uuid);

        RAISE NOTICE 'Coluna hotel_uuid adicionada à tabela active_extractions';
    ELSE
        RAISE NOTICE 'Coluna hotel_uuid já existe na tabela active_extractions';
    END IF;
END
$$;

-- ============================================
-- CRIAR ÍNDICES PARA OTIMIZAÇÃO
-- ============================================

-- Índice para busca por hotel_uuid
CREATE INDEX IF NOT EXISTS idx_active_extractions_hotel_uuid
ON active_extractions(hotel_uuid);

-- Índice composto para status e hotel_uuid
CREATE INDEX IF NOT EXISTS idx_active_extractions_status_hotel_uuid
ON active_extractions(status, hotel_uuid);

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN active_extractions.hotel_uuid IS
'UUID do hotel - chave primária para identificação única em todo sistema.';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================