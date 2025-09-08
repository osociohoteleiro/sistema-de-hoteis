-- Adiciona coluna platform à tabela rate_shopper_properties
-- Migration: 021_add_platform_to_rate_shopper_properties.sql

-- Adicionar coluna platform
ALTER TABLE rate_shopper_properties 
ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'booking';

-- Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_rate_shopper_properties_platform 
ON rate_shopper_properties(platform);

-- Atualizar registros existentes baseado na URL
-- Para URLs com artaxnet, definir como 'artaxnet'
UPDATE rate_shopper_properties 
SET platform = 'artaxnet' 
WHERE LOWER(booking_url) LIKE '%artaxnet%';

-- Para URLs com booking.com, definir como 'booking'
UPDATE rate_shopper_properties 
SET platform = 'booking' 
WHERE LOWER(booking_url) LIKE '%booking.com%';

-- Adicionar constraint para garantir valores válidos
ALTER TABLE rate_shopper_properties 
ADD CONSTRAINT check_platform_values 
CHECK (platform IN ('booking', 'artaxnet'));

-- Comentar a coluna
COMMENT ON COLUMN rate_shopper_properties.platform 
IS 'Plataforma de reserva: booking (Booking.com) ou artaxnet (Artaxnet)';

-- Log da migration
INSERT INTO migration_log (
    migration_id, 
    description, 
    applied_at
) VALUES (
    '021', 
    'Add platform column to rate_shopper_properties table for multi-platform support', 
    NOW()
) ON CONFLICT (migration_id) DO NOTHING;