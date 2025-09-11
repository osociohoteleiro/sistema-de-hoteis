-- Migration: 017_site_hoteleiro_tables_postgres.sql
-- Cria tabelas para o módulo SAAS de sites hoteleiros - PostgreSQL
-- Data: 2025-09-05

-- Sites dos Hotéis
CREATE TABLE hotel_sites (
    id SERIAL PRIMARY KEY,
    site_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    hotel_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    custom_domain VARCHAR(255),
    description TEXT,
    theme_id INT,
    settings JSONB,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    seo_config JSONB,
    analytics_config JSONB,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    plan_type VARCHAR(20) DEFAULT 'STARTER' CHECK (plan_type IN ('STARTER', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Páginas dos Sites
CREATE TABLE site_pages (
    id SERIAL PRIMARY KEY,
    site_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content JSONB, -- Armazena blocos de conteúdo em formato JSON
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_homepage BOOLEAN DEFAULT FALSE,
    is_system_page BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES hotel_sites(id) ON DELETE CASCADE,
    UNIQUE(site_id, slug)
);

-- Temas para Sites
CREATE TABLE site_themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) CHECK (category IN ('luxury', 'resort', 'boutique', 'business', 'budget', 'eco', 'urban', 'beach')),
    thumbnail_url TEXT,
    preview_url TEXT,
    config JSONB, -- Configurações do tema (cores, fontes, etc)
    styles JSONB, -- Estilos CSS personalizados
    components JSONB, -- Componentes disponíveis no tema
    is_premium BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservas através do Site
CREATE TABLE site_bookings (
    id SERIAL PRIMARY KEY,
    site_id INT NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INT DEFAULT 1,
    room_type VARCHAR(100),
    special_requests TEXT,
    total_amount DECIMAL(10,2),
    booking_status VARCHAR(20) DEFAULT 'PENDING' CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    confirmation_code VARCHAR(20) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES hotel_sites(id) ON DELETE CASCADE
);

-- Mídia dos Sites
CREATE TABLE site_media (
    id SERIAL PRIMARY KEY,
    site_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INT,
    file_path TEXT NOT NULL,
    alt_text TEXT,
    caption TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES hotel_sites(id) ON DELETE CASCADE
);

-- Analytics dos Sites
CREATE TABLE site_analytics (
    id SERIAL PRIMARY KEY,
    site_id INT NOT NULL,
    page_url VARCHAR(500),
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    session_id VARCHAR(100),
    event_type VARCHAR(50) DEFAULT 'page_view' CHECK (event_type IN ('page_view', 'form_submit', 'booking_started', 'booking_completed', 'contact_form')),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES hotel_sites(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_hotel_sites_hotel_id ON hotel_sites(hotel_id);
CREATE INDEX idx_hotel_sites_subdomain ON hotel_sites(subdomain);
CREATE INDEX idx_hotel_sites_published ON hotel_sites(published);
CREATE INDEX idx_site_pages_site_id ON site_pages(site_id);
CREATE INDEX idx_site_pages_slug ON site_pages(slug);
CREATE INDEX idx_site_bookings_site_id ON site_bookings(site_id);
CREATE INDEX idx_site_bookings_status ON site_bookings(booking_status);
CREATE INDEX idx_site_analytics_site_id ON site_analytics(site_id);
CREATE INDEX idx_site_analytics_date ON site_analytics(created_at);

-- Inserir temas padrão
INSERT INTO site_themes (name, category, is_premium, config, styles, components) VALUES
('Hotel Clássico', 'business', false, 
 '{"primaryColor": "#2563eb", "secondaryColor": "#64748b", "fontFamily": "Inter"}',
 '{"headerHeight": "80px", "borderRadius": "8px"}',
 '["hero", "rooms", "gallery", "contact", "booking"]'
),
('Resort Paradise', 'resort', false,
 '{"primaryColor": "#059669", "secondaryColor": "#fbbf24", "fontFamily": "Poppins"}', 
 '{"headerHeight": "90px", "borderRadius": "12px"}',
 '["hero", "rooms", "amenities", "gallery", "contact", "booking", "testimonials"]'
),
('Boutique Elegante', 'boutique', true,
 '{"primaryColor": "#7c3aed", "secondaryColor": "#f59e0b", "fontFamily": "Playfair Display"}',
 '{"headerHeight": "70px", "borderRadius": "4px"}', 
 '["hero", "rooms", "gallery", "restaurant", "spa", "contact", "booking"]'
);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hotel_sites_updated_at BEFORE UPDATE ON hotel_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_pages_updated_at BEFORE UPDATE ON site_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_themes_updated_at BEFORE UPDATE ON site_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_bookings_updated_at BEFORE UPDATE ON site_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();