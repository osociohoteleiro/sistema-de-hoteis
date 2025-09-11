-- Migration: Criar tabela evolution_instances
-- Data: 2025-08-31
-- Descrição: Adiciona tabela para cadastrar instâncias da Evolution API

-- Criar tabela evolution_instances
CREATE TABLE IF NOT EXISTS evolution_instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instance_name VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    hotel_uuid VARCHAR(36) NOT NULL,
    host_url VARCHAR(500) DEFAULT 'https://osh-ia-evolution-api.d32pnk.easypanel.host/',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_uuid) REFERENCES hotels(hotel_uuid) ON DELETE CASCADE,
    UNIQUE KEY unique_hotel_instance (hotel_uuid, instance_name),
    INDEX idx_hotel_uuid (hotel_uuid),
    INDEX idx_instance_name (instance_name),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir instância padrão da Evolution API para Hotel Exemplo 1
INSERT IGNORE INTO evolution_instances (instance_name, api_key, hotel_uuid, host_url, active) 
SELECT 'instancia-principal', '429683C4C977415CAAFCCE10F7D57E11', hotel_uuid, 'https://osh-ia-evolution-api.d32pnk.easypanel.host/', TRUE 
FROM hotels WHERE name = 'Hotel Exemplo 1' LIMIT 1;