-- SQL MÍNIMO para produção - apenas colunas essenciais
-- Execute no PGweb linha por linha

-- 1. Primeiro verificar se hotel existe
SELECT id, name FROM hotels WHERE hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1';

-- 2. Verificar estrutura da tabela
SELECT column_name FROM information_schema.columns WHERE table_name = 'rate_shopper_properties' ORDER BY ordinal_position;

-- 3. Inserir propriedades básicas (apenas hotel_id e property_name)
DO $$
DECLARE
    hotel_id_var INTEGER;
BEGIN
    -- Buscar ID do hotel
    SELECT id INTO hotel_id_var FROM hotels WHERE hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1';
    
    IF hotel_id_var IS NOT NULL THEN
        -- Remover existentes
        DELETE FROM rate_shopper_properties WHERE hotel_id = hotel_id_var;
        
        -- Inserir apenas com colunas que certamente existem
        INSERT INTO rate_shopper_properties (hotel_id, property_name) VALUES (hotel_id_var, 'Eco Encanto Pousada (booking)');
        INSERT INTO rate_shopper_properties (hotel_id, property_name) VALUES (hotel_id_var, 'Chalés Four Seasons');
        INSERT INTO rate_shopper_properties (hotel_id, property_name) VALUES (hotel_id_var, 'Pousada Aldeia da Lagoinha');
        INSERT INTO rate_shopper_properties (hotel_id, property_name) VALUES (hotel_id_var, 'Pousada Kaliman');
        INSERT INTO rate_shopper_properties (hotel_id, property_name) VALUES (hotel_id_var, 'Venice Hotel');
        INSERT INTO rate_shopper_properties (hotel_id, property_name) VALUES (hotel_id_var, 'Hotel Porto do Eixo');
        INSERT INTO rate_shopper_properties (hotel_id, property_name) VALUES (hotel_id_var, 'Pousada Aquária');
        INSERT INTO rate_shopper_properties (hotel_id, property_name) VALUES (hotel_id_var, 'Eco Encanto Pousada (artaxnet)');
        
        RAISE NOTICE 'Inseridas 8 propriedades para hotel %', hotel_id_var;
    ELSE
        RAISE EXCEPTION 'Hotel não encontrado';
    END IF;
END $$;

-- 4. Verificar se funcionou
SELECT COUNT(*) as total FROM rate_shopper_properties rsp 
JOIN hotels h ON rsp.hotel_id = h.id 
WHERE h.hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1';