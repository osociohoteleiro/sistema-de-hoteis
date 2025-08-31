-- Migration: Atualizar constraint da tabela flowise_bots
-- Data: 2025-08-31
-- Descrição: Remove constraint única (hotel_uuid + bot_id) para permitir 1 bot em N hotéis
--           Mantém regra: 1 hotel = 1 bot máximo (aplicada via lógica de negócio)

-- Remover a constraint única que impedia 1 bot estar em vários hotéis
ALTER TABLE flowise_bots DROP INDEX unique_hotel_bot;

-- Adicionar constraint única apenas por hotel (1 hotel = 1 bot máximo)
ALTER TABLE flowise_bots ADD CONSTRAINT unique_hotel_one_bot UNIQUE (hotel_uuid);