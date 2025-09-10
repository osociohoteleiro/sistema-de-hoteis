-- EXPORT DO BANCO LOCAL OSH

-- Gerado automaticamente em 2025-09-10T20:14:47.928Z



-- Remover tabelas existentes

DROP TABLE IF EXISTS user_permissions CASCADE;

DROP TABLE IF EXISTS user_hotels CASCADE;

DROP TABLE IF EXISTS site_analytics CASCADE;

DROP TABLE IF EXISTS site_bookings CASCADE;

DROP TABLE IF EXISTS site_form_submissions CASCADE;

DROP TABLE IF EXISTS site_media CASCADE;

DROP TABLE IF EXISTS site_pages CASCADE;

DROP TABLE IF EXISTS site_templates CASCADE;

DROP TABLE IF EXISTS site_themes CASCADE;

DROP TABLE IF EXISTS hotel_sites CASCADE;

DROP TABLE IF EXISTS rate_shopper_alert_history CASCADE;

DROP TABLE IF EXISTS rate_shopper_alerts CASCADE;

DROP TABLE IF EXISTS rate_shopper_configs CASCADE;

DROP TABLE IF EXISTS rate_shopper_price_history CASCADE;

DROP TABLE IF EXISTS rate_shopper_prices CASCADE;

DROP TABLE IF EXISTS rate_shopper_properties CASCADE;

DROP TABLE IF EXISTS rate_shopper_queue CASCADE;

DROP TABLE IF EXISTS rate_shopper_reports CASCADE;

DROP TABLE IF EXISTS rate_shopper_searches CASCADE;

DROP TABLE IF EXISTS meta_available_accounts CASCADE;

DROP TABLE IF EXISTS meta_connected_accounts CASCADE;

DROP TABLE IF EXISTS meta_sync_logs CASCADE;

DROP TABLE IF EXISTS oauth_states CASCADE;

DROP TABLE IF EXISTS logo_history CASCADE;

DROP TABLE IF EXISTS bot_fields CASCADE;

DROP TABLE IF EXISTS onenode_bot_fields CASCADE;

DROP TABLE IF EXISTS flows CASCADE;

DROP TABLE IF EXISTS bots CASCADE;

DROP TABLE IF EXISTS folders CASCADE;

DROP TABLE IF EXISTS workspaces CASCADE;

DROP TABLE IF EXISTS app_config CASCADE;

DROP TABLE IF EXISTS app_configurations CASCADE;

DROP TABLE IF EXISTS hotels CASCADE;

DROP TABLE IF EXISTS users CASCADE;

-- Habilitar extensões necessárias

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CRIAÇÃO DAS TABELAS

CREATE TABLE app_config (
    id INTEGER NOT NULL,
    hotel_id INTEGER,
    config_key VARCHAR(255) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'STRING'::character varying,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE app_config ADD PRIMARY KEY (id);

CREATE TABLE app_configurations (
    id INTEGER NOT NULL,
    hotel_id UUID,
    app_name VARCHAR(50) NOT NULL,
    app_title VARCHAR(255) DEFAULT NULL::character varying,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    shared_from_app VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    favicon_url TEXT,
    description TEXT
);

ALTER TABLE app_configurations ADD PRIMARY KEY (id);

CREATE TABLE bot_fields (
    id INTEGER NOT NULL,
    hotel_id INTEGER,
    field_key VARCHAR(255) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(20) DEFAULT 'STRING'::character varying,
    category VARCHAR(100),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE bot_fields ADD PRIMARY KEY (id);

CREATE TABLE bots (
    id INTEGER NOT NULL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id INTEGER NOT NULL,
    workspace_uuid UUID NOT NULL,
    hotel_id INTEGER NOT NULL,
    hotel_uuid UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bot_type VARCHAR(50) DEFAULT 'CHATBOT'::character varying,
    status VARCHAR(20) DEFAULT 'DRAFT'::character varying,
    configuration JSONB,
    settings JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bots ADD PRIMARY KEY (id);

CREATE TABLE flows (
    id INTEGER NOT NULL,
    flow_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    bot_id INTEGER NOT NULL,
    bot_uuid UUID NOT NULL,
    workspace_id INTEGER NOT NULL,
    workspace_uuid UUID NOT NULL,
    hotel_id INTEGER NOT NULL,
    hotel_uuid UUID NOT NULL,
    folder_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    flow_type VARCHAR(20) DEFAULT 'CONVERSATION'::character varying,
    status VARCHAR(20) DEFAULT 'DRAFT'::character varying,
    version VARCHAR(20) DEFAULT '1.0.0'::character varying,
    flow_data JSONB,
    variables JSONB,
    settings JSONB,
    triggers JSONB,
    priority INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE flows ADD PRIMARY KEY (id);

CREATE TABLE folders (
    id INTEGER NOT NULL,
    folder_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    bot_id INTEGER NOT NULL,
    bot_uuid UUID NOT NULL,
    workspace_id INTEGER NOT NULL,
    workspace_uuid UUID NOT NULL,
    hotel_id INTEGER NOT NULL,
    hotel_uuid UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6'::character varying,
    icon VARCHAR(50) DEFAULT 'folder'::character varying,
    parent_folder_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE folders ADD PRIMARY KEY (id);

CREATE TABLE hotel_sites (
    id INTEGER NOT NULL,
    site_uuid UUID DEFAULT gen_random_uuid(),
    hotel_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100),
    custom_domain VARCHAR(255),
    description TEXT,
    theme_id INTEGER,
    settings JSONB,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    seo_config JSONB,
    analytics_config JSONB,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    plan_type VARCHAR(20) DEFAULT 'STARTER'::character varying,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE hotel_sites ADD PRIMARY KEY (id);

CREATE TABLE hotels (
    id INTEGER NOT NULL,
    hotel_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    checkin_time TIME DEFAULT '14:00:00'::time without time zone,
    checkout_time TIME DEFAULT '12:00:00'::time without time zone,
    cover_image TEXT,
    description TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE'::character varying,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE hotels ADD PRIMARY KEY (id);

CREATE TABLE logo_history (
    id INTEGER NOT NULL,
    hotel_id INTEGER,
    logo_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE logo_history ADD PRIMARY KEY (id);

CREATE TABLE meta_available_accounts (
    id INTEGER NOT NULL,
    hotel_uuid UUID NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    account_status INTEGER DEFAULT 1,
    currency VARCHAR(10),
    business_id VARCHAR(255),
    business_name VARCHAR(255),
    is_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE meta_available_accounts ADD PRIMARY KEY (id);

CREATE TABLE meta_connected_accounts (
    id INTEGER NOT NULL,
    hotel_uuid UUID NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    access_token TEXT,
    account_status INTEGER DEFAULT 1,
    currency VARCHAR(10),
    business_id VARCHAR(255),
    business_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE meta_connected_accounts ADD PRIMARY KEY (id);

CREATE TABLE meta_sync_logs (
    id INTEGER NOT NULL,
    hotel_uuid UUID NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING'::character varying,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE meta_sync_logs ADD PRIMARY KEY (id);

CREATE TABLE oauth_states (
    id INTEGER NOT NULL,
    state VARCHAR(255) NOT NULL,
    hotel_uuid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

ALTER TABLE oauth_states ADD PRIMARY KEY (id);

CREATE TABLE onenode_bot_fields (
    id INTEGER NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    name VARCHAR(255),
    var_ns VARCHAR(32) NOT NULL,
    var_type VARCHAR(20) DEFAULT 'STRING'::character varying,
    description TEXT,
    value TEXT,
    workspace_id INTEGER,
    is_required BOOLEAN DEFAULT false,
    is_custom BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE onenode_bot_fields ADD PRIMARY KEY (id);

CREATE TABLE rate_shopper_alert_history (
    id INTEGER NOT NULL,
    alert_id INTEGER NOT NULL,
    search_id INTEGER,
    price_id INTEGER,
    triggered_value NUMERIC,
    message TEXT,
    notification_sent BOOLEAN DEFAULT false,
    notification_channels_used TEXT,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rate_shopper_alert_history ADD PRIMARY KEY (id);

CREATE TABLE rate_shopper_alerts (
    id INTEGER NOT NULL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    hotel_id INTEGER NOT NULL,
    property_id INTEGER,
    alert_name VARCHAR(255) NOT NULL,
    alert_type USER-DEFINED NOT NULL,
    condition_field VARCHAR(100) NOT NULL,
    condition_operator USER-DEFINED NOT NULL,
    condition_value NUMERIC NOT NULL,
    date_range_start DATE,
    date_range_end DATE,
    notification_channels TEXT,
    active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rate_shopper_alerts ADD PRIMARY KEY (id);

CREATE TABLE rate_shopper_configs (
    id INTEGER NOT NULL,
    hotel_id INTEGER NOT NULL,
    auto_search_enabled BOOLEAN DEFAULT false,
    search_frequency_hours INTEGER DEFAULT 8,
    date_range_days INTEGER DEFAULT 90,
    max_bundle_size INTEGER DEFAULT 7,
    notification_enabled BOOLEAN DEFAULT true,
    notification_emails TEXT,
    price_alert_threshold NUMERIC DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rate_shopper_configs ADD PRIMARY KEY (id);

CREATE TABLE rate_shopper_price_history (
    id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    hotel_id INTEGER NOT NULL,
    check_in_date DATE NOT NULL,
    current_price NUMERIC NOT NULL,
    previous_price NUMERIC,
    price_change NUMERIC DEFAULT 0,
    change_percentage NUMERIC DEFAULT 0,
    change_type USER-DEFINED DEFAULT 'NEW'::rate_shopper_price_change_type,
    search_id INTEGER,
    currency VARCHAR(3) DEFAULT 'BRL'::character varying,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rate_shopper_price_history ADD PRIMARY KEY (id);

CREATE TABLE rate_shopper_prices (
    id INTEGER NOT NULL,
    search_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    hotel_id INTEGER NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    price NUMERIC NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL'::character varying,
    room_type VARCHAR(255),
    max_guests INTEGER DEFAULT 2,
    is_bundle BOOLEAN DEFAULT false,
    bundle_size INTEGER DEFAULT 1,
    original_price NUMERIC,
    availability_status USER-DEFINED DEFAULT 'AVAILABLE'::rate_shopper_availability_status,
    extraction_method VARCHAR(50) DEFAULT 'JS_VARS'::character varying,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rate_shopper_prices ADD PRIMARY KEY (id);

CREATE TABLE rate_shopper_properties (
    id INTEGER NOT NULL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    hotel_id INTEGER NOT NULL,
    property_name VARCHAR(255) NOT NULL,
    booking_url TEXT NOT NULL,
    competitor_type USER-DEFINED DEFAULT 'OTA'::rate_shopper_competitor_type,
    ota_name VARCHAR(100) DEFAULT 'Booking.com'::character varying,
    location VARCHAR(255),
    category VARCHAR(100),
    max_bundle_size INTEGER DEFAULT 7,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_main_property BOOLEAN DEFAULT false,
    platform VARCHAR(20) DEFAULT 'booking'::character varying
);

ALTER TABLE rate_shopper_properties ADD PRIMARY KEY (id);

CREATE TABLE rate_shopper_queue (
    id INTEGER NOT NULL,
    job_id VARCHAR(100) NOT NULL,
    job_type USER-DEFINED NOT NULL,
    job_data TEXT,
    priority INTEGER DEFAULT 0,
    status USER-DEFINED DEFAULT 'PENDING'::rate_shopper_status,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rate_shopper_queue ADD PRIMARY KEY (id);

CREATE TABLE rate_shopper_reports (
    id INTEGER NOT NULL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    hotel_id INTEGER NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type USER-DEFINED NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    properties_included TEXT,
    report_data TEXT,
    file_path VARCHAR(500),
    file_type VARCHAR(10),
    status USER-DEFINED DEFAULT 'GENERATING'::rate_shopper_report_status,
    generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rate_shopper_reports ADD PRIMARY KEY (id);

CREATE TABLE rate_shopper_searches (
    id INTEGER NOT NULL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    hotel_id INTEGER NOT NULL,
    property_id INTEGER,
    search_type USER-DEFINED DEFAULT 'MANUAL'::rate_shopper_search_type,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status USER-DEFINED DEFAULT 'PENDING'::rate_shopper_status,
    total_dates INTEGER DEFAULT 0,
    processed_dates INTEGER DEFAULT 0,
    total_prices_found INTEGER DEFAULT 0,
    error_log TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rate_shopper_searches ADD PRIMARY KEY (id);

CREATE TABLE site_analytics (
    id INTEGER NOT NULL,
    site_id INTEGER NOT NULL,
    page_url VARCHAR(500),
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    session_id VARCHAR(100),
    event_type VARCHAR(50) DEFAULT 'page_view'::character varying,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE site_analytics ADD PRIMARY KEY (id);

CREATE TABLE site_bookings (
    id INTEGER NOT NULL,
    site_id INTEGER NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INTEGER DEFAULT 1,
    room_type VARCHAR(100),
    special_requests TEXT,
    total_amount NUMERIC,
    booking_status VARCHAR(20) DEFAULT 'PENDING'::character varying,
    payment_status VARCHAR(20) DEFAULT 'PENDING'::character varying,
    confirmation_code VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE site_bookings ADD PRIMARY KEY (id);

CREATE TABLE site_form_submissions (
    id INTEGER NOT NULL,
    site_id INTEGER,
    form_type VARCHAR(50) NOT NULL,
    form_data JSONB NOT NULL,
    visitor_ip INET,
    user_agent TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'new'::character varying,
    notes TEXT
);

ALTER TABLE site_form_submissions ADD PRIMARY KEY (id);

CREATE TABLE site_media (
    id INTEGER NOT NULL,
    site_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INTEGER,
    file_path TEXT NOT NULL,
    alt_text TEXT,
    caption TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE site_media ADD PRIMARY KEY (id);

CREATE TABLE site_pages (
    id INTEGER NOT NULL,
    site_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content JSONB,
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_homepage BOOLEAN DEFAULT false,
    is_system_page BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE site_pages ADD PRIMARY KEY (id);

CREATE TABLE site_templates (
    id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    preview_image TEXT,
    html_structure JSONB NOT NULL,
    css_styles JSONB NOT NULL,
    default_content JSONB NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    is_premium BOOLEAN DEFAULT false,
    price NUMERIC DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE site_templates ADD PRIMARY KEY (id);

CREATE TABLE site_themes (
    id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    thumbnail_url TEXT,
    preview_url TEXT,
    config JSONB,
    styles JSONB,
    components JSONB,
    is_premium BOOLEAN DEFAULT false,
    price NUMERIC DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE site_themes ADD PRIMARY KEY (id);

CREATE TABLE user_hotels (
    id INTEGER NOT NULL,
    user_id INTEGER,
    hotel_id INTEGER,
    role VARCHAR(50) DEFAULT 'STAFF'::character varying,
    permissions JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE user_hotels ADD PRIMARY KEY (id);

CREATE TABLE user_permissions (
    id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    permission VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_permissions ADD PRIMARY KEY (id);

CREATE TABLE users (
    id INTEGER NOT NULL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'HOTEL'::character varying,
    active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD PRIMARY KEY (id);

CREATE TABLE workspaces (
    id INTEGER NOT NULL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    hotel_id INTEGER,
    hotel_uuid UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE workspaces ADD PRIMARY KEY (id);

-- DADOS DAS TABELAS

-- Dados da tabela app_config

INSERT INTO app_config (id, hotel_id, config_key, config_value, config_type, description, created_at, updated_at) VALUES (1, NULL, 'companyName', 'OSócio Hoteleiro', 'STRING', 'Nome da empresa', '2025-08-30T21:26:26.000Z', '2025-08-30T21:26:26.000Z');

INSERT INTO app_config (id, hotel_id, config_key, config_value, config_type, description, created_at, updated_at) VALUES (2, NULL, 'logo', '', 'STRING', 'URL do logo da empresa', '2025-08-30T21:26:26.000Z', '2025-08-30T21:26:26.000Z');

INSERT INTO app_config (id, hotel_id, config_key, config_value, config_type, description, created_at, updated_at) VALUES (3, NULL, 'theme', 'dark', 'STRING', 'Tema da aplicação', '2025-08-30T21:26:26.000Z', '2025-08-30T21:26:26.000Z');

INSERT INTO app_config (id, hotel_id, config_key, config_value, config_type, description, created_at, updated_at) VALUES (4, NULL, 'version', '1.0.0', 'STRING', 'Versão do sistema', '2025-08-30T21:26:26.000Z', '2025-08-30T21:26:26.000Z');

INSERT INTO app_config (id, hotel_id, config_key, config_value, config_type, description, created_at, updated_at) VALUES (5, 2, 'test_key', 'updated_value', 'STRING', NULL, '2025-09-04T23:15:33.266Z', '2025-09-04T23:15:33.266Z');



-- Dados da tabela app_configurations

INSERT INTO app_configurations (id, hotel_id, app_name, app_title, logo_url, is_active, shared_from_app, created_at, updated_at, favicon_url, description) VALUES (31, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'pms', 'OSH PMS', 'https://hoteloshia.s3.us-east-2.amazonaws.com/app/1757445539246_ew2ha2lxkqp.png', true, NULL, '2025-09-09T22:19:00.099Z', '2025-09-09T22:19:25.538Z', 'https://hoteloshia.s3.us-east-2.amazonaws.com/app/1757445565185_yhhzg9h18ma.png', 'Sistema de gerenciamento de propriedades hoteleiras do O Sócio Hoteleiro. Inteligência em gestão que faz o seu hotel avançar para o próximo nível.');

INSERT INTO app_configurations (id, hotel_id, app_name, app_title, logo_url, is_active, shared_from_app, created_at, updated_at, favicon_url, description) VALUES (25, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'site-hoteleiro', 'Criador de sites', 'https://hoteloshia.s3.us-east-2.amazonaws.com/app/1757444968699_cw37c20h8u9.png', true, NULL, '2025-09-09T22:04:54.407Z', '2025-09-09T22:19:32.151Z', 'https://hoteloshia.s3.us-east-2.amazonaws.com/app/1757445571804_h7of0n9dwhk.png', 'Sistema de ciração de sites hoteleiros do O Sócio Hoteleiro. Crie o site do seu hotel de forma rápida, fácil e com integração ao motor de reservas e inteligência artificial.');

INSERT INTO app_configurations (id, hotel_id, app_name, app_title, logo_url, is_active, shared_from_app, created_at, updated_at, favicon_url, description) VALUES (36, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'automacao', 'Amplia ia', 'https://hoteloshia.s3.us-east-2.amazonaws.com/app/1757445657251_89i5j2guczb.png', true, NULL, '2025-09-09T22:20:58.250Z', '2025-09-09T22:20:59.876Z', 'https://hoteloshia.s3.us-east-2.amazonaws.com/app/1757445659528_thwqvryw77e.png', 'Sistema de gestão de automações dedicado ao aprimoramento da inteligência artificial do O Sócio Hoteleiro.');

INSERT INTO app_configurations (id, hotel_id, app_name, app_title, logo_url, is_active, shared_from_app, created_at, updated_at, favicon_url, description) VALUES (34, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'hotel-app', 'Sistema de Hotéis', 'https://hoteloshia.s3.us-east-2.amazonaws.com/app/1757445595101_thxtqom2n.png', true, NULL, '2025-09-09T22:19:55.443Z', '2025-09-09T22:27:06.298Z', 'https://hoteloshia.s3.us-east-2.amazonaws.com/app/1757446024288_i0lqw3x6b6c.png', 'Sistema de gerenciamento de hotéis do O Sócio Hoteleiro.');

INSERT INTO app_configurations (id, hotel_id, app_name, app_title, logo_url, is_active, shared_from_app, created_at, updated_at, favicon_url, description) VALUES (39, NULL, 'pms', 'PMS - Sistema OSH', NULL, true, NULL, '2025-09-10T22:14:12.051Z', '2025-09-10T22:14:12.051Z', NULL, NULL);



-- Dados da tabela bots

INSERT INTO bots (id, uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings, active, created_at, updated_at) VALUES (1, 'f0096bf6-2020-4905-b091-faf3007bb9a8', 1, 'a43ae5fc-7f88-4f7b-a7a2-5c159fefa89c', 2, '0cf811dd-82cb-11f0-bd40-02420a0b00b1', 'Bot Recepção - Pousada Bugaendrus', 'Bot para atendimento automatizado da recepção do hotel Pousada Bugaendrus', 'CHATBOT', 'ACTIVE', '{"language":"pt-BR","welcome_message":"Olá! Bem-vindo ao nosso hotel. Como posso ajudá-lo?","fallback_message":"Desculpe, não entendi. Pode reformular sua pergunta?","max_response_time":5000}', '{"auto_response":true,"business_hours":{"end":"22:00","start":"08:00"},"notification_email":"bot@pousadabugaendrus.com"}', true, '2025-09-08T15:17:36.041Z', '2025-09-08T15:17:36.041Z');

INSERT INTO bots (id, uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings, active, created_at, updated_at) VALUES (2, '28154e14-cd0d-4ffe-804e-ee8e877418db', 2, 'a8e75bb1-c8f0-46fb-a9f5-5579e1aaea43', 3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'Bot Recepção - O Sócio Hoteleiro Treinamentos', 'Bot para atendimento automatizado da recepção do hotel O Sócio Hoteleiro Treinamentos', 'CHATBOT', 'ACTIVE', '{"language":"pt-BR","welcome_message":"Olá! Bem-vindo ao nosso hotel. Como posso ajudá-lo?","fallback_message":"Desculpe, não entendi. Pode reformular sua pergunta?","max_response_time":5000}', '{"auto_response":true,"business_hours":{"end":"22:00","start":"08:00"},"notification_email":"bot@osóciohoteleirotreinamentos.com"}', true, '2025-09-08T15:17:36.048Z', '2025-09-08T15:17:36.048Z');

INSERT INTO bots (id, uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings, active, created_at, updated_at) VALUES (3, '3837ebbb-cc11-4bb1-aa31-e5dfa3e17633', 3, '40d3b0e5-d214-44de-b037-7cddc8f363a2', 4, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', 'Bot Recepção - Rental Acomodações', 'Bot para atendimento automatizado da recepção do hotel Rental Acomodações', 'CHATBOT', 'ACTIVE', '{"language":"pt-BR","welcome_message":"Olá! Bem-vindo ao nosso hotel. Como posso ajudá-lo?","fallback_message":"Desculpe, não entendi. Pode reformular sua pergunta?","max_response_time":5000}', '{"auto_response":true,"business_hours":{"end":"22:00","start":"08:00"},"notification_email":"bot@rentalacomodações.com"}', true, '2025-09-08T15:17:36.050Z', '2025-09-08T15:17:36.050Z');

INSERT INTO bots (id, uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings, active, created_at, updated_at) VALUES (4, 'd35adc3d-6e8d-4385-9991-6c3f213d8444', 4, 'bd6bb9a5-1206-453c-8ca0-6ae94f54d45b', 5, '0cf84d02-82cb-11f0-bd40-02420a0b00b1', 'Bot Recepção - Marine Hotel', 'Bot para atendimento automatizado da recepção do hotel Marine Hotel', 'CHATBOT', 'ACTIVE', '{"language":"pt-BR","welcome_message":"Olá! Bem-vindo ao nosso hotel. Como posso ajudá-lo?","fallback_message":"Desculpe, não entendi. Pode reformular sua pergunta?","max_response_time":5000}', '{"auto_response":true,"business_hours":{"end":"22:00","start":"08:00"},"notification_email":"bot@marinehotel.com"}', true, '2025-09-08T15:17:36.052Z', '2025-09-08T15:17:36.052Z');

INSERT INTO bots (id, uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings, active, created_at, updated_at) VALUES (5, 'fc1451a4-1ac8-442a-9628-9add7c611d65', 5, 'ea536d7d-3fec-4f55-809f-da99d48c54df', 7, '0cf84d38-82cb-11f0-bd40-02420a0b00b1', 'Bot Recepção - Pousada Trancoso', 'Bot para atendimento automatizado da recepção do hotel Pousada Trancoso', 'CHATBOT', 'ACTIVE', '{"language":"pt-BR","welcome_message":"Olá! Bem-vindo ao nosso hotel. Como posso ajudá-lo?","fallback_message":"Desculpe, não entendi. Pode reformular sua pergunta?","max_response_time":5000}', '{"auto_response":true,"business_hours":{"end":"22:00","start":"08:00"},"notification_email":"bot@pousadatrancoso.com"}', true, '2025-09-08T15:17:36.054Z', '2025-09-08T15:17:36.054Z');

INSERT INTO bots (id, uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings, active, created_at, updated_at) VALUES (6, '5995a138-a7b7-4568-8c67-d791012318a7', 1, 'a43ae5fc-7f88-4f7b-a7a2-5c159fefa89c', 2, '0cf811dd-82cb-11f0-bd40-02420a0b00b1', 'Bot Check-in - Pousada Bugaendrus', 'Bot para automatizar processo de check-in do hotel Pousada Bugaendrus', 'AUTOMATION', 'DRAFT', '{"actions":[{"type":"send_email","template":"checkin_instructions"},{"type":"send_sms","template":"checkin_reminder"}],"conditions":{"hours_before_checkin":24},"trigger_event":"reservation_confirmed"}', '{"enabled":false,"test_mode":true,"retry_attempts":3}', true, '2025-09-08T15:17:36.055Z', '2025-09-08T15:17:36.055Z');

INSERT INTO bots (id, uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings, active, created_at, updated_at) VALUES (7, 'b3758442-9e14-4ff6-9644-294e0d159aaf', 2, 'a8e75bb1-c8f0-46fb-a9f5-5579e1aaea43', 3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'Bot Check-in - O Sócio Hoteleiro Treinamentos', 'Bot para automatizar processo de check-in do hotel O Sócio Hoteleiro Treinamentos', 'AUTOMATION', 'DRAFT', '{"actions":[{"type":"send_email","template":"checkin_instructions"},{"type":"send_sms","template":"checkin_reminder"}],"conditions":{"hours_before_checkin":24},"trigger_event":"reservation_confirmed"}', '{"enabled":false,"test_mode":true,"retry_attempts":3}', true, '2025-09-08T15:17:36.057Z', '2025-09-08T15:17:36.057Z');

INSERT INTO bots (id, uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings, active, created_at, updated_at) VALUES (8, '280035c0-1fde-4b78-b3ef-f715967c23b3', 3, '40d3b0e5-d214-44de-b037-7cddc8f363a2', 4, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', 'Bot Check-in - Rental Acomodações', 'Bot para automatizar processo de check-in do hotel Rental Acomodações', 'AUTOMATION', 'DRAFT', '{"actions":[{"type":"send_email","template":"checkin_instructions"},{"type":"send_sms","template":"checkin_reminder"}],"conditions":{"hours_before_checkin":24},"trigger_event":"reservation_confirmed"}', '{"enabled":false,"test_mode":true,"retry_attempts":3}', true, '2025-09-08T15:17:36.059Z', '2025-09-08T15:17:36.059Z');



-- Dados da tabela flows

INSERT INTO flows (id, flow_uuid, bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, folder_id, name, description, flow_type, status, version, flow_data, variables, settings, triggers, priority, is_default, execution_count, last_executed_at, sort_order, active, created_at, updated_at) VALUES (1, '704e4ab0-6d73-4104-8f74-93d67d65d40a', 1, 'f0096bf6-2020-4905-b091-faf3007bb9a8', 1, 'a43ae5fc-7f88-4f7b-a7a2-5c159fefa89c', 2, '0cf811dd-82cb-11f0-bd40-02420a0b00b1', 1, 'Fluxo de Atendimento Principal', 'Fluxo principal para atendimento inicial do cliente', 'CONVERSATION', 'ACTIVE', '1.0.0', '{"edges":[{"id":"e1","type":"custom-edge","source":"start_node_1","target":"message_node_1"},{"id":"e2","type":"custom-edge","source":"message_node_1","target":"question_node_1"}],"nodes":[{"id":"start_node_1","data":{"label":"Início","config":{"message":"Bem-vindo ao Bot Recepção - Pousada Bugaendrus!"}},"type":"startNode","position":{"x":100,"y":250}},{"id":"message_node_1","data":{"label":"Saudação","config":{"messages":["Olá! Como posso ajudá-lo hoje?"]}},"type":"messageNode","position":{"x":300,"y":250}},{"id":"question_node_1","data":{"label":"Qual serviço?","config":{"question":"Qual serviço você precisa?","variable":"servico_escolhido","validation":"none"}},"type":"questionNode","position":{"x":500,"y":250}}],"viewport":{"x":0,"y":0,"zoom":1}}', '{"cliente_nome":"","servico_escolhido":""}', '{"timeout":30000,"typing_delay":1500,"fallback_enabled":true}', '[{"type":"message_received","conditions":["first_interaction"]}]', 0, true, 0, NULL, 0, true, '2025-09-08T16:59:03.468Z', '2025-09-08T16:59:03.468Z');

INSERT INTO flows (id, flow_uuid, bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, folder_id, name, description, flow_type, status, version, flow_data, variables, settings, triggers, priority, is_default, execution_count, last_executed_at, sort_order, active, created_at, updated_at) VALUES (2, 'cf076b2d-e37f-4188-bd05-7fd1e4e1e8a8', 2, '28154e14-cd0d-4ffe-804e-ee8e877418db', 2, 'a8e75bb1-c8f0-46fb-a9f5-5579e1aaea43', 3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 2, 'Fluxo de Atendimento Principal', 'Fluxo principal para atendimento inicial do cliente', 'CONVERSATION', 'ACTIVE', '1.0.0', '{"edges":[{"id":"e1","type":"custom-edge","source":"start_node_1","target":"message_node_1"},{"id":"e2","type":"custom-edge","source":"message_node_1","target":"question_node_1"}],"nodes":[{"id":"start_node_1","data":{"label":"Início","config":{"message":"Bem-vindo ao Bot Recepção - O Sócio Hoteleiro Treinamentos!"}},"type":"startNode","position":{"x":100,"y":250}},{"id":"message_node_1","data":{"label":"Saudação","config":{"messages":["Olá! Como posso ajudá-lo hoje?"]}},"type":"messageNode","position":{"x":300,"y":250}},{"id":"question_node_1","data":{"label":"Qual serviço?","config":{"question":"Qual serviço você precisa?","variable":"servico_escolhido","validation":"none"}},"type":"questionNode","position":{"x":500,"y":250}}],"viewport":{"x":0,"y":0,"zoom":1}}', '{"cliente_nome":"","servico_escolhido":""}', '{"timeout":30000,"typing_delay":1500,"fallback_enabled":true}', '[{"type":"message_received","conditions":["first_interaction"]}]', 0, true, 0, NULL, 0, true, '2025-09-08T16:59:03.474Z', '2025-09-08T16:59:03.474Z');

INSERT INTO flows (id, flow_uuid, bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, folder_id, name, description, flow_type, status, version, flow_data, variables, settings, triggers, priority, is_default, execution_count, last_executed_at, sort_order, active, created_at, updated_at) VALUES (3, '020109de-a5dd-4e08-b3d1-741734def339', 3, '3837ebbb-cc11-4bb1-aa31-e5dfa3e17633', 3, '40d3b0e5-d214-44de-b037-7cddc8f363a2', 4, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', 3, 'Fluxo de Atendimento Principal', 'Fluxo principal para atendimento inicial do cliente', 'CONVERSATION', 'ACTIVE', '1.0.0', '{"edges":[{"id":"e1","type":"custom-edge","source":"start_node_1","target":"message_node_1"},{"id":"e2","type":"custom-edge","source":"message_node_1","target":"question_node_1"}],"nodes":[{"id":"start_node_1","data":{"label":"Início","config":{"message":"Bem-vindo ao Bot Recepção - Rental Acomodações!"}},"type":"startNode","position":{"x":100,"y":250}},{"id":"message_node_1","data":{"label":"Saudação","config":{"messages":["Olá! Como posso ajudá-lo hoje?"]}},"type":"messageNode","position":{"x":300,"y":250}},{"id":"question_node_1","data":{"label":"Qual serviço?","config":{"question":"Qual serviço você precisa?","variable":"servico_escolhido","validation":"none"}},"type":"questionNode","position":{"x":500,"y":250}}],"viewport":{"x":0,"y":0,"zoom":1}}', '{"cliente_nome":"","servico_escolhido":""}', '{"timeout":30000,"typing_delay":1500,"fallback_enabled":true}', '[{"type":"message_received","conditions":["first_interaction"]}]', 0, true, 0, NULL, 0, true, '2025-09-08T16:59:03.478Z', '2025-09-08T16:59:03.478Z');

INSERT INTO flows (id, flow_uuid, bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, folder_id, name, description, flow_type, status, version, flow_data, variables, settings, triggers, priority, is_default, execution_count, last_executed_at, sort_order, active, created_at, updated_at) VALUES (4, 'a7236de3-4eb9-4871-836c-071954d9502d', 2, '28154e14-cd0d-4ffe-804e-ee8e877418db', 2, 'a8e75bb1-c8f0-46fb-a9f5-5579e1aaea43', 3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 2, 'Fluxo de criação', 'Fluxo de deste de desenvolvimento', 'CONVERSATION', 'DRAFT', '1.0.0', '{"edges":[],"nodes":[{"id":"start_node_1","data":{"label":"Início","config":{"message":"Bem-vindo ao Bot Recepção - O Sócio Hoteleiro Treinamentos!"}},"type":"startNode","position":{"x":100,"y":250}}],"viewport":{"x":0,"y":0,"zoom":1}}', '{}', '{"timeout":30000,"typing_delay":1500,"fallback_enabled":true}', '[{"type":"keyword","keywords":["fluxo de criação"]}]', 0, false, 0, NULL, 0, true, '2025-09-08T17:06:23.394Z', '2025-09-08T17:06:23.394Z');

INSERT INTO flows (id, flow_uuid, bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, folder_id, name, description, flow_type, status, version, flow_data, variables, settings, triggers, priority, is_default, execution_count, last_executed_at, sort_order, active, created_at, updated_at) VALUES (5, '9fb490bf-10b4-4be2-a77c-daf5e6694b1a', 7, 'b3758442-9e14-4ff6-9644-294e0d159aaf', 2, 'a8e75bb1-c8f0-46fb-a9f5-5579e1aaea43', 3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', NULL, 'Teste Novo Flow', 'Teste de cria��o de flow', 'CONVERSATION', 'DRAFT', '1.0.0', '{"edges":[],"nodes":[{"id":"start_node_1","data":{"label":"In�cio","config":{"message":"Bem-vindo!"}},"type":"startNode","position":{"x":100,"y":250}}],"viewport":{"x":0,"y":0,"zoom":1}}', '{}', '{}', '[]', 0, false, 0, NULL, 0, true, '2025-09-08T17:16:10.781Z', '2025-09-08T17:16:10.781Z');

INSERT INTO flows (id, flow_uuid, bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, folder_id, name, description, flow_type, status, version, flow_data, variables, settings, triggers, priority, is_default, execution_count, last_executed_at, sort_order, active, created_at, updated_at) VALUES (6, '97763743-2f5f-44d7-9dc8-21a4d2d96c6f', 2, '28154e14-cd0d-4ffe-804e-ee8e877418db', 2, 'a8e75bb1-c8f0-46fb-a9f5-5579e1aaea43', 3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 2, 'Fluxo de criação', 'Fluxo de deste de desenvolvimento', 'CONVERSATION', 'DRAFT', '1.0.0', '{"edges":[],"nodes":[{"id":"start_node_1","data":{"label":"Início","config":{"message":"Bem-vindo ao Bot Recepção - O Sócio Hoteleiro Treinamentos!"}},"type":"startNode","position":{"x":100,"y":250}}],"viewport":{"x":0,"y":0,"zoom":1}}', '{}', '{"timeout":30000,"typing_delay":1500,"fallback_enabled":true}', '[{"type":"keyword","keywords":["fluxo de criação"]}]', 0, false, 0, NULL, 0, true, '2025-09-08T17:17:12.321Z', '2025-09-08T17:17:12.321Z');



-- Dados da tabela folders

INSERT INTO folders (id, folder_uuid, bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, color, icon, parent_folder_id, sort_order, active, created_at, updated_at) VALUES (1, 'efe8e88c-e3ee-4706-80f3-e4ad778c7660', 1, 'f0096bf6-2020-4905-b091-faf3007bb9a8', 1, 'a43ae5fc-7f88-4f7b-a7a2-5c159fefa89c', 2, '0cf811dd-82cb-11f0-bd40-02420a0b00b1', 'Fluxos Principais', 'Pasta com os fluxos principais do bot', '#10B981', 'folder', NULL, 0, true, '2025-09-08T16:59:03.464Z', '2025-09-08T16:59:03.464Z');

INSERT INTO folders (id, folder_uuid, bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, color, icon, parent_folder_id, sort_order, active, created_at, updated_at) VALUES (2, 'e420a09b-daaf-4943-a51f-2cf101159842', 2, '28154e14-cd0d-4ffe-804e-ee8e877418db', 2, 'a8e75bb1-c8f0-46fb-a9f5-5579e1aaea43', 3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'Fluxos Principais', 'Pasta com os fluxos principais do bot', '#10B981', 'folder', NULL, 0, true, '2025-09-08T16:59:03.472Z', '2025-09-08T16:59:03.472Z');

INSERT INTO folders (id, folder_uuid, bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, color, icon, parent_folder_id, sort_order, active, created_at, updated_at) VALUES (3, '73ba3840-60c1-4d43-821f-506e17abf627', 3, '3837ebbb-cc11-4bb1-aa31-e5dfa3e17633', 3, '40d3b0e5-d214-44de-b037-7cddc8f363a2', 4, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', 'Fluxos Principais', 'Pasta com os fluxos principais do bot', '#10B981', 'folder', NULL, 0, true, '2025-09-08T16:59:03.476Z', '2025-09-08T16:59:03.476Z');



-- Dados da tabela hotels

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (2, '0cf811dd-82cb-11f0-bd40-02420a0b00b1', 'Pousada Bugaendrus', '14:00:00', '12:00:00', 'https://www.bugaendrus.com.br/banner1.jpg', NULL, 'Búzios, RJ', NULL, NULL, NULL, 'ACTIVE', '2025-06-03T16:22:09.000Z', '2025-06-03T16:22:09.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'O Sócio Hoteleiro Treinamentos', '14:00:00', '12:00:00', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSP5cuXeMdGE4v6eICTrhiRDFa7iJBIwFbRreNR-zNsKMM5z9HyVNM1GGN-G3VxQ_b0kuw&usqp=CAU', NULL, 'São Paulo, SP', NULL, NULL, NULL, 'ACTIVE', '2025-06-03T16:17:06.000Z', '2025-06-03T16:17:06.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (4, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', 'Rental Acomodações', '14:00:00', '12:00:00', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf9ojXu9dEA6GQyRg8C1TRQspzZfIOWxouqS93gqUGmu6zY6Npthc8x9mxUkaQn6lsLZc&usqp=CAU', NULL, 'Gramado, RS', NULL, NULL, NULL, 'ACTIVE', '2025-06-09T19:37:16.000Z', '2025-06-09T19:37:16.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (5, '0cf84d02-82cb-11f0-bd40-02420a0b00b1', 'Marine Hotel', '14:00:00', '12:00:00', 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/628237435.jpg?k=10b604f50f91493fd6e072439687f17f294da20258ba9503ae898089670ca35a&o=&hp=1', NULL, 'Fortaleza, CE', NULL, NULL, NULL, 'ACTIVE', '2025-06-10T18:17:34.000Z', '2025-06-10T18:17:34.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (7, '0cf84d38-82cb-11f0-bd40-02420a0b00b1', 'Pousada Trancoso', '14:00:00', '12:00:00', 'https://lh3.googleusercontent.com/gps-cs-s/AC9h4npdvzcCV4dF0YkB2zLZLpBONNLLK__93WBl2CjiL9osyRMwnoCx-LPY9FFklTrdr_1G_w_vUJmC1O9fJuB83aEPtDalrCVfUefq6NZppfM40VAuCTHkQRS0DHhdq16nhuTKPvgBaw=w243-h174-n-k-no-nu', NULL, 'Trancoso, BA', NULL, NULL, NULL, 'ACTIVE', '2025-06-18T02:00:19.000Z', '2025-06-18T02:00:19.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (10, '0cf84d98-82cb-11f0-bd40-02420a0b00b1', 'Wakanda Hotel', '14:00:00', '12:00:00', NULL, NULL, 'São Paulo, SP', NULL, NULL, NULL, 'ACTIVE', '2025-08-22T20:28:11.000Z', '2025-08-22T20:28:11.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (13, '0171371b-8435-11f0-bd40-02420a0b00b1', 'passou', '14:00:00', '12:00:00', 'https://google.com/1.png', NULL, 'Florianópolis, SC', NULL, NULL, NULL, 'ACTIVE', '2025-08-28T20:32:44.000Z', '2025-08-28T20:32:44.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (14, 'd0deca4c-85ec-11f0-bd40-02420a0b00b1', 'Hotel API Test', '15:00:00', '11:00:00', 'https://hoteloshia.s3.us-east-2.amazonaws.com/hotel_api_test/1756707118066_sb2r5ehyrd.jpg', NULL, 'Florianópolis, SC', NULL, NULL, NULL, 'ACTIVE', '2025-08-31T01:01:01.000Z', '2025-08-31T01:01:01.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (16, '00afbc14-8763-11f0-bd40-02420a0b00b1', 'Hotel Teste Claude', '14:00:00', '12:00:00', '', NULL, NULL, NULL, NULL, NULL, 'ACTIVE', '2025-09-01T21:39:33.000Z', '2025-09-01T21:39:33.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (17, '3e74f4e5-8763-11f0-bd40-02420a0b00b1', 'Eco Encanto Pousada', '15:00:00', '12:00:00', '', NULL, NULL, NULL, NULL, NULL, 'ACTIVE', '2025-09-01T21:41:16.000Z', '2025-09-01T21:41:16.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (18, '94a52b6d-8763-11f0-bd40-02420a0b00b1', 'Hotel Teste com Imagem', '14:00:00', '12:00:00', 'https://example.com/image.jpg', NULL, NULL, NULL, NULL, NULL, 'ACTIVE', '2025-09-01T21:43:41.000Z', '2025-09-01T21:43:41.000Z');

INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, description, address, phone, email, website, status, created_at, updated_at) VALUES (19, 'b1df3a21-8763-11f0-bd40-02420a0b00b1', 'Hotel Teste Base64', '14:00:00', '12:00:00', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA4eJ0JgAAAABJRU5ErkJggg==', NULL, NULL, NULL, NULL, NULL, 'ACTIVE', '2025-09-01T21:44:30.000Z', '2025-09-01T21:44:30.000Z');



-- Dados da tabela meta_available_accounts

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (29, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '2435647743401534', 'CA - Pousada Praia Bela', 1, 'BRL', '1692376260878329', 'Pousada Praia Bela - Ilhéus|BA', false, '2025-09-05T02:17:09.094Z', '2025-09-05T02:17:09.094Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (30, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '257701115460205', 'Eco Encanto Anúncios', 1, 'BRL', '198588024295594', 'Eco Encanto Pousada', false, '2025-09-05T02:17:09.096Z', '2025-09-05T02:17:09.096Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (31, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '448291369888080', '[CA] Marine Hotel', 1, 'BRL', '140610937411204', 'Marine Hotel', false, '2025-09-05T02:17:09.097Z', '2025-09-05T02:17:09.097Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (32, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '946873246103511', 'CA - OSH', 1, 'BRL', '3473304226233324', 'O Sócio Hoteleiro', false, '2025-09-05T02:17:09.099Z', '2025-09-05T02:17:09.099Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (33, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '1245764929299764', 'Venice Hotel CA', 1, 'BRL', '195807912905177', 'Venice Hotel Ubatuba', false, '2025-09-05T02:17:09.100Z', '2025-09-05T02:17:09.100Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (34, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '1756054681494548', 'CA - Mirante Lagoinha', 1, 'BRL', '1886443601395158', 'mirante da lagoinha', false, '2025-09-05T02:17:09.102Z', '2025-09-05T02:17:09.102Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (35, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '362595773238852', 'Williams Lopes', 1, 'BRL', '', '', false, '2025-09-05T02:17:09.104Z', '2025-09-05T02:17:09.104Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (36, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '831081862273266', 'CA Casa Cajú', 1, 'BRL', '112553537796550', 'Casa Caju', false, '2025-09-05T02:17:09.106Z', '2025-09-05T02:17:09.106Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (37, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '1042060400880152', 'CA - Hospedaria Beach', 1, 'BRL', '223553355099677', 'Santa Hospedaria Beach', false, '2025-09-05T02:17:09.107Z', '2025-09-05T02:17:09.107Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (38, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '1700562407543441', 'CA - Gidu Pouada', 1, 'BRL', '168019803832725', 'Gidu', false, '2025-09-05T02:17:09.109Z', '2025-09-05T02:17:09.109Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (39, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '1190693395854694', 'Pousada Três Marias', 1, 'BRL', '1912004716235739', 'Três Marias', false, '2025-09-05T02:17:09.110Z', '2025-09-05T02:17:09.110Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (40, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '569873792369233', 'CA - Rental Acomodações', 1, 'BRL', '3690318921266469', 'rentalacomodacoes', false, '2025-09-05T02:17:09.111Z', '2025-09-05T02:17:09.111Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (41, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '1705729163391366', 'CA - Marina Paraty', 1, 'BRL', '1189144149536208', 'pousadamarinaparaty', false, '2025-09-05T02:17:09.113Z', '2025-09-05T02:17:09.113Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (42, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '1000125298552288', 'CA - Pousada Bugaendrus', 1, 'BRL', '662160720159255', 'pousadabuga', false, '2025-09-05T02:17:09.114Z', '2025-09-05T02:17:09.114Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (43, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '2435647743401534', 'CA - Pousada Praia Bela', 1, 'BRL', '1692376260878329', 'Pousada Praia Bela - Ilhéus|BA', false, '2025-09-05T02:51:17.141Z', '2025-09-05T02:51:17.141Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (44, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '257701115460205', 'Eco Encanto Anúncios', 1, 'BRL', '198588024295594', 'Eco Encanto Pousada', false, '2025-09-05T02:51:17.220Z', '2025-09-05T02:51:17.220Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (45, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '448291369888080', '[CA] Marine Hotel', 1, 'BRL', '140610937411204', 'Marine Hotel', false, '2025-09-05T02:51:17.222Z', '2025-09-05T02:51:17.222Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (46, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '946873246103511', 'CA - OSH', 1, 'BRL', '3473304226233324', 'O Sócio Hoteleiro', false, '2025-09-05T02:51:17.224Z', '2025-09-05T02:51:17.224Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (47, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1245764929299764', 'Venice Hotel CA', 1, 'BRL', '195807912905177', 'Venice Hotel Ubatuba', false, '2025-09-05T02:51:17.226Z', '2025-09-05T02:51:17.226Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (48, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1756054681494548', 'CA - Mirante Lagoinha', 1, 'BRL', '1886443601395158', 'mirante da lagoinha', false, '2025-09-05T02:51:17.228Z', '2025-09-05T02:51:17.228Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (49, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '362595773238852', 'Williams Lopes', 1, 'BRL', '', '', false, '2025-09-05T02:51:17.229Z', '2025-09-05T02:51:17.229Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (50, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '831081862273266', 'CA Casa Cajú', 1, 'BRL', '112553537796550', 'Casa Caju', false, '2025-09-05T02:51:17.231Z', '2025-09-05T02:51:17.231Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (51, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1042060400880152', 'CA - Hospedaria Beach', 1, 'BRL', '223553355099677', 'Santa Hospedaria Beach', false, '2025-09-05T02:51:17.232Z', '2025-09-05T02:51:17.232Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (52, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1700562407543441', 'CA - Gidu Pouada', 1, 'BRL', '168019803832725', 'Gidu', false, '2025-09-05T02:51:17.234Z', '2025-09-05T02:51:17.234Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (53, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1190693395854694', 'Pousada Três Marias', 1, 'BRL', '1912004716235739', 'Três Marias', false, '2025-09-05T02:51:17.236Z', '2025-09-05T02:51:17.236Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (54, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '569873792369233', 'CA - Rental Acomodações', 1, 'BRL', '3690318921266469', 'rentalacomodacoes', false, '2025-09-05T02:51:17.237Z', '2025-09-05T02:51:17.237Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (55, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1705729163391366', 'CA - Marina Paraty', 1, 'BRL', '1189144149536208', 'pousadamarinaparaty', false, '2025-09-05T02:51:17.239Z', '2025-09-05T02:51:17.239Z');

INSERT INTO meta_available_accounts (id, hotel_uuid, account_id, account_name, account_status, currency, business_id, business_name, is_connected, created_at, updated_at) VALUES (56, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1000125298552288', 'CA - Pousada Bugaendrus', 1, 'BRL', '662160720159255', 'pousadabuga', false, '2025-09-05T02:51:17.240Z', '2025-09-05T02:51:17.240Z');



-- Dados da tabela meta_connected_accounts

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (2, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', '946873246103511', 'CA - OSH', 'temp_token_946873246103511', 1, NULL, '3473304226233324', 'O Sócio Hoteleiro', '2025-09-05T02:31:35.526Z', '2025-09-05T02:31:35.526Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1700562407543441', 'CA - Gidu Pouada', 'temp_token_1700562407543441', 1, NULL, '168019803832725', 'Gidu', '2025-09-05T02:51:21.217Z', '2025-09-05T02:51:21.217Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (4, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1042060400880152', 'CA - Hospedaria Beach', 'temp_token_1042060400880152', 1, NULL, '223553355099677', 'Santa Hospedaria Beach', '2025-09-05T02:51:21.491Z', '2025-09-05T02:51:21.491Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (5, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1705729163391366', 'CA - Marina Paraty', 'temp_token_1705729163391366', 1, NULL, '1189144149536208', 'pousadamarinaparaty', '2025-09-05T02:51:21.493Z', '2025-09-05T02:51:21.493Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (6, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1756054681494548', 'CA - Mirante Lagoinha', 'temp_token_1756054681494548', 1, NULL, '1886443601395158', 'mirante da lagoinha', '2025-09-05T02:51:21.495Z', '2025-09-05T02:51:21.495Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (7, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '946873246103511', 'CA - OSH', 'temp_token_946873246103511', 1, NULL, '3473304226233324', 'O Sócio Hoteleiro', '2025-09-05T02:51:21.498Z', '2025-09-05T02:51:21.498Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (8, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1000125298552288', 'CA - Pousada Bugaendrus', 'temp_token_1000125298552288', 1, NULL, '662160720159255', 'pousadabuga', '2025-09-05T02:51:21.501Z', '2025-09-05T02:51:21.501Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (9, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '2435647743401534', 'CA - Pousada Praia Bela', 'temp_token_2435647743401534', 1, NULL, '1692376260878329', 'Pousada Praia Bela - Ilhéus|BA', '2025-09-05T02:51:21.503Z', '2025-09-05T02:51:21.503Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (10, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '569873792369233', 'CA - Rental Acomodações', 'temp_token_569873792369233', 1, NULL, '3690318921266469', 'rentalacomodacoes', '2025-09-05T02:51:21.506Z', '2025-09-05T02:51:21.506Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (11, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '831081862273266', 'CA Casa Cajú', 'temp_token_831081862273266', 1, NULL, '112553537796550', 'Casa Caju', '2025-09-05T02:51:21.508Z', '2025-09-05T02:51:21.508Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (12, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '257701115460205', 'Eco Encanto Anúncios', 'temp_token_257701115460205', 1, NULL, '198588024295594', 'Eco Encanto Pousada', '2025-09-05T02:51:21.511Z', '2025-09-05T02:51:21.511Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (13, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1190693395854694', 'Pousada Três Marias', 'temp_token_1190693395854694', 1, NULL, '1912004716235739', 'Três Marias', '2025-09-05T02:51:21.513Z', '2025-09-05T02:51:21.513Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (14, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '1245764929299764', 'Venice Hotel CA', 'temp_token_1245764929299764', 1, NULL, '195807912905177', 'Venice Hotel Ubatuba', '2025-09-05T02:51:21.515Z', '2025-09-05T02:51:21.515Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (16, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '448291369888080', '[CA] Marine Hotel', 'temp_token_448291369888080', 1, NULL, '140610937411204', 'Marine Hotel', '2025-09-05T02:51:21.520Z', '2025-09-05T02:51:21.520Z');

INSERT INTO meta_connected_accounts (id, hotel_uuid, account_id, account_name, access_token, account_status, currency, business_id, business_name, created_at, updated_at) VALUES (17, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', '362595773238852', 'Williams Lopes', 'temp_token_362595773238852', 1, NULL, '', '', '2025-09-05T03:54:23.496Z', '2025-09-05T03:54:23.496Z');



-- Dados da tabela onenode_bot_fields

INSERT INTO onenode_bot_fields (id, hotel_uuid, name, var_ns, var_type, description, value, workspace_id, is_required, is_custom, active, created_at, updated_at) VALUES (1, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'Nome do H�spede', 'guest_name', 'STRING', 'Nome completo do h�spede', '', NULL, false, true, true, '2025-09-08T22:35:34.304Z', '2025-09-08T22:35:34.304Z');



-- Dados da tabela rate_shopper_configs

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (1, 2, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (2, 3, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (3, 4, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (4, 5, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (5, 7, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (6, 10, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (7, 13, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (8, 14, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (9, 16, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (10, 17, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (11, 18, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');

INSERT INTO rate_shopper_configs (id, hotel_id, auto_search_enabled, search_frequency_hours, date_range_days, max_bundle_size, notification_enabled, notification_emails, price_alert_threshold, created_at, updated_at) VALUES (12, 19, false, 8, 90, 7, true, NULL, '10.00', '2025-09-05T17:55:17.406Z', '2025-09-05T17:55:17.406Z');



-- Dados da tabela rate_shopper_price_history

INSERT INTO rate_shopper_price_history (id, property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type, search_id, currency, created_at) VALUES (1, 13, 17, '2025-09-07T03:00:00.000Z', '250.00', NULL, '0.00', '0.00', 'NEW', NULL, 'BRL', '2025-09-07T13:03:06.103Z');

INSERT INTO rate_shopper_price_history (id, property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type, search_id, currency, created_at) VALUES (2, 13, 17, '2025-09-07T03:00:00.000Z', '275.00', '250.00', '25.00', '10.00', 'UP', NULL, 'BRL', '2025-09-07T13:03:06.111Z');

INSERT INTO rate_shopper_price_history (id, property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type, search_id, currency, created_at) VALUES (3, 12, 17, '2025-09-08T03:00:00.000Z', '180.00', '200.00', '-20.00', '-10.00', 'DOWN', NULL, 'BRL', '2025-09-07T13:03:06.113Z');

INSERT INTO rate_shopper_price_history (id, property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type, search_id, currency, created_at) VALUES (4, 13, 17, '2025-09-07T03:00:00.000Z', '250.00', NULL, '0.00', '0.00', 'NEW', NULL, 'BRL', '2025-09-07T13:07:53.981Z');

INSERT INTO rate_shopper_price_history (id, property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type, search_id, currency, created_at) VALUES (5, 13, 17, '2025-09-07T03:00:00.000Z', '275.00', '250.00', '25.00', '10.00', 'UP', NULL, 'BRL', '2025-09-07T13:07:53.988Z');

INSERT INTO rate_shopper_price_history (id, property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type, search_id, currency, created_at) VALUES (6, 12, 17, '2025-09-08T03:00:00.000Z', '180.00', '200.00', '-20.00', '-10.00', 'DOWN', NULL, 'BRL', '2025-09-07T13:07:53.990Z');

INSERT INTO rate_shopper_price_history (id, property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type, search_id, currency, created_at) VALUES (7, 12, 17, '2025-09-11T03:00:00.000Z', '188.10', '199.80', '-11.70', '-5.86', 'DOWN', NULL, 'BRL', '2025-09-07T13:11:23.102Z');

INSERT INTO rate_shopper_price_history (id, property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type, search_id, currency, created_at) VALUES (8, 12, 17, '2025-09-16T03:00:00.000Z', '188.10', '199.80', '-11.70', '-5.86', 'DOWN', NULL, 'BRL', '2025-09-07T13:11:23.108Z');



-- Dados da tabela rate_shopper_prices

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1629, 142, 16, 17, '2025-11-30T03:00:00.000Z', '2025-12-01T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:13:17.652Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1630, 142, 16, 17, '2025-12-01T03:00:00.000Z', '2025-12-02T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:13:26.361Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1631, 142, 16, 17, '2025-12-02T03:00:00.000Z', '2025-12-03T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:13:33.534Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1632, 142, 16, 17, '2025-12-03T03:00:00.000Z', '2025-12-04T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:13:41.446Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1633, 142, 16, 17, '2025-12-04T03:00:00.000Z', '2025-12-05T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:13:48.952Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1634, 142, 16, 17, '2025-12-05T03:00:00.000Z', '2025-12-06T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:14:03.552Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1635, 142, 16, 17, '2025-12-06T03:00:00.000Z', '2025-12-07T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:14:03.556Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1636, 142, 16, 17, '2025-12-07T03:00:00.000Z', '2025-12-08T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:14:11.576Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1637, 142, 16, 17, '2025-12-08T03:00:00.000Z', '2025-12-09T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:14:20.919Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1638, 142, 16, 17, '2025-12-09T03:00:00.000Z', '2025-12-10T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:14:27.875Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1639, 142, 16, 17, '2025-12-10T03:00:00.000Z', '2025-12-11T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:14:37.655Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1640, 142, 16, 17, '2025-12-11T03:00:00.000Z', '2025-12-12T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:14:44.377Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1641, 142, 16, 17, '2025-12-12T03:00:00.000Z', '2025-12-13T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:15:00.161Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (24, 3, 4, 2, '2025-09-07T03:00:00.000Z', '2025-09-08T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:57:44.574Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (25, 3, 4, 2, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:57:54.201Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (26, 3, 4, 2, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:58:02.903Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (27, 3, 4, 2, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:58:11.979Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (28, 3, 4, 2, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:58:19.617Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (29, 3, 4, 2, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:58:29.319Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (30, 3, 4, 2, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:58:37.237Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (31, 3, 4, 2, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:58:48.502Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (32, 3, 4, 2, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:58:56.022Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (33, 3, 4, 2, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:59:04.490Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (34, 3, 4, 2, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '446.00', 'BRL', 'Standard', 2, false, 1, '446.00', 'AVAILABLE', 'JS_VARS', '2025-09-05T20:59:13.138Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1642, 142, 16, 17, '2025-12-13T03:00:00.000Z', '2025-12-14T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:15:00.165Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1643, 142, 16, 17, '2025-12-14T03:00:00.000Z', '2025-12-15T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:15:09.249Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1644, 142, 16, 17, '2025-12-15T03:00:00.000Z', '2025-12-16T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:15:16.472Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1645, 142, 16, 17, '2025-12-16T03:00:00.000Z', '2025-12-17T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:15:23.668Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1646, 142, 16, 17, '2025-12-17T03:00:00.000Z', '2025-12-18T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:15:32.450Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1647, 142, 16, 17, '2025-12-18T03:00:00.000Z', '2025-12-19T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:15:39.359Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1648, 142, 16, 17, '2025-12-19T03:00:00.000Z', '2025-12-20T03:00:00.000Z', '350.41', 'BRL', 'Standard', 2, false, 1, '350.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:15:57.985Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1649, 142, 16, 17, '2025-12-20T03:00:00.000Z', '2025-12-21T03:00:00.000Z', '350.41', 'BRL', 'Standard', 2, false, 1, '350.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:16:06.774Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1650, 142, 16, 17, '2025-12-21T03:00:00.000Z', '2025-12-22T03:00:00.000Z', '360.10', 'BRL', 'Standard', 2, true, 3, '360.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:16:31.602Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1651, 142, 16, 17, '2025-12-22T03:00:00.000Z', '2025-12-23T03:00:00.000Z', '360.10', 'BRL', 'Standard', 2, true, 3, '360.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:16:31.607Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1652, 142, 16, 17, '2025-12-23T03:00:00.000Z', '2025-12-24T03:00:00.000Z', '360.10', 'BRL', 'Standard', 2, true, 3, '360.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:16:31.610Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1653, 142, 16, 17, '2025-12-24T03:00:00.000Z', '2025-12-25T03:00:00.000Z', '473.40', 'BRL', 'Standard', 2, true, 3, '473.40', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:16:50.593Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (110, 77, 6, 3, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '111.15', 'BRL', 'Standard', 2, false, 1, '111.15', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:22:26.526Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (111, 77, 6, 3, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '111.15', 'BRL', 'Standard', 2, false, 1, '111.15', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:22:33.817Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (112, 77, 6, 3, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '117.00', 'BRL', 'Standard', 2, false, 1, '117.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:22:48.542Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (113, 77, 6, 3, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '111.15', 'BRL', 'Standard', 2, false, 1, '111.15', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:23:13.261Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (114, 77, 6, 3, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '111.15', 'BRL', 'Standard', 2, false, 1, '111.15', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:23:20.656Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (115, 77, 6, 3, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '111.15', 'BRL', 'Standard', 2, false, 1, '111.15', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:23:30.581Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (53, 14, 2, 2, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '425.39', 'BRL', 'Standard', 2, false, 1, '425.39', 'AVAILABLE', 'JS_VARS', '2025-09-05T21:49:51.410Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (54, 14, 2, 2, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '425.39', 'BRL', 'Standard', 2, false, 1, '425.39', 'AVAILABLE', 'JS_VARS', '2025-09-05T21:50:00.042Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (55, 14, 2, 2, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '425.39', 'BRL', 'Standard', 2, false, 1, '425.39', 'AVAILABLE', 'JS_VARS', '2025-09-05T21:50:11.598Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (56, 14, 2, 2, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '790.02', 'BRL', 'Standard', 2, false, 1, '790.02', 'AVAILABLE', 'JS_VARS', '2025-09-05T21:50:19.509Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (116, 77, 6, 3, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '111.15', 'BRL', 'Standard', 2, false, 1, '111.15', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:23:39.089Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (117, 77, 6, 3, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '117.00', 'BRL', 'Standard', 2, false, 1, '117.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:23:47.953Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (118, 77, 6, 3, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '117.00', 'BRL', 'Standard', 2, false, 1, '117.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:24:01.526Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (119, 77, 6, 3, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '117.00', 'BRL', 'Standard', 2, false, 1, '117.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:24:09.155Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (120, 77, 6, 3, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '117.00', 'BRL', 'Standard', 2, false, 1, '117.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:24:57.672Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (121, 77, 6, 3, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '117.00', 'BRL', 'Standard', 2, false, 1, '117.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:25:07.536Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (122, 77, 6, 3, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '117.00', 'BRL', 'Standard', 2, false, 1, '117.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:25:13.637Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (123, 77, 6, 3, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:25:29.949Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (124, 77, 6, 3, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:25:39.185Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (125, 77, 6, 3, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '257.40', 'BRL', 'Standard', 2, false, 1, '257.40', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:26:05.418Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (126, 77, 6, 3, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:26:13.417Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (127, 77, 6, 3, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:26:20.274Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (128, 77, 6, 3, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:26:30.779Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (129, 77, 6, 3, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:26:40.683Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (130, 77, 6, 3, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '257.40', 'BRL', 'Standard', 2, false, 1, '257.40', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:28:10.604Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (131, 77, 6, 3, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:28:20.500Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (132, 77, 6, 3, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:28:38.869Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (133, 77, 6, 3, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:28:47.888Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (134, 77, 6, 3, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:28:57.026Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (135, 77, 6, 3, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '257.40', 'BRL', 'Standard', 2, false, 1, '257.40', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:29:20.433Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (136, 77, 6, 3, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:29:29.703Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (137, 77, 6, 3, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:29:36.419Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (138, 77, 6, 3, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '163.80', 'BRL', 'Standard', 2, false, 1, '163.80', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:29:42.948Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (139, 76, 8, 3, '2025-09-05T03:00:00.000Z', '2025-09-06T03:00:00.000Z', '369.48', 'BRL', 'Standard', 2, false, 1, '369.48', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:29:54.506Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (140, 76, 8, 3, '2025-09-06T03:00:00.000Z', '2025-09-07T03:00:00.000Z', '680.63', 'BRL', 'Standard', 2, false, 1, '680.63', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:30:04.172Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (141, 76, 8, 3, '2025-09-07T03:00:00.000Z', '2025-09-08T03:00:00.000Z', '388.93', 'BRL', 'Standard', 2, false, 1, '388.93', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:30:21.578Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (142, 76, 8, 3, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '408.38', 'BRL', 'Standard', 2, false, 1, '408.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:30:32.057Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (143, 76, 8, 3, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '408.38', 'BRL', 'Standard', 2, false, 1, '408.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:30:42.615Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (144, 76, 8, 3, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '391.36', 'BRL', 'Standard', 2, false, 1, '391.36', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:30:51.175Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (145, 76, 8, 3, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '391.36', 'BRL', 'Standard', 2, false, 1, '391.36', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:31:01.418Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (146, 76, 8, 3, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '607.71', 'BRL', 'Standard', 2, false, 1, '607.71', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:31:08.690Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (147, 76, 8, 3, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '425.39', 'BRL', 'Standard', 2, false, 1, '425.39', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:31:28.601Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (148, 76, 8, 3, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '425.39', 'BRL', 'Standard', 2, false, 1, '425.39', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:31:35.601Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (149, 76, 8, 3, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '425.39', 'BRL', 'Standard', 2, false, 1, '425.39', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:31:55.023Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (150, 76, 8, 3, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '790.02', 'BRL', 'Standard', 2, false, 1, '790.02', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:32:05.692Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (151, 76, 8, 3, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '461.85', 'BRL', 'Standard', 2, false, 1, '461.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:32:13.415Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (152, 76, 8, 3, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '425.39', 'BRL', 'Standard', 2, false, 1, '425.39', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:32:40.086Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (153, 76, 8, 3, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '408.38', 'BRL', 'Standard', 2, false, 1, '408.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:32:50.577Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (154, 76, 8, 3, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '408.38', 'BRL', 'Standard', 2, false, 1, '408.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:33:00.597Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (155, 76, 8, 3, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '408.38', 'BRL', 'Standard', 2, false, 1, '408.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:33:13.608Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (156, 76, 8, 3, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '408.38', 'BRL', 'Standard', 2, false, 1, '408.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:33:22.313Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (157, 76, 8, 3, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '607.71', 'BRL', 'Standard', 2, false, 1, '607.71', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:33:32.061Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (158, 76, 8, 3, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '492.00', 'BRL', 'Standard', 2, false, 1, '492.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:33:49.200Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (159, 76, 8, 3, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '357.32', 'BRL', 'Standard', 2, false, 1, '357.32', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:33:59.235Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (160, 76, 8, 3, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '357.32', 'BRL', 'Standard', 2, false, 1, '357.32', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:34:09.600Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (161, 76, 8, 3, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '409.40', 'BRL', 'Standard', 2, false, 1, '409.40', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:34:20.285Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (162, 76, 8, 3, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '552.69', 'BRL', 'Standard', 2, false, 1, '552.69', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:34:30.486Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (163, 76, 8, 3, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '450.34', 'BRL', 'Standard', 2, false, 1, '450.34', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:34:58.526Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (164, 76, 8, 3, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '800.38', 'BRL', 'Standard', 2, false, 1, '800.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:35:06.375Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (165, 76, 8, 3, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '450.34', 'BRL', 'Standard', 2, false, 1, '450.34', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:35:15.401Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (166, 76, 8, 3, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '562.93', 'BRL', 'Standard', 2, false, 1, '562.93', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:35:23.505Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (167, 76, 8, 3, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '552.69', 'BRL', 'Standard', 2, false, 1, '552.69', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:35:33.783Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (168, 76, 8, 3, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '800.38', 'BRL', 'Standard', 2, false, 1, '800.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:35:57.277Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (169, 76, 8, 3, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '511.75', 'BRL', 'Standard', 2, false, 1, '511.75', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:36:05.118Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (170, 76, 8, 3, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '639.69', 'BRL', 'Standard', 2, false, 1, '639.69', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:36:13.633Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (171, 76, 8, 3, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '511.75', 'BRL', 'Standard', 2, false, 1, '511.75', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:36:22.804Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (172, 76, 8, 3, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '690.86', 'BRL', 'Standard', 2, false, 1, '690.86', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:36:32.577Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (173, 76, 8, 3, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '470.81', 'BRL', 'Standard', 2, false, 1, '470.81', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:36:56.048Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (174, 76, 8, 3, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '800.38', 'BRL', 'Standard', 2, false, 1, '800.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:37:03.873Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (175, 76, 8, 3, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '800.38', 'BRL', 'Standard', 2, false, 1, '800.38', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:37:12.751Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (176, 76, 8, 3, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '470.81', 'BRL', 'Standard', 2, false, 1, '470.81', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:37:20.171Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (177, 76, 8, 3, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '552.69', 'BRL', 'Standard', 2, false, 1, '552.69', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:37:30.221Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (178, 76, 8, 3, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '450.34', 'BRL', 'Standard', 2, false, 1, '450.34', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:37:54.319Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (179, 76, 8, 3, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '450.34', 'BRL', 'Standard', 2, false, 1, '450.34', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:38:02.881Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (180, 76, 8, 3, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '409.40', 'BRL', 'Standard', 2, false, 1, '409.40', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:38:11.885Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (181, 76, 8, 3, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '409.40', 'BRL', 'Standard', 2, false, 1, '409.40', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:38:20.201Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (182, 75, 7, 3, '2025-09-06T03:00:00.000Z', '2025-09-07T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, false, 1, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:40:19.894Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (183, 75, 7, 3, '2025-09-07T03:00:00.000Z', '2025-09-08T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:40:28.240Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (184, 75, 7, 3, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:40:37.760Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (185, 75, 7, 3, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:40:44.352Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (186, 75, 7, 3, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:40:53.910Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (187, 75, 7, 3, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:41:00.852Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (188, 75, 7, 3, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:41:25.109Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (189, 75, 7, 3, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:41:33.334Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (190, 75, 7, 3, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:41:41.790Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (191, 75, 7, 3, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:41:49.502Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (192, 75, 7, 3, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:41:57.262Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (193, 75, 7, 3, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:42:31.739Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (194, 75, 7, 3, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:42:38.841Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (195, 75, 7, 3, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:42:46.755Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (196, 75, 7, 3, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:42:56.222Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (197, 75, 7, 3, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:43:04.343Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (198, 75, 7, 3, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:43:26.623Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (199, 75, 7, 3, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:43:36.614Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (200, 75, 7, 3, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:43:43.010Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (201, 75, 7, 3, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:43:50.015Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (202, 75, 7, 3, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:43:56.090Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (203, 75, 7, 3, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:44:17.877Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (204, 75, 7, 3, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:44:26.019Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (205, 75, 7, 3, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:44:35.694Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (206, 75, 7, 3, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:44:43.102Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (207, 75, 7, 3, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:44:49.422Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (208, 75, 7, 3, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:45:09.917Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (209, 75, 7, 3, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:45:20.125Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (210, 75, 7, 3, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:45:26.199Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (211, 75, 7, 3, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:45:34.989Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (212, 75, 7, 3, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:45:42.681Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (213, 75, 7, 3, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:46:05.574Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (214, 75, 7, 3, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:46:15.401Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (215, 75, 7, 3, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:46:23.380Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (216, 75, 7, 3, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:46:30.283Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (217, 75, 7, 3, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:46:36.939Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (218, 75, 7, 3, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:47:00.568Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (219, 75, 7, 3, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:47:10.227Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (220, 75, 7, 3, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:47:19.204Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (221, 75, 7, 3, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T03:47:27.560Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (222, 74, 5, 3, '2025-09-06T03:00:00.000Z', '2025-09-07T03:00:00.000Z', '267.00', 'BRL', 'Standard', 2, false, 1, '267.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:26:18.313Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (223, 74, 5, 3, '2025-09-07T03:00:00.000Z', '2025-09-08T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:26:27.965Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (224, 74, 5, 3, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:26:34.981Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (225, 74, 5, 3, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:26:42.816Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (226, 74, 5, 3, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:26:52.767Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (227, 74, 5, 3, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:27:03.071Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (228, 74, 5, 3, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:27:28.543Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (229, 74, 5, 3, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:27:37.794Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (230, 74, 5, 3, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:27:46.449Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (231, 74, 5, 3, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:27:54.617Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (232, 74, 5, 3, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:28:04.836Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (233, 74, 5, 3, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:28:30.123Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (234, 74, 5, 3, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:28:36.508Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (235, 74, 5, 3, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:28:43.984Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (236, 74, 5, 3, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:28:53.014Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (237, 74, 5, 3, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:28:59.558Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (238, 74, 5, 3, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:29:23.582Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (239, 74, 5, 3, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:29:30.909Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (240, 74, 5, 3, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '222.00', 'BRL', 'Standard', 2, false, 1, '222.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:29:39.489Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (241, 74, 5, 3, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:29:47.605Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (242, 74, 5, 3, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:29:56.976Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (243, 74, 5, 3, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:30:22.051Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (244, 74, 5, 3, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:30:29.986Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (245, 74, 5, 3, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:30:39.571Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (246, 74, 5, 3, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:30:46.263Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (247, 74, 5, 3, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:30:55.435Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (248, 74, 5, 3, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:31:17.536Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (249, 74, 5, 3, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:31:25.153Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (250, 74, 5, 3, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:31:44.130Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (251, 74, 5, 3, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:31:53.782Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (252, 74, 5, 3, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:32:03.480Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (253, 74, 5, 3, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:32:41.057Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (254, 74, 5, 3, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:32:51.292Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (255, 74, 5, 3, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:33:01.036Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (256, 74, 5, 3, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:33:10.561Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (257, 74, 5, 3, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:33:17.770Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (258, 74, 5, 3, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:33:40.265Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (259, 74, 5, 3, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:33:47.156Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (260, 74, 5, 3, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:33:53.606Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (261, 74, 5, 3, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-06T04:34:01.296Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (264, 81, 5, 3, '2025-01-01T03:00:00.000Z', '2025-01-02T03:00:00.000Z', '172.78', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.424Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (265, 81, 5, 3, '2025-01-02T03:00:00.000Z', '2025-01-03T03:00:00.000Z', '152.60', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.429Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (266, 81, 5, 3, '2025-01-03T03:00:00.000Z', '2025-01-04T03:00:00.000Z', '174.98', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.431Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (267, 81, 5, 3, '2025-01-04T03:00:00.000Z', '2025-01-05T03:00:00.000Z', '193.44', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.433Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (268, 81, 5, 3, '2025-01-05T03:00:00.000Z', '2025-01-06T03:00:00.000Z', '227.65', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.434Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (269, 81, 5, 3, '2025-01-06T03:00:00.000Z', '2025-01-07T03:00:00.000Z', '188.87', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.436Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (270, 81, 5, 3, '2025-01-07T03:00:00.000Z', '2025-01-08T03:00:00.000Z', '210.52', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.440Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (271, 81, 5, 3, '2025-01-08T03:00:00.000Z', '2025-01-09T03:00:00.000Z', '193.18', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.442Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (272, 81, 5, 3, '2025-01-09T03:00:00.000Z', '2025-01-10T03:00:00.000Z', '234.28', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.444Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (273, 81, 5, 3, '2025-01-10T03:00:00.000Z', '2025-01-11T03:00:00.000Z', '150.42', 'BRL', 'Quarto Duplo Standard', 2, false, 1, NULL, 'AVAILABLE', 'JS_VARS', '2025-09-06T04:47:55.445Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (274, 85, 6, 3, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '117.00', 'BRL', 'Standard', 2, false, 1, '117.00', 'AVAILABLE', 'JS_VARS', '2025-09-06T08:12:49.968Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (275, 84, 8, 3, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '607.71', 'BRL', 'Standard', 2, false, 1, '607.71', 'AVAILABLE', 'JS_VARS', '2025-09-06T08:13:00.662Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1376, 135, 20, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T01:34:19.744Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1377, 135, 20, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T01:34:30.155Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1378, 135, 20, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T01:34:40.396Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1654, 142, 16, 17, '2025-12-25T03:00:00.000Z', '2025-12-26T03:00:00.000Z', '473.40', 'BRL', 'Standard', 2, true, 3, '473.40', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:16:50.597Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1655, 142, 16, 17, '2025-12-26T03:00:00.000Z', '2025-12-27T03:00:00.000Z', '473.40', 'BRL', 'Standard', 2, true, 3, '473.40', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:16:50.602Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1656, 142, 16, 17, '2025-12-27T03:00:00.000Z', '2025-12-28T03:00:00.000Z', '1079.50', 'BRL', 'Standard', 2, true, 5, '1079.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:17:36.487Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1657, 142, 16, 17, '2025-12-28T03:00:00.000Z', '2025-12-29T03:00:00.000Z', '1079.50', 'BRL', 'Standard', 2, true, 5, '1079.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:17:36.494Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1658, 142, 16, 17, '2025-12-29T03:00:00.000Z', '2025-12-30T03:00:00.000Z', '1079.50', 'BRL', 'Standard', 2, true, 5, '1079.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:17:36.498Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1659, 142, 16, 17, '2025-12-30T03:00:00.000Z', '2025-12-31T03:00:00.000Z', '1079.50', 'BRL', 'Standard', 2, true, 5, '1079.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:17:36.501Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1660, 142, 16, 17, '2025-12-31T03:00:00.000Z', '2026-01-01T03:00:00.000Z', '1079.50', 'BRL', 'Standard', 2, true, 5, '1079.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:17:36.504Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1835, 140, 17, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:55:57.966Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1836, 140, 17, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:56:06.151Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1837, 140, 17, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:56:16.996Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1838, 140, 17, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:56:35.895Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1839, 140, 17, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '364.57', 'BRL', 'Standard', 2, false, 1, '364.57', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:56:45.293Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1840, 140, 17, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '460.16', 'BRL', 'Standard', 2, false, 1, '460.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:56:56.715Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1841, 140, 17, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:57:05.040Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1842, 140, 17, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:57:13.454Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1843, 140, 17, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:57:23.865Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1844, 140, 17, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:57:34.492Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1845, 140, 17, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:57:44.452Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1846, 140, 17, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '364.57', 'BRL', 'Standard', 2, false, 1, '364.57', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:57:52.694Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1847, 140, 17, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '532.19', 'BRL', 'Standard', 2, false, 1, '532.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:58:02.564Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1848, 140, 17, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:58:13.381Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1849, 140, 17, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:58:22.691Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1850, 140, 17, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:58:30.050Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1851, 140, 17, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:58:37.969Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1852, 140, 17, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:58:46.314Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1853, 140, 17, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '382.36', 'BRL', 'Standard', 2, false, 1, '382.36', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:58:55.637Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1854, 140, 17, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '460.16', 'BRL', 'Standard', 2, false, 1, '460.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:59:04.399Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1855, 140, 17, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:59:12.609Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1856, 140, 17, 17, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:59:21.887Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1857, 140, 17, 17, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:59:28.826Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1858, 140, 17, 17, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:59:36.565Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1859, 140, 17, 17, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:59:44.089Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1860, 140, 17, 17, '2025-10-03T03:00:00.000Z', '2025-10-04T03:00:00.000Z', '382.36', 'BRL', 'Standard', 2, false, 1, '382.36', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:59:53.166Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1861, 140, 17, 17, '2025-10-04T03:00:00.000Z', '2025-10-05T03:00:00.000Z', '460.16', 'BRL', 'Standard', 2, false, 1, '460.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:00:02.853Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1862, 140, 17, 17, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:00:12.501Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1863, 140, 17, 17, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:00:20.147Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1864, 140, 17, 17, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:00:29.223Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1865, 140, 17, 17, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:00:38.328Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1866, 140, 17, 17, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:00:45.152Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1867, 140, 17, 17, '2025-10-10T03:00:00.000Z', '2025-10-11T03:00:00.000Z', '382.36', 'BRL', 'Standard', 2, false, 1, '382.36', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:00:53.144Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1868, 140, 17, 17, '2025-10-11T03:00:00.000Z', '2025-10-12T03:00:00.000Z', '460.16', 'BRL', 'Standard', 2, false, 1, '460.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:01:01.938Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1869, 140, 17, 17, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:01:10.481Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1870, 140, 17, 17, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '432.45', 'BRL', 'Standard', 2, false, 1, '432.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:01:20.071Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1871, 140, 17, 17, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '432.45', 'BRL', 'Standard', 2, false, 1, '432.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:01:28.862Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1872, 140, 17, 17, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '432.45', 'BRL', 'Standard', 2, false, 1, '432.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:01:37.404Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1873, 140, 17, 17, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '499.28', 'BRL', 'Standard', 2, false, 1, '499.28', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:01:44.779Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1874, 140, 17, 17, '2025-10-17T03:00:00.000Z', '2025-10-18T03:00:00.000Z', '364.57', 'BRL', 'Standard', 2, false, 1, '364.57', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:01:55.825Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1875, 140, 17, 17, '2025-10-18T03:00:00.000Z', '2025-10-19T03:00:00.000Z', '437.93', 'BRL', 'Standard', 2, false, 1, '437.93', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:02:03.667Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1876, 140, 17, 17, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:02:11.876Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1877, 140, 17, 17, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:02:22.115Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1379, 135, 20, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T01:34:49.922Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1380, 135, 20, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '266.00', 'BRL', 'Opção 1', 2, false, 1, '266.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T01:35:01.867Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1381, 135, 20, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '266.00', 'BRL', 'Opção 1', 2, false, 1, '266.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T01:35:13.847Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1661, 142, 16, 17, '2026-01-01T03:00:00.000Z', '2026-01-02T03:00:00.000Z', '1041.25', 'BRL', 'Standard', 2, true, 2, '1041.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:18:00.426Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1662, 142, 16, 17, '2026-01-02T03:00:00.000Z', '2026-01-03T03:00:00.000Z', '1041.25', 'BRL', 'Standard', 2, true, 2, '1041.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:18:00.431Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1663, 142, 16, 17, '2026-01-03T03:00:00.000Z', '2026-01-04T03:00:00.000Z', '546.91', 'BRL', 'Standard', 2, true, 2, '546.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:18:16.444Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1664, 142, 16, 17, '2026-01-04T03:00:00.000Z', '2026-01-05T03:00:00.000Z', '546.91', 'BRL', 'Standard', 2, true, 2, '546.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:18:16.448Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1665, 142, 16, 17, '2026-01-05T03:00:00.000Z', '2026-01-06T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:18:30.085Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1666, 142, 16, 17, '2026-01-06T03:00:00.000Z', '2026-01-07T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:18:30.089Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1667, 142, 16, 17, '2026-01-07T03:00:00.000Z', '2026-01-08T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:18:47.610Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1668, 142, 16, 17, '2026-01-08T03:00:00.000Z', '2026-01-09T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:18:47.614Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1669, 142, 16, 17, '2026-01-09T03:00:00.000Z', '2026-01-10T03:00:00.000Z', '607.68', 'BRL', 'Standard', 2, true, 2, '607.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:19:04.375Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1670, 142, 16, 17, '2026-01-10T03:00:00.000Z', '2026-01-11T03:00:00.000Z', '607.68', 'BRL', 'Standard', 2, true, 2, '607.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:19:04.379Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1671, 142, 16, 17, '2026-01-11T03:00:00.000Z', '2026-01-12T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:19:17.757Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1672, 142, 16, 17, '2026-01-12T03:00:00.000Z', '2026-01-13T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:19:17.761Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1673, 142, 16, 17, '2026-01-13T03:00:00.000Z', '2026-01-14T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:19:34.627Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1674, 142, 16, 17, '2026-01-14T03:00:00.000Z', '2026-01-15T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:19:34.660Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1675, 142, 16, 17, '2026-01-15T03:00:00.000Z', '2026-01-16T03:00:00.000Z', '546.91', 'BRL', 'Standard', 2, true, 2, '546.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:19:48.721Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1676, 142, 16, 17, '2026-01-16T03:00:00.000Z', '2026-01-17T03:00:00.000Z', '546.91', 'BRL', 'Standard', 2, true, 2, '546.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:19:48.725Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1677, 142, 16, 17, '2026-01-17T03:00:00.000Z', '2026-01-18T03:00:00.000Z', '546.91', 'BRL', 'Standard', 2, true, 2, '546.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:20:03.601Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1678, 142, 16, 17, '2026-01-18T03:00:00.000Z', '2026-01-19T03:00:00.000Z', '546.91', 'BRL', 'Standard', 2, true, 2, '546.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:20:03.604Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1679, 142, 16, 17, '2026-01-19T03:00:00.000Z', '2026-01-20T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:20:19.355Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1680, 142, 16, 17, '2026-01-20T03:00:00.000Z', '2026-01-21T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:20:19.359Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1681, 142, 16, 17, '2026-01-21T03:00:00.000Z', '2026-01-22T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:20:32.217Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1682, 142, 16, 17, '2026-01-22T03:00:00.000Z', '2026-01-23T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:20:32.221Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1683, 142, 16, 17, '2026-01-23T03:00:00.000Z', '2026-01-24T03:00:00.000Z', '607.68', 'BRL', 'Standard', 2, true, 2, '607.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:20:47.331Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1684, 142, 16, 17, '2026-01-24T03:00:00.000Z', '2026-01-25T03:00:00.000Z', '607.68', 'BRL', 'Standard', 2, true, 2, '607.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:20:47.336Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1685, 142, 16, 17, '2026-01-25T03:00:00.000Z', '2026-01-26T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:21:01.447Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1686, 142, 16, 17, '2026-01-26T03:00:00.000Z', '2026-01-27T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:21:01.451Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1687, 142, 16, 17, '2026-01-27T03:00:00.000Z', '2026-01-28T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:21:18.198Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1688, 142, 16, 17, '2026-01-28T03:00:00.000Z', '2026-01-29T03:00:00.000Z', '486.14', 'BRL', 'Standard', 2, true, 2, '486.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:21:18.201Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1689, 142, 16, 17, '2026-01-29T03:00:00.000Z', '2026-01-30T03:00:00.000Z', '546.91', 'BRL', 'Standard', 2, true, 2, '546.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:21:33.962Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1690, 142, 16, 17, '2026-01-30T03:00:00.000Z', '2026-01-31T03:00:00.000Z', '546.91', 'BRL', 'Standard', 2, true, 2, '546.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:21:33.965Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1878, 140, 17, 17, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:02:30.030Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1879, 140, 17, 17, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:02:40.673Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1880, 140, 17, 17, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:02:47.579Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1881, 140, 17, 17, '2025-10-24T03:00:00.000Z', '2025-10-25T03:00:00.000Z', '382.36', 'BRL', 'Standard', 2, false, 1, '382.36', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:02:55.872Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1882, 140, 17, 17, '2025-10-25T03:00:00.000Z', '2025-10-26T03:00:00.000Z', '460.16', 'BRL', 'Standard', 2, false, 1, '460.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:03:03.127Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1883, 140, 17, 17, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:03:13.653Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1884, 140, 17, 17, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:03:22.521Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1885, 140, 17, 17, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:03:30.969Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1886, 140, 17, 17, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:03:39.847Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1887, 140, 17, 17, '2025-10-30T03:00:00.000Z', '2025-10-31T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:03:49.176Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1888, 140, 17, 17, '2025-10-31T03:00:00.000Z', '2025-11-01T03:00:00.000Z', '382.36', 'BRL', 'Standard', 2, false, 1, '382.36', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:03:56.815Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1889, 140, 17, 17, '2025-11-01T03:00:00.000Z', '2025-11-02T03:00:00.000Z', '610.21', 'BRL', 'Standard', 2, false, 1, '610.21', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:04:10.613Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1890, 140, 17, 17, '2025-11-02T03:00:00.000Z', '2025-11-03T03:00:00.000Z', '363.12', 'BRL', 'Standard', 2, false, 1, '363.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:04:18.671Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1891, 140, 17, 17, '2025-11-03T03:00:00.000Z', '2025-11-04T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:04:25.629Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1892, 140, 17, 17, '2025-11-04T03:00:00.000Z', '2025-11-05T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:04:34.655Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1893, 140, 17, 17, '2025-11-05T03:00:00.000Z', '2025-11-06T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:04:44.531Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1894, 140, 17, 17, '2025-11-06T03:00:00.000Z', '2025-11-07T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:04:54.486Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1895, 140, 17, 17, '2025-11-07T03:00:00.000Z', '2025-11-08T03:00:00.000Z', '460.16', 'BRL', 'Standard', 2, false, 1, '460.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:05:05.050Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1896, 140, 17, 17, '2025-11-08T03:00:00.000Z', '2025-11-09T03:00:00.000Z', '554.64', 'BRL', 'Standard', 2, false, 1, '554.64', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:05:15.680Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1897, 140, 17, 17, '2025-11-09T03:00:00.000Z', '2025-11-10T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:05:24.976Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1898, 140, 17, 17, '2025-11-10T03:00:00.000Z', '2025-11-11T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:05:32.866Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1899, 140, 17, 17, '2025-11-11T03:00:00.000Z', '2025-11-12T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:05:40.771Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1915, 140, 17, 17, '2025-11-27T03:00:00.000Z', '2025-11-28T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:08:08.493Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1916, 140, 17, 17, '2025-11-28T03:00:00.000Z', '2025-11-29T03:00:00.000Z', '460.16', 'BRL', 'Standard', 2, false, 1, '460.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:08:17.545Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1917, 140, 17, 17, '2025-11-29T03:00:00.000Z', '2025-11-30T03:00:00.000Z', '554.64', 'BRL', 'Standard', 2, false, 1, '554.64', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:08:27.561Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1918, 140, 17, 17, '2025-11-30T03:00:00.000Z', '2025-12-01T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:08:36.453Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1244, 130, 15, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '432.77', 'BRL', 'Standard', 2, false, 1, '432.77', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:02:17.049Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1245, 130, 15, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '454.41', 'BRL', 'Standard', 2, false, 1, '454.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:02:27.073Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1246, 130, 15, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '435.47', 'BRL', 'Standard', 2, false, 1, '435.47', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:02:36.609Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1247, 130, 15, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '435.47', 'BRL', 'Standard', 2, false, 1, '435.47', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:02:44.844Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1248, 130, 15, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '676.20', 'BRL', 'Standard', 2, false, 1, '676.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:02:51.594Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1249, 130, 15, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:03:59.888Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1250, 130, 15, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:04:09.739Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1251, 130, 15, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:04:16.409Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1252, 130, 15, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '649.15', 'BRL', 'Standard', 2, false, 1, '649.15', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:04:24.386Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1253, 130, 15, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '513.91', 'BRL', 'Standard', 2, false, 1, '513.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:04:31.418Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1254, 130, 15, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '1081.92', 'BRL', 'Standard', 2, true, 2, '1081.92', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:04:47.691Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1255, 130, 15, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '1081.92', 'BRL', 'Standard', 2, true, 2, '1081.92', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:04:47.722Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1256, 130, 15, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:04:56.221Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1257, 130, 15, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '649.15', 'BRL', 'Standard', 2, false, 1, '649.15', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:05:03.860Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1258, 130, 15, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '454.41', 'BRL', 'Standard', 2, false, 1, '454.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:05:10.716Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1259, 130, 15, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '454.41', 'BRL', 'Standard', 2, false, 1, '454.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:05:19.203Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1260, 130, 15, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:05:26.622Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1261, 130, 15, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '676.20', 'BRL', 'Standard', 2, false, 1, '676.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:05:35.103Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1262, 130, 15, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '809.28', 'BRL', 'Standard', 2, true, 2, '809.28', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:05:51.813Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1263, 130, 15, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '809.28', 'BRL', 'Standard', 2, true, 2, '809.28', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:05:51.819Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1382, 136, 20, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:05:06.267Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1383, 136, 20, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '205.00', 'BRL', 'Opção 1', 2, false, 1, '205.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:05:17.841Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1384, 136, 20, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '205.00', 'BRL', 'Opção 1', 2, false, 1, '205.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:05:28.136Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1691, 141, 15, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '432.77', 'BRL', 'Standard', 2, false, 1, '432.77', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:21:42.974Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1692, 141, 15, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '454.41', 'BRL', 'Standard', 2, false, 1, '454.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:21:51.880Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1693, 141, 15, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '435.47', 'BRL', 'Standard', 2, false, 1, '435.47', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:21:59.489Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1694, 141, 15, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '435.47', 'BRL', 'Standard', 2, false, 1, '435.47', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:22:08.866Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1695, 141, 15, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '595.06', 'BRL', 'Standard', 2, false, 1, '595.06', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:22:16.106Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1696, 141, 15, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:23:22.726Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1697, 141, 15, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:23:30.132Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1698, 141, 15, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:23:39.924Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1699, 141, 15, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '649.15', 'BRL', 'Standard', 2, false, 1, '649.15', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:23:49.035Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1700, 141, 15, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '513.91', 'BRL', 'Standard', 2, false, 1, '513.91', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:23:56.593Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1701, 141, 15, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '1081.92', 'BRL', 'Standard', 2, true, 2, '1081.92', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:24:12.551Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1702, 141, 15, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '1081.92', 'BRL', 'Standard', 2, true, 2, '1081.92', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:24:12.555Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1703, 141, 15, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:24:21.616Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1704, 141, 15, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '649.15', 'BRL', 'Standard', 2, false, 1, '649.15', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:24:29.244Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1705, 141, 15, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '649.15', 'BRL', 'Standard', 2, false, 1, '649.15', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:24:39.353Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1706, 141, 15, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '649.15', 'BRL', 'Standard', 2, false, 1, '649.15', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:24:49.130Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1707, 141, 15, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '473.34', 'BRL', 'Standard', 2, false, 1, '473.34', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:24:56.601Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1708, 141, 15, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '676.20', 'BRL', 'Standard', 2, false, 1, '676.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:25:03.943Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1709, 141, 15, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '809.28', 'BRL', 'Standard', 2, true, 2, '809.28', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:25:21.230Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1710, 141, 15, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '809.28', 'BRL', 'Standard', 2, true, 2, '809.28', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:25:21.233Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1711, 141, 15, 17, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '397.61', 'BRL', 'Standard', 2, false, 1, '397.61', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:25:31.725Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1712, 141, 15, 17, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '397.61', 'BRL', 'Standard', 2, false, 1, '397.61', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:25:39.879Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1713, 141, 15, 17, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '476.04', 'BRL', 'Standard', 2, false, 1, '476.04', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:25:48.691Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1714, 141, 15, 17, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '714.07', 'BRL', 'Standard', 2, false, 1, '714.07', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:25:56.597Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1715, 141, 15, 17, '2025-10-03T03:00:00.000Z', '2025-10-04T03:00:00.000Z', '1012.68', 'BRL', 'Standard', 2, true, 2, '1012.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:26:12.776Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1716, 141, 15, 17, '2025-10-04T03:00:00.000Z', '2025-10-05T03:00:00.000Z', '1012.68', 'BRL', 'Standard', 2, true, 2, '1012.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:26:12.780Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1717, 141, 15, 17, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '497.68', 'BRL', 'Standard', 2, false, 1, '497.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:26:19.990Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1718, 141, 15, 17, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '684.31', 'BRL', 'Standard', 2, false, 1, '684.31', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:26:29.202Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1719, 141, 15, 17, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '523.65', 'BRL', 'Standard', 2, false, 1, '523.65', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:26:38.737Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1720, 141, 15, 17, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '654.56', 'BRL', 'Standard', 2, false, 1, '654.56', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:26:46.448Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1721, 141, 15, 17, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '649.15', 'BRL', 'Standard', 2, false, 1, '649.15', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:26:57.812Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1722, 141, 15, 17, '2025-10-10T03:00:00.000Z', '2025-10-11T03:00:00.000Z', '900.70', 'BRL', 'Standard', 2, true, 2, '900.70', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:27:15.216Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1723, 141, 15, 17, '2025-10-11T03:00:00.000Z', '2025-10-12T03:00:00.000Z', '900.70', 'BRL', 'Standard', 2, true, 2, '900.70', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:27:15.233Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1724, 141, 15, 17, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '684.31', 'BRL', 'Standard', 2, false, 1, '684.31', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:27:22.618Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1725, 141, 15, 17, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '595.06', 'BRL', 'Standard', 2, false, 1, '595.06', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:27:31.980Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1726, 141, 15, 17, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '811.44', 'BRL', 'Standard', 2, false, 1, '811.44', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:27:39.370Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1727, 141, 15, 17, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '595.06', 'BRL', 'Standard', 2, false, 1, '595.06', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:27:47.427Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1728, 141, 15, 17, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '811.44', 'BRL', 'Standard', 2, false, 1, '811.44', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:27:56.868Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1729, 141, 15, 17, '2025-10-17T03:00:00.000Z', '2025-10-18T03:00:00.000Z', '960.75', 'BRL', 'Standard', 2, true, 2, '960.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:28:15.323Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1730, 141, 15, 17, '2025-10-18T03:00:00.000Z', '2025-10-19T03:00:00.000Z', '960.75', 'BRL', 'Standard', 2, true, 2, '960.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:28:15.329Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1731, 141, 15, 17, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '497.68', 'BRL', 'Standard', 2, false, 1, '497.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:28:22.746Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1732, 141, 15, 17, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '721.64', 'BRL', 'Standard', 2, false, 1, '721.64', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:28:33.090Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1733, 141, 15, 17, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '684.31', 'BRL', 'Standard', 2, false, 1, '684.31', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:28:39.732Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1734, 141, 15, 17, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '547.45', 'BRL', 'Standard', 2, false, 1, '547.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:28:47.541Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1735, 141, 15, 17, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '649.15', 'BRL', 'Standard', 2, false, 1, '649.15', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:28:58.320Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1736, 141, 15, 17, '2025-10-24T03:00:00.000Z', '2025-10-25T03:00:00.000Z', '960.75', 'BRL', 'Standard', 2, true, 2, '960.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:29:14.748Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1737, 141, 15, 17, '2025-10-25T03:00:00.000Z', '2025-10-26T03:00:00.000Z', '960.75', 'BRL', 'Standard', 2, true, 2, '960.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:29:14.753Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1264, 129, 14, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:07:08.782Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1265, 129, 14, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:07:17.243Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1266, 129, 14, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:07:25.778Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1267, 129, 14, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:07:39.728Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1268, 129, 14, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:07:39.732Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1269, 129, 14, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:07:48.181Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1270, 129, 14, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:07:54.273Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1271, 129, 14, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:08:02.893Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1272, 129, 14, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:08:12.959Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1273, 129, 14, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:08:22.345Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1274, 129, 14, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:08:37.181Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1275, 129, 14, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:08:37.185Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1276, 129, 14, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:08:44.887Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1277, 129, 14, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:09:02.860Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1278, 129, 14, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:09:10.705Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1279, 129, 14, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:09:19.530Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1280, 129, 14, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:09:26.100Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1281, 129, 14, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:09:43.142Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1282, 129, 14, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:09:43.149Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1283, 129, 14, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:09:53.846Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1385, 144, 18, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:17:00.828Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1386, 144, 18, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:17:10.135Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1387, 144, 18, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:17:19.943Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1388, 144, 18, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:17:31.369Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1389, 144, 18, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:17:40.626Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1390, 144, 18, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:17:47.057Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1391, 144, 18, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:17:56.406Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1392, 144, 18, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:18:04.365Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1393, 144, 18, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:18:13.322Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1394, 144, 18, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:18:21.482Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1395, 144, 18, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:18:29.587Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1396, 144, 18, 17, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '145.00', 'BRL', 'Standard', 2, true, 2, '145.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:30:14.796Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1397, 144, 18, 17, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '145.00', 'BRL', 'Standard', 2, true, 2, '145.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:30:14.808Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1398, 144, 18, 17, '2025-10-03T03:00:00.000Z', '2025-10-04T03:00:00.000Z', '145.00', 'BRL', 'Standard', 2, true, 2, '145.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:30:31.563Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1399, 144, 18, 17, '2025-10-04T03:00:00.000Z', '2025-10-05T03:00:00.000Z', '145.00', 'BRL', 'Standard', 2, true, 2, '145.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:30:31.569Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1400, 144, 18, 17, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '145.00', 'BRL', 'Standard', 2, true, 2, '145.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:30:45.873Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1401, 144, 18, 17, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '145.00', 'BRL', 'Standard', 2, true, 2, '145.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:30:45.878Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1402, 144, 18, 17, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '145.00', 'BRL', 'Standard', 2, true, 2, '145.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:31:03.773Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1403, 144, 18, 17, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '145.00', 'BRL', 'Standard', 2, true, 2, '145.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:31:03.779Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1738, 141, 15, 17, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '497.68', 'BRL', 'Standard', 2, false, 1, '497.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:29:22.076Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1739, 141, 15, 17, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '547.45', 'BRL', 'Standard', 2, false, 1, '547.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:29:30.652Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1740, 141, 15, 17, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '476.04', 'BRL', 'Standard', 2, false, 1, '476.04', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:29:39.781Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1741, 141, 15, 17, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '476.04', 'BRL', 'Standard', 2, false, 1, '476.04', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:29:47.354Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1742, 141, 15, 17, '2025-10-30T03:00:00.000Z', '2025-10-31T03:00:00.000Z', '649.15', 'BRL', 'Standard', 2, false, 1, '649.15', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:29:54.975Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1743, 141, 15, 17, '2025-10-31T03:00:00.000Z', '2025-11-01T03:00:00.000Z', '929.81', 'BRL', 'Standard', 2, true, 2, '929.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:30:11.459Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1744, 141, 15, 17, '2025-11-01T03:00:00.000Z', '2025-11-02T03:00:00.000Z', '929.81', 'BRL', 'Standard', 2, true, 2, '929.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:30:11.464Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1745, 141, 15, 17, '2025-11-02T03:00:00.000Z', '2025-11-03T03:00:00.000Z', '568.01', 'BRL', 'Standard', 2, true, 2, '568.01', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:30:35.769Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1746, 141, 15, 17, '2025-11-03T03:00:00.000Z', '2025-11-04T03:00:00.000Z', '568.01', 'BRL', 'Standard', 2, true, 2, '568.01', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:30:35.774Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1747, 141, 15, 17, '2025-11-04T03:00:00.000Z', '2025-11-05T03:00:00.000Z', '540.96', 'BRL', 'Standard', 2, true, 2, '540.96', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:31:05.262Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1748, 141, 15, 17, '2025-11-05T03:00:00.000Z', '2025-11-06T03:00:00.000Z', '540.96', 'BRL', 'Standard', 2, true, 2, '540.96', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:31:05.266Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1749, 141, 15, 17, '2025-11-06T03:00:00.000Z', '2025-11-07T03:00:00.000Z', '738.41', 'BRL', 'Standard', 2, true, 2, '738.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:31:24.720Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1750, 141, 15, 17, '2025-11-07T03:00:00.000Z', '2025-11-08T03:00:00.000Z', '738.41', 'BRL', 'Standard', 2, true, 2, '738.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:31:24.725Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1751, 141, 15, 17, '2025-11-08T03:00:00.000Z', '2025-11-09T03:00:00.000Z', '694.87', 'BRL', 'Standard', 2, true, 2, '694.87', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:31:42.847Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1752, 141, 15, 17, '2025-11-09T03:00:00.000Z', '2025-11-10T03:00:00.000Z', '694.87', 'BRL', 'Standard', 2, true, 2, '694.87', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:31:42.860Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1753, 141, 15, 17, '2025-11-10T03:00:00.000Z', '2025-11-11T03:00:00.000Z', '595.06', 'BRL', 'Standard', 2, true, 2, '595.06', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:31:58.672Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1754, 141, 15, 17, '2025-11-11T03:00:00.000Z', '2025-11-12T03:00:00.000Z', '595.06', 'BRL', 'Standard', 2, true, 2, '595.06', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:31:58.676Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1755, 141, 15, 17, '2025-11-12T03:00:00.000Z', '2025-11-13T03:00:00.000Z', '622.11', 'BRL', 'Standard', 2, true, 2, '622.11', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:32:17.055Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1756, 141, 15, 17, '2025-11-13T03:00:00.000Z', '2025-11-14T03:00:00.000Z', '622.11', 'BRL', 'Standard', 2, true, 2, '622.11', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:32:17.060Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1757, 141, 15, 17, '2025-11-14T03:00:00.000Z', '2025-11-15T03:00:00.000Z', '773.58', 'BRL', 'Standard', 2, true, 2, '773.58', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:32:33.444Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1758, 141, 15, 17, '2025-11-15T03:00:00.000Z', '2025-11-16T03:00:00.000Z', '773.58', 'BRL', 'Standard', 2, true, 2, '773.58', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:32:33.449Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1759, 141, 15, 17, '2025-11-16T03:00:00.000Z', '2025-11-17T03:00:00.000Z', '568.01', 'BRL', 'Standard', 2, true, 2, '568.01', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:32:46.954Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1760, 141, 15, 17, '2025-11-17T03:00:00.000Z', '2025-11-18T03:00:00.000Z', '568.01', 'BRL', 'Standard', 2, true, 2, '568.01', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:32:46.958Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1761, 141, 15, 17, '2025-11-18T03:00:00.000Z', '2025-11-19T03:00:00.000Z', '676.20', 'BRL', 'Standard', 2, true, 2, '676.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:33:02.518Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1762, 141, 15, 17, '2025-11-19T03:00:00.000Z', '2025-11-20T03:00:00.000Z', '676.20', 'BRL', 'Standard', 2, true, 2, '676.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:33:02.522Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1763, 141, 15, 17, '2025-11-20T03:00:00.000Z', '2025-11-21T03:00:00.000Z', '1220.41', 'BRL', 'Standard', 2, true, 3, '1220.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:33:28.209Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1764, 141, 15, 17, '2025-11-21T03:00:00.000Z', '2025-11-22T03:00:00.000Z', '1220.41', 'BRL', 'Standard', 2, true, 3, '1220.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:33:28.213Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1765, 141, 15, 17, '2025-11-22T03:00:00.000Z', '2025-11-23T03:00:00.000Z', '1220.41', 'BRL', 'Standard', 2, true, 3, '1220.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:33:28.216Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1766, 141, 15, 17, '2025-11-23T03:00:00.000Z', '2025-11-24T03:00:00.000Z', '703.25', 'BRL', 'Standard', 2, true, 2, '703.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:33:46.746Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1767, 141, 15, 17, '2025-11-24T03:00:00.000Z', '2025-11-25T03:00:00.000Z', '703.25', 'BRL', 'Standard', 2, true, 2, '703.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:33:46.750Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1768, 141, 15, 17, '2025-11-25T03:00:00.000Z', '2025-11-26T03:00:00.000Z', '595.06', 'BRL', 'Standard', 2, true, 2, '595.06', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:34:05.933Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1284, 128, 18, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:10:07.452Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1285, 128, 18, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:10:16.485Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1286, 128, 18, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:10:23.093Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1287, 128, 18, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:10:33.115Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1288, 128, 18, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:10:54.257Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1289, 128, 18, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:11:02.334Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1290, 128, 18, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '200.00', 'BRL', 'Standard', 2, false, 1, '200.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:11:11.070Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1404, 143, 14, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:40:33.205Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1405, 143, 14, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:40:43.088Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1406, 143, 14, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:40:50.979Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1407, 143, 14, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:41:05.841Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1408, 143, 14, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:41:05.846Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1409, 143, 14, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:41:16.932Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1410, 143, 14, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:41:24.472Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1411, 143, 14, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:41:32.552Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1412, 143, 14, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:41:41.791Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1413, 143, 14, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:41:50.820Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1414, 143, 14, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:42:08.668Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1415, 143, 14, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:42:08.672Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1416, 143, 14, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:42:14.586Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1417, 143, 14, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:42:22.245Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1418, 143, 14, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:42:28.685Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1419, 143, 14, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:42:39.400Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1420, 143, 14, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:42:45.630Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1421, 143, 14, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:43:03.759Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1422, 143, 14, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '223.13', 'BRL', 'Standard', 2, true, 2, '223.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:43:03.763Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1423, 143, 14, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:43:13.629Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1424, 143, 14, 17, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:43:23.213Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1425, 143, 14, 17, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '151.20', 'BRL', 'Standard', 2, false, 1, '151.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:43:32.484Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1426, 143, 14, 17, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:43:41.307Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1427, 143, 14, 17, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:43:50.590Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1428, 143, 14, 17, '2025-10-03T03:00:00.000Z', '2025-10-04T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, true, 2, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:44:04.681Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1429, 143, 14, 17, '2025-10-04T03:00:00.000Z', '2025-10-05T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, true, 2, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:44:04.686Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1430, 143, 14, 17, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:44:16.791Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1431, 143, 14, 17, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:44:26.389Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1432, 143, 14, 17, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:44:33.346Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1433, 143, 14, 17, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:44:41.741Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1434, 143, 14, 17, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:44:50.762Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1435, 143, 14, 17, '2025-10-10T03:00:00.000Z', '2025-10-11T03:00:00.000Z', '315.00', 'BRL', 'Standard', 2, true, 2, '315.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:45:05.656Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1436, 143, 14, 17, '2025-10-11T03:00:00.000Z', '2025-10-12T03:00:00.000Z', '315.00', 'BRL', 'Standard', 2, true, 2, '315.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:45:05.660Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1437, 143, 14, 17, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:45:15.001Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1438, 143, 14, 17, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:45:23.343Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1439, 143, 14, 17, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:45:39.060Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1440, 143, 14, 17, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:45:46.209Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1441, 143, 14, 17, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:45:52.083Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1442, 143, 14, 17, '2025-10-17T03:00:00.000Z', '2025-10-18T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, true, 2, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:46:09.220Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1443, 143, 14, 17, '2025-10-18T03:00:00.000Z', '2025-10-19T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, true, 2, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:46:09.225Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1444, 143, 14, 17, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:46:23.526Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1445, 143, 14, 17, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:46:33.610Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1446, 143, 14, 17, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:46:43.058Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1447, 143, 14, 17, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:46:50.340Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1448, 143, 14, 17, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:46:59.199Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1449, 143, 14, 17, '2025-10-24T03:00:00.000Z', '2025-10-25T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, true, 2, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:47:13.741Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1450, 143, 14, 17, '2025-10-25T03:00:00.000Z', '2025-10-26T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, true, 2, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:47:13.745Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1451, 143, 14, 17, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:47:23.697Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1452, 143, 14, 17, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:47:32.676Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1453, 143, 14, 17, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:47:40.109Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1454, 143, 14, 17, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:47:46.745Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1455, 143, 14, 17, '2025-10-30T03:00:00.000Z', '2025-10-31T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:47:54.191Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1456, 143, 14, 17, '2025-10-31T03:00:00.000Z', '2025-11-01T03:00:00.000Z', '273.00', 'BRL', 'Standard', 2, true, 2, '273.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:48:17.038Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1457, 143, 14, 17, '2025-11-01T03:00:00.000Z', '2025-11-02T03:00:00.000Z', '273.00', 'BRL', 'Standard', 2, true, 2, '273.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:48:17.042Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1458, 143, 14, 17, '2025-11-02T03:00:00.000Z', '2025-11-03T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:48:24.207Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1459, 143, 14, 17, '2025-11-03T03:00:00.000Z', '2025-11-04T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:48:30.900Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1460, 143, 14, 17, '2025-11-04T03:00:00.000Z', '2025-11-05T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:48:37.871Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1461, 143, 14, 17, '2025-11-05T03:00:00.000Z', '2025-11-06T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:48:44.914Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1769, 141, 15, 17, '2025-11-26T03:00:00.000Z', '2025-11-27T03:00:00.000Z', '595.06', 'BRL', 'Standard', 2, true, 2, '595.06', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:34:05.939Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1770, 141, 15, 17, '2025-11-27T03:00:00.000Z', '2025-11-28T03:00:00.000Z', '966.26', 'BRL', 'Standard', 2, true, 2, '966.26', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:34:23.890Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1771, 141, 15, 17, '2025-11-28T03:00:00.000Z', '2025-11-29T03:00:00.000Z', '966.26', 'BRL', 'Standard', 2, true, 2, '966.26', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:34:23.894Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1772, 141, 15, 17, '2025-11-29T03:00:00.000Z', '2025-11-30T03:00:00.000Z', '844.01', 'BRL', 'Standard', 2, true, 2, '844.01', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:34:39.046Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1773, 141, 15, 17, '2025-11-30T03:00:00.000Z', '2025-12-01T03:00:00.000Z', '844.01', 'BRL', 'Standard', 2, true, 2, '844.01', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:34:39.050Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1291, 127, 16, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:13:43.403Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1292, 127, 16, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:13:51.521Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1293, 127, 16, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:13:59.850Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1294, 127, 16, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '600.00', 'BRL', 'Standard', 2, true, 2, '600.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:14:18.591Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1295, 127, 16, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '600.00', 'BRL', 'Standard', 2, true, 2, '600.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:14:18.598Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1296, 127, 16, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:14:27.877Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1297, 127, 16, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:14:34.756Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1298, 127, 16, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:14:44.496Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1299, 127, 16, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:14:51.633Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1300, 127, 16, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:14:58.905Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1301, 127, 16, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '500.00', 'BRL', 'Standard', 2, true, 2, '500.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:15:15.439Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1302, 127, 16, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '500.00', 'BRL', 'Standard', 2, true, 2, '500.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:15:15.443Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1303, 127, 16, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:15:25.338Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1304, 127, 16, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:15:31.891Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1462, 143, 14, 17, '2025-11-06T03:00:00.000Z', '2025-11-07T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:48:52.412Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1463, 143, 14, 17, '2025-11-07T03:00:00.000Z', '2025-11-08T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, true, 2, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:49:08.103Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1464, 143, 14, 17, '2025-11-08T03:00:00.000Z', '2025-11-09T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, true, 2, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:49:08.107Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1465, 143, 14, 17, '2025-11-09T03:00:00.000Z', '2025-11-10T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:49:15.595Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1466, 143, 14, 17, '2025-11-10T03:00:00.000Z', '2025-11-11T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:49:25.728Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1467, 143, 14, 17, '2025-11-11T03:00:00.000Z', '2025-11-12T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:49:33.215Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1468, 143, 14, 17, '2025-11-12T03:00:00.000Z', '2025-11-13T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:49:40.319Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1469, 143, 14, 17, '2025-11-13T03:00:00.000Z', '2025-11-14T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:49:49.885Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1470, 143, 14, 17, '2025-11-14T03:00:00.000Z', '2025-11-15T03:00:00.000Z', '367.50', 'BRL', 'Standard', 2, true, 2, '367.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:50:06.780Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1471, 143, 14, 17, '2025-11-15T03:00:00.000Z', '2025-11-16T03:00:00.000Z', '367.50', 'BRL', 'Standard', 2, true, 2, '367.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:50:06.794Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1472, 143, 14, 17, '2025-11-16T03:00:00.000Z', '2025-11-17T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:50:14.422Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1473, 143, 14, 17, '2025-11-17T03:00:00.000Z', '2025-11-18T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:50:21.964Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1474, 143, 14, 17, '2025-11-18T03:00:00.000Z', '2025-11-19T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:50:29.236Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1475, 143, 14, 17, '2025-11-19T03:00:00.000Z', '2025-11-20T03:00:00.000Z', '341.25', 'BRL', 'Standard', 2, true, 4, '341.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:50:59.302Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1476, 143, 14, 17, '2025-11-20T03:00:00.000Z', '2025-11-21T03:00:00.000Z', '341.25', 'BRL', 'Standard', 2, true, 4, '341.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:50:59.308Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1477, 143, 14, 17, '2025-11-21T03:00:00.000Z', '2025-11-22T03:00:00.000Z', '341.25', 'BRL', 'Standard', 2, true, 4, '341.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:50:59.312Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1478, 143, 14, 17, '2025-11-22T03:00:00.000Z', '2025-11-23T03:00:00.000Z', '341.25', 'BRL', 'Standard', 2, true, 4, '341.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:50:59.315Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1479, 143, 14, 17, '2025-11-23T03:00:00.000Z', '2025-11-24T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:51:06.232Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1480, 143, 14, 17, '2025-11-24T03:00:00.000Z', '2025-11-25T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:51:15.899Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1481, 143, 14, 17, '2025-11-25T03:00:00.000Z', '2025-11-26T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:51:23.926Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1482, 143, 14, 17, '2025-11-26T03:00:00.000Z', '2025-11-27T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:51:33.197Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1483, 143, 14, 17, '2025-11-27T03:00:00.000Z', '2025-11-28T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:51:45.482Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1484, 143, 14, 17, '2025-11-28T03:00:00.000Z', '2025-11-29T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, true, 2, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:52:11.441Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1485, 143, 14, 17, '2025-11-29T03:00:00.000Z', '2025-11-30T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, true, 2, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:52:11.444Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1486, 143, 14, 17, '2025-11-30T03:00:00.000Z', '2025-12-01T03:00:00.000Z', '189.00', 'BRL', 'Standard', 2, false, 1, '189.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:52:17.849Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1487, 143, 14, 17, '2025-12-01T03:00:00.000Z', '2025-12-02T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:52:26.970Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1488, 143, 14, 17, '2025-12-02T03:00:00.000Z', '2025-12-03T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:52:34.548Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1489, 143, 14, 17, '2025-12-03T03:00:00.000Z', '2025-12-04T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:52:43.154Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1490, 143, 14, 17, '2025-12-04T03:00:00.000Z', '2025-12-05T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:52:52.179Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1491, 143, 14, 17, '2025-12-05T03:00:00.000Z', '2025-12-06T03:00:00.000Z', '315.00', 'BRL', 'Standard', 2, true, 2, '315.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:53:08.988Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1492, 143, 14, 17, '2025-12-06T03:00:00.000Z', '2025-12-07T03:00:00.000Z', '315.00', 'BRL', 'Standard', 2, true, 2, '315.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:53:08.999Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1493, 143, 14, 17, '2025-12-07T03:00:00.000Z', '2025-12-08T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:53:28.084Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1494, 143, 14, 17, '2025-12-08T03:00:00.000Z', '2025-12-09T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:53:35.559Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1495, 143, 14, 17, '2025-12-09T03:00:00.000Z', '2025-12-10T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:53:42.766Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1496, 143, 14, 17, '2025-12-10T03:00:00.000Z', '2025-12-11T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:53:51.945Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1497, 143, 14, 17, '2025-12-11T03:00:00.000Z', '2025-12-12T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:53:58.033Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1498, 143, 14, 17, '2025-12-12T03:00:00.000Z', '2025-12-13T03:00:00.000Z', '315.00', 'BRL', 'Standard', 2, true, 2, '315.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:54:14.734Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1499, 143, 14, 17, '2025-12-13T03:00:00.000Z', '2025-12-14T03:00:00.000Z', '315.00', 'BRL', 'Standard', 2, true, 2, '315.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:54:14.738Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1500, 143, 14, 17, '2025-12-14T03:00:00.000Z', '2025-12-15T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:54:22.610Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1501, 143, 14, 17, '2025-12-15T03:00:00.000Z', '2025-12-16T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:54:32.368Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1502, 143, 14, 17, '2025-12-16T03:00:00.000Z', '2025-12-17T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:54:40.043Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1503, 143, 14, 17, '2025-12-17T03:00:00.000Z', '2025-12-18T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:54:48.719Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1504, 143, 14, 17, '2025-12-18T03:00:00.000Z', '2025-12-19T03:00:00.000Z', '262.50', 'BRL', 'Standard', 2, false, 1, '262.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:54:58.931Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1505, 143, 14, 17, '2025-12-19T03:00:00.000Z', '2025-12-20T03:00:00.000Z', '420.00', 'BRL', 'Standard', 2, true, 2, '420.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:55:12.946Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1506, 143, 14, 17, '2025-12-20T03:00:00.000Z', '2025-12-21T03:00:00.000Z', '420.00', 'BRL', 'Standard', 2, true, 2, '420.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:55:12.951Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1507, 143, 14, 17, '2025-12-21T03:00:00.000Z', '2025-12-22T03:00:00.000Z', '315.00', 'BRL', 'Standard', 2, true, 2, '315.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:55:25.893Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1508, 143, 14, 17, '2025-12-22T03:00:00.000Z', '2025-12-23T03:00:00.000Z', '315.00', 'BRL', 'Standard', 2, true, 2, '315.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:55:25.896Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1509, 143, 14, 17, '2025-12-23T03:00:00.000Z', '2025-12-24T03:00:00.000Z', '630.00', 'BRL', 'Standard', 2, true, 4, '630.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:55:57.875Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1510, 143, 14, 17, '2025-12-24T03:00:00.000Z', '2025-12-25T03:00:00.000Z', '630.00', 'BRL', 'Standard', 2, true, 4, '630.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:55:57.880Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1511, 143, 14, 17, '2025-12-25T03:00:00.000Z', '2025-12-26T03:00:00.000Z', '630.00', 'BRL', 'Standard', 2, true, 4, '630.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:55:57.884Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1512, 143, 14, 17, '2025-12-26T03:00:00.000Z', '2025-12-27T03:00:00.000Z', '630.00', 'BRL', 'Standard', 2, true, 4, '630.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:55:57.888Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1513, 143, 14, 17, '2025-12-27T03:00:00.000Z', '2025-12-28T03:00:00.000Z', '924.00', 'BRL', 'Standard', 2, true, 5, '924.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:56:42.468Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1514, 143, 14, 17, '2025-12-28T03:00:00.000Z', '2025-12-29T03:00:00.000Z', '924.00', 'BRL', 'Standard', 2, true, 5, '924.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:56:42.474Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1515, 143, 14, 17, '2025-12-29T03:00:00.000Z', '2025-12-30T03:00:00.000Z', '924.00', 'BRL', 'Standard', 2, true, 5, '924.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:56:42.478Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1516, 143, 14, 17, '2025-12-30T03:00:00.000Z', '2025-12-31T03:00:00.000Z', '924.00', 'BRL', 'Standard', 2, true, 5, '924.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:56:42.483Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1517, 143, 14, 17, '2025-12-31T03:00:00.000Z', '2026-01-01T03:00:00.000Z', '924.00', 'BRL', 'Standard', 2, true, 5, '924.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:56:42.487Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1305, 127, 16, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:15:48.348Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1306, 127, 16, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:15:58.914Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1307, 127, 16, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:16:09.048Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1308, 127, 16, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '500.00', 'BRL', 'Standard', 2, true, 2, '500.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:16:23.054Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1309, 127, 16, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '500.00', 'BRL', 'Standard', 2, true, 2, '500.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:16:23.058Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1310, 127, 16, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '405.00', 'BRL', 'Standard', 2, false, 1, '405.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:16:29.581Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1518, 143, 14, 17, '2026-01-01T03:00:00.000Z', '2026-01-02T03:00:00.000Z', '630.00', 'BRL', 'Standard', 2, true, 4, '630.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:15.437Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1519, 143, 14, 17, '2026-01-02T03:00:00.000Z', '2026-01-03T03:00:00.000Z', '630.00', 'BRL', 'Standard', 2, true, 4, '630.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:15.444Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1520, 143, 14, 17, '2026-01-03T03:00:00.000Z', '2026-01-04T03:00:00.000Z', '630.00', 'BRL', 'Standard', 2, true, 4, '630.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:15.457Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1521, 143, 14, 17, '2026-01-04T03:00:00.000Z', '2026-01-05T03:00:00.000Z', '630.00', 'BRL', 'Standard', 2, true, 4, '630.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:15.464Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1522, 143, 14, 17, '2026-01-05T03:00:00.000Z', '2026-01-06T03:00:00.000Z', '525.00', 'BRL', 'Standard', 2, true, 3, '525.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:36.408Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1523, 143, 14, 17, '2026-01-06T03:00:00.000Z', '2026-01-07T03:00:00.000Z', '525.00', 'BRL', 'Standard', 2, true, 3, '525.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:36.411Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1524, 143, 14, 17, '2026-01-07T03:00:00.000Z', '2026-01-08T03:00:00.000Z', '525.00', 'BRL', 'Standard', 2, true, 3, '525.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:36.415Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1525, 143, 14, 17, '2026-01-08T03:00:00.000Z', '2026-01-09T03:00:00.000Z', '525.00', 'BRL', 'Standard', 2, true, 3, '525.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:55.575Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1526, 143, 14, 17, '2026-01-09T03:00:00.000Z', '2026-01-10T03:00:00.000Z', '525.00', 'BRL', 'Standard', 2, true, 3, '525.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:55.579Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1527, 143, 14, 17, '2026-01-10T03:00:00.000Z', '2026-01-11T03:00:00.000Z', '525.00', 'BRL', 'Standard', 2, true, 3, '525.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:57:55.583Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1528, 143, 14, 17, '2026-01-11T03:00:00.000Z', '2026-01-12T03:00:00.000Z', '511.00', 'BRL', 'Standard', 2, true, 3, '511.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:58:22.308Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1529, 143, 14, 17, '2026-01-12T03:00:00.000Z', '2026-01-13T03:00:00.000Z', '511.00', 'BRL', 'Standard', 2, true, 3, '511.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:58:22.314Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1530, 143, 14, 17, '2026-01-13T03:00:00.000Z', '2026-01-14T03:00:00.000Z', '511.00', 'BRL', 'Standard', 2, true, 3, '511.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:58:22.340Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1531, 143, 14, 17, '2026-01-14T03:00:00.000Z', '2026-01-15T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:58:35.378Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1532, 143, 14, 17, '2026-01-15T03:00:00.000Z', '2026-01-16T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:58:35.384Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1533, 143, 14, 17, '2026-01-16T03:00:00.000Z', '2026-01-17T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:58:49.133Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1534, 143, 14, 17, '2026-01-17T03:00:00.000Z', '2026-01-18T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:58:49.137Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1535, 143, 14, 17, '2026-01-18T03:00:00.000Z', '2026-01-19T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:59:05.382Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1536, 143, 14, 17, '2026-01-19T03:00:00.000Z', '2026-01-20T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:59:05.386Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1537, 143, 14, 17, '2026-01-20T03:00:00.000Z', '2026-01-21T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:59:19.146Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1538, 143, 14, 17, '2026-01-21T03:00:00.000Z', '2026-01-22T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:59:20.690Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1539, 143, 14, 17, '2026-01-22T03:00:00.000Z', '2026-01-23T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:59:39.282Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1540, 143, 14, 17, '2026-01-23T03:00:00.000Z', '2026-01-24T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:59:39.288Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1541, 143, 14, 17, '2026-01-24T03:00:00.000Z', '2026-01-25T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:59:53.165Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1542, 143, 14, 17, '2026-01-25T03:00:00.000Z', '2026-01-26T03:00:00.000Z', '483.00', 'BRL', 'Standard', 2, true, 2, '483.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T02:59:53.169Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1543, 143, 14, 17, '2026-01-26T03:00:00.000Z', '2026-01-27T03:00:00.000Z', '399.00', 'BRL', 'Standard', 2, true, 2, '399.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:00:07.994Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1544, 143, 14, 17, '2026-01-27T03:00:00.000Z', '2026-01-28T03:00:00.000Z', '399.00', 'BRL', 'Standard', 2, true, 2, '399.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:00:07.998Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1545, 143, 14, 17, '2026-01-28T03:00:00.000Z', '2026-01-29T03:00:00.000Z', '399.00', 'BRL', 'Standard', 2, true, 2, '399.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:00:24.930Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1546, 143, 14, 17, '2026-01-29T03:00:00.000Z', '2026-01-30T03:00:00.000Z', '399.00', 'BRL', 'Standard', 2, true, 2, '399.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:00:24.934Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1774, 141, 15, 17, '2025-12-01T03:00:00.000Z', '2025-12-02T03:00:00.000Z', '669.44', 'BRL', 'Standard', 2, true, 2, '669.44', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:34:57.188Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1775, 141, 15, 17, '2025-12-02T03:00:00.000Z', '2025-12-03T03:00:00.000Z', '669.44', 'BRL', 'Standard', 2, true, 2, '669.44', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:34:57.192Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1776, 141, 15, 17, '2025-12-03T03:00:00.000Z', '2025-12-04T03:00:00.000Z', '788.45', 'BRL', 'Standard', 2, true, 2, '788.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:35:26.368Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1777, 141, 15, 17, '2025-12-04T03:00:00.000Z', '2025-12-05T03:00:00.000Z', '788.45', 'BRL', 'Standard', 2, true, 2, '788.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:35:26.372Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1778, 141, 15, 17, '2025-12-05T03:00:00.000Z', '2025-12-06T03:00:00.000Z', '852.01', 'BRL', 'Standard', 2, true, 2, '852.01', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:35:44.878Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1779, 141, 15, 17, '2025-12-06T03:00:00.000Z', '2025-12-07T03:00:00.000Z', '852.01', 'BRL', 'Standard', 2, true, 2, '852.01', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:35:44.882Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1780, 141, 15, 17, '2025-12-07T03:00:00.000Z', '2025-12-08T03:00:00.000Z', '808.74', 'BRL', 'Standard', 2, true, 2, '808.74', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:36:01.836Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1781, 141, 15, 17, '2025-12-08T03:00:00.000Z', '2025-12-09T03:00:00.000Z', '808.74', 'BRL', 'Standard', 2, true, 2, '808.74', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:36:01.840Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1782, 141, 15, 17, '2025-12-09T03:00:00.000Z', '2025-12-10T03:00:00.000Z', '684.32', 'BRL', 'Standard', 2, true, 2, '684.32', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:36:21.672Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1783, 141, 15, 17, '2025-12-10T03:00:00.000Z', '2025-12-11T03:00:00.000Z', '684.32', 'BRL', 'Standard', 2, true, 2, '684.32', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:36:21.676Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1784, 141, 15, 17, '2025-12-11T03:00:00.000Z', '2025-12-12T03:00:00.000Z', '933.16', 'BRL', 'Standard', 2, true, 2, '933.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:36:51.319Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1785, 141, 15, 17, '2025-12-12T03:00:00.000Z', '2025-12-13T03:00:00.000Z', '933.16', 'BRL', 'Standard', 2, true, 2, '933.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:36:51.325Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1786, 141, 15, 17, '2025-12-13T03:00:00.000Z', '2025-12-14T03:00:00.000Z', '973.73', 'BRL', 'Standard', 2, true, 2, '973.73', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:37:09.238Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1787, 141, 15, 17, '2025-12-14T03:00:00.000Z', '2025-12-15T03:00:00.000Z', '973.73', 'BRL', 'Standard', 2, true, 2, '973.73', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:37:09.242Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1788, 141, 15, 17, '2025-12-15T03:00:00.000Z', '2025-12-16T03:00:00.000Z', '908.82', 'BRL', 'Standard', 2, true, 2, '908.82', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:37:23.050Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1789, 141, 15, 17, '2025-12-16T03:00:00.000Z', '2025-12-17T03:00:00.000Z', '908.82', 'BRL', 'Standard', 2, true, 2, '908.82', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:37:23.054Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1790, 141, 15, 17, '2025-12-17T03:00:00.000Z', '2025-12-18T03:00:00.000Z', '1038.65', 'BRL', 'Standard', 2, true, 2, '1038.65', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:37:41.702Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1791, 141, 15, 17, '2025-12-18T03:00:00.000Z', '2025-12-19T03:00:00.000Z', '1038.65', 'BRL', 'Standard', 2, true, 2, '1038.65', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:37:41.706Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1792, 141, 15, 17, '2025-12-19T03:00:00.000Z', '2025-12-20T03:00:00.000Z', '770.87', 'BRL', 'Standard', 2, true, 2, '770.87', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:37:57.520Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1793, 141, 15, 17, '2025-12-20T03:00:00.000Z', '2025-12-21T03:00:00.000Z', '770.87', 'BRL', 'Standard', 2, true, 2, '770.87', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:37:57.524Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1794, 141, 15, 17, '2025-12-21T03:00:00.000Z', '2025-12-22T03:00:00.000Z', '770.87', 'BRL', 'Standard', 2, true, 2, '770.87', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:38:27.819Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1795, 141, 15, 17, '2025-12-22T03:00:00.000Z', '2025-12-23T03:00:00.000Z', '770.87', 'BRL', 'Standard', 2, true, 2, '770.87', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:38:27.825Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1796, 141, 15, 17, '2025-12-23T03:00:00.000Z', '2025-12-24T03:00:00.000Z', '1130.61', 'BRL', 'Standard', 2, true, 3, '1130.61', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:38:54.280Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1797, 141, 15, 17, '2025-12-24T03:00:00.000Z', '2025-12-25T03:00:00.000Z', '1130.61', 'BRL', 'Standard', 2, true, 3, '1130.61', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:38:54.284Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1798, 141, 15, 17, '2025-12-25T03:00:00.000Z', '2025-12-26T03:00:00.000Z', '1130.61', 'BRL', 'Standard', 2, true, 3, '1130.61', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:38:54.287Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1799, 141, 15, 17, '2025-12-26T03:00:00.000Z', '2025-12-27T03:00:00.000Z', '2011.60', 'BRL', 'Standard', 2, true, 7, '2011.60', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:39:49.935Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1800, 141, 15, 17, '2025-12-27T03:00:00.000Z', '2025-12-28T03:00:00.000Z', '2011.60', 'BRL', 'Standard', 2, true, 7, '2011.60', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:39:49.939Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1801, 141, 15, 17, '2025-12-28T03:00:00.000Z', '2025-12-29T03:00:00.000Z', '2011.60', 'BRL', 'Standard', 2, true, 7, '2011.60', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:39:49.943Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1802, 141, 15, 17, '2025-12-29T03:00:00.000Z', '2025-12-30T03:00:00.000Z', '2011.60', 'BRL', 'Standard', 2, true, 7, '2011.60', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:39:49.947Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1803, 141, 15, 17, '2025-12-30T03:00:00.000Z', '2025-12-31T03:00:00.000Z', '2011.60', 'BRL', 'Standard', 2, true, 7, '2011.60', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:39:49.950Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1804, 141, 15, 17, '2025-12-31T03:00:00.000Z', '2026-01-01T03:00:00.000Z', '2011.60', 'BRL', 'Standard', 2, true, 7, '2011.60', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:39:49.953Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1805, 141, 15, 17, '2026-01-01T03:00:00.000Z', '2026-01-02T03:00:00.000Z', '2011.60', 'BRL', 'Standard', 2, true, 7, '2011.60', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:39:49.956Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1806, 141, 15, 17, '2026-01-02T03:00:00.000Z', '2026-01-03T03:00:00.000Z', '1744.13', 'BRL', 'Standard', 2, true, 3, '1744.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:40:19.996Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1807, 141, 15, 17, '2026-01-03T03:00:00.000Z', '2026-01-04T03:00:00.000Z', '1744.13', 'BRL', 'Standard', 2, true, 3, '1744.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:40:20.000Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1808, 141, 15, 17, '2026-01-04T03:00:00.000Z', '2026-01-05T03:00:00.000Z', '1744.13', 'BRL', 'Standard', 2, true, 3, '1744.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:40:20.003Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1311, 126, 13, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:16:42.471Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1312, 126, 13, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:16:48.993Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1313, 126, 13, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:16:55.258Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1314, 126, 13, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:17:03.389Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1315, 126, 13, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '330.75', 'BRL', 'Standard', 2, false, 1, '330.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:17:11.196Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1316, 126, 13, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '337.50', 'BRL', 'Standard', 2, false, 1, '337.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:17:21.275Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1317, 126, 13, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '277.88', 'BRL', 'Standard', 2, false, 1, '277.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:17:30.320Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1318, 126, 13, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:17:39.030Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1319, 126, 13, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:17:45.811Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1320, 126, 13, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:17:56.105Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1321, 126, 13, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:18:03.299Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1322, 126, 13, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '330.75', 'BRL', 'Standard', 2, false, 1, '330.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:18:11.234Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1323, 126, 13, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '337.50', 'BRL', 'Standard', 2, false, 1, '337.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:18:20.480Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1324, 126, 13, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '277.88', 'BRL', 'Standard', 2, false, 1, '277.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:18:27.602Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1325, 126, 13, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:18:35.853Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1326, 126, 13, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:18:46.441Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1327, 126, 13, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:18:54.959Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1328, 126, 13, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:19:03.011Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1329, 126, 13, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '285.00', 'BRL', 'Standard', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:19:12.695Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1330, 126, 13, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '320.62', 'BRL', 'Standard', 2, false, 1, '320.62', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:19:21.809Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1331, 126, 13, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '299.25', 'BRL', 'Standard', 2, false, 1, '299.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:19:32.029Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1547, 142, 16, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:01:48.940Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1548, 142, 16, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:01:56.826Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1549, 142, 16, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:02:04.468Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1550, 142, 16, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '420.00', 'BRL', 'Standard', 2, true, 2, '420.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:02:19.214Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1551, 142, 16, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '420.00', 'BRL', 'Standard', 2, true, 2, '420.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:02:19.218Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1552, 142, 16, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:02:25.967Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1553, 142, 16, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:02:32.646Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1554, 142, 16, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:02:40.368Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1809, 141, 15, 17, '2026-01-05T03:00:00.000Z', '2026-01-06T03:00:00.000Z', '936.08', 'BRL', 'Standard', 2, true, 3, '936.08', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:40:57.118Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1810, 141, 15, 17, '2026-01-06T03:00:00.000Z', '2026-01-07T03:00:00.000Z', '936.08', 'BRL', 'Standard', 2, true, 3, '936.08', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:40:57.123Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1811, 141, 15, 17, '2026-01-07T03:00:00.000Z', '2026-01-08T03:00:00.000Z', '936.08', 'BRL', 'Standard', 2, true, 3, '936.08', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:40:57.126Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1812, 141, 15, 17, '2026-01-08T03:00:00.000Z', '2026-01-09T03:00:00.000Z', '942.14', 'BRL', 'Standard', 2, true, 3, '942.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:41:23.229Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1813, 141, 15, 17, '2026-01-09T03:00:00.000Z', '2026-01-10T03:00:00.000Z', '942.14', 'BRL', 'Standard', 2, true, 3, '942.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:41:23.232Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1814, 141, 15, 17, '2026-01-10T03:00:00.000Z', '2026-01-11T03:00:00.000Z', '942.14', 'BRL', 'Standard', 2, true, 3, '942.14', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:41:23.236Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1815, 141, 15, 17, '2026-01-11T03:00:00.000Z', '2026-01-12T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:41:45.062Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1816, 141, 15, 17, '2026-01-12T03:00:00.000Z', '2026-01-13T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:41:45.069Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1817, 141, 15, 17, '2026-01-13T03:00:00.000Z', '2026-01-14T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:41:45.074Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1818, 141, 15, 17, '2026-01-14T03:00:00.000Z', '2026-01-15T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:42:10.495Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1819, 141, 15, 17, '2026-01-15T03:00:00.000Z', '2026-01-16T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:42:10.499Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1820, 141, 15, 17, '2026-01-16T03:00:00.000Z', '2026-01-17T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:42:10.503Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1821, 141, 15, 17, '2026-01-17T03:00:00.000Z', '2026-01-18T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:42:36.819Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1822, 141, 15, 17, '2026-01-18T03:00:00.000Z', '2026-01-19T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:42:36.822Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1823, 141, 15, 17, '2026-01-19T03:00:00.000Z', '2026-01-20T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:42:36.825Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1824, 141, 15, 17, '2026-01-20T03:00:00.000Z', '2026-01-21T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:43:01.197Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1825, 141, 15, 17, '2026-01-21T03:00:00.000Z', '2026-01-22T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:43:01.201Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1826, 141, 15, 17, '2026-01-22T03:00:00.000Z', '2026-01-23T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:43:01.206Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1827, 141, 15, 17, '2026-01-23T03:00:00.000Z', '2026-01-24T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:43:27.242Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1828, 141, 15, 17, '2026-01-24T03:00:00.000Z', '2026-01-25T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:43:27.246Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1829, 141, 15, 17, '2026-01-25T03:00:00.000Z', '2026-01-26T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:43:27.249Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1830, 141, 15, 17, '2026-01-26T03:00:00.000Z', '2026-01-27T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:43:51.451Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1831, 141, 15, 17, '2026-01-27T03:00:00.000Z', '2026-01-28T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:43:51.455Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1832, 141, 15, 17, '2026-01-28T03:00:00.000Z', '2026-01-29T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:43:51.458Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1833, 141, 15, 17, '2026-01-29T03:00:00.000Z', '2026-01-30T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:44:14.440Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1834, 141, 15, 17, '2026-01-30T03:00:00.000Z', '2026-01-31T03:00:00.000Z', '908.81', 'BRL', 'Standard', 2, true, 3, '908.81', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:44:14.444Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1900, 140, 17, 17, '2025-11-12T03:00:00.000Z', '2025-11-13T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:05:51.200Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1901, 140, 17, 17, '2025-11-13T03:00:00.000Z', '2025-11-14T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:06:01.224Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1902, 140, 17, 17, '2025-11-14T03:00:00.000Z', '2025-11-15T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:06:10.993Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1903, 140, 17, 17, '2025-11-15T03:00:00.000Z', '2025-11-16T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:06:19.529Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1904, 140, 17, 17, '2025-11-16T03:00:00.000Z', '2025-11-17T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:06:29.519Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1905, 140, 17, 17, '2025-11-17T03:00:00.000Z', '2025-11-18T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:06:39.533Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1906, 140, 17, 17, '2025-11-18T03:00:00.000Z', '2025-11-19T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:06:49.710Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1907, 140, 17, 17, '2025-11-19T03:00:00.000Z', '2025-11-20T03:00:00.000Z', '346.62', 'BRL', 'Standard', 2, false, 1, '346.62', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:06:58.869Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1908, 140, 17, 17, '2025-11-20T03:00:00.000Z', '2025-11-21T03:00:00.000Z', '1373.71', 'BRL', 'Standard', 2, true, 3, '1373.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:07:23.628Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1909, 140, 17, 17, '2025-11-21T03:00:00.000Z', '2025-11-22T03:00:00.000Z', '1373.71', 'BRL', 'Standard', 2, true, 3, '1373.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:07:23.633Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1910, 140, 17, 17, '2025-11-22T03:00:00.000Z', '2025-11-23T03:00:00.000Z', '1373.71', 'BRL', 'Standard', 2, true, 3, '1373.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:07:23.637Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1911, 140, 17, 17, '2025-11-23T03:00:00.000Z', '2025-11-24T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:07:31.054Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1912, 140, 17, 17, '2025-11-24T03:00:00.000Z', '2025-11-25T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:07:38.863Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1913, 140, 17, 17, '2025-11-25T03:00:00.000Z', '2025-11-26T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:07:49.504Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1914, 140, 17, 17, '2025-11-26T03:00:00.000Z', '2025-11-27T03:00:00.000Z', '330.12', 'BRL', 'Standard', 2, false, 1, '330.12', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:07:57.964Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1332, 125, 17, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:19:42.706Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1333, 125, 17, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:19:51.541Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1334, 125, 17, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:20:02.333Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1335, 125, 17, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:20:10.131Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1336, 125, 17, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '364.57', 'BRL', 'Standard', 2, false, 1, '364.57', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:20:20.402Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1337, 125, 17, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '460.16', 'BRL', 'Standard', 2, false, 1, '460.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:20:31.931Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1338, 125, 17, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '274.10', 'BRL', 'Standard', 2, false, 1, '274.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:20:41.551Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1339, 125, 17, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:20:49.832Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1340, 125, 17, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:21:00.333Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1341, 125, 17, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:21:11.524Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1342, 125, 17, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:21:21.287Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1343, 125, 17, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '364.57', 'BRL', 'Standard', 2, false, 1, '364.57', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:21:29.225Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1344, 125, 17, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '532.19', 'BRL', 'Standard', 2, false, 1, '532.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:21:39.153Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1345, 125, 17, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:21:49.859Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1346, 125, 17, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:22:01.524Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1347, 125, 17, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:22:12.705Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1348, 125, 17, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:22:22.389Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1349, 125, 17, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:22:30.093Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1350, 125, 17, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '382.36', 'BRL', 'Standard', 2, false, 1, '382.36', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:22:40.540Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1351, 125, 17, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '460.16', 'BRL', 'Standard', 2, false, 1, '460.16', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:22:47.923Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1352, 125, 17, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '261.09', 'BRL', 'Standard', 2, false, 1, '261.09', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:22:56.808Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1555, 142, 16, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:02:49.110Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1556, 142, 16, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:02:55.219Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1557, 142, 16, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '350.00', 'BRL', 'Standard', 2, true, 2, '350.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:03:11.953Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1558, 142, 16, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '350.00', 'BRL', 'Standard', 2, true, 2, '350.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:03:11.957Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1559, 142, 16, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:03:21.111Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1560, 142, 16, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:03:28.836Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1561, 142, 16, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:03:35.407Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1562, 142, 16, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:03:44.902Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1563, 142, 16, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:03:53.043Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1564, 142, 16, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '350.00', 'BRL', 'Standard', 2, true, 2, '350.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:04:06.341Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1565, 142, 16, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '350.00', 'BRL', 'Standard', 2, true, 2, '350.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:04:06.345Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1566, 142, 16, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:04:14.315Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1567, 142, 16, 17, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:04:21.322Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1568, 142, 16, 17, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '283.50', 'BRL', 'Standard', 2, false, 1, '283.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:04:29.497Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1569, 142, 16, 17, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:04:35.587Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1570, 142, 16, 17, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:04:44.413Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1571, 142, 16, 17, '2025-10-03T03:00:00.000Z', '2025-10-04T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:04:58.261Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1572, 142, 16, 17, '2025-10-04T03:00:00.000Z', '2025-10-05T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:04:58.265Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1573, 142, 16, 17, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:05:06.353Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1574, 142, 16, 17, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:05:16.027Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1575, 142, 16, 17, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:05:24.002Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1576, 142, 16, 17, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:05:30.238Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1577, 142, 16, 17, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:05:40.035Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1578, 142, 16, 17, '2025-10-10T03:00:00.000Z', '2025-10-11T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:05:59.355Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1579, 142, 16, 17, '2025-10-11T03:00:00.000Z', '2025-10-12T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:05:59.360Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1580, 142, 16, 17, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:06:06.647Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1581, 142, 16, 17, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:06:15.491Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1582, 142, 16, 17, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:06:25.467Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1583, 142, 16, 17, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:06:34.727Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1584, 142, 16, 17, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:06:43.753Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (902, 13, 1, 2, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '360.00', 'BRL', 'Standard', 2, false, 1, '360.00', 'AVAILABLE', 'JS_VARS', '2025-09-08T17:33:46.242Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (903, 13, 1, 2, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '360.00', 'BRL', 'Standard', 2, false, 1, '360.00', 'AVAILABLE', 'JS_VARS', '2025-09-08T17:33:56.569Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (904, 13, 1, 2, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '360.00', 'BRL', 'Standard', 2, false, 1, '360.00', 'AVAILABLE', 'JS_VARS', '2025-09-08T17:34:03.957Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (905, 13, 1, 2, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '360.00', 'BRL', 'Standard', 2, false, 1, '360.00', 'AVAILABLE', 'JS_VARS', '2025-09-08T17:34:10.754Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1353, 124, 12, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:23:09.425Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1354, 124, 12, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:23:15.440Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1355, 124, 12, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:23:25.545Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1356, 124, 12, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '188.10', 'BRL', 'Standard', 2, false, 1, '188.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:23:33.100Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1357, 124, 12, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:23:48.868Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1358, 124, 12, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:23:48.876Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1359, 124, 12, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:23:57.542Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1360, 124, 12, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:24:05.779Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1361, 124, 12, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '188.10', 'BRL', 'Standard', 2, false, 1, '188.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:24:14.609Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1362, 124, 12, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:24:24.291Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1363, 124, 12, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:24:33.626Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1364, 124, 12, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '329.85', 'BRL', 'Standard', 2, true, 2, '329.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:24:49.314Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1365, 124, 12, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '329.85', 'BRL', 'Standard', 2, true, 2, '329.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:24:52.708Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1366, 124, 12, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:24:59.767Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1367, 124, 12, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:25:08.632Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1368, 124, 12, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:25:18.118Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1369, 124, 12, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:25:30.818Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1370, 124, 12, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:25:39.514Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1371, 124, 12, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:25:53.752Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1372, 124, 12, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:25:53.756Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1373, 124, 12, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T00:26:03.679Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1585, 142, 16, 17, '2025-10-17T03:00:00.000Z', '2025-10-18T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:06:59.616Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1586, 142, 16, 17, '2025-10-18T03:00:00.000Z', '2025-10-19T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:06:59.620Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1587, 142, 16, 17, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '255.95', 'BRL', 'Standard', 2, false, 1, '255.95', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:07:06.707Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1588, 142, 16, 17, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:07:13.482Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1589, 142, 16, 17, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:07:23.175Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1590, 142, 16, 17, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:07:35.277Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1591, 142, 16, 17, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:07:43.260Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1592, 142, 16, 17, '2025-10-24T03:00:00.000Z', '2025-10-25T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:07:55.364Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1593, 142, 16, 17, '2025-10-25T03:00:00.000Z', '2025-10-26T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:07:55.368Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1594, 142, 16, 17, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:08:03.567Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1595, 142, 16, 17, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:08:13.293Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1596, 142, 16, 17, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:08:36.014Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1597, 142, 16, 17, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:08:42.307Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1598, 142, 16, 17, '2025-10-30T03:00:00.000Z', '2025-10-31T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:08:50.215Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1599, 142, 16, 17, '2025-10-31T03:00:00.000Z', '2025-11-01T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:09:08.317Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1600, 142, 16, 17, '2025-11-01T03:00:00.000Z', '2025-11-02T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:09:08.322Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1601, 142, 16, 17, '2025-11-02T03:00:00.000Z', '2025-11-03T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:09:17.192Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1602, 142, 16, 17, '2025-11-03T03:00:00.000Z', '2025-11-04T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:09:23.400Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1603, 142, 16, 17, '2025-11-04T03:00:00.000Z', '2025-11-05T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:09:31.404Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1604, 142, 16, 17, '2025-11-05T03:00:00.000Z', '2025-11-06T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:09:39.231Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1605, 142, 16, 17, '2025-11-06T03:00:00.000Z', '2025-11-07T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:09:47.641Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1606, 142, 16, 17, '2025-11-07T03:00:00.000Z', '2025-11-08T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:10:07.594Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1607, 142, 16, 17, '2025-11-08T03:00:00.000Z', '2025-11-09T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:10:07.598Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1608, 142, 16, 17, '2025-11-09T03:00:00.000Z', '2025-11-10T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:10:15.451Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1609, 142, 16, 17, '2025-11-10T03:00:00.000Z', '2025-11-11T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:10:21.909Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1610, 142, 16, 17, '2025-11-11T03:00:00.000Z', '2025-11-12T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:10:32.152Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1611, 142, 16, 17, '2025-11-12T03:00:00.000Z', '2025-11-13T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:10:40.777Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1612, 142, 16, 17, '2025-11-13T03:00:00.000Z', '2025-11-14T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:10:49.036Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1613, 142, 16, 17, '2025-11-14T03:00:00.000Z', '2025-11-15T03:00:00.000Z', '327.55', 'BRL', 'Standard', 2, true, 2, '327.55', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:11:02.282Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1614, 142, 16, 17, '2025-11-15T03:00:00.000Z', '2025-11-16T03:00:00.000Z', '327.55', 'BRL', 'Standard', 2, true, 2, '327.55', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:11:02.286Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1615, 142, 16, 17, '2025-11-16T03:00:00.000Z', '2025-11-17T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:11:22.987Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1616, 142, 16, 17, '2025-11-17T03:00:00.000Z', '2025-11-18T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:11:29.861Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1617, 142, 16, 17, '2025-11-18T03:00:00.000Z', '2025-11-19T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:11:40.055Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1618, 142, 16, 17, '2025-11-19T03:00:00.000Z', '2025-11-20T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:11:48.063Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1619, 142, 16, 17, '2025-11-20T03:00:00.000Z', '2025-11-21T03:00:00.000Z', '342.40', 'BRL', 'Standard', 2, true, 3, '342.40', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:12:13.756Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1620, 142, 16, 17, '2025-11-21T03:00:00.000Z', '2025-11-22T03:00:00.000Z', '342.40', 'BRL', 'Standard', 2, true, 3, '342.40', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:12:13.760Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1621, 142, 16, 17, '2025-11-22T03:00:00.000Z', '2025-11-23T03:00:00.000Z', '342.40', 'BRL', 'Standard', 2, true, 3, '342.40', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:12:13.763Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1622, 142, 16, 17, '2025-11-23T03:00:00.000Z', '2025-11-24T03:00:00.000Z', '326.40', 'BRL', 'Standard', 2, false, 1, '326.40', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:12:20.661Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1623, 142, 16, 17, '2025-11-24T03:00:00.000Z', '2025-11-25T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:12:29.672Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1624, 142, 16, 17, '2025-11-25T03:00:00.000Z', '2025-11-26T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:12:39.284Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1625, 142, 16, 17, '2025-11-26T03:00:00.000Z', '2025-11-27T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:12:45.620Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1626, 142, 16, 17, '2025-11-27T03:00:00.000Z', '2025-11-28T03:00:00.000Z', '243.76', 'BRL', 'Standard', 2, false, 1, '243.76', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:12:52.563Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1627, 142, 16, 17, '2025-11-28T03:00:00.000Z', '2025-11-29T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:13:09.680Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1628, 142, 16, 17, '2025-11-29T03:00:00.000Z', '2025-11-30T03:00:00.000Z', '304.71', 'BRL', 'Standard', 2, true, 2, '304.71', 'AVAILABLE', 'JS_VARS', '2025-09-09T03:13:09.684Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1919, 140, 17, 17, '2025-12-01T03:00:00.000Z', '2025-12-02T03:00:00.000Z', '388.13', 'BRL', 'Standard', 2, false, 1, '388.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:08:44.230Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1920, 140, 17, 17, '2025-12-02T03:00:00.000Z', '2025-12-03T03:00:00.000Z', '388.13', 'BRL', 'Standard', 2, false, 1, '388.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:08:52.404Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1921, 140, 17, 17, '2025-12-03T03:00:00.000Z', '2025-12-04T03:00:00.000Z', '388.13', 'BRL', 'Standard', 2, false, 1, '388.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:08:59.841Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1922, 140, 17, 17, '2025-12-04T03:00:00.000Z', '2025-12-05T03:00:00.000Z', '388.13', 'BRL', 'Standard', 2, false, 1, '388.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:09:10.287Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1923, 140, 17, 17, '2025-12-05T03:00:00.000Z', '2025-12-06T03:00:00.000Z', '542.41', 'BRL', 'Standard', 2, false, 1, '542.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:09:18.529Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1924, 140, 17, 17, '2025-12-06T03:00:00.000Z', '2025-12-07T03:00:00.000Z', '652.45', 'BRL', 'Standard', 2, false, 1, '652.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:09:26.773Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1925, 140, 17, 17, '2025-12-07T03:00:00.000Z', '2025-12-08T03:00:00.000Z', '388.13', 'BRL', 'Standard', 2, false, 1, '388.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:09:36.944Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1926, 140, 17, 17, '2025-12-08T03:00:00.000Z', '2025-12-09T03:00:00.000Z', '388.13', 'BRL', 'Standard', 2, false, 1, '388.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:09:47.209Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1927, 140, 17, 17, '2025-12-09T03:00:00.000Z', '2025-12-10T03:00:00.000Z', '388.13', 'BRL', 'Standard', 2, false, 1, '388.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:09:55.015Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1928, 140, 17, 17, '2025-12-10T03:00:00.000Z', '2025-12-11T03:00:00.000Z', '388.13', 'BRL', 'Standard', 2, false, 1, '388.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:10:02.692Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1929, 140, 17, 17, '2025-12-11T03:00:00.000Z', '2025-12-12T03:00:00.000Z', '388.13', 'BRL', 'Standard', 2, false, 1, '388.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:10:10.699Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1930, 140, 17, 17, '2025-12-12T03:00:00.000Z', '2025-12-13T03:00:00.000Z', '542.41', 'BRL', 'Standard', 2, false, 1, '542.41', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:10:18.437Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1931, 140, 17, 17, '2025-12-13T03:00:00.000Z', '2025-12-14T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:10:26.083Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1932, 140, 17, 17, '2025-12-14T03:00:00.000Z', '2025-12-15T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:10:35.125Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1933, 140, 17, 17, '2025-12-15T03:00:00.000Z', '2025-12-16T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:10:45.935Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1934, 140, 17, 17, '2025-12-16T03:00:00.000Z', '2025-12-17T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:10:55.679Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1935, 140, 17, 17, '2025-12-17T03:00:00.000Z', '2025-12-18T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:11:06.021Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1936, 140, 17, 17, '2025-12-18T03:00:00.000Z', '2025-12-19T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:11:15.080Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1937, 140, 17, 17, '2025-12-19T03:00:00.000Z', '2025-12-20T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:11:23.374Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1938, 140, 17, 17, '2025-12-20T03:00:00.000Z', '2025-12-21T03:00:00.000Z', '957.00', 'BRL', 'Standard', 2, false, 1, '957.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:11:30.483Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1939, 140, 17, 17, '2025-12-21T03:00:00.000Z', '2025-12-22T03:00:00.000Z', '1033.56', 'BRL', 'Standard', 2, false, 1, '1033.56', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:11:39.536Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1940, 140, 17, 17, '2025-12-22T03:00:00.000Z', '2025-12-23T03:00:00.000Z', '1033.56', 'BRL', 'Standard', 2, false, 1, '1033.56', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:11:46.578Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1941, 140, 17, 17, '2025-12-23T03:00:00.000Z', '2025-12-24T03:00:00.000Z', '1033.56', 'BRL', 'Standard', 2, false, 1, '1033.56', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:11:53.987Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1942, 140, 17, 17, '2025-12-24T03:00:00.000Z', '2025-12-25T03:00:00.000Z', '1033.56', 'BRL', 'Standard', 2, false, 1, '1033.56', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:12:01.921Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1943, 140, 17, 17, '2025-12-25T03:00:00.000Z', '2025-12-26T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:12:10.540Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1944, 140, 17, 17, '2025-12-26T03:00:00.000Z', '2025-12-27T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:12:19.281Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1945, 140, 17, 17, '2025-12-27T03:00:00.000Z', '2025-12-28T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:12:27.390Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1946, 140, 17, 17, '2025-12-28T03:00:00.000Z', '2025-12-29T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:12:37.831Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1947, 140, 17, 17, '2025-12-29T03:00:00.000Z', '2025-12-30T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:12:46.224Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1948, 140, 17, 17, '2025-12-30T03:00:00.000Z', '2025-12-31T03:00:00.000Z', '5563.45', 'BRL', 'Standard', 2, true, 2, '5563.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:13:02.726Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1949, 140, 17, 17, '2025-12-31T03:00:00.000Z', '2026-01-01T03:00:00.000Z', '5563.45', 'BRL', 'Standard', 2, true, 2, '5563.45', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:13:02.729Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1950, 140, 17, 17, '2026-01-04T03:00:00.000Z', '2026-01-05T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:16:05.328Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1951, 140, 17, 17, '2026-01-05T03:00:00.000Z', '2026-01-06T03:00:00.000Z', '861.30', 'BRL', 'Standard', 2, false, 1, '861.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:16:16.750Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1952, 140, 17, 17, '2026-01-06T03:00:00.000Z', '2026-01-07T03:00:00.000Z', '861.30', 'BRL', 'Standard', 2, false, 1, '861.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:16:23.967Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1953, 140, 17, 17, '2026-01-07T03:00:00.000Z', '2026-01-08T03:00:00.000Z', '861.30', 'BRL', 'Standard', 2, false, 1, '861.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:16:31.924Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1954, 140, 17, 17, '2026-01-08T03:00:00.000Z', '2026-01-09T03:00:00.000Z', '957.00', 'BRL', 'Standard', 2, false, 1, '957.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:16:39.144Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1955, 140, 17, 17, '2026-01-09T03:00:00.000Z', '2026-01-10T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:16:48.539Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1956, 140, 17, 17, '2026-01-10T03:00:00.000Z', '2026-01-11T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:16:57.633Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1957, 140, 17, 17, '2026-01-11T03:00:00.000Z', '2026-01-12T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:17:07.643Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1958, 140, 17, 17, '2026-01-12T03:00:00.000Z', '2026-01-13T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:17:15.483Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1959, 140, 17, 17, '2026-01-13T03:00:00.000Z', '2026-01-14T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:17:30.982Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1960, 140, 17, 17, '2026-01-14T03:00:00.000Z', '2026-01-15T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:17:40.540Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1961, 140, 17, 17, '2026-01-15T03:00:00.000Z', '2026-01-16T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:17:48.366Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1962, 140, 17, 17, '2026-01-16T03:00:00.000Z', '2026-01-17T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:17:58.896Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1963, 140, 17, 17, '2026-01-17T03:00:00.000Z', '2026-01-18T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:18:10.222Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1964, 140, 17, 17, '2026-01-18T03:00:00.000Z', '2026-01-19T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:18:21.803Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1965, 140, 17, 17, '2026-01-19T03:00:00.000Z', '2026-01-20T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:18:30.136Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1966, 140, 17, 17, '2026-01-20T03:00:00.000Z', '2026-01-21T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:18:40.049Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1967, 140, 17, 17, '2026-01-21T03:00:00.000Z', '2026-01-22T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:18:49.414Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1968, 140, 17, 17, '2026-01-22T03:00:00.000Z', '2026-01-23T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:18:56.739Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1969, 140, 17, 17, '2026-01-23T03:00:00.000Z', '2026-01-24T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:19:05.117Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1970, 140, 17, 17, '2026-01-24T03:00:00.000Z', '2026-01-25T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:19:13.474Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1971, 140, 17, 17, '2026-01-25T03:00:00.000Z', '2026-01-26T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:19:24.305Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1972, 140, 17, 17, '2026-01-26T03:00:00.000Z', '2026-01-27T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:19:32.876Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1973, 140, 17, 17, '2026-01-27T03:00:00.000Z', '2026-01-28T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:19:42.267Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1974, 140, 17, 17, '2026-01-28T03:00:00.000Z', '2026-01-29T03:00:00.000Z', '782.27', 'BRL', 'Standard', 2, false, 1, '782.27', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:19:50.126Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1975, 140, 17, 17, '2026-01-29T03:00:00.000Z', '2026-01-30T03:00:00.000Z', '869.19', 'BRL', 'Standard', 2, false, 1, '869.19', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:20:00.256Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1976, 139, 13, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:21:07.322Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1977, 139, 13, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:21:16.627Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1978, 139, 13, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:21:25.846Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1979, 139, 13, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '330.75', 'BRL', 'Standard', 2, false, 1, '330.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:21:32.526Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1980, 139, 13, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '337.50', 'BRL', 'Standard', 2, false, 1, '337.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:21:40.116Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1981, 139, 13, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '277.88', 'BRL', 'Standard', 2, false, 1, '277.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:21:48.360Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1982, 139, 13, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:21:57.688Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1983, 139, 13, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:22:07.313Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1984, 139, 13, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:22:17.521Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1985, 139, 13, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:22:28.921Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1986, 139, 13, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '330.75', 'BRL', 'Standard', 2, false, 1, '330.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:22:38.838Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1987, 139, 13, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '337.50', 'BRL', 'Standard', 2, false, 1, '337.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:22:47.988Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1988, 139, 13, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '277.88', 'BRL', 'Standard', 2, false, 1, '277.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:22:54.779Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1989, 139, 13, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:23:02.805Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1990, 139, 13, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:23:10.760Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1991, 139, 13, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:23:19.600Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1992, 139, 13, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:23:27.896Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1993, 139, 13, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '285.00', 'BRL', 'Standard', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:23:36.425Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1994, 139, 13, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '320.62', 'BRL', 'Standard', 2, false, 1, '320.62', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:23:43.944Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1995, 139, 13, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '299.25', 'BRL', 'Standard', 2, false, 1, '299.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:23:52.309Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1996, 139, 13, 17, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:24:02.063Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1997, 139, 13, 17, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '263.63', 'BRL', 'Standard', 2, false, 1, '263.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:24:12.934Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1998, 139, 13, 17, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '277.88', 'BRL', 'Standard', 2, false, 1, '277.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:24:20.872Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (1999, 139, 13, 17, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '277.88', 'BRL', 'Standard', 2, false, 1, '277.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:24:28.311Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2000, 139, 13, 17, '2025-10-03T03:00:00.000Z', '2025-10-04T03:00:00.000Z', '299.25', 'BRL', 'Standard', 2, true, 2, '299.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:24:53.672Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2001, 139, 13, 17, '2025-10-04T03:00:00.000Z', '2025-10-05T03:00:00.000Z', '299.25', 'BRL', 'Standard', 2, true, 2, '299.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:24:53.676Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2002, 139, 13, 17, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '277.88', 'BRL', 'Standard', 2, false, 1, '277.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:25:03.380Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2003, 139, 13, 17, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '277.88', 'BRL', 'Standard', 2, false, 1, '277.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:25:10.650Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2004, 139, 13, 17, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:25:18.541Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2005, 139, 13, 17, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:25:26.149Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2006, 139, 13, 17, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:25:34.946Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2007, 139, 13, 17, '2025-10-10T03:00:00.000Z', '2025-10-11T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, true, 2, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:25:50.444Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2008, 139, 13, 17, '2025-10-11T03:00:00.000Z', '2025-10-12T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, true, 2, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:25:50.449Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2009, 139, 13, 17, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:25:58.131Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2010, 139, 13, 17, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:26:05.554Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2011, 139, 13, 17, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:26:14.430Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2012, 139, 13, 17, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:26:21.926Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2013, 139, 13, 17, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:26:31.610Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2014, 139, 13, 17, '2025-10-17T03:00:00.000Z', '2025-10-18T03:00:00.000Z', '448.88', 'BRL', 'Standard', 2, true, 2, '448.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:26:44.297Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2015, 139, 13, 17, '2025-10-18T03:00:00.000Z', '2025-10-19T03:00:00.000Z', '448.88', 'BRL', 'Standard', 2, true, 2, '448.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:26:44.301Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2016, 139, 13, 17, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '448.88', 'BRL', 'Standard', 2, false, 1, '448.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:26:52.066Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2017, 139, 13, 17, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:27:00.099Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2018, 139, 13, 17, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:27:09.424Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2019, 139, 13, 17, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:27:19.685Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2020, 139, 13, 17, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:27:26.825Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2021, 139, 13, 17, '2025-10-24T03:00:00.000Z', '2025-10-25T03:00:00.000Z', '342.00', 'BRL', 'Standard', 2, true, 2, '342.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:27:42.206Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2022, 139, 13, 17, '2025-10-25T03:00:00.000Z', '2025-10-26T03:00:00.000Z', '342.00', 'BRL', 'Standard', 2, true, 2, '342.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:27:42.210Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2023, 139, 13, 17, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '342.00', 'BRL', 'Standard', 2, false, 1, '342.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:27:48.900Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2024, 139, 13, 17, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:27:55.337Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2025, 139, 13, 17, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:28:03.583Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2026, 139, 13, 17, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:28:11.333Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2027, 139, 13, 17, '2025-10-30T03:00:00.000Z', '2025-10-31T03:00:00.000Z', '320.63', 'BRL', 'Standard', 2, false, 1, '320.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:28:20.591Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2028, 139, 13, 17, '2025-10-31T03:00:00.000Z', '2025-11-01T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, true, 2, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:28:34.897Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2029, 139, 13, 17, '2025-11-01T03:00:00.000Z', '2025-11-02T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, true, 2, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:28:34.901Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2030, 139, 13, 17, '2025-11-02T03:00:00.000Z', '2025-11-03T03:00:00.000Z', '375.00', 'BRL', 'Standard', 2, false, 1, '375.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:28:43.569Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2031, 139, 13, 17, '2025-11-03T03:00:00.000Z', '2025-11-04T03:00:00.000Z', '342.00', 'BRL', 'Standard', 2, false, 1, '342.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:28:51.779Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2032, 139, 13, 17, '2025-11-04T03:00:00.000Z', '2025-11-05T03:00:00.000Z', '342.00', 'BRL', 'Standard', 2, false, 1, '342.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:28:59.155Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2033, 139, 13, 17, '2025-11-05T03:00:00.000Z', '2025-11-06T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:29:06.310Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2034, 139, 13, 17, '2025-11-06T03:00:00.000Z', '2025-11-07T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:29:15.593Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2035, 139, 13, 17, '2025-11-07T03:00:00.000Z', '2025-11-08T03:00:00.000Z', '598.50', 'BRL', 'Standard', 2, false, 1, '598.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:29:24.338Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2036, 139, 13, 17, '2025-11-08T03:00:00.000Z', '2025-11-09T03:00:00.000Z', '598.50', 'BRL', 'Standard', 2, false, 1, '598.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:29:33.453Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2037, 139, 13, 17, '2025-11-09T03:00:00.000Z', '2025-11-10T03:00:00.000Z', '363.38', 'BRL', 'Standard', 2, false, 1, '363.38', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:29:40.178Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2038, 139, 13, 17, '2025-11-10T03:00:00.000Z', '2025-11-11T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:29:49.723Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2039, 139, 13, 17, '2025-11-11T03:00:00.000Z', '2025-11-12T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:29:57.730Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2040, 139, 13, 17, '2025-11-12T03:00:00.000Z', '2025-11-13T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:30:07.856Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2041, 139, 13, 17, '2025-11-13T03:00:00.000Z', '2025-11-14T03:00:00.000Z', '378.75', 'BRL', 'Standard', 2, true, 2, '378.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:30:22.620Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2042, 139, 13, 17, '2025-11-14T03:00:00.000Z', '2025-11-15T03:00:00.000Z', '378.75', 'BRL', 'Standard', 2, true, 2, '378.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:30:22.624Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2043, 139, 13, 17, '2025-11-15T03:00:00.000Z', '2025-11-16T03:00:00.000Z', '401.25', 'BRL', 'Standard', 2, true, 2, '401.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:30:40.522Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2044, 139, 13, 17, '2025-11-16T03:00:00.000Z', '2025-11-17T03:00:00.000Z', '401.25', 'BRL', 'Standard', 2, true, 2, '401.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:30:40.527Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2045, 139, 13, 17, '2025-11-17T03:00:00.000Z', '2025-11-18T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:30:47.698Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2046, 139, 13, 17, '2025-11-18T03:00:00.000Z', '2025-11-19T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:30:58.590Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2047, 139, 13, 17, '2025-11-19T03:00:00.000Z', '2025-11-20T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:31:08.535Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2048, 139, 13, 17, '2025-11-23T03:00:00.000Z', '2025-11-24T03:00:00.000Z', '448.88', 'BRL', 'Standard', 2, false, 1, '448.88', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:34:22.214Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2049, 139, 13, 17, '2025-11-24T03:00:00.000Z', '2025-11-25T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:34:30.173Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2050, 139, 13, 17, '2025-11-25T03:00:00.000Z', '2025-11-26T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:34:40.432Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2051, 139, 13, 17, '2025-11-26T03:00:00.000Z', '2025-11-27T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:34:46.988Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2052, 139, 13, 17, '2025-11-27T03:00:00.000Z', '2025-11-28T03:00:00.000Z', '349.13', 'BRL', 'Standard', 2, false, 1, '349.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:34:53.516Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2053, 139, 13, 17, '2025-11-28T03:00:00.000Z', '2025-11-29T03:00:00.000Z', '363.38', 'BRL', 'Standard', 2, true, 2, '363.38', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:35:09.331Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2054, 139, 13, 17, '2025-11-29T03:00:00.000Z', '2025-11-30T03:00:00.000Z', '363.38', 'BRL', 'Standard', 2, true, 2, '363.38', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:35:09.335Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2055, 139, 13, 17, '2025-11-30T03:00:00.000Z', '2025-12-01T03:00:00.000Z', '363.38', 'BRL', 'Standard', 2, false, 1, '363.38', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:35:25.581Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2056, 139, 13, 17, '2025-12-01T03:00:00.000Z', '2025-12-02T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:35:32.340Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2057, 139, 13, 17, '2025-12-02T03:00:00.000Z', '2025-12-03T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:35:42.314Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2058, 139, 13, 17, '2025-12-03T03:00:00.000Z', '2025-12-04T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:35:50.006Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2059, 139, 13, 17, '2025-12-04T03:00:00.000Z', '2025-12-05T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:35:59.615Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2060, 139, 13, 17, '2025-12-05T03:00:00.000Z', '2025-12-06T03:00:00.000Z', '377.63', 'BRL', 'Standard', 2, false, 1, '377.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:36:06.656Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2061, 139, 13, 17, '2025-12-06T03:00:00.000Z', '2025-12-07T03:00:00.000Z', '406.13', 'BRL', 'Standard', 2, false, 1, '406.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:36:25.059Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2062, 139, 13, 17, '2025-12-07T03:00:00.000Z', '2025-12-08T03:00:00.000Z', '406.13', 'BRL', 'Standard', 2, false, 1, '406.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:36:33.249Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2063, 139, 13, 17, '2025-12-08T03:00:00.000Z', '2025-12-09T03:00:00.000Z', '406.13', 'BRL', 'Standard', 2, false, 1, '406.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:36:43.045Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2064, 139, 13, 17, '2025-12-09T03:00:00.000Z', '2025-12-10T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:36:50.772Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2065, 139, 13, 17, '2025-12-10T03:00:00.000Z', '2025-12-11T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:36:59.110Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2066, 139, 13, 17, '2025-12-11T03:00:00.000Z', '2025-12-12T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:37:12.192Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2067, 139, 13, 17, '2025-12-12T03:00:00.000Z', '2025-12-13T03:00:00.000Z', '377.63', 'BRL', 'Standard', 2, false, 1, '377.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:37:18.948Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2068, 139, 13, 17, '2025-12-13T03:00:00.000Z', '2025-12-14T03:00:00.000Z', '377.63', 'BRL', 'Standard', 2, false, 1, '377.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:37:29.263Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2069, 139, 13, 17, '2025-12-14T03:00:00.000Z', '2025-12-15T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:37:36.728Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2070, 139, 13, 17, '2025-12-15T03:00:00.000Z', '2025-12-16T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:37:45.681Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2071, 139, 13, 17, '2025-12-16T03:00:00.000Z', '2025-12-17T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:37:55.024Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2072, 139, 13, 17, '2025-12-17T03:00:00.000Z', '2025-12-18T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:38:04.847Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2073, 139, 13, 17, '2025-12-18T03:00:00.000Z', '2025-12-19T03:00:00.000Z', '356.25', 'BRL', 'Standard', 2, false, 1, '356.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:38:14.253Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2074, 139, 13, 17, '2025-12-19T03:00:00.000Z', '2025-12-20T03:00:00.000Z', '570.00', 'BRL', 'Standard', 2, false, 1, '570.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:38:23.063Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2075, 139, 13, 17, '2026-01-07T03:00:00.000Z', '2026-01-08T03:00:00.000Z', '662.63', 'BRL', 'Standard', 2, true, 4, '662.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:56:04.904Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2076, 139, 13, 17, '2026-01-08T03:00:00.000Z', '2026-01-09T03:00:00.000Z', '662.63', 'BRL', 'Standard', 2, true, 4, '662.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:56:04.915Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2077, 139, 13, 17, '2026-01-09T03:00:00.000Z', '2026-01-10T03:00:00.000Z', '662.63', 'BRL', 'Standard', 2, true, 4, '662.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:56:04.918Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2078, 139, 13, 17, '2026-01-10T03:00:00.000Z', '2026-01-11T03:00:00.000Z', '662.63', 'BRL', 'Standard', 2, true, 4, '662.63', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:56:04.922Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2079, 139, 13, 17, '2026-01-11T03:00:00.000Z', '2026-01-12T03:00:00.000Z', '623.68', 'BRL', 'Standard', 2, true, 3, '623.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:56:30.977Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2080, 139, 13, 17, '2026-01-12T03:00:00.000Z', '2026-01-13T03:00:00.000Z', '623.68', 'BRL', 'Standard', 2, true, 3, '623.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:56:30.987Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2081, 139, 13, 17, '2026-01-13T03:00:00.000Z', '2026-01-14T03:00:00.000Z', '623.68', 'BRL', 'Standard', 2, true, 3, '623.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:56:30.992Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2082, 139, 13, 17, '2026-01-14T03:00:00.000Z', '2026-01-15T03:00:00.000Z', '641.25', 'BRL', 'Standard', 2, true, 4, '641.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:57:10.787Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2083, 139, 13, 17, '2026-01-15T03:00:00.000Z', '2026-01-16T03:00:00.000Z', '641.25', 'BRL', 'Standard', 2, true, 4, '641.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:57:10.794Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2084, 139, 13, 17, '2026-01-16T03:00:00.000Z', '2026-01-17T03:00:00.000Z', '641.25', 'BRL', 'Standard', 2, true, 4, '641.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:57:10.798Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2085, 139, 13, 17, '2026-01-17T03:00:00.000Z', '2026-01-18T03:00:00.000Z', '641.25', 'BRL', 'Standard', 2, true, 4, '641.25', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:57:10.801Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2086, 139, 13, 17, '2026-01-18T03:00:00.000Z', '2026-01-19T03:00:00.000Z', '604.68', 'BRL', 'Standard', 2, true, 3, '604.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:57:33.639Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2087, 139, 13, 17, '2026-01-19T03:00:00.000Z', '2026-01-20T03:00:00.000Z', '604.68', 'BRL', 'Standard', 2, true, 3, '604.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:57:33.644Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2088, 139, 13, 17, '2026-01-20T03:00:00.000Z', '2026-01-21T03:00:00.000Z', '604.68', 'BRL', 'Standard', 2, true, 3, '604.68', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:57:33.647Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2089, 139, 13, 17, '2026-01-21T03:00:00.000Z', '2026-01-22T03:00:00.000Z', '627.00', 'BRL', 'Standard', 2, true, 4, '627.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:58:03.106Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2090, 139, 13, 17, '2026-01-22T03:00:00.000Z', '2026-01-23T03:00:00.000Z', '627.00', 'BRL', 'Standard', 2, true, 4, '627.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:58:03.111Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2091, 139, 13, 17, '2026-01-23T03:00:00.000Z', '2026-01-24T03:00:00.000Z', '627.00', 'BRL', 'Standard', 2, true, 4, '627.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:58:03.115Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2092, 139, 13, 17, '2026-01-24T03:00:00.000Z', '2026-01-25T03:00:00.000Z', '627.00', 'BRL', 'Standard', 2, true, 4, '627.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:58:03.119Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2093, 139, 13, 17, '2026-01-25T03:00:00.000Z', '2026-01-26T03:00:00.000Z', '595.18', 'BRL', 'Standard', 2, true, 3, '595.18', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:58:30.253Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2094, 139, 13, 17, '2026-01-26T03:00:00.000Z', '2026-01-27T03:00:00.000Z', '595.18', 'BRL', 'Standard', 2, true, 3, '595.18', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:58:30.258Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2095, 139, 13, 17, '2026-01-27T03:00:00.000Z', '2026-01-28T03:00:00.000Z', '595.18', 'BRL', 'Standard', 2, true, 3, '595.18', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:58:30.261Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2096, 139, 13, 17, '2026-01-28T03:00:00.000Z', '2026-01-29T03:00:00.000Z', '577.13', 'BRL', 'Standard', 2, true, 4, '577.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:59:05.184Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2097, 139, 13, 17, '2026-01-29T03:00:00.000Z', '2026-01-30T03:00:00.000Z', '577.13', 'BRL', 'Standard', 2, true, 4, '577.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:59:05.192Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2098, 139, 13, 17, '2026-01-30T03:00:00.000Z', '2026-01-31T03:00:00.000Z', '577.13', 'BRL', 'Standard', 2, true, 4, '577.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:59:05.197Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2099, 138, 20, 17, '2025-09-08T03:00:00.000Z', '2025-09-09T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:59:30.625Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2100, 138, 20, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '205.00', 'BRL', 'Opção 1', 2, false, 1, '205.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:59:42.832Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2101, 138, 20, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '205.00', 'BRL', 'Opção 1', 2, false, 1, '205.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T04:59:53.026Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2102, 138, 20, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:00:03.773Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2103, 138, 20, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '266.00', 'BRL', 'Opção 1', 2, false, 1, '266.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:00:12.364Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2104, 138, 20, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '266.00', 'BRL', 'Opção 1', 2, false, 1, '266.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:00:21.643Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2105, 138, 20, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:00:32.421Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2106, 138, 20, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:00:41.860Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2107, 138, 20, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:00:50.999Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2108, 138, 20, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:01:00.893Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2109, 138, 20, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:01:10.241Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2110, 138, 20, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '266.00', 'BRL', 'Opção 1', 2, false, 1, '266.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:01:19.201Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2111, 138, 20, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '266.00', 'BRL', 'Opção 1', 2, false, 1, '266.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:01:27.790Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2112, 138, 20, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:01:37.497Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2113, 138, 20, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:01:48.029Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2114, 138, 20, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:01:57.038Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2115, 138, 20, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:02:09.235Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2116, 138, 20, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:02:18.062Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2117, 138, 20, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '266.00', 'BRL', 'Opção 1', 2, false, 1, '266.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:02:29.905Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2118, 138, 20, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '266.00', 'BRL', 'Opção 1', 2, false, 1, '266.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:02:40.398Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2119, 138, 20, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:02:51.110Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2120, 138, 20, 17, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:03:00.519Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2121, 138, 20, 17, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:03:12.463Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2122, 138, 20, 17, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:03:24.676Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2123, 138, 20, 17, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:03:34.167Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2124, 138, 20, 17, '2025-10-03T03:00:00.000Z', '2025-10-04T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:03:45.865Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2125, 138, 20, 17, '2025-10-04T03:00:00.000Z', '2025-10-05T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:03:57.109Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2126, 138, 20, 17, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:04:07.571Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2127, 138, 20, 17, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:04:16.030Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2128, 138, 20, 17, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:04:25.723Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2129, 138, 20, 17, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:04:36.733Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2130, 138, 20, 17, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:04:45.422Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2131, 138, 20, 17, '2025-10-10T03:00:00.000Z', '2025-10-11T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:04:54.587Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2132, 138, 20, 17, '2025-10-11T03:00:00.000Z', '2025-10-12T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:05:06.109Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2133, 138, 20, 17, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:05:18.257Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2134, 138, 20, 17, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:05:29.221Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2135, 138, 20, 17, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:05:38.575Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2136, 138, 20, 17, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:05:49.426Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2137, 138, 20, 17, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:06:00.420Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2138, 138, 20, 17, '2025-10-17T03:00:00.000Z', '2025-10-18T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:06:11.632Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2139, 138, 20, 17, '2025-10-18T03:00:00.000Z', '2025-10-19T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:06:21.795Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2140, 138, 20, 17, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:06:33.205Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2141, 138, 20, 17, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:06:42.494Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2142, 138, 20, 17, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:06:52.708Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2143, 138, 20, 17, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:07:07.723Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2144, 138, 20, 17, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:07:17.467Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2145, 138, 20, 17, '2025-10-24T03:00:00.000Z', '2025-10-25T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:07:30.263Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2146, 138, 20, 17, '2025-10-25T03:00:00.000Z', '2025-10-26T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:07:41.639Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2147, 138, 20, 17, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:07:52.684Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2148, 138, 20, 17, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:08:03.976Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2149, 138, 20, 17, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:08:15.056Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2150, 138, 20, 17, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:08:26.703Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2151, 138, 20, 17, '2025-10-30T03:00:00.000Z', '2025-10-31T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:08:36.996Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2152, 138, 20, 17, '2025-10-31T03:00:00.000Z', '2025-11-01T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:08:46.807Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2153, 138, 20, 17, '2025-11-01T03:00:00.000Z', '2025-11-02T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:08:57.500Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2154, 138, 20, 17, '2025-11-02T03:00:00.000Z', '2025-11-03T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:09:07.954Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2155, 138, 20, 17, '2025-11-03T03:00:00.000Z', '2025-11-04T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:09:18.255Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2156, 138, 20, 17, '2025-11-04T03:00:00.000Z', '2025-11-05T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:09:30.000Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2157, 138, 20, 17, '2025-11-05T03:00:00.000Z', '2025-11-06T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:09:40.697Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2158, 138, 20, 17, '2025-11-06T03:00:00.000Z', '2025-11-07T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:09:49.689Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2159, 138, 20, 17, '2025-11-07T03:00:00.000Z', '2025-11-08T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:10:01.196Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2160, 138, 20, 17, '2025-11-08T03:00:00.000Z', '2025-11-09T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:10:12.780Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2161, 138, 20, 17, '2025-11-09T03:00:00.000Z', '2025-11-10T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:10:22.419Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2162, 138, 20, 17, '2025-11-10T03:00:00.000Z', '2025-11-11T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:10:31.164Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2163, 138, 20, 17, '2025-11-11T03:00:00.000Z', '2025-11-12T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:10:42.791Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2164, 138, 20, 17, '2025-11-12T03:00:00.000Z', '2025-11-13T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:10:53.638Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2165, 138, 20, 17, '2025-11-13T03:00:00.000Z', '2025-11-14T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:11:02.534Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2166, 138, 20, 17, '2025-11-14T03:00:00.000Z', '2025-11-15T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:11:12.969Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2167, 138, 20, 17, '2025-11-15T03:00:00.000Z', '2025-11-16T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:11:22.264Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2168, 138, 20, 17, '2025-11-16T03:00:00.000Z', '2025-11-17T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:11:33.293Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2169, 138, 20, 17, '2025-11-17T03:00:00.000Z', '2025-11-18T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:11:44.054Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2170, 138, 20, 17, '2025-11-18T03:00:00.000Z', '2025-11-19T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:11:53.944Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2171, 138, 20, 17, '2025-11-19T03:00:00.000Z', '2025-11-20T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:12:04.822Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2172, 138, 20, 17, '2025-11-20T03:00:00.000Z', '2025-11-21T03:00:00.000Z', '461.00', 'BRL', 'Opção 1', 2, false, 1, '461.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:12:15.187Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2173, 138, 20, 17, '2025-11-21T03:00:00.000Z', '2025-11-22T03:00:00.000Z', '461.00', 'BRL', 'Opção 1', 2, false, 1, '461.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:12:24.698Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2174, 138, 20, 17, '2025-11-22T03:00:00.000Z', '2025-11-23T03:00:00.000Z', '461.00', 'BRL', 'Opção 1', 2, false, 1, '461.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:12:35.158Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2175, 138, 20, 17, '2025-11-23T03:00:00.000Z', '2025-11-24T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:12:45.941Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2176, 138, 20, 17, '2025-11-24T03:00:00.000Z', '2025-11-25T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:12:58.229Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2177, 138, 20, 17, '2025-11-25T03:00:00.000Z', '2025-11-26T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:13:07.039Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2178, 138, 20, 17, '2025-11-26T03:00:00.000Z', '2025-11-27T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:13:15.580Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2179, 138, 20, 17, '2025-11-27T03:00:00.000Z', '2025-11-28T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:13:26.811Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2180, 138, 20, 17, '2025-11-28T03:00:00.000Z', '2025-11-29T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:13:39.036Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2181, 138, 20, 17, '2025-11-29T03:00:00.000Z', '2025-11-30T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:13:48.567Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2182, 138, 20, 17, '2025-11-30T03:00:00.000Z', '2025-12-01T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:13:57.076Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2183, 138, 20, 17, '2025-12-01T03:00:00.000Z', '2025-12-02T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:14:08.220Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2184, 138, 20, 17, '2025-12-02T03:00:00.000Z', '2025-12-03T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:14:17.114Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2185, 138, 20, 17, '2025-12-03T03:00:00.000Z', '2025-12-04T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:14:28.224Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2186, 138, 20, 17, '2025-12-04T03:00:00.000Z', '2025-12-05T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:14:37.481Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2187, 138, 20, 17, '2025-12-05T03:00:00.000Z', '2025-12-06T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:14:45.957Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2188, 138, 20, 17, '2025-12-06T03:00:00.000Z', '2025-12-07T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:14:56.204Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2189, 138, 20, 17, '2025-12-07T03:00:00.000Z', '2025-12-08T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:15:06.579Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2190, 138, 20, 17, '2025-12-08T03:00:00.000Z', '2025-12-09T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:15:15.471Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2191, 138, 20, 17, '2025-12-09T03:00:00.000Z', '2025-12-10T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:15:24.096Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2192, 138, 20, 17, '2025-12-10T03:00:00.000Z', '2025-12-11T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:15:35.490Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2193, 138, 20, 17, '2025-12-11T03:00:00.000Z', '2025-12-12T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:15:44.384Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2194, 138, 20, 17, '2025-12-12T03:00:00.000Z', '2025-12-13T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:15:53.660Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2195, 138, 20, 17, '2025-12-13T03:00:00.000Z', '2025-12-14T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:16:05.532Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2196, 138, 20, 17, '2025-12-14T03:00:00.000Z', '2025-12-15T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:16:17.982Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2197, 138, 20, 17, '2025-12-15T03:00:00.000Z', '2025-12-16T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:16:29.246Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2198, 138, 20, 17, '2025-12-16T03:00:00.000Z', '2025-12-17T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:16:39.972Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2199, 138, 20, 17, '2025-12-17T03:00:00.000Z', '2025-12-18T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:16:50.985Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2200, 138, 20, 17, '2025-12-18T03:00:00.000Z', '2025-12-19T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:16:59.393Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2201, 138, 20, 17, '2025-12-19T03:00:00.000Z', '2025-12-20T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:17:08.637Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2202, 138, 20, 17, '2025-12-20T03:00:00.000Z', '2025-12-21T03:00:00.000Z', '285.00', 'BRL', 'Opção 1', 2, false, 1, '285.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:17:18.947Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2203, 138, 20, 17, '2025-12-21T03:00:00.000Z', '2025-12-22T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:17:27.424Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2204, 138, 20, 17, '2025-12-22T03:00:00.000Z', '2025-12-23T03:00:00.000Z', '190.00', 'BRL', 'Opção 1', 2, false, 1, '190.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:17:37.391Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2205, 138, 20, 17, '2025-12-23T03:00:00.000Z', '2025-12-24T03:00:00.000Z', '475.00', 'BRL', 'Opção 1', 2, false, 1, '475.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:17:47.993Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2206, 138, 20, 17, '2025-12-24T03:00:00.000Z', '2025-12-25T03:00:00.000Z', '475.00', 'BRL', 'Opção 1', 2, false, 1, '475.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:18:00.274Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2207, 138, 20, 17, '2025-12-25T03:00:00.000Z', '2025-12-26T03:00:00.000Z', '475.00', 'BRL', 'Opção 1', 2, false, 1, '475.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:18:12.382Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2208, 138, 20, 17, '2025-12-26T03:00:00.000Z', '2025-12-27T03:00:00.000Z', '475.00', 'BRL', 'Opção 1', 2, false, 1, '475.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:18:23.329Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2209, 138, 20, 17, '2025-12-27T03:00:00.000Z', '2025-12-28T03:00:00.000Z', '475.00', 'BRL', 'Opção 1', 2, false, 1, '475.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:18:35.475Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2210, 138, 20, 17, '2025-12-28T03:00:00.000Z', '2025-12-29T03:00:00.000Z', '475.00', 'BRL', 'Opção 1', 2, false, 1, '475.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:18:47.383Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2211, 138, 20, 17, '2025-12-29T03:00:00.000Z', '2025-12-30T03:00:00.000Z', '475.00', 'BRL', 'Opção 1', 2, false, 1, '475.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:18:56.029Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2212, 138, 20, 17, '2025-12-30T03:00:00.000Z', '2025-12-31T03:00:00.000Z', '769.00', 'BRL', 'Opção 1', 2, false, 1, '769.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:19:08.237Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2213, 138, 20, 17, '2025-12-31T03:00:00.000Z', '2026-01-01T03:00:00.000Z', '769.00', 'BRL', 'Opção 1', 2, false, 1, '769.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:19:18.052Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2214, 138, 20, 17, '2026-01-01T03:00:00.000Z', '2026-01-02T03:00:00.000Z', '769.00', 'BRL', 'Opção 1', 2, false, 1, '769.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:19:26.527Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2215, 138, 20, 17, '2026-01-02T03:00:00.000Z', '2026-01-03T03:00:00.000Z', '769.00', 'BRL', 'Opção 1', 2, false, 1, '769.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:19:35.369Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2216, 138, 20, 17, '2026-01-03T03:00:00.000Z', '2026-01-04T03:00:00.000Z', '769.00', 'BRL', 'Opção 1', 2, false, 1, '769.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:19:46.465Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2217, 138, 20, 17, '2026-01-04T03:00:00.000Z', '2026-01-05T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:19:57.894Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2218, 138, 20, 17, '2026-01-05T03:00:00.000Z', '2026-01-06T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:20:06.827Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2219, 138, 20, 17, '2026-01-06T03:00:00.000Z', '2026-01-07T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:20:15.596Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2220, 138, 20, 17, '2026-01-07T03:00:00.000Z', '2026-01-08T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:20:26.391Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2221, 138, 20, 17, '2026-01-08T03:00:00.000Z', '2026-01-09T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:20:36.565Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2222, 138, 20, 17, '2026-01-09T03:00:00.000Z', '2026-01-10T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:20:48.108Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2223, 138, 20, 17, '2026-01-10T03:00:00.000Z', '2026-01-11T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:20:59.291Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2224, 138, 20, 17, '2026-01-11T03:00:00.000Z', '2026-01-12T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:21:10.968Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2225, 138, 20, 17, '2026-01-12T03:00:00.000Z', '2026-01-13T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:21:20.044Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2226, 138, 20, 17, '2026-01-13T03:00:00.000Z', '2026-01-14T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:21:28.719Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2227, 138, 20, 17, '2026-01-14T03:00:00.000Z', '2026-01-15T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:21:39.659Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2228, 138, 20, 17, '2026-01-15T03:00:00.000Z', '2026-01-16T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:21:49.207Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2229, 138, 20, 17, '2026-01-16T03:00:00.000Z', '2026-01-17T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:22:00.585Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2230, 138, 20, 17, '2026-01-17T03:00:00.000Z', '2026-01-18T03:00:00.000Z', '456.00', 'BRL', 'Opção 1', 2, false, 1, '456.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:22:10.979Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2231, 138, 20, 17, '2026-01-18T03:00:00.000Z', '2026-01-19T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:22:19.457Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2232, 138, 20, 17, '2026-01-19T03:00:00.000Z', '2026-01-20T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:22:30.201Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2233, 138, 20, 17, '2026-01-20T03:00:00.000Z', '2026-01-21T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:22:39.590Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2234, 138, 20, 17, '2026-01-21T03:00:00.000Z', '2026-01-22T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:22:50.734Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2235, 138, 20, 17, '2026-01-22T03:00:00.000Z', '2026-01-23T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:23:01.674Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2236, 138, 20, 17, '2026-01-23T03:00:00.000Z', '2026-01-24T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:23:11.390Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2237, 138, 20, 17, '2026-01-24T03:00:00.000Z', '2026-01-25T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:23:20.367Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2238, 138, 20, 17, '2026-01-25T03:00:00.000Z', '2026-01-26T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:23:30.979Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2239, 138, 20, 17, '2026-01-26T03:00:00.000Z', '2026-01-27T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:23:41.553Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2240, 138, 20, 17, '2026-01-27T03:00:00.000Z', '2026-01-28T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:23:52.384Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2241, 138, 20, 17, '2026-01-28T03:00:00.000Z', '2026-01-29T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:24:02.980Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2242, 138, 20, 17, '2026-01-29T03:00:00.000Z', '2026-01-30T03:00:00.000Z', '370.00', 'BRL', 'Opção 1', 2, false, 1, '370.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:24:12.604Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2243, 137, 12, 17, '2025-09-09T03:00:00.000Z', '2025-09-10T03:00:00.000Z', '253.80', 'BRL', 'Standard', 2, false, 1, '253.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:25:33.182Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2244, 137, 12, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '253.80', 'BRL', 'Standard', 2, false, 1, '253.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:25:39.644Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2245, 137, 12, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '188.10', 'BRL', 'Standard', 2, false, 1, '188.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:25:46.488Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2246, 137, 12, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:26:02.521Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2247, 137, 12, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:26:02.527Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2248, 137, 12, 17, '2025-09-14T03:00:00.000Z', '2025-09-15T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:26:09.325Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2249, 137, 12, 17, '2025-09-15T03:00:00.000Z', '2025-09-16T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:26:17.853Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2250, 137, 12, 17, '2025-09-16T03:00:00.000Z', '2025-09-17T03:00:00.000Z', '188.10', 'BRL', 'Standard', 2, false, 1, '188.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:26:25.695Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2251, 137, 12, 17, '2025-09-17T03:00:00.000Z', '2025-09-18T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:26:33.650Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2252, 137, 12, 17, '2025-09-18T03:00:00.000Z', '2025-09-19T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:26:40.548Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2253, 137, 12, 17, '2025-09-19T03:00:00.000Z', '2025-09-20T03:00:00.000Z', '329.85', 'BRL', 'Standard', 2, true, 2, '329.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:26:55.009Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2254, 137, 12, 17, '2025-09-20T03:00:00.000Z', '2025-09-21T03:00:00.000Z', '329.85', 'BRL', 'Standard', 2, true, 2, '329.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:26:55.013Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2255, 137, 12, 17, '2025-09-21T03:00:00.000Z', '2025-09-22T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:27:01.314Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2256, 137, 12, 17, '2025-09-22T03:00:00.000Z', '2025-09-23T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:27:07.858Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2257, 137, 12, 17, '2025-09-23T03:00:00.000Z', '2025-09-24T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:27:18.268Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2258, 137, 12, 17, '2025-09-24T03:00:00.000Z', '2025-09-25T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:27:24.840Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2259, 137, 12, 17, '2025-09-25T03:00:00.000Z', '2025-09-26T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:27:33.914Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2260, 137, 12, 17, '2025-09-26T03:00:00.000Z', '2025-09-27T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:27:52.335Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2261, 137, 12, 17, '2025-09-27T03:00:00.000Z', '2025-09-28T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:27:52.339Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2262, 137, 12, 17, '2025-09-28T03:00:00.000Z', '2025-09-29T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:28:02.728Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2263, 137, 12, 17, '2025-09-29T03:00:00.000Z', '2025-09-30T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:28:09.569Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2264, 137, 12, 17, '2025-09-30T03:00:00.000Z', '2025-10-01T03:00:00.000Z', '199.80', 'BRL', 'Standard', 2, false, 1, '199.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:28:17.160Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2265, 137, 12, 17, '2025-10-01T03:00:00.000Z', '2025-10-02T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:28:23.964Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2266, 137, 12, 17, '2025-10-02T03:00:00.000Z', '2025-10-03T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:28:32.327Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2267, 137, 12, 17, '2025-10-03T03:00:00.000Z', '2025-10-04T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:28:48.892Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2268, 137, 12, 17, '2025-10-04T03:00:00.000Z', '2025-10-05T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:28:48.899Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2269, 137, 12, 17, '2025-10-05T03:00:00.000Z', '2025-10-06T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:28:57.952Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2270, 137, 12, 17, '2025-10-06T03:00:00.000Z', '2025-10-07T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:29:04.924Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2271, 137, 12, 17, '2025-10-07T03:00:00.000Z', '2025-10-08T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:29:14.269Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2272, 137, 12, 17, '2025-10-08T03:00:00.000Z', '2025-10-09T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:29:23.798Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2273, 137, 12, 17, '2025-10-09T03:00:00.000Z', '2025-10-10T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:29:33.684Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2274, 137, 12, 17, '2025-10-10T03:00:00.000Z', '2025-10-11T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:29:52.025Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2275, 137, 12, 17, '2025-10-11T03:00:00.000Z', '2025-10-12T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:29:52.029Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2276, 137, 12, 17, '2025-10-12T03:00:00.000Z', '2025-10-13T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:29:59.366Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2277, 137, 12, 17, '2025-10-13T03:00:00.000Z', '2025-10-14T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:30:08.823Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2278, 137, 12, 17, '2025-10-14T03:00:00.000Z', '2025-10-15T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:30:15.997Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2279, 137, 12, 17, '2025-10-15T03:00:00.000Z', '2025-10-16T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:30:24.925Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2280, 137, 12, 17, '2025-10-16T03:00:00.000Z', '2025-10-17T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:30:33.884Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2281, 137, 12, 17, '2025-10-17T03:00:00.000Z', '2025-10-18T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:30:47.829Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2282, 137, 12, 17, '2025-10-18T03:00:00.000Z', '2025-10-19T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:30:47.837Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2283, 137, 12, 17, '2025-10-19T03:00:00.000Z', '2025-10-20T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:30:54.685Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2284, 137, 12, 17, '2025-10-20T03:00:00.000Z', '2025-10-21T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:31:02.862Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2285, 137, 12, 17, '2025-10-21T03:00:00.000Z', '2025-10-22T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:31:13.186Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2286, 137, 12, 17, '2025-10-22T03:00:00.000Z', '2025-10-23T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:31:22.867Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2287, 137, 12, 17, '2025-10-23T03:00:00.000Z', '2025-10-24T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:31:31.188Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2288, 137, 12, 17, '2025-10-24T03:00:00.000Z', '2025-10-25T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:31:46.290Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2289, 137, 12, 17, '2025-10-25T03:00:00.000Z', '2025-10-26T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:31:46.294Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2290, 137, 12, 17, '2025-10-26T03:00:00.000Z', '2025-10-27T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:32:03.028Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2291, 137, 12, 17, '2025-10-27T03:00:00.000Z', '2025-10-28T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:32:11.650Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2292, 137, 12, 17, '2025-10-28T03:00:00.000Z', '2025-10-29T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:32:19.367Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2293, 137, 12, 17, '2025-10-29T03:00:00.000Z', '2025-10-30T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:32:27.901Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2294, 137, 12, 17, '2025-10-30T03:00:00.000Z', '2025-10-31T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:32:36.672Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2295, 137, 12, 17, '2025-10-31T03:00:00.000Z', '2025-11-01T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:32:51.137Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2296, 137, 12, 17, '2025-11-01T03:00:00.000Z', '2025-11-02T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:32:51.730Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2297, 137, 12, 17, '2025-11-02T03:00:00.000Z', '2025-11-03T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:33:08.459Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2298, 137, 12, 17, '2025-11-03T03:00:00.000Z', '2025-11-04T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:33:14.929Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2299, 137, 12, 17, '2025-11-04T03:00:00.000Z', '2025-11-05T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:33:23.141Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2300, 137, 12, 17, '2025-11-05T03:00:00.000Z', '2025-11-06T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:33:33.201Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2301, 137, 12, 17, '2025-11-06T03:00:00.000Z', '2025-11-07T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:33:43.278Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2302, 137, 12, 17, '2025-11-07T03:00:00.000Z', '2025-11-08T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:34:01.914Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2303, 137, 12, 17, '2025-11-08T03:00:00.000Z', '2025-11-09T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:34:01.917Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2304, 137, 12, 17, '2025-11-09T03:00:00.000Z', '2025-11-10T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:34:10.487Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2305, 137, 12, 17, '2025-11-10T03:00:00.000Z', '2025-11-11T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:34:19.680Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2306, 137, 12, 17, '2025-11-11T03:00:00.000Z', '2025-11-12T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:34:26.921Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2307, 137, 12, 17, '2025-11-12T03:00:00.000Z', '2025-11-13T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:34:34.013Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2308, 137, 12, 17, '2025-11-13T03:00:00.000Z', '2025-11-14T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:34:41.336Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2309, 137, 12, 17, '2025-11-14T03:00:00.000Z', '2025-11-15T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:34:58.892Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2310, 137, 12, 17, '2025-11-15T03:00:00.000Z', '2025-11-16T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:34:58.896Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2311, 137, 12, 17, '2025-11-16T03:00:00.000Z', '2025-11-17T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:35:07.245Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2312, 137, 12, 17, '2025-11-17T03:00:00.000Z', '2025-11-18T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:35:14.369Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2313, 137, 12, 17, '2025-11-18T03:00:00.000Z', '2025-11-19T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:35:22.027Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2314, 137, 12, 17, '2025-11-19T03:00:00.000Z', '2025-11-20T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:35:31.021Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2315, 137, 12, 17, '2025-11-20T03:00:00.000Z', '2025-11-21T03:00:00.000Z', '538.90', 'BRL', 'Standard', 2, true, 3, '538.90', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:35:56.466Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2316, 137, 12, 17, '2025-11-21T03:00:00.000Z', '2025-11-22T03:00:00.000Z', '538.90', 'BRL', 'Standard', 2, true, 3, '538.90', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:35:56.472Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2317, 137, 12, 17, '2025-11-22T03:00:00.000Z', '2025-11-23T03:00:00.000Z', '538.90', 'BRL', 'Standard', 2, true, 3, '538.90', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:35:56.476Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2318, 137, 12, 17, '2025-11-23T03:00:00.000Z', '2025-11-24T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:36:03.004Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2319, 137, 12, 17, '2025-11-24T03:00:00.000Z', '2025-11-25T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:36:09.191Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2320, 137, 12, 17, '2025-11-25T03:00:00.000Z', '2025-11-26T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:36:17.952Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2321, 137, 12, 17, '2025-11-26T03:00:00.000Z', '2025-11-27T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:36:27.847Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2322, 137, 12, 17, '2025-11-27T03:00:00.000Z', '2025-11-28T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:36:37.019Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2323, 137, 12, 17, '2025-11-28T03:00:00.000Z', '2025-11-29T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:36:54.073Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2324, 137, 12, 17, '2025-11-29T03:00:00.000Z', '2025-11-30T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:36:54.077Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2325, 137, 12, 17, '2025-11-30T03:00:00.000Z', '2025-12-01T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:37:02.847Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2326, 137, 12, 17, '2025-12-01T03:00:00.000Z', '2025-12-02T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:37:11.940Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2327, 137, 12, 17, '2025-12-02T03:00:00.000Z', '2025-12-03T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:37:19.431Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2328, 137, 12, 17, '2025-12-03T03:00:00.000Z', '2025-12-04T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:37:29.575Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2329, 137, 12, 17, '2025-12-04T03:00:00.000Z', '2025-12-05T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:37:38.852Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2330, 137, 12, 17, '2025-12-05T03:00:00.000Z', '2025-12-06T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:37:52.304Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2331, 137, 12, 17, '2025-12-06T03:00:00.000Z', '2025-12-07T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:37:52.313Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2332, 137, 12, 17, '2025-12-07T03:00:00.000Z', '2025-12-08T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:38:02.560Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2333, 137, 12, 17, '2025-12-08T03:00:00.000Z', '2025-12-09T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:38:12.749Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2334, 137, 12, 17, '2025-12-09T03:00:00.000Z', '2025-12-10T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:38:21.464Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2335, 137, 12, 17, '2025-12-10T03:00:00.000Z', '2025-12-11T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:38:29.521Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2336, 137, 12, 17, '2025-12-11T03:00:00.000Z', '2025-12-12T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:38:39.010Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2337, 137, 12, 17, '2025-12-12T03:00:00.000Z', '2025-12-13T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:38:53.043Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2338, 137, 12, 17, '2025-12-13T03:00:00.000Z', '2025-12-14T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:38:53.047Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2339, 137, 12, 17, '2025-12-14T03:00:00.000Z', '2025-12-15T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:39:01.386Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2340, 137, 12, 17, '2025-12-15T03:00:00.000Z', '2025-12-16T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:39:10.324Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2341, 137, 12, 17, '2025-12-16T03:00:00.000Z', '2025-12-17T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:39:17.519Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2342, 137, 12, 17, '2025-12-17T03:00:00.000Z', '2025-12-18T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:39:26.347Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2343, 137, 12, 17, '2025-12-18T03:00:00.000Z', '2025-12-19T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:39:35.120Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2344, 137, 12, 17, '2025-12-19T03:00:00.000Z', '2025-12-20T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:39:51.672Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2345, 137, 12, 17, '2025-12-20T03:00:00.000Z', '2025-12-21T03:00:00.000Z', '333.20', 'BRL', 'Standard', 2, true, 2, '333.20', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:39:51.677Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2346, 137, 12, 17, '2025-12-21T03:00:00.000Z', '2025-12-22T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:40:00.896Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2347, 137, 12, 17, '2025-12-22T03:00:00.000Z', '2025-12-23T03:00:00.000Z', '221.85', 'BRL', 'Standard', 2, false, 1, '221.85', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:40:07.985Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2348, 137, 12, 17, '2025-12-23T03:00:00.000Z', '2025-12-24T03:00:00.000Z', '555.05', 'BRL', 'Standard', 2, true, 5, '555.05', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:40:56.445Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2349, 137, 12, 17, '2025-12-24T03:00:00.000Z', '2025-12-25T03:00:00.000Z', '555.05', 'BRL', 'Standard', 2, true, 5, '555.05', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:40:56.454Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2350, 137, 12, 17, '2025-12-25T03:00:00.000Z', '2025-12-26T03:00:00.000Z', '555.05', 'BRL', 'Standard', 2, true, 5, '555.05', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:40:56.458Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2351, 137, 12, 17, '2025-12-26T03:00:00.000Z', '2025-12-27T03:00:00.000Z', '555.05', 'BRL', 'Standard', 2, true, 5, '555.05', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:40:56.462Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2352, 137, 12, 17, '2025-12-27T03:00:00.000Z', '2025-12-28T03:00:00.000Z', '555.05', 'BRL', 'Standard', 2, true, 5, '555.05', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:40:56.466Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2353, 137, 12, 17, '2025-12-28T03:00:00.000Z', '2025-12-29T03:00:00.000Z', '762.11', 'BRL', 'Standard', 2, true, 5, '762.11', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:41:41.406Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2354, 137, 12, 17, '2025-12-29T03:00:00.000Z', '2025-12-30T03:00:00.000Z', '762.11', 'BRL', 'Standard', 2, true, 5, '762.11', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:41:41.414Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2355, 137, 12, 17, '2025-12-30T03:00:00.000Z', '2025-12-31T03:00:00.000Z', '762.11', 'BRL', 'Standard', 2, true, 5, '762.11', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:41:41.418Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2356, 137, 12, 17, '2025-12-31T03:00:00.000Z', '2026-01-01T03:00:00.000Z', '762.11', 'BRL', 'Standard', 2, true, 5, '762.11', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:41:41.421Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2357, 137, 12, 17, '2026-01-01T03:00:00.000Z', '2026-01-02T03:00:00.000Z', '762.11', 'BRL', 'Standard', 2, true, 5, '762.11', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:41:41.425Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2358, 137, 12, 17, '2026-01-02T03:00:00.000Z', '2026-01-03T03:00:00.000Z', '716.55', 'BRL', 'Standard', 2, true, 4, '716.55', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:42:22.701Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2359, 137, 12, 17, '2026-01-03T03:00:00.000Z', '2026-01-04T03:00:00.000Z', '716.55', 'BRL', 'Standard', 2, true, 4, '716.55', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:42:22.717Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2360, 137, 12, 17, '2026-01-04T03:00:00.000Z', '2026-01-05T03:00:00.000Z', '716.55', 'BRL', 'Standard', 2, true, 4, '716.55', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:42:22.723Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2361, 137, 12, 17, '2026-01-05T03:00:00.000Z', '2026-01-06T03:00:00.000Z', '716.55', 'BRL', 'Standard', 2, true, 4, '716.55', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:42:22.728Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2362, 137, 12, 17, '2026-01-06T03:00:00.000Z', '2026-01-07T03:00:00.000Z', '532.95', 'BRL', 'Standard', 2, true, 2, '532.95', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:42:39.675Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2363, 137, 12, 17, '2026-01-07T03:00:00.000Z', '2026-01-08T03:00:00.000Z', '532.95', 'BRL', 'Standard', 2, true, 2, '532.95', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:42:39.679Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2364, 137, 12, 17, '2026-01-08T03:00:00.000Z', '2026-01-09T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:43:03.734Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2365, 137, 12, 17, '2026-01-09T03:00:00.000Z', '2026-01-10T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:43:03.746Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2366, 137, 12, 17, '2026-01-10T03:00:00.000Z', '2026-01-11T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:43:19.002Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2367, 137, 12, 17, '2026-01-11T03:00:00.000Z', '2026-01-12T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:43:19.009Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2368, 137, 12, 17, '2026-01-12T03:00:00.000Z', '2026-01-13T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:43:33.584Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2369, 137, 12, 17, '2026-01-13T03:00:00.000Z', '2026-01-14T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:43:33.588Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2370, 137, 12, 17, '2026-01-14T03:00:00.000Z', '2026-01-15T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:43:49.484Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2371, 137, 12, 17, '2026-01-15T03:00:00.000Z', '2026-01-16T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:43:49.487Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2372, 137, 12, 17, '2026-01-16T03:00:00.000Z', '2026-01-17T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:44:08.946Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2373, 137, 12, 17, '2026-01-17T03:00:00.000Z', '2026-01-18T03:00:00.000Z', '564.30', 'BRL', 'Standard', 2, true, 2, '564.30', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:44:08.952Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2374, 137, 12, 17, '2026-01-18T03:00:00.000Z', '2026-01-19T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:44:26.572Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2375, 137, 12, 17, '2026-01-19T03:00:00.000Z', '2026-01-20T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:44:26.577Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2376, 137, 12, 17, '2026-01-20T03:00:00.000Z', '2026-01-21T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:44:42.886Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2377, 137, 12, 17, '2026-01-21T03:00:00.000Z', '2026-01-22T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:44:42.893Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2378, 137, 12, 17, '2026-01-22T03:00:00.000Z', '2026-01-23T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:45:00.101Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2379, 137, 12, 17, '2026-01-23T03:00:00.000Z', '2026-01-24T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:45:00.105Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2380, 137, 12, 17, '2026-01-24T03:00:00.000Z', '2026-01-25T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:45:14.417Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2381, 137, 12, 17, '2026-01-25T03:00:00.000Z', '2026-01-26T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:45:14.421Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2382, 137, 12, 17, '2026-01-26T03:00:00.000Z', '2026-01-27T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:45:39.839Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2383, 137, 12, 17, '2026-01-27T03:00:00.000Z', '2026-01-28T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:45:39.846Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2384, 137, 12, 17, '2026-01-28T03:00:00.000Z', '2026-01-29T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:45:55.793Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2385, 137, 12, 17, '2026-01-29T03:00:00.000Z', '2026-01-30T03:00:00.000Z', '458.10', 'BRL', 'Standard', 2, true, 2, '458.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T05:45:55.798Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2386, 145, 12, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '253.80', 'BRL', 'Standard', 2, false, 1, '253.80', 'AVAILABLE', 'JS_VARS', '2025-09-09T15:48:25.894Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2387, 145, 12, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '188.10', 'BRL', 'Standard', 2, false, 1, '188.10', 'AVAILABLE', 'JS_VARS', '2025-09-09T15:48:35.233Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2388, 145, 12, 17, '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T15:48:50.901Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2389, 145, 12, 17, '2025-09-13T03:00:00.000Z', '2025-09-14T03:00:00.000Z', '328.50', 'BRL', 'Standard', 2, true, 2, '328.50', 'AVAILABLE', 'JS_VARS', '2025-09-09T15:48:50.909Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2390, 146, 20, 17, '2025-09-10T03:00:00.000Z', '2025-09-11T03:00:00.000Z', '205.00', 'BRL', 'Opção 1', 2, false, 1, '205.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T15:51:56.077Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2391, 146, 20, 17, '2025-09-11T03:00:00.000Z', '2025-09-12T03:00:00.000Z', '162.00', 'BRL', 'Opção 1', 2, false, 1, '162.00', 'AVAILABLE', 'JS_VARS', '2025-09-09T15:52:05.000Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2392, 147, 12, 17, '2025-12-25T03:00:00.000Z', '2025-12-26T03:00:00.000Z', '555.05', 'BRL', 'Standard', 2, true, 4, '555.05', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:45:38.013Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2393, 147, 12, 17, '2025-12-26T03:00:00.000Z', '2025-12-27T03:00:00.000Z', '555.05', 'BRL', 'Standard', 2, true, 4, '555.05', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:45:38.059Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2394, 147, 12, 17, '2025-12-27T03:00:00.000Z', '2025-12-28T03:00:00.000Z', '555.05', 'BRL', 'Standard', 2, true, 4, '555.05', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:45:38.064Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2395, 147, 12, 17, '2025-12-28T03:00:00.000Z', '2025-12-29T03:00:00.000Z', '555.05', 'BRL', 'Standard', 2, true, 4, '555.05', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:45:38.069Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2396, 147, 12, 17, '2025-12-29T03:00:00.000Z', '2025-12-30T03:00:00.000Z', '831.13', 'BRL', 'Standard', 2, true, 5, '831.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:46:18.181Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2397, 147, 12, 17, '2025-12-30T03:00:00.000Z', '2025-12-31T03:00:00.000Z', '831.13', 'BRL', 'Standard', 2, true, 5, '831.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:46:18.191Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2398, 147, 12, 17, '2025-12-31T03:00:00.000Z', '2026-01-01T03:00:00.000Z', '831.13', 'BRL', 'Standard', 2, true, 5, '831.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:46:18.195Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2399, 147, 12, 17, '2026-01-01T03:00:00.000Z', '2026-01-02T03:00:00.000Z', '831.13', 'BRL', 'Standard', 2, true, 5, '831.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:46:18.199Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2400, 147, 12, 17, '2026-01-02T03:00:00.000Z', '2026-01-03T03:00:00.000Z', '831.13', 'BRL', 'Standard', 2, true, 5, '831.13', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:46:18.203Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2401, 147, 12, 17, '2026-01-03T03:00:00.000Z', '2026-01-04T03:00:00.000Z', '624.75', 'BRL', 'Standard', 2, true, 4, '624.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:46:55.779Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2402, 147, 12, 17, '2026-01-04T03:00:00.000Z', '2026-01-05T03:00:00.000Z', '624.75', 'BRL', 'Standard', 2, true, 4, '624.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:46:55.813Z');

INSERT INTO rate_shopper_prices (id, search_id, property_id, hotel_id, check_in_date, check_out_date, price, currency, room_type, max_guests, is_bundle, bundle_size, original_price, availability_status, extraction_method, scraped_at) VALUES (2403, 147, 12, 17, '2026-01-05T03:00:00.000Z', '2026-01-06T03:00:00.000Z', '624.75', 'BRL', 'Standard', 2, true, 4, '624.75', 'AVAILABLE', 'JS_VARS', '2025-09-09T19:46:55.818Z');



-- Dados da tabela rate_shopper_properties

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (12, '6a19436a-9e1c-46b3-9b93-edd46c103853', 17, 'Eco Encanto Pousada', 'https://www.booking.com/hotel/br/eco-encanto-pousada-e-hostel.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São paulo', 'Pousada', 7, true, '2025-09-06T15:20:13.054Z', '2025-09-09T01:46:12.732Z', true, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (1, '20e84ad5-b3e2-43e3-8229-f874476b7483', 2, 'HOTEL MARANDUBA', 'https://www.booking.com/hotel/br/maranduba-ubatuba12.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba, SP', 'Hotel', 7, true, '2025-09-05T18:31:27.032Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (2, '0591b1d8-3857-4930-813b-af524b65711f', 2, 'POUSADA KALIMAN', 'https://www.booking.com/hotel/br/kaliman-pousada.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba, SP', 'Pousada', 7, true, '2025-09-05T18:31:27.051Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (3, '31957422-7f2d-49cc-868c-ee6e508418d2', 2, 'SOLAR GREGO', 'https://www.booking.com/hotel/br/solar-grego.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba, SP', 'Hotel', 7, true, '2025-09-05T18:31:27.054Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (4, 'f662bfbc-cbc6-42b6-9a9d-8a40ec6c3563', 2, 'SOLAR DAS AGUAS', 'https://www.booking.com/hotel/br/solar-das-aguas-cantantes.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba, SP', 'Hotel', 7, true, '2025-09-05T18:31:27.056Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (99, 'b13b8532-1013-4648-9952-c1a4c95b8893', 2, 'COPACABANA PALACE (TESTE)', 'https://www.booking.com/hotel/br/copacabana-palace.pt-br.html', 'OTA', 'Booking.com', NULL, NULL, 3, true, '2025-09-05T19:36:34.960Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (5, '8a365bf5-89f3-42db-886d-e910d5e22b0f', 3, 'Eco Encanto Pousada', 'https://www.booking.com/hotel/br/eco-encanto-pousada-e-hostel.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo', 'Pousada', 7, true, '2025-09-05T23:59:24.238Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (6, 'fc4cc2da-19b3-4eea-a2bc-48c11cfe52e4', 3, 'Recanto Maranduba', 'https://www.booking.com/hotel/br/recanto-maranduba.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo', 'Pousada', 7, true, '2025-09-06T00:01:01.521Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (8, '217a960a-854c-4b8d-899a-71ae1da3f5b1', 3, 'Kaliman Pousada', 'https://www.booking.com/hotel/br/kaliman-pousada.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo', '', 7, true, '2025-09-06T00:07:47.333Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (13, 'a383e5bb-f2a0-453e-922b-6febfedb6550', 17, 'Chalés Four Seasons', 'https://www.booking.com/hotel/br/chales-four-seasons.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo', 'Pousada', 7, true, '2025-09-06T15:21:43.520Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (14, 'cb1a69cb-1ecd-4751-86bf-c6fc675904c6', 17, 'Pousada Aldeia da Lagoinha', 'https://www.booking.com/hotel/br/aldeia-da-lagoinha.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo', 'Pousada', 7, true, '2025-09-06T15:22:36.812Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (15, 'd8844394-7312-4c1c-9fed-65f895399a37', 17, 'Pousada Kaliman', 'https://www.booking.com/hotel/br/kaliman-pousada.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo', 'Pousada', 7, true, '2025-09-06T15:24:17.394Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (16, '89481aba-a882-4e3a-bc86-8939e790ae65', 17, 'Venice Hotel', 'https://www.booking.com/hotel/br/caribe-ubatuba.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo', 'Hotel', 7, true, '2025-09-06T15:25:36.045Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (17, '95c2e7c9-920e-404e-acdf-b0d05ec3ce4d', 17, 'Hotel Porto do Eixo', 'https://www.booking.com/hotel/br/porto-do-eixo.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo', 'Hotel', 7, true, '2025-09-06T15:26:45.636Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (7, '40ac42fd-bc8b-4815-b961-1fbbab0e49b0', 3, 'Aldeia Da Lagoinha', 'https://www.booking.com/hotel/br/aldeia-da-lagoinha.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo', 'Pousada', 7, true, '2025-09-06T00:04:16.986Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (18, '256d2138-442e-46df-895b-8584d0ade648', 17, 'Pousada Aquária', 'https://www.booking.com/hotel/br/pousada-aquaria.pt-br.html', 'OTA', 'Booking.com', 'Ubatuba - São Paulo - maranduba', 'Pousada', 7, true, '2025-09-08T16:33:44.344Z', '2025-09-09T00:47:03.794Z', false, 'booking');

INSERT INTO rate_shopper_properties (id, uuid, hotel_id, property_name, booking_url, competitor_type, ota_name, location, category, max_bundle_size, active, created_at, updated_at, is_main_property, platform) VALUES (20, '30ee5bed-36d2-4604-9dfb-c3ff1c6f8358', 17, 'Eco Encanto Pousada', 'https://eco-encanto-pousada.artaxnet.com/#/', 'OTA', 'Artaxnet', 'Ubatuba - São Paulo', 'Pousada', 7, true, '2025-09-09T01:22:55.049Z', '2025-09-09T01:56:52.727Z', true, 'artaxnet');



-- Dados da tabela rate_shopper_searches

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (78, 'eb18d2c8-bac3-4c12-92c7-3e4303a796c6', 3, 5, 'MANUAL', '2025-01-01T03:00:00.000Z', '2025-01-10T03:00:00.000Z', 'COMPLETED', 10, 10, 10, NULL, '2025-09-06T03:47:02.204Z', '2025-09-06T04:47:02.204Z', 0, '2025-09-06T04:47:02.204Z', '2025-09-06T04:47:02.204Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (79, 'ec85e498-52fe-44fe-a4af-a3a6b57a44ef', 3, 5, 'MANUAL', '2025-01-01T03:00:00.000Z', '2025-01-10T03:00:00.000Z', 'COMPLETED', 10, 10, 10, NULL, '2025-09-06T03:47:20.178Z', '2025-09-06T04:47:20.178Z', 0, '2025-09-06T04:47:20.178Z', '2025-09-06T04:47:20.178Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (80, '5df523a6-575d-4ac9-a667-bf73d81c93ef', 3, 5, 'MANUAL', '2025-01-01T03:00:00.000Z', '2025-01-10T03:00:00.000Z', 'COMPLETED', 10, 10, 10, NULL, '2025-09-06T03:47:38.065Z', '2025-09-06T04:47:38.065Z', 0, '2025-09-06T04:47:38.065Z', '2025-09-06T04:47:38.065Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (81, '1a31f2eb-7f6e-4d1e-b47e-831538c49e1b', 3, 5, 'MANUAL', '2025-01-01T03:00:00.000Z', '2025-01-10T03:00:00.000Z', 'COMPLETED', 10, 10, 10, NULL, '2025-09-06T03:47:55.419Z', '2025-09-06T04:47:55.419Z', 0, '2025-09-06T04:47:55.419Z', '2025-09-06T04:47:55.419Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (130, '21ae768e-2e4c-4739-9b55-33fcc865e64a', 17, 15, 'MANUAL', '2025-09-08T03:00:00.000Z', '2025-09-29T03:00:00.000Z', 'COMPLETED', 21, 21, 20, NULL, '2025-09-09T00:02:11.571Z', '2025-09-09T00:05:52.053Z', 0, '2025-09-09T00:02:05.744Z', '2025-09-09T00:05:52.053Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (142, '581fef3f-b6ee-4dc2-b333-6274c0abe684', 17, 16, 'MANUAL', '2025-09-08T03:00:00.000Z', '2026-01-30T03:00:00.000Z', 'COMPLETED', 144, 144, 144, NULL, '2025-09-09T03:00:28.943Z', '2025-09-09T03:21:34.215Z', 0, '2025-09-09T02:16:41.487Z', '2025-09-09T03:21:34.215Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (126, '6ff8372f-4af2-4d11-955d-abc49317bafc', 17, 13, 'MANUAL', '2025-09-08T03:00:00.000Z', '2025-09-29T03:00:00.000Z', 'COMPLETED', 21, 21, 21, NULL, '2025-09-09T00:16:34.410Z', '2025-09-09T00:19:32.250Z', 0, '2025-09-09T00:02:05.721Z', '2025-09-09T00:19:32.250Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (85, '5c647206-b993-4857-99b9-5d763933257a', 3, 6, 'MANUAL', '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', 'COMPLETED', 1, 1, 1, NULL, '2025-09-06T08:12:39.154Z', '2025-09-06T08:12:50.169Z', 0, '2025-09-06T08:12:31.830Z', '2025-09-06T08:12:50.169Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (84, '27b5b4ae-23df-4926-bd01-0f7ca5cb1681', 3, 8, 'MANUAL', '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', 'COMPLETED', 1, 1, 1, NULL, '2025-09-06T08:12:53.052Z', '2025-09-06T08:13:00.830Z', 0, '2025-09-06T08:12:31.830Z', '2025-09-06T08:13:00.830Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (138, 'bed11585-e0fa-478d-bf96-c171329b1474', 17, 20, 'MANUAL', '2025-09-08T03:00:00.000Z', '2026-01-30T03:00:00.000Z', 'COMPLETED', 144, 144, 144, NULL, '2025-09-09T04:59:18.988Z', '2025-09-09T05:24:13.523Z', 0, '2025-09-09T02:16:41.475Z', '2025-09-09T05:24:13.523Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (83, '6cea0d9b-4998-41a6-b0f2-cdb478a212fe', 3, 5, 'MANUAL', '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', 'COMPLETED', 1, 1, 0, NULL, '2025-09-06T08:13:03.726Z', '2025-09-06T08:13:10.881Z', 0, '2025-09-06T08:12:31.829Z', '2025-09-06T08:13:10.881Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (82, '726c63ec-759c-4fcc-8594-870b4ca657ae', 3, 7, 'MANUAL', '2025-09-12T03:00:00.000Z', '2025-09-13T03:00:00.000Z', 'COMPLETED', 1, 1, 0, NULL, '2025-09-06T08:13:59.230Z', '2025-09-06T08:14:05.492Z', 0, '2025-09-06T08:12:31.829Z', '2025-09-06T08:14:05.492Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (14, '29462673-4c72-497e-ba71-1a4110ded323', 2, 2, 'MANUAL', '2025-09-14T03:00:00.000Z', '2025-09-18T03:00:00.000Z', 'COMPLETED', 4, 4, 4, NULL, '2025-09-05T21:49:44.731Z', '2025-09-05T21:50:19.756Z', 0, '2025-09-05T21:49:15.721Z', '2025-09-05T21:50:19.756Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (141, '1c9e5bad-8bec-4558-bb0d-b4aa7efdf060', 17, 15, 'MANUAL', '2025-09-08T03:00:00.000Z', '2026-01-30T03:00:00.000Z', 'COMPLETED', 144, 144, 144, NULL, '2025-09-09T03:21:37.540Z', '2025-09-09T03:44:14.721Z', 0, '2025-09-09T02:16:41.487Z', '2025-09-09T03:44:14.721Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (124, '894ae0ba-8ebc-4518-aff8-0e51ec8e3168', 17, 12, 'MANUAL', '2025-09-08T03:00:00.000Z', '2025-09-29T03:00:00.000Z', 'COMPLETED', 21, 21, 21, NULL, '2025-09-09T00:23:00.522Z', '2025-09-09T00:26:03.881Z', 0, '2025-09-09T00:02:05.721Z', '2025-09-09T00:26:03.881Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (137, '084109f2-e8e9-4be4-a65a-3e54eaface1b', 17, 12, 'MANUAL', '2025-09-08T03:00:00.000Z', '2026-01-30T03:00:00.000Z', 'COMPLETED', 144, 144, 143, NULL, '2025-09-09T05:24:17.007Z', '2025-09-09T05:45:56.113Z', 0, '2025-09-09T02:16:41.474Z', '2025-09-09T05:45:56.113Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (13, '19555be4-8e76-4e3e-a74d-6318407608dc', 2, 1, 'MANUAL', '2025-09-14T03:00:00.000Z', '2025-09-18T03:00:00.000Z', 'COMPLETED', 4, 4, 4, NULL, '2025-09-08T17:33:37.930Z', '2025-09-08T17:34:11.482Z', 0, '2025-09-05T21:49:15.719Z', '2025-09-08T17:34:11.482Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (139, 'cc19e877-88ec-4e8d-afaa-af52428c43a7', 17, 13, 'MANUAL', '2025-09-08T03:00:00.000Z', '2026-01-30T03:00:00.000Z', 'COMPLETED', 144, 144, 123, NULL, '2025-09-09T04:20:03.965Z', '2025-09-09T04:59:05.604Z', 0, '2025-09-09T02:16:41.474Z', '2025-09-09T04:59:05.604Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (127, 'c10d1324-f6e5-429a-8b6c-5b7da46c5811', 17, 16, 'MANUAL', '2025-09-08T03:00:00.000Z', '2025-09-29T03:00:00.000Z', 'COMPLETED', 21, 21, 20, NULL, '2025-09-09T00:12:41.714Z', '2025-09-09T00:16:29.806Z', 0, '2025-09-09T00:02:05.732Z', '2025-09-09T00:16:29.806Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (145, '5174a9d1-89f8-4ebb-b010-b318b5104c61', 17, 12, 'MANUAL', '2025-09-10T03:00:00.000Z', '2025-09-14T03:00:00.000Z', 'COMPLETED', 4, 4, 4, NULL, '2025-09-09T15:48:13.968Z', '2025-09-09T15:48:51.190Z', 0, '2025-09-09T15:47:40.086Z', '2025-09-09T15:48:51.190Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (3, '677548bc-ad24-4f51-bff8-8bae81d58205', 2, 4, 'MANUAL', '2025-09-07T03:00:00.000Z', '2025-09-29T03:00:00.000Z', 'CANCELLED', 22, 0, 0, NULL, '2025-09-05T20:57:36.778Z', '2025-09-05T21:16:01.315Z', 0, '2025-09-05T20:25:10.216Z', '2025-09-05T21:16:01.315Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (129, '74799a82-7b00-48a8-ba28-56dd19cb69ae', 17, 14, 'MANUAL', '2025-09-08T03:00:00.000Z', '2025-09-29T03:00:00.000Z', 'COMPLETED', 21, 21, 20, NULL, '2025-09-09T00:05:55.197Z', '2025-09-09T00:09:54.058Z', 0, '2025-09-09T00:02:05.740Z', '2025-09-09T00:09:54.058Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (144, 'a2f316a0-d375-459f-b9cd-b7f9f58ad5fa', 17, 18, 'MANUAL', '2025-09-08T03:00:00.000Z', '2026-01-30T03:00:00.000Z', 'FAILED', 144, 38, 19, 'booking_query_param_current_date is not defined', '2025-09-09T02:16:50.202Z', '2025-09-09T02:39:25.633Z', 0, '2025-09-09T02:16:41.497Z', '2025-09-09T02:39:25.633Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (140, 'f08b7ab7-8aa1-4ca4-aa25-1714479492f1', 17, 17, 'MANUAL', '2025-09-08T03:00:00.000Z', '2026-01-30T03:00:00.000Z', 'COMPLETED', 144, 144, 141, NULL, '2025-09-09T03:55:45.923Z', '2025-09-09T04:20:00.534Z', 0, '2025-09-09T02:16:41.475Z', '2025-09-09T04:20:00.534Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (77, 'a4fa2d9f-110a-47fc-8e57-5260898a011a', 3, 6, 'MANUAL', '2025-09-05T03:00:00.000Z', '2025-10-30T03:00:00.000Z', 'COMPLETED', 55, 55, 29, NULL, '2025-09-06T03:21:35.420Z', '2025-09-06T03:29:43.172Z', 0, '2025-09-06T03:21:25.873Z', '2025-09-06T03:29:43.172Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (147, '2f3c2887-f6a3-4cad-97fb-ea81d72fe974', 17, 12, 'MANUAL', '2025-12-25T03:00:00.000Z', '2026-01-05T03:00:00.000Z', 'COMPLETED', 11, 11, 12, NULL, '2025-09-09T19:45:03.294Z', '2025-09-09T19:46:56.555Z', 0, '2025-09-09T19:44:58.119Z', '2025-09-09T19:46:56.555Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (76, '853ef2cc-5fa2-4ce1-b864-bf8622ac2e01', 3, 8, 'MANUAL', '2025-09-05T03:00:00.000Z', '2025-10-30T03:00:00.000Z', 'COMPLETED', 55, 55, 43, NULL, '2025-09-06T03:29:46.149Z', '2025-09-06T03:38:20.852Z', 0, '2025-09-06T03:21:25.873Z', '2025-09-06T03:38:20.852Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (128, '8d065a29-d854-4e6e-adbc-16e5503deb88', 17, 18, 'MANUAL', '2025-09-08T03:00:00.000Z', '2025-09-29T03:00:00.000Z', 'CANCELLED', 21, 7, 7, NULL, '2025-09-09T00:09:57.308Z', '2025-09-09T00:11:13.940Z', 0, '2025-09-09T00:02:05.740Z', '2025-09-09T00:11:13.940Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (125, 'b7c3a390-1c36-48c4-b441-8d0c9c7cefc1', 17, 17, 'MANUAL', '2025-09-08T03:00:00.000Z', '2025-09-29T03:00:00.000Z', 'COMPLETED', 21, 21, 21, NULL, '2025-09-09T00:19:35.345Z', '2025-09-09T00:22:57.034Z', 0, '2025-09-09T00:02:05.721Z', '2025-09-09T00:22:57.034Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (75, 'a4f21948-bcda-4acf-9f6b-88565047123c', 3, 7, 'MANUAL', '2025-09-05T03:00:00.000Z', '2025-10-30T03:00:00.000Z', 'COMPLETED', 55, 55, 40, NULL, '2025-09-06T03:40:03.475Z', '2025-09-06T03:47:27.797Z', 0, '2025-09-06T03:21:25.873Z', '2025-09-06T03:47:27.797Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (135, 'e9ef9ecd-3656-43f4-a78d-25a7a7589172', 17, 20, 'MANUAL', '2025-09-08T03:00:00.000Z', '2025-09-14T03:00:00.000Z', 'COMPLETED', 6, 6, 6, NULL, '2025-09-09T01:34:07.084Z', '2025-09-09T01:35:14.015Z', 0, '2025-09-09T01:28:26.236Z', '2025-09-09T01:35:14.015Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (74, 'c06fad36-5e0c-4d2b-b0c7-ed93487ffe07', 3, 5, 'MANUAL', '2025-09-05T03:00:00.000Z', '2025-10-30T03:00:00.000Z', 'COMPLETED', 55, 55, 40, NULL, '2025-09-06T04:26:05.601Z', '2025-09-06T04:34:01.562Z', 0, '2025-09-06T03:21:25.857Z', '2025-09-06T04:34:01.562Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (136, '0c231a60-8525-466e-9709-980188e6e74d', 17, 20, 'MANUAL', '2025-09-08T03:00:00.000Z', '2025-09-11T03:00:00.000Z', 'COMPLETED', 3, 3, 3, NULL, '2025-09-09T02:04:52.897Z', '2025-09-09T02:05:28.339Z', 0, '2025-09-09T02:04:47.550Z', '2025-09-09T02:05:28.339Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (143, '8d8e1749-37f2-4731-ae4b-bbdfff863628', 17, 14, 'MANUAL', '2025-09-08T03:00:00.000Z', '2026-01-30T03:00:00.000Z', 'COMPLETED', 144, 144, 143, NULL, '2025-09-09T02:39:29.250Z', '2025-09-09T03:00:25.333Z', 0, '2025-09-09T02:16:41.496Z', '2025-09-09T03:00:25.333Z');

INSERT INTO rate_shopper_searches (id, uuid, hotel_id, property_id, search_type, start_date, end_date, status, total_dates, processed_dates, total_prices_found, error_log, started_at, completed_at, duration_seconds, created_at, updated_at) VALUES (146, '8f98317b-7fc0-4e6f-804a-a08db56765d6', 17, 20, 'MANUAL', '2025-09-10T03:00:00.000Z', '2025-09-12T03:00:00.000Z', 'COMPLETED', 2, 2, 2, NULL, '2025-09-09T15:51:42.273Z', '2025-09-09T15:52:05.232Z', 0, '2025-09-09T15:51:38.612Z', '2025-09-09T15:52:05.232Z');



-- Dados da tabela site_templates

INSERT INTO site_templates (id, name, category, description, preview_image, html_structure, css_styles, default_content, features, is_premium, price, is_active, created_at, updated_at) VALUES (1, 'Resort de Luxo', 'luxury', 'Design elegante para resorts de alto padrão com cores douradas e layout sofisticado.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop', '{"layout":"luxury","sections":["hero","about","rooms","amenities","gallery","contact"]}', '{"font_family":"Playfair Display","primary_color":"#D4AF37","secondary_color":"#1A1A1A"}', '{"about_text":"Nosso resort oferece a mais requintada experiência em hospedagem de luxo.","hero_title":"Bem-vindo ao Paraíso","hero_subtitle":"Uma experiência única de luxo e conforto"}', '["Galeria Premium","Reservas Online","Concierge Digital","Spa & Wellness"]', true, '199.90', true, '2025-09-05T15:46:31.324Z', '2025-09-05T15:46:31.324Z');

INSERT INTO site_templates (id, name, category, description, preview_image, html_structure, css_styles, default_content, features, is_premium, price, is_active, created_at, updated_at) VALUES (2, 'Hotel Boutique', 'boutique', 'Template exclusivo para hotéis boutique com design minimalista e elegante.', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop', '{"layout":"boutique","sections":["hero","story","rooms","experiences","gallery","contact"]}', '{"font_family":"Montserrat","primary_color":"#8B4513","secondary_color":"#F5F5DC"}', '{"hero_title":"Hotel Boutique Exclusivo","story_text":"Um refúgio urbano que combina design contemporâneo com charme local.","hero_subtitle":"Onde cada detalhe conta uma história"}', '["Design Personalizado","História Local","Experiências Únicas","Arte Local"]', false, '0.00', true, '2025-09-05T15:46:31.324Z', '2025-09-05T15:46:31.324Z');

INSERT INTO site_templates (id, name, category, description, preview_image, html_structure, css_styles, default_content, features, is_premium, price, is_active, created_at, updated_at) VALUES (3, 'Hotel Executivo', 'business', 'Perfeito para hotéis de negócios com foco em produtividade e conveniência.', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop', '{"layout":"business","sections":["hero","business","rooms","facilities","meeting","contact"]}', '{"font_family":"Open Sans","primary_color":"#2C3E50","secondary_color":"#3498DB"}', '{"hero_title":"Hotel Executivo","business_text":"Instalações modernas e serviços especializados para o executivo moderno.","hero_subtitle":"Sua base para negócios de sucesso"}', '["Centro de Negócios","Salas de Reunião","Wi-Fi Premium","Serviço Express"]', false, '0.00', true, '2025-09-05T15:46:31.324Z', '2025-09-05T15:46:31.324Z');

INSERT INTO site_templates (id, name, category, description, preview_image, html_structure, css_styles, default_content, features, is_premium, price, is_active, created_at, updated_at) VALUES (4, 'Hotel de Praia', 'beach', 'Ideal para hotéis à beira-mar com cores tropicais e atmosfera relaxante.', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop', '{"layout":"beach","sections":["hero","beach","rooms","activities","restaurant","contact"]}', '{"font_family":"Poppins","primary_color":"#20B2AA","secondary_color":"#F4A460"}', '{"beach_text":"Desfrute de dias perfeitos em frente ao mar com todo conforto e comodidade.","hero_title":"Paraíso Tropical","hero_subtitle":"Onde o mar encontra o conforto"}', '["Vista para o Mar","Esportes Aquáticos","Beach Club","Piscina Infinita"]', false, '0.00', true, '2025-09-05T15:46:31.324Z', '2025-09-05T15:46:31.324Z');



-- Dados da tabela site_themes

INSERT INTO site_themes (id, name, category, thumbnail_url, preview_url, config, styles, components, is_premium, price, active, created_at, updated_at) VALUES (1, 'Hotel Clássico', 'business', NULL, NULL, '{"fontFamily":"Inter","primaryColor":"#2563eb","secondaryColor":"#64748b"}', '{"borderRadius":"8px","headerHeight":"80px"}', '["hero","rooms","gallery","contact","booking"]', false, '0.00', true, '2025-09-05T05:54:29.305Z', '2025-09-05T05:54:29.305Z');

INSERT INTO site_themes (id, name, category, thumbnail_url, preview_url, config, styles, components, is_premium, price, active, created_at, updated_at) VALUES (2, 'Resort Paradise', 'resort', NULL, NULL, '{"fontFamily":"Poppins","primaryColor":"#059669","secondaryColor":"#fbbf24"}', '{"borderRadius":"12px","headerHeight":"90px"}', '["hero","rooms","amenities","gallery","contact","booking","testimonials"]', false, '0.00', true, '2025-09-05T05:54:29.305Z', '2025-09-05T05:54:29.305Z');

INSERT INTO site_themes (id, name, category, thumbnail_url, preview_url, config, styles, components, is_premium, price, active, created_at, updated_at) VALUES (3, 'Boutique Elegante', 'boutique', NULL, NULL, '{"fontFamily":"Playfair Display","primaryColor":"#7c3aed","secondaryColor":"#f59e0b"}', '{"borderRadius":"4px","headerHeight":"70px"}', '["hero","rooms","gallery","restaurant","spa","contact","booking"]', true, '0.00', true, '2025-09-05T05:54:29.305Z', '2025-09-05T05:54:29.305Z');



-- Dados da tabela user_hotels

INSERT INTO user_hotels (id, user_id, hotel_id, role, permissions, active, created_at, updated_at) VALUES (3, 10, 17, 'STAFF', '{}', true, '2025-09-09T19:26:24.642Z', '2025-09-09T19:26:24.642Z');



-- Dados da tabela user_permissions

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (26, 10, 'view_pms_rate_shopper', '2025-09-10T00:48:49.392Z', '2025-09-10T00:48:49.392Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (27, 14, 'admin_full_access', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (28, 14, 'view_pms_dashboard', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (29, 14, 'manage_pms_reservas', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (30, 14, 'manage_pms_tarifas', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (31, 14, 'view_automacao_dashboard', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (32, 14, 'manage_automacao_flows', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (33, 14, 'view_rate_shopper', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (34, 14, 'manage_rate_shopper', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (35, 14, 'manage_users', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');

INSERT INTO user_permissions (id, user_id, permission, created_at, updated_at) VALUES (36, 14, 'manage_hotels', '2025-09-10T22:13:47.568Z', '2025-09-10T22:13:47.568Z');



-- Dados da tabela users

INSERT INTO users (id, uuid, name, email, password_hash, user_type, active, email_verified, created_at, updated_at) VALUES (8, '649160b5-cdc3-41cb-bd89-c76b9c3d6563', 'Williams Lopes', 'osociohoteleiro@gmail.com', '$2a$12$RljLSdhIp980yoQX2AI8/uzyCU0x3/JjsY1rp57nB5nHY7Z1pCODK', 'SUPER_ADMIN', true, false, '2025-09-09T17:01:16.785Z', '2025-09-09T17:01:16.785Z');

INSERT INTO users (id, uuid, name, email, password_hash, user_type, active, email_verified, created_at, updated_at) VALUES (9, '3198d2b8-75f4-4963-8f48-9fe4685e7960', 'Williams Lopes', 'nsetew@gmail.com', '$2a$12$7I4srjnT2m37KP7v/dexpObxczpt8J.xfBCPhBdKkFy3rIrUbKCPa', 'ADMIN', true, false, '2025-09-09T18:14:48.338Z', '2025-09-09T18:14:48.338Z');

INSERT INTO users (id, uuid, name, email, password_hash, user_type, active, email_verified, created_at, updated_at) VALUES (10, 'd453ad65-d253-4304-bdfe-c7eed3e3e676', 'Giandro Tonacci', 'giandroft@gmail.com', '$2a$12$AwJrHlLzitQT0ITohGHV3ujrPNCrJOj3/b3fECzEY6.lSsasGB5ie', 'HOTEL', true, false, '2025-09-09T18:28:53.312Z', '2025-09-09T18:28:53.312Z');

INSERT INTO users (id, uuid, name, email, password_hash, user_type, active, email_verified, created_at, updated_at) VALUES (14, 'f7bd1b1c-e63f-468b-9785-aea9de0493b4', 'Administrador OSH', 'admin@osh.com.br', '$2b$10$mE6XQLXDb07Y0ncosRgyFOisORyR6ahqUM6yw4M1oO1xUSS1Ia7qy', 'admin', true, true, '2025-09-10T20:09:14.794Z', '2025-09-10T20:09:14.794Z');



-- Dados da tabela workspaces

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (1, 'a43ae5fc-7f88-4f7b-a7a2-5c159fefa89c', 2, '0cf811dd-82cb-11f0-bd40-02420a0b00b1', 'Workspace Principal - Pousada Bugaendrus', 'Workspace principal para gerenciamento de automações do hotel Pousada Bugaendrus', '{}', true, '2025-09-08T15:12:50.357Z', '2025-09-08T15:12:50.357Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (2, 'a8e75bb1-c8f0-46fb-a9f5-5579e1aaea43', 3, '0cf84c30-82cb-11f0-bd40-02420a0b00b1', 'Workspace Principal - O Sócio Hoteleiro Treinamentos', 'Workspace principal para gerenciamento de automações do hotel O Sócio Hoteleiro Treinamentos', '{}', true, '2025-09-08T15:12:50.376Z', '2025-09-08T15:12:50.376Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (3, '40d3b0e5-d214-44de-b037-7cddc8f363a2', 4, '0cf84cb8-82cb-11f0-bd40-02420a0b00b1', 'Workspace Principal - Rental Acomodações', 'Workspace principal para gerenciamento de automações do hotel Rental Acomodações', '{}', true, '2025-09-08T15:12:50.378Z', '2025-09-08T15:12:50.378Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (4, 'bd6bb9a5-1206-453c-8ca0-6ae94f54d45b', 5, '0cf84d02-82cb-11f0-bd40-02420a0b00b1', 'Workspace Principal - Marine Hotel', 'Workspace principal para gerenciamento de automações do hotel Marine Hotel', '{}', true, '2025-09-08T15:12:50.379Z', '2025-09-08T15:12:50.379Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (5, 'ea536d7d-3fec-4f55-809f-da99d48c54df', 7, '0cf84d38-82cb-11f0-bd40-02420a0b00b1', 'Workspace Principal - Pousada Trancoso', 'Workspace principal para gerenciamento de automações do hotel Pousada Trancoso', '{}', true, '2025-09-08T15:12:50.382Z', '2025-09-08T15:12:50.382Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (6, '0f844ddb-a281-478a-a427-d74ff34ea154', 10, '0cf84d98-82cb-11f0-bd40-02420a0b00b1', 'Workspace Principal - Wakanda Hotel', 'Workspace principal para gerenciamento de automações do hotel Wakanda Hotel', '{}', true, '2025-09-08T15:12:50.384Z', '2025-09-08T15:12:50.384Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (7, '8896a145-048b-4ad2-bac9-55835de7cbe0', 13, '0171371b-8435-11f0-bd40-02420a0b00b1', 'Workspace Principal - passou', 'Workspace principal para gerenciamento de automações do hotel passou', '{}', true, '2025-09-08T15:12:50.385Z', '2025-09-08T15:12:50.385Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (8, '3c7f6e4d-11bc-403f-bab3-5147a44fe788', 14, 'd0deca4c-85ec-11f0-bd40-02420a0b00b1', 'Workspace Principal - Hotel API Test', 'Workspace principal para gerenciamento de automações do hotel Hotel API Test', '{}', true, '2025-09-08T15:12:50.387Z', '2025-09-08T15:12:50.387Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (9, 'bf43a970-2ba2-4d36-af41-0712e686d3e0', 16, '00afbc14-8763-11f0-bd40-02420a0b00b1', 'Workspace Principal - Hotel Teste Claude', 'Workspace principal para gerenciamento de automações do hotel Hotel Teste Claude', '{}', true, '2025-09-08T15:12:50.389Z', '2025-09-08T15:12:50.389Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (10, 'bb4740c7-2830-4686-8922-51037c59e546', 17, '3e74f4e5-8763-11f0-bd40-02420a0b00b1', 'Workspace Principal - Eco Encanto Pousada', 'Workspace principal para gerenciamento de automações do hotel Eco Encanto Pousada', '{}', true, '2025-09-08T15:12:50.391Z', '2025-09-08T15:12:50.391Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (11, 'f36a3a33-f088-4560-afe5-538aed671636', 18, '94a52b6d-8763-11f0-bd40-02420a0b00b1', 'Workspace Principal - Hotel Teste com Imagem', 'Workspace principal para gerenciamento de automações do hotel Hotel Teste com Imagem', '{}', true, '2025-09-08T15:12:50.392Z', '2025-09-08T15:12:50.392Z');

INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at) VALUES (12, 'f574f7e1-263d-4b7a-937e-e3d0311a3cc2', 19, 'b1df3a21-8763-11f0-bd40-02420a0b00b1', 'Workspace Principal - Hotel Teste Base64', 'Workspace principal para gerenciamento de automações do hotel Hotel Teste Base64', '{}', true, '2025-09-08T15:12:50.394Z', '2025-09-08T15:12:50.394Z');



