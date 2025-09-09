-- ============================================
-- RATE SHOPPER - ANÁLISE DE PREÇOS COMPETITIVA - PostgreSQL
-- ============================================
-- Migração: 007 - Tabelas do Rate Shopper (PostgreSQL)
-- Data: 2025-01-05
-- Descrição: Sistema de monitoramento e análise de preços de concorrentes

-- Criar tipos ENUM
CREATE TYPE rate_shopper_competitor_type AS ENUM ('DIRECT', 'OTA');
CREATE TYPE rate_shopper_search_type AS ENUM ('MANUAL', 'SCHEDULED');
CREATE TYPE rate_shopper_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE rate_shopper_availability_status AS ENUM ('AVAILABLE', 'LIMITED', 'SOLD_OUT');
CREATE TYPE rate_shopper_alert_type AS ENUM ('PRICE_DROP', 'PRICE_INCREASE', 'AVAILABILITY_CHANGE', 'CUSTOM');
CREATE TYPE rate_shopper_condition_operator AS ENUM ('GREATER_THAN', 'LESS_THAN', 'EQUALS', 'PERCENTAGE_CHANGE');
CREATE TYPE rate_shopper_report_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM', 'COMPETITIVE_ANALYSIS');
CREATE TYPE rate_shopper_report_status AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');
CREATE TYPE rate_shopper_job_type AS ENUM ('SEARCH', 'REPORT', 'ALERT_CHECK', 'CLEANUP');

-- Instalar extensão uuid se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de propriedades monitoradas
CREATE TABLE IF NOT EXISTS rate_shopper_properties (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    hotel_id INT NOT NULL,
    property_name VARCHAR(255) NOT NULL,
    booking_url TEXT NOT NULL,
    competitor_type rate_shopper_competitor_type DEFAULT 'OTA',
    ota_name VARCHAR(100) DEFAULT 'Booking.com',
    location VARCHAR(255),
    category VARCHAR(100), -- Hotel, Pousada, Resort, etc
    max_bundle_size INT DEFAULT 7,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Índices para rate_shopper_properties
CREATE INDEX IF NOT EXISTS idx_rsp_hotel_id ON rate_shopper_properties (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rsp_active ON rate_shopper_properties (active);
CREATE INDEX IF NOT EXISTS idx_rsp_competitor_type ON rate_shopper_properties (competitor_type);

-- Tabela de configurações do Rate Shopper por hotel
CREATE TABLE IF NOT EXISTS rate_shopper_configs (
    id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL,
    auto_search_enabled BOOLEAN DEFAULT FALSE,
    search_frequency_hours INT DEFAULT 8, -- De quantas em quantas horas fazer busca automática
    date_range_days INT DEFAULT 90, -- Quantos dias à frente buscar
    max_bundle_size INT DEFAULT 7,
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_emails TEXT, -- JSON array com emails para notificação
    price_alert_threshold DECIMAL(5,2) DEFAULT 10.00, -- % de variação para alerta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE (hotel_id)
);

-- Tabela de execuções de busca
CREATE TABLE IF NOT EXISTS rate_shopper_searches (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    hotel_id INT NOT NULL,
    property_id INT,
    search_type rate_shopper_search_type DEFAULT 'MANUAL',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status rate_shopper_status DEFAULT 'PENDING',
    total_dates INT DEFAULT 0,
    processed_dates INT DEFAULT 0,
    total_prices_found INT DEFAULT 0,
    error_log TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE SET NULL
);

-- Índices para rate_shopper_searches
CREATE INDEX IF NOT EXISTS idx_rss_hotel_id ON rate_shopper_searches (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rss_property_id ON rate_shopper_searches (property_id);
CREATE INDEX IF NOT EXISTS idx_rss_status ON rate_shopper_searches (status);
CREATE INDEX IF NOT EXISTS idx_rss_search_type ON rate_shopper_searches (search_type);
CREATE INDEX IF NOT EXISTS idx_rss_date_range ON rate_shopper_searches (start_date, end_date);

-- Tabela de preços coletados
CREATE TABLE IF NOT EXISTS rate_shopper_prices (
    id SERIAL PRIMARY KEY,
    search_id INT NOT NULL,
    property_id INT NOT NULL,
    hotel_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    room_type VARCHAR(255),
    max_guests INT DEFAULT 2,
    is_bundle BOOLEAN DEFAULT FALSE,
    bundle_size INT DEFAULT 1,
    original_price DECIMAL(10,2), -- Preço original antes de dividir pelo bundle
    availability_status rate_shopper_availability_status DEFAULT 'AVAILABLE',
    extraction_method VARCHAR(50) DEFAULT 'JS_VARS', -- JS_VARS, HTML_PARSE, API
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (search_id) REFERENCES rate_shopper_searches(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Índices para rate_shopper_prices
CREATE INDEX IF NOT EXISTS idx_rspr_search_id ON rate_shopper_prices (search_id);
CREATE INDEX IF NOT EXISTS idx_rspr_property_id ON rate_shopper_prices (property_id);
CREATE INDEX IF NOT EXISTS idx_rspr_hotel_id ON rate_shopper_prices (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rspr_dates ON rate_shopper_prices (check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_rspr_price ON rate_shopper_prices (price);
CREATE INDEX IF NOT EXISTS idx_rspr_scraped_at ON rate_shopper_prices (scraped_at);

-- Tabela de alertas configurados
CREATE TABLE IF NOT EXISTS rate_shopper_alerts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    hotel_id INT NOT NULL,
    property_id INT,
    alert_name VARCHAR(255) NOT NULL,
    alert_type rate_shopper_alert_type NOT NULL,
    condition_field VARCHAR(100) NOT NULL, -- price, availability_status, etc
    condition_operator rate_shopper_condition_operator NOT NULL,
    condition_value DECIMAL(10,2) NOT NULL,
    date_range_start DATE,
    date_range_end DATE,
    notification_channels TEXT, -- JSON: email, webhook, slack, etc
    active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP NULL,
    trigger_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE CASCADE
);

-- Índices para rate_shopper_alerts
CREATE INDEX IF NOT EXISTS idx_rsa_hotel_id ON rate_shopper_alerts (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rsa_property_id ON rate_shopper_alerts (property_id);
CREATE INDEX IF NOT EXISTS idx_rsa_active ON rate_shopper_alerts (active);
CREATE INDEX IF NOT EXISTS idx_rsa_alert_type ON rate_shopper_alerts (alert_type);

-- Tabela de histórico de alertas disparados
CREATE TABLE IF NOT EXISTS rate_shopper_alert_history (
    id SERIAL PRIMARY KEY,
    alert_id INT NOT NULL,
    search_id INT,
    price_id INT,
    triggered_value DECIMAL(10,2),
    message TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels_used TEXT, -- JSON
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (alert_id) REFERENCES rate_shopper_alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (search_id) REFERENCES rate_shopper_searches(id) ON DELETE SET NULL,
    FOREIGN KEY (price_id) REFERENCES rate_shopper_prices(id) ON DELETE SET NULL
);

-- Índices para rate_shopper_alert_history
CREATE INDEX IF NOT EXISTS idx_rsah_alert_id ON rate_shopper_alert_history (alert_id);
CREATE INDEX IF NOT EXISTS idx_rsah_triggered_at ON rate_shopper_alert_history (triggered_at);

-- Tabela de análises/relatórios gerados
CREATE TABLE IF NOT EXISTS rate_shopper_reports (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    hotel_id INT NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type rate_shopper_report_type NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    properties_included TEXT, -- JSON array de property_ids
    report_data TEXT, -- JSON com dados do relatório
    file_path VARCHAR(500), -- Caminho do arquivo PDF/Excel gerado
    file_type VARCHAR(10), -- PDF, XLSX
    status rate_shopper_report_status DEFAULT 'GENERATING',
    generated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Índices para rate_shopper_reports
CREATE INDEX IF NOT EXISTS idx_rsr_hotel_id ON rate_shopper_reports (hotel_id);
CREATE INDEX IF NOT EXISTS idx_rsr_report_type ON rate_shopper_reports (report_type);
CREATE INDEX IF NOT EXISTS idx_rsr_date_range ON rate_shopper_reports (date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_rsr_status ON rate_shopper_reports (status);

-- Tabela de filas de processamento (para sistema assíncrono)
CREATE TABLE IF NOT EXISTS rate_shopper_queue (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    job_type rate_shopper_job_type NOT NULL,
    job_data TEXT, -- JSON com dados do job
    priority INT DEFAULT 0, -- 0 = normal, 1 = high, -1 = low
    status rate_shopper_status DEFAULT 'PENDING',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para rate_shopper_queue
CREATE INDEX IF NOT EXISTS idx_rsq_status ON rate_shopper_queue (status);
CREATE INDEX IF NOT EXISTS idx_rsq_job_type ON rate_shopper_queue (job_type);
CREATE INDEX IF NOT EXISTS idx_rsq_priority ON rate_shopper_queue (priority);
CREATE INDEX IF NOT EXISTS idx_rsq_scheduled_for ON rate_shopper_queue (scheduled_for);

-- ============================================
-- TRIGGERS E FUNCTIONS
-- ============================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_rate_shopper_properties_updated_at BEFORE UPDATE ON rate_shopper_properties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rate_shopper_configs_updated_at BEFORE UPDATE ON rate_shopper_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rate_shopper_searches_updated_at BEFORE UPDATE ON rate_shopper_searches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rate_shopper_alerts_updated_at BEFORE UPDATE ON rate_shopper_alerts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function para atualizar progresso da busca
CREATE OR REPLACE FUNCTION update_search_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rate_shopper_searches 
    SET total_prices_found = total_prices_found + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.search_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar progresso da busca
CREATE TRIGGER update_search_progress_trigger 
    AFTER INSERT ON rate_shopper_prices
    FOR EACH ROW EXECUTE FUNCTION update_search_progress();

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View para preços mais recentes por propriedade
CREATE OR REPLACE VIEW rate_shopper_latest_prices AS
SELECT 
    p.id as property_id,
    p.property_name,
    p.hotel_id,
    rsp.check_in_date,
    rsp.check_out_date,
    rsp.price,
    rsp.currency,
    rsp.availability_status,
    rsp.scraped_at,
    s.search_type
FROM rate_shopper_prices rsp
JOIN rate_shopper_properties p ON rsp.property_id = p.id
JOIN rate_shopper_searches s ON rsp.search_id = s.id
WHERE rsp.scraped_at = (
    SELECT MAX(rsp2.scraped_at) 
    FROM rate_shopper_prices rsp2 
    WHERE rsp2.property_id = rsp.property_id 
      AND rsp2.check_in_date = rsp.check_in_date
);

-- View para dashboard summary
CREATE OR REPLACE VIEW rate_shopper_dashboard_summary AS
SELECT 
    h.id as hotel_id,
    h.name as hotel_name,
    COUNT(DISTINCT p.id) as total_properties,
    COUNT(DISTINCT s.id) as total_searches,
    COUNT(DISTINCT rsp.id) as total_prices,
    AVG(rsp.price) as avg_price,
    MIN(rsp.price) as min_price,
    MAX(rsp.price) as max_price,
    MAX(s.completed_at) as last_search
FROM hotels h
LEFT JOIN rate_shopper_properties p ON h.id = p.hotel_id AND p.active = TRUE
LEFT JOIN rate_shopper_searches s ON h.id = s.hotel_id
LEFT JOIN rate_shopper_prices rsp ON s.id = rsp.search_id
GROUP BY h.id, h.name;

-- ============================================
-- DADOS INICIAIS / SEEDS
-- ============================================

-- Inserir configuração padrão para hotéis existentes
INSERT INTO rate_shopper_configs (hotel_id, auto_search_enabled, search_frequency_hours, date_range_days) 
SELECT id, FALSE, 8, 90 FROM hotels 
WHERE id NOT IN (SELECT hotel_id FROM rate_shopper_configs WHERE hotel_id IS NOT NULL);