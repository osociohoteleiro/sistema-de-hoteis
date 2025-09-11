-- Tabela para armazenar credenciais do Meta Ads por hotel
CREATE TABLE IF NOT EXISTS meta_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_uuid VARCHAR(36) NOT NULL,
    app_id VARCHAR(255) NOT NULL COMMENT 'Meta App ID',
    app_secret TEXT NOT NULL COMMENT 'Meta App Secret (encrypted)',
    access_token TEXT NOT NULL COMMENT 'Meta Access Token',
    ad_account_id VARCHAR(255) NOT NULL COMMENT 'Meta Ad Account ID',
    business_manager_id VARCHAR(255) COMMENT 'Business Manager ID',
    token_expires_at DATETIME COMMENT 'When the access token expires',
    status ENUM('active', 'expired', 'invalid', 'disabled') DEFAULT 'active',
    last_sync_at TIMESTAMP NULL COMMENT 'Last successful data sync',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_hotel_credentials (hotel_uuid),
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_status (status),
    INDEX idx_token_expires (token_expires_at),
    
    FOREIGN KEY (hotel_uuid) REFERENCES hotels(hotel_uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para logs de sincronização
CREATE TABLE IF NOT EXISTS meta_sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_uuid VARCHAR(36) NOT NULL,
    sync_type ENUM('manual', 'scheduled', 'webhook') NOT NULL,
    status ENUM('success', 'error', 'partial') NOT NULL,
    records_processed INT DEFAULT 0,
    error_message TEXT,
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_status (status),
    INDEX idx_sync_type (sync_type),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (hotel_uuid) REFERENCES hotels(hotel_uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;