-- Migration para o SaaS de Site Hoteleiro
-- Criação das tabelas para o construtor de sites

-- Tabela de templates de sites
CREATE TABLE IF NOT EXISTS site_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- luxury, boutique, business, beach, etc.
    description TEXT,
    preview_image TEXT, -- URL da imagem de preview
    html_structure JSONB NOT NULL, -- Estrutura HTML do template
    css_styles JSONB NOT NULL, -- Estilos CSS do template
    default_content JSONB NOT NULL, -- Conteúdo padrão (textos, imagens)
    features JSONB DEFAULT '[]'::jsonb, -- Array de features do template
    is_premium BOOLEAN DEFAULT false,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de sites dos hotéis
CREATE TABLE IF NOT EXISTS hotel_sites (
    id SERIAL PRIMARY KEY,
    site_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    hotel_id INT REFERENCES hotels(id) ON DELETE CASCADE,
    template_id INT REFERENCES site_templates(id),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE, -- subdominio.sitehoteleiro.com
    custom_domain VARCHAR(255), -- dominio personalizado opcional
    description TEXT,
    
    -- Conteúdo personalizado do site
    content JSONB DEFAULT '{}'::jsonb, -- Conteúdo editado pelo usuário
    settings JSONB DEFAULT '{}'::jsonb, -- Configurações gerais
    
    -- SEO
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    seo_config JSONB DEFAULT '{}'::jsonb,
    
    -- Analytics e Configurações
    analytics_config JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    published BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    
    -- Plano e billing
    plan_type VARCHAR(50) DEFAULT 'free', -- free, basic, premium
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de mídia dos sites
CREATE TABLE IF NOT EXISTS site_media (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES hotel_sites(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- caminho no servidor/S3
    file_url TEXT NOT NULL, -- URL pública
    file_type VARCHAR(50) NOT NULL, -- image, video, document
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL, -- tamanho em bytes
    width INT, -- para imagens
    height INT, -- para imagens
    alt_text VARCHAR(255),
    caption TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de páginas dos sites (para sites multi-página)
CREATE TABLE IF NOT EXISTS site_pages (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES hotel_sites(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL, -- sobre, quartos, contato, etc.
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL, -- Conteúdo da página
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(site_id, slug)
);

-- Tabela de formulários de contato/reserva
CREATE TABLE IF NOT EXISTS site_form_submissions (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES hotel_sites(id) ON DELETE CASCADE,
    form_type VARCHAR(50) NOT NULL, -- contact, reservation, newsletter
    form_data JSONB NOT NULL, -- dados do formulário
    visitor_ip INET,
    user_agent TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'new', -- new, read, replied
    notes TEXT
);

-- Inserir templates padrão
INSERT INTO site_templates (name, category, description, preview_image, html_structure, css_styles, default_content, features, is_premium, price) VALUES 

-- Template 1: Resort de Luxo
('Resort de Luxo', 'luxury', 'Design elegante para resorts de alto padrão com cores douradas e layout sofisticado.', 
'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
'{"sections": ["hero", "about", "rooms", "amenities", "gallery", "contact"], "layout": "luxury"}',
'{"primary_color": "#D4AF37", "secondary_color": "#1A1A1A", "font_family": "Playfair Display"}',
'{"hero_title": "Bem-vindo ao Paraíso", "hero_subtitle": "Uma experiência única de luxo e conforto", "about_text": "Nosso resort oferece a mais requintada experiência em hospedagem de luxo."}',
'["Galeria Premium", "Reservas Online", "Concierge Digital", "Spa & Wellness"]',
true, 199.90),

-- Template 2: Hotel Boutique
('Hotel Boutique', 'boutique', 'Template exclusivo para hotéis boutique com design minimalista e elegante.',
'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
'{"sections": ["hero", "story", "rooms", "experiences", "gallery", "contact"], "layout": "boutique"}',
'{"primary_color": "#8B4513", "secondary_color": "#F5F5DC", "font_family": "Montserrat"}',
'{"hero_title": "Hotel Boutique Exclusivo", "hero_subtitle": "Onde cada detalhe conta uma história", "story_text": "Um refúgio urbano que combina design contemporâneo com charme local."}',
'["Design Personalizado", "História Local", "Experiências Únicas", "Arte Local"]',
false, 0.00),

-- Template 3: Hotel Executivo
('Hotel Executivo', 'business', 'Perfeito para hotéis de negócios com foco em produtividade e conveniência.',
'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
'{"sections": ["hero", "business", "rooms", "facilities", "meeting", "contact"], "layout": "business"}',
'{"primary_color": "#2C3E50", "secondary_color": "#3498DB", "font_family": "Open Sans"}',
'{"hero_title": "Hotel Executivo", "hero_subtitle": "Sua base para negócios de sucesso", "business_text": "Instalações modernas e serviços especializados para o executivo moderno."}',
'["Centro de Negócios", "Salas de Reunião", "Wi-Fi Premium", "Serviço Express"]',
false, 0.00),

-- Template 4: Hotel de Praia
('Hotel de Praia', 'beach', 'Ideal para hotéis à beira-mar com cores tropicais e atmosfera relaxante.',
'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop',
'{"sections": ["hero", "beach", "rooms", "activities", "restaurant", "contact"], "layout": "beach"}',
'{"primary_color": "#20B2AA", "secondary_color": "#F4A460", "font_family": "Poppins"}',
'{"hero_title": "Paraíso Tropical", "hero_subtitle": "Onde o mar encontra o conforto", "beach_text": "Desfrute de dias perfeitos em frente ao mar com todo conforto e comodidade."}',
'["Vista para o Mar", "Esportes Aquáticos", "Beach Club", "Piscina Infinita"]',
false, 0.00);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_hotel_sites_hotel_id ON hotel_sites(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_sites_subdomain ON hotel_sites(subdomain);
CREATE INDEX IF NOT EXISTS idx_hotel_sites_published ON hotel_sites(published);
CREATE INDEX IF NOT EXISTS idx_site_media_site_id ON site_media(site_id);
CREATE INDEX IF NOT EXISTS idx_site_pages_site_id ON site_pages(site_id);
CREATE INDEX IF NOT EXISTS idx_site_form_submissions_site_id ON site_form_submissions(site_id);
CREATE INDEX IF NOT EXISTS idx_site_templates_category ON site_templates(category);
CREATE INDEX IF NOT EXISTS idx_site_templates_active ON site_templates(is_active);

-- Comentários
COMMENT ON TABLE site_templates IS 'Templates de sites disponíveis para os hotéis';
COMMENT ON TABLE hotel_sites IS 'Sites criados pelos hotéis usando os templates';
COMMENT ON TABLE site_media IS 'Arquivos de mídia (imagens, vídeos) dos sites';
COMMENT ON TABLE site_pages IS 'Páginas individuais dos sites (sobre, contato, etc.)';
COMMENT ON TABLE site_form_submissions IS 'Formulários enviados através dos sites';