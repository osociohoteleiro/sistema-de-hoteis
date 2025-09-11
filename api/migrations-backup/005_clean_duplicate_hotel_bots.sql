-- Migration: Limpar bots duplicados por hotel
-- Data: 2025-08-31  
-- Descrição: Remove registros duplicados mantendo apenas 1 bot por hotel (o mais recente)

-- Criar tabela temporária com apenas 1 registro por hotel (o mais recente)
CREATE TEMPORARY TABLE temp_unique_bots AS
SELECT 
  t1.id
FROM flowise_bots t1
WHERE t1.id = (
  SELECT MAX(t2.id) 
  FROM flowise_bots t2 
  WHERE t2.hotel_uuid = t1.hotel_uuid
);

-- Deletar todos os registros que não estão na tabela temporária
DELETE FROM flowise_bots 
WHERE id NOT IN (SELECT id FROM temp_unique_bots);

-- Agora adicionar a constraint única por hotel
ALTER TABLE flowise_bots ADD CONSTRAINT unique_hotel_one_bot UNIQUE (hotel_uuid);