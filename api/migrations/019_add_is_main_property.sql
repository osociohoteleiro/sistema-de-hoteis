-- ============================================
-- RATE SHOPPER - ADICIONAR PROPRIEDADE PRINCIPAL
-- ============================================
-- Migração: 019 - Adicionar campo is_main_property
-- Data: 2025-01-06
-- Descrição: Adiciona campo para identificar propriedade principal do hotel

-- Adicionar coluna is_main_property na tabela rate_shopper_properties
ALTER TABLE rate_shopper_properties 
ADD COLUMN IF NOT EXISTS is_main_property BOOLEAN DEFAULT FALSE;

-- Criar índice para otimizar consultas por propriedade principal
CREATE INDEX IF NOT EXISTS idx_rsp_is_main_property ON rate_shopper_properties (hotel_id, is_main_property);

-- Comentário da coluna
COMMENT ON COLUMN rate_shopper_properties.is_main_property IS 'Indica se esta propriedade é a principal do hotel selecionado';

-- Constraint para garantir que apenas uma propriedade seja principal por hotel
-- (removido para permitir flexibilidade, será controlado pela aplicação)

-- ============================================
-- FUNCTION PARA CONTROLAR PROPRIEDADE PRINCIPAL
-- ============================================

-- Function para garantir apenas uma propriedade principal por hotel
CREATE OR REPLACE FUNCTION ensure_single_main_property()
RETURNS TRIGGER AS $$
BEGIN
    -- Se está sendo definida como principal (TRUE)
    IF NEW.is_main_property = TRUE AND OLD.is_main_property = FALSE THEN
        -- Desativar todas as outras propriedades principais do mesmo hotel
        UPDATE rate_shopper_properties 
        SET is_main_property = FALSE 
        WHERE hotel_id = NEW.hotel_id 
          AND id != NEW.id 
          AND is_main_property = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para executar a função
DROP TRIGGER IF EXISTS ensure_single_main_property_trigger ON rate_shopper_properties;
CREATE TRIGGER ensure_single_main_property_trigger 
    BEFORE UPDATE ON rate_shopper_properties
    FOR EACH ROW EXECUTE FUNCTION ensure_single_main_property();