-- Migration: Create app_configurations table for managing multiple applications branding (PostgreSQL)
-- Description: Table to store logo and name configurations for each application (hotel-app, pms, automacao, site-hoteleiro)

CREATE TABLE IF NOT EXISTS app_configurations (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER,
    app_name VARCHAR(50) CHECK (app_name IN ('hotel-app', 'pms', 'automacao', 'site-hoteleiro')) NOT NULL,
    app_title VARCHAR(255) DEFAULT NULL,
    logo_url TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    shared_from_app VARCHAR(50) CHECK (shared_from_app IN ('hotel-app', 'pms', 'automacao', 'site-hoteleiro')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint (assumindo que existe tabela hotels)
    -- FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate configurations for the same app and hotel
    UNIQUE (hotel_id, app_name)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_app_configurations_hotel_app ON app_configurations(hotel_id, app_name);
CREATE INDEX IF NOT EXISTS idx_app_configurations_app_name ON app_configurations(app_name);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_app_configurations_updated_at ON app_configurations;
CREATE TRIGGER update_app_configurations_updated_at
    BEFORE UPDATE ON app_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default configurations for existing hotels
INSERT INTO app_configurations (hotel_id, app_name, app_title, logo_url, is_active) 
SELECT 
    h.id,
    'hotel-app' as app_name,
    CONCAT(h.name, ' - Sistema') as app_title,
    NULL as logo_url,
    TRUE as is_active
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM app_configurations ac 
    WHERE ac.hotel_id = h.id AND ac.app_name = 'hotel-app'
);

INSERT INTO app_configurations (hotel_id, app_name, app_title, logo_url, is_active) 
SELECT 
    h.id,
    'pms' as app_name,
    CONCAT(h.name, ' - PMS') as app_title,
    NULL as logo_url,
    TRUE as is_active
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM app_configurations ac 
    WHERE ac.hotel_id = h.id AND ac.app_name = 'pms'
);

INSERT INTO app_configurations (hotel_id, app_name, app_title, logo_url, is_active) 
SELECT 
    h.id,
    'automacao' as app_name,
    CONCAT(h.name, ' - Automação') as app_title,
    NULL as logo_url,
    TRUE as is_active
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM app_configurations ac 
    WHERE ac.hotel_id = h.id AND ac.app_name = 'automacao'
);

INSERT INTO app_configurations (hotel_id, app_name, app_title, logo_url, is_active) 
SELECT 
    h.id,
    'site-hoteleiro' as app_name,
    CONCAT(h.name, ' - Site') as app_title,
    NULL as logo_url,
    TRUE as is_active
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM app_configurations ac 
    WHERE ac.hotel_id = h.id AND ac.app_name = 'site-hoteleiro'
);

-- Add global configurations (when hotel_id is NULL)
INSERT INTO app_configurations (hotel_id, app_name, app_title, logo_url, is_active) 
VALUES 
    (NULL, 'hotel-app', 'OSH - Sistema de Hotéis', NULL, TRUE),
    (NULL, 'pms', 'OSH - PMS', NULL, TRUE),
    (NULL, 'automacao', 'OSH - Automação', NULL, TRUE),
    (NULL, 'site-hoteleiro', 'OSH - Site Hoteleiro', NULL, TRUE)
ON CONFLICT (hotel_id, app_name) DO UPDATE SET 
    app_title = EXCLUDED.app_title,
    updated_at = CURRENT_TIMESTAMP;