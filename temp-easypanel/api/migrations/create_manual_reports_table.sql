-- Tabela para armazenar relatórios manuais importados do Meta
CREATE TABLE IF NOT EXISTS manual_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_uuid VARCHAR(36) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type ENUM('META_ADS', 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'GENERAL') DEFAULT 'META_ADS',
    report_period_start DATE,
    report_period_end DATE,
    meta_data JSON NOT NULL COMMENT 'Dados processados do arquivo Meta em formato JSON',
    file_info JSON COMMENT 'Informações do arquivo original (nome, tamanho, etc)',
    summary_metrics JSON COMMENT 'Métricas resumo calculadas (impressões, cliques, custo, etc)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    status ENUM('ACTIVE', 'DELETED') DEFAULT 'ACTIVE',
    
    -- Índices para performance
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_report_type (report_type),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status),
    
    -- Referência ao hotel
    CONSTRAINT fk_manual_reports_hotel 
        FOREIGN KEY (hotel_uuid) 
        REFERENCES hotels(hotel_uuid) 
        ON DELETE CASCADE,
    
    -- Referência ao usuário que criou (opcional)
    CONSTRAINT fk_manual_reports_user 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Relatórios manuais importados do Meta e outras plataformas';