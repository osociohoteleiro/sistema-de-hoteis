-- ============================================
-- RATE SHOPPER - ANÁLISE DE PREÇOS COMPETITIVA
-- ============================================
-- Migração: 007 - Tabelas do Rate Shopper
-- Data: 2025-01-XX
-- Descrição: Sistema de monitoramento e análise de preços de concorrentes

-- Tabela de propriedades monitoradas
CREATE TABLE IF NOT EXISTS rate_shopper_properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    hotel_id INT NOT NULL,
    property_name VARCHAR(255) NOT NULL,
    booking_url TEXT NOT NULL,
    competitor_type ENUM('DIRECT', 'OTA') DEFAULT 'OTA',
    ota_name VARCHAR(100) DEFAULT 'Booking.com',
    location VARCHAR(255),
    category VARCHAR(100), -- Hotel, Pousada, Resort, etc
    max_bundle_size INT DEFAULT 7,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_active (active),
    INDEX idx_competitor_type (competitor_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações do Rate Shopper por hotel
CREATE TABLE IF NOT EXISTS rate_shopper_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    auto_search_enabled BOOLEAN DEFAULT FALSE,
    search_frequency_hours INT DEFAULT 8, -- De quantas em quantas horas fazer busca automática
    date_range_days INT DEFAULT 90, -- Quantos dias à frente buscar
    max_bundle_size INT DEFAULT 7,
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_emails TEXT, -- JSON array com emails para notificação
    price_alert_threshold DECIMAL(5,2) DEFAULT 10.00, -- % de variação para alerta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hotel_config (hotel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de execuções de busca
CREATE TABLE IF NOT EXISTS rate_shopper_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    hotel_id INT NOT NULL,
    property_id INT,
    search_type ENUM('MANUAL', 'SCHEDULED') DEFAULT 'MANUAL',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    total_dates INT DEFAULT 0,
    processed_dates INT DEFAULT 0,
    total_prices_found INT DEFAULT 0,
    error_log TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE SET NULL,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_property_id (property_id),
    INDEX idx_status (status),
    INDEX idx_search_type (search_type),
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de preços coletados
CREATE TABLE IF NOT EXISTS rate_shopper_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    availability_status ENUM('AVAILABLE', 'LIMITED', 'SOLD_OUT') DEFAULT 'AVAILABLE',
    extraction_method VARCHAR(50) DEFAULT 'JS_VARS', -- JS_VARS, HTML_PARSE, API
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (search_id) REFERENCES rate_shopper_searches(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_search_id (search_id),
    INDEX idx_property_id (property_id),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_dates (check_in_date, check_out_date),
    INDEX idx_price (price),
    INDEX idx_scraped_at (scraped_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de alertas configurados
CREATE TABLE IF NOT EXISTS rate_shopper_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    hotel_id INT NOT NULL,
    property_id INT,
    alert_name VARCHAR(255) NOT NULL,
    alert_type ENUM('PRICE_DROP', 'PRICE_INCREASE', 'AVAILABILITY_CHANGE', 'CUSTOM') NOT NULL,
    condition_field VARCHAR(100) NOT NULL, -- price, availability_status, etc
    condition_operator ENUM('GREATER_THAN', 'LESS_THAN', 'EQUALS', 'PERCENTAGE_CHANGE') NOT NULL,
    condition_value DECIMAL(10,2) NOT NULL,
    date_range_start DATE,
    date_range_end DATE,
    notification_channels TEXT, -- JSON: email, webhook, slack, etc
    active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP NULL,
    trigger_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_property_id (property_id),
    INDEX idx_active (active),
    INDEX idx_alert_type (alert_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de histórico de alertas disparados
CREATE TABLE IF NOT EXISTS rate_shopper_alert_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    FOREIGN KEY (price_id) REFERENCES rate_shopper_prices(id) ON DELETE SET NULL,
    INDEX idx_alert_id (alert_id),
    INDEX idx_triggered_at (triggered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de análises/relatórios gerados
CREATE TABLE IF NOT EXISTS rate_shopper_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    hotel_id INT NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM', 'COMPETITIVE_ANALYSIS') NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    properties_included TEXT, -- JSON array de property_ids
    report_data LONGTEXT, -- JSON com dados do relatório
    file_path VARCHAR(500), -- Caminho do arquivo PDF/Excel gerado
    file_type VARCHAR(10), -- PDF, XLSX
    status ENUM('GENERATING', 'COMPLETED', 'FAILED') DEFAULT 'GENERATING',
    generated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_report_type (report_type),
    INDEX idx_date_range (date_range_start, date_range_end),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de filas de processamento (para sistema assíncrono)
CREATE TABLE IF NOT EXISTS rate_shopper_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    job_type ENUM('SEARCH', 'REPORT', 'ALERT_CHECK', 'CLEANUP') NOT NULL,
    job_data TEXT, -- JSON com dados do job
    priority INT DEFAULT 0, -- 0 = normal, 1 = high, -1 = low
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_job_type (job_type),
    INDEX idx_priority (priority),
    INDEX idx_scheduled_for (scheduled_for)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DADOS INICIAIS / SEEDS
-- ============================================

-- Inserir configuração padrão para hotéis existentes
INSERT INTO rate_shopper_configs (hotel_id, auto_search_enabled, search_frequency_hours, date_range_days) 
SELECT id, FALSE, 8, 90 FROM hotels 
WHERE id NOT IN (SELECT hotel_id FROM rate_shopper_configs);

-- ============================================
-- TRIGGERS E PROCEDURES (OPCIONAL)
-- ============================================

-- Trigger para atualizar progresso da busca
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_search_progress 
    AFTER INSERT ON rate_shopper_prices
    FOR EACH ROW
BEGIN
    UPDATE rate_shopper_searches 
    SET total_prices_found = total_prices_found + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.search_id;
END//

-- Trigger para verificar alertas após inserir preço
CREATE TRIGGER IF NOT EXISTS check_price_alerts 
    AFTER INSERT ON rate_shopper_prices
    FOR EACH ROW
BEGIN
    -- Verificar alertas de queda de preço
    INSERT INTO rate_shopper_alert_history (alert_id, price_id, triggered_value, message)
    SELECT a.id, NEW.id, NEW.price, 
           CONCAT('Preço abaixo do limite: R$ ', NEW.price)
    FROM rate_shopper_alerts a
    WHERE a.hotel_id = NEW.hotel_id
      AND a.property_id = NEW.property_id
      AND a.active = TRUE
      AND a.alert_type = 'PRICE_DROP'
      AND a.condition_operator = 'LESS_THAN'
      AND NEW.price < a.condition_value
      AND (a.date_range_start IS NULL OR NEW.check_in_date >= a.date_range_start)
      AND (a.date_range_end IS NULL OR NEW.check_in_date <= a.date_range_end);
END//
DELIMITER ;

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