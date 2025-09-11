-- Migration: Alter app_configurations table to use hotel_uuid instead of hotel_id
-- Description: Convert hotel_id (INTEGER) to hotel_uuid (UUID) for consistency across the application

-- Step 1: Add the new hotel_uuid column
ALTER TABLE app_configurations ADD COLUMN hotel_uuid UUID;

-- Step 2: Update existing records to use hotel UUID instead of hotel ID
-- First, we need to populate the hotel_uuid for existing records
UPDATE app_configurations 
SET hotel_uuid = h.hotel_uuid 
FROM hotels h 
WHERE app_configurations.hotel_id = h.id AND app_configurations.hotel_id IS NOT NULL;

-- Step 3: Drop the old constraint and index before removing hotel_id
ALTER TABLE app_configurations DROP CONSTRAINT IF EXISTS app_configurations_hotel_id_app_name_key;
DROP INDEX IF EXISTS idx_app_configurations_hotel_app;

-- Step 4: Drop the old hotel_id column
ALTER TABLE app_configurations DROP COLUMN hotel_id;

-- Step 5: Add new unique constraint using hotel_uuid
ALTER TABLE app_configurations ADD CONSTRAINT app_configurations_hotel_uuid_app_name_key 
UNIQUE (hotel_uuid, app_name);

-- Step 6: Create new indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_configurations_hotel_uuid_app ON app_configurations(hotel_uuid, app_name);
CREATE INDEX IF NOT EXISTS idx_app_configurations_hotel_uuid ON app_configurations(hotel_uuid);

-- Step 7: Add favicon_url column if it doesn't exist (from the model we saw)
ALTER TABLE app_configurations ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT NULL;
ALTER TABLE app_configurations ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- Step 8: Insert/update global configurations for NULL hotel_uuid (system-wide configs)
INSERT INTO app_configurations (hotel_uuid, app_name, app_title, logo_url, favicon_url, description, is_active) 
VALUES 
    (NULL, 'hotel-app', 'OSH - Sistema Principal', NULL, NULL, 'Sistema principal de gestão hoteleira', TRUE),
    (NULL, 'pms', 'OSH - PMS', NULL, NULL, 'Sistema de gestão de propriedades', TRUE),
    (NULL, 'automacao', 'OSH - Automação', NULL, NULL, 'Sistema de automação e chatbots', TRUE),
    (NULL, 'site-hoteleiro', 'OSH - Site Hoteleiro', NULL, NULL, 'Construtor de sites para hotéis', TRUE)
ON CONFLICT (hotel_uuid, app_name) DO UPDATE SET 
    app_title = EXCLUDED.app_title,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- Step 9: Update trigger to work with the new structure
DROP TRIGGER IF EXISTS update_app_configurations_updated_at ON app_configurations;
CREATE TRIGGER update_app_configurations_updated_at
    BEFORE UPDATE ON app_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();