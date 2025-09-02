-- Tabela para states do OAuth (segurança)
CREATE TABLE IF NOT EXISTS oauth_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    state VARCHAR(255) NOT NULL UNIQUE,
    hotel_uuid VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    INDEX idx_state (state),
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (hotel_uuid) REFERENCES hotels(hotel_uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para informações do OAuth do Meta
CREATE TABLE IF NOT EXISTS meta_oauth_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_uuid VARCHAR(36) NOT NULL,
    facebook_user_id VARCHAR(255) NOT NULL,
    facebook_name VARCHAR(255),
    facebook_email VARCHAR(255),
    available_ad_accounts LONGTEXT COMMENT 'JSON das contas disponíveis',
    selected_ad_account TEXT COMMENT 'JSON da conta selecionada',
    oauth_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_hotel_oauth (hotel_uuid),
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_facebook_user_id (facebook_user_id),
    INDEX idx_oauth_completed (oauth_completed_at),
    
    FOREIGN KEY (hotel_uuid) REFERENCES hotels(hotel_uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;