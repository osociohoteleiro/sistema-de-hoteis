-- Tabela para armazenar contas disponíveis após OAuth (não conectadas ainda)
CREATE TABLE IF NOT EXISTS meta_available_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotel_uuid VARCHAR(36) NOT NULL,
  ad_account_id VARCHAR(50) NOT NULL,
  ad_account_name VARCHAR(255) NOT NULL,
  business_id VARCHAR(50) DEFAULT '',
  business_name VARCHAR(255) DEFAULT '',
  account_status INT DEFAULT 1,
  currency VARCHAR(10) DEFAULT '',
  access_token TEXT NOT NULL,
  token_expires_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_hotel_account (hotel_uuid, ad_account_id),
  INDEX idx_hotel_uuid (hotel_uuid)
);

-- Modificar meta_connected_accounts para adicionar campo de status
ALTER TABLE meta_connected_accounts ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active';
ALTER TABLE meta_connected_accounts ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE meta_connected_accounts ADD COLUMN IF NOT EXISTS token_expires_at DATETIME;