-- Migration: 017_site_hoteleiro_tables.sql
-- Cria tabelas para o módulo SAAS de sites hoteleiros
-- Data: 2025-09-05

-- Sites dos Hotéis
CREATE TABLE hotel_sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_uuid VARCHAR(36) DEFAULT (UUID()) UNIQUE,
    hotel_id INT NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    custom_domain VARCHAR(255),
    theme_id INT,
    settings JSON,
    seo_config JSON,
    analytics_config JSON,
    published_at TIMESTAMP NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'MAINTENANCE') DEFAULT 'DRAFT',
    plan_type ENUM('STARTER', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE') DEFAULT 'STARTER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_subdomain (subdomain),
    INDEX idx_custom_domain (custom_domain),
    INDEX idx_status (status),
    INDEX idx_plan_type (plan_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Páginas do Site
CREATE TABLE site_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_uuid VARCHAR(36) DEFAULT (UUID()) UNIQUE,
    site_id INT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    meta_description TEXT,
    content_blocks JSON,
    template VARCHAR(100),
    layout_config JSON,
    is_homepage BOOLEAN DEFAULT FALSE,
    is_system_page BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    status ENUM('DRAFT', 'PUBLISHED') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES hotel_sites(id) ON DELETE CASCADE,
    UNIQUE KEY unique_site_slug (site_id, slug),
    INDEX idx_site_id (site_id),
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_is_homepage (is_homepage),
    INDEX idx_is_system_page (is_system_page)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Temas e Templates
CREATE TABLE site_themes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    theme_uuid VARCHAR(36) DEFAULT (UUID()) UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    thumbnail_url VARCHAR(500),
    preview_url VARCHAR(500),
    config JSON,
    styles JSON,
    components JSON,
    is_premium BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_premium (is_premium),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reservas via Site
CREATE TABLE site_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_uuid VARCHAR(36) DEFAULT (UUID()) UNIQUE,
    site_id INT NOT NULL,
    hotel_id INT NOT NULL,
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    rooms JSON,
    total_amount DECIMAL(10,2),
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    confirmation_code VARCHAR(20) UNIQUE,
    special_requests TEXT,
    source VARCHAR(50) DEFAULT 'WEBSITE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES hotel_sites(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_site_id (site_id),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_confirmation_code (confirmation_code),
    INDEX idx_check_in (check_in),
    INDEX idx_check_out (check_out),
    INDEX idx_payment_status (payment_status),
    INDEX idx_guest_email (guest_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mídia do Site
CREATE TABLE site_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    media_uuid VARCHAR(36) DEFAULT (UUID()) UNIQUE,
    site_id INT NOT NULL,
    hotel_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    type ENUM('IMAGE', 'VIDEO', 'DOCUMENT') DEFAULT 'IMAGE',
    alt_text VARCHAR(255),
    folder VARCHAR(100),
    size INT,
    dimensions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES hotel_sites(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_site_id (site_id),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_type (type),
    INDEX idx_folder (folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics
CREATE TABLE site_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    date DATE NOT NULL,
    page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    bookings_count INT DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    revenue DECIMAL(10,2),
    top_pages JSON,
    traffic_sources JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES hotel_sites(id) ON DELETE CASCADE,
    UNIQUE KEY unique_site_date (site_id, date),
    INDEX idx_site_id (site_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir temas padrão
INSERT INTO site_themes (name, category, thumbnail_url, config, styles, components, is_premium, price) VALUES
(
    'Hotel Elegante',
    'luxury',
    '/themes/elegante/thumbnail.jpg',
    '{"primaryColor": "#1a365d", "secondaryColor": "#e2e8f0", "fontFamily": "Inter"}',
    '{"headerHeight": "80px", "borderRadius": "8px", "shadows": true}',
    '["hero", "gallery", "rooms", "contact", "booking"]',
    false,
    0.00
),
(
    'Resort Tropical',
    'resort',
    '/themes/tropical/thumbnail.jpg',
    '{"primaryColor": "#0891b2", "secondaryColor": "#fef3c7", "fontFamily": "Poppins"}',
    '{"headerHeight": "90px", "borderRadius": "12px", "shadows": false}',
    '["hero", "gallery", "amenities", "activities", "contact", "booking"]',
    false,
    0.00
),
(
    'Boutique Moderno',
    'boutique',
    '/themes/boutique/thumbnail.jpg',
    '{"primaryColor": "#7c3aed", "secondaryColor": "#f3f4f6", "fontFamily": "Montserrat"}',
    '{"headerHeight": "70px", "borderRadius": "4px", "shadows": true}',
    '["hero", "gallery", "about", "rooms", "restaurant", "contact", "booking"]',
    true,
    99.00
);

-- Adicionar constraint para a FK theme_id
ALTER TABLE hotel_sites ADD CONSTRAINT fk_site_theme 
    FOREIGN KEY (theme_id) REFERENCES site_themes(id) ON DELETE SET NULL;