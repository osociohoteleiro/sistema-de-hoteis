-- Migration: Create app_configurations table for managing multiple applications branding
-- Description: Table to store logo and name configurations for each application (hotel-app, pms, automacao, site-hoteleiro)

CREATE TABLE IF NOT EXISTS app_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT,
    app_name ENUM('hotel-app', 'pms', 'automacao', 'site-hoteleiro') NOT NULL,
    app_title VARCHAR(255) DEFAULT NULL COMMENT 'Custom title/name for the application',
    logo_url TEXT DEFAULT NULL COMMENT 'URL of the logo image for this application',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this configuration is active',
    shared_from_app ENUM('hotel-app', 'pms', 'automacao', 'site-hoteleiro') DEFAULT NULL COMMENT 'If logo is shared from another app',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate configurations for the same app and hotel
    UNIQUE KEY unique_hotel_app (hotel_id, app_name),
    
    -- Index for better performance
    INDEX idx_hotel_app (hotel_id, app_name),
    INDEX idx_app_name (app_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores branding configurations for different applications';

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
ON DUPLICATE KEY UPDATE 
    app_title = VALUES(app_title),
    updated_at = CURRENT_TIMESTAMP;