-- SQLs para sincronizar Rate Shopper para produção (VERSÃO CORRIGIDA)
-- Gerado automaticamente em 2025-09-10T22:00:00.000Z

-- Hotel: Eco Encanto Pousada
-- UUID: 3e74f4e5-8763-11f0-bd40-02420a0b00b1
-- Propriedades: 8

-- Verificar estrutura da tabela primeiro
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rate_shopper_properties' 
ORDER BY ordinal_position;

-- Inserção de propriedades Rate Shopper (versão compatível)
DO $$
DECLARE
    hotel_id_var INTEGER;
    table_exists BOOLEAN;
BEGIN
    -- Verificar se a tabela existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'rate_shopper_properties'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'Tabela rate_shopper_properties não existe na produção';
    END IF;
    
    -- Buscar ID do hotel pelo UUID
    SELECT id INTO hotel_id_var FROM hotels WHERE hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1';
    
    IF hotel_id_var IS NOT NULL THEN
        RAISE NOTICE 'Hotel encontrado com ID: %', hotel_id_var;
        
        -- Deletar propriedades existentes para evitar duplicatas
        DELETE FROM rate_shopper_properties WHERE hotel_id = hotel_id_var;
        RAISE NOTICE 'Propriedades existentes removidas';
        
        -- Verificar quais colunas existem na tabela
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_properties' AND column_name = 'booking_url') THEN
            -- Versão completa com booking_url
            RAISE NOTICE 'Usando versão completa com booking_url';
            
            -- 1. Eco Encanto Pousada (booking) ⭐
            INSERT INTO rate_shopper_properties (
                hotel_id, property_name, booking_url, location, category,
                competitor_type, ota_name, platform, max_bundle_size,
                is_main_property, active, created_at, updated_at
            ) VALUES (
                hotel_id_var,
                'Eco Encanto Pousada',
                'https://www.booking.com/hotel/br/eco-encanto-pousada-e-hostel.pt-br.html',
                'Ubatuba - São paulo',
                'Pousada',
                'OTA',
                'Booking.com',
                'booking',
                7,
                true,
                true,
                NOW(),
                NOW()
            );
            
            -- 2. Chalés Four Seasons (booking)
            INSERT INTO rate_shopper_properties (
                hotel_id, property_name, booking_url, location, category,
                competitor_type, ota_name, platform, max_bundle_size,
                is_main_property, active, created_at, updated_at
            ) VALUES (
                hotel_id_var,
                'Chalés Four Seasons',
                'https://www.booking.com/hotel/br/chales-four-seasons.pt-br.html',
                'Ubatuba - São Paulo',
                'Pousada',
                'OTA',
                'Booking.com',
                'booking',
                7,
                false,
                true,
                NOW(),
                NOW()
            );
            
            -- 3. Pousada Aldeia da Lagoinha (booking)
            INSERT INTO rate_shopper_properties (
                hotel_id, property_name, booking_url, location, category,
                competitor_type, ota_name, platform, max_bundle_size,
                is_main_property, active, created_at, updated_at
            ) VALUES (
                hotel_id_var,
                'Pousada Aldeia da Lagoinha',
                'https://www.booking.com/hotel/br/aldeia-da-lagoinha.pt-br.html',
                'Ubatuba - São Paulo',
                'Pousada',
                'OTA',
                'Booking.com',
                'booking',
                7,
                false,
                true,
                NOW(),
                NOW()
            );
            
            -- 4. Pousada Kaliman (booking)
            INSERT INTO rate_shopper_properties (
                hotel_id, property_name, booking_url, location, category,
                competitor_type, ota_name, platform, max_bundle_size,
                is_main_property, active, created_at, updated_at
            ) VALUES (
                hotel_id_var,
                'Pousada Kaliman',
                'https://www.booking.com/hotel/br/kaliman-pousada.pt-br.html',
                'Ubatuba - São Paulo',
                'Pousada',
                'OTA',
                'Booking.com',
                'booking',
                7,
                false,
                true,
                NOW(),
                NOW()
            );
            
            -- 5. Venice Hotel (booking)
            INSERT INTO rate_shopper_properties (
                hotel_id, property_name, booking_url, location, category,
                competitor_type, ota_name, platform, max_bundle_size,
                is_main_property, active, created_at, updated_at
            ) VALUES (
                hotel_id_var,
                'Venice Hotel',
                'https://www.booking.com/hotel/br/caribe-ubatuba.pt-br.html',
                'Ubatuba - São Paulo',
                'Hotel',
                'OTA',
                'Booking.com',
                'booking',
                7,
                false,
                true,
                NOW(),
                NOW()
            );
            
            -- 6. Hotel Porto do Eixo (booking)
            INSERT INTO rate_shopper_properties (
                hotel_id, property_name, booking_url, location, category,
                competitor_type, ota_name, platform, max_bundle_size,
                is_main_property, active, created_at, updated_at
            ) VALUES (
                hotel_id_var,
                'Hotel Porto do Eixo',
                'https://www.booking.com/hotel/br/porto-do-eixo.pt-br.html',
                'Ubatuba - São Paulo',
                'Hotel',
                'OTA',
                'Booking.com',
                'booking',
                7,
                false,
                true,
                NOW(),
                NOW()
            );
            
            -- 7. Pousada Aquária (booking)
            INSERT INTO rate_shopper_properties (
                hotel_id, property_name, booking_url, location, category,
                competitor_type, ota_name, platform, max_bundle_size,
                is_main_property, active, created_at, updated_at
            ) VALUES (
                hotel_id_var,
                'Pousada Aquária',
                'https://www.booking.com/hotel/br/pousada-aquaria.pt-br.html',
                'Ubatuba - São Paulo - maranduba',
                'Pousada',
                'OTA',
                'Booking.com',
                'booking',
                7,
                false,
                true,
                NOW(),
                NOW()
            );
            
            -- 8. Eco Encanto Pousada (artaxnet) ⭐
            INSERT INTO rate_shopper_properties (
                hotel_id, property_name, booking_url, location, category,
                competitor_type, ota_name, platform, max_bundle_size,
                is_main_property, active, created_at, updated_at
            ) VALUES (
                hotel_id_var,
                'Eco Encanto Pousada',
                'https://eco-encanto-pousada.artaxnet.com/#/',
                'Ubatuba - São Paulo',
                'Pousada',
                'OTA',
                'Artaxnet',
                'artaxnet',
                7,
                true,
                true,
                NOW(),
                NOW()
            );
            
        ELSE
            -- Versão simplificada sem booking_url
            RAISE NOTICE 'Usando versão simplificada sem booking_url';
            
            -- Inserir apenas com os campos básicos
            INSERT INTO rate_shopper_properties (hotel_id, property_name, created_at, updated_at)
            VALUES (hotel_id_var, 'Eco Encanto Pousada (booking)', NOW(), NOW());
            
            INSERT INTO rate_shopper_properties (hotel_id, property_name, created_at, updated_at)
            VALUES (hotel_id_var, 'Chalés Four Seasons', NOW(), NOW());
            
            INSERT INTO rate_shopper_properties (hotel_id, property_name, created_at, updated_at)
            VALUES (hotel_id_var, 'Pousada Aldeia da Lagoinha', NOW(), NOW());
            
            INSERT INTO rate_shopper_properties (hotel_id, property_name, created_at, updated_at)
            VALUES (hotel_id_var, 'Pousada Kaliman', NOW(), NOW());
            
            INSERT INTO rate_shopper_properties (hotel_id, property_name, created_at, updated_at)
            VALUES (hotel_id_var, 'Venice Hotel', NOW(), NOW());
            
            INSERT INTO rate_shopper_properties (hotel_id, property_name, created_at, updated_at)
            VALUES (hotel_id_var, 'Hotel Porto do Eixo', NOW(), NOW());
            
            INSERT INTO rate_shopper_properties (hotel_id, property_name, created_at, updated_at)
            VALUES (hotel_id_var, 'Pousada Aquária', NOW(), NOW());
            
            INSERT INTO rate_shopper_properties (hotel_id, property_name, created_at, updated_at)
            VALUES (hotel_id_var, 'Eco Encanto Pousada (artaxnet)', NOW(), NOW());
            
        END IF;
        
        RAISE NOTICE 'Inseridas 8 propriedades para hotel %', hotel_id_var;
        
    ELSE
        RAISE EXCEPTION 'Hotel não encontrado com UUID: 3e74f4e5-8763-11f0-bd40-02420a0b00b1';
    END IF;
END $$;

-- Verificação das propriedades inseridas
SELECT 
    h.name as hotel_name,
    h.hotel_uuid,
    COUNT(rsp.id) as total_properties,
    COUNT(CASE WHEN rsp.is_main_property = true THEN 1 END) as main_properties
FROM hotels h
LEFT JOIN rate_shopper_properties rsp ON h.id = rsp.hotel_id
WHERE h.hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1'
GROUP BY h.id, h.name, h.hotel_uuid;

-- Listar todas as propriedades inseridas
SELECT 
    rsp.id,
    rsp.property_name,
    rsp.platform,
    rsp.is_main_property,
    rsp.active,
    rsp.created_at
FROM rate_shopper_properties rsp
JOIN hotels h ON rsp.hotel_id = h.id
WHERE h.hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1'
ORDER BY rsp.id;