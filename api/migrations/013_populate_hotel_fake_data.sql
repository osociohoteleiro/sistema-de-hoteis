-- Migration: 013_populate_hotel_fake_data.sql
-- Popula as novas colunas da tabela hotels com dados fake para desenvolvimento
-- Data: 2025-09-01

-- Atualizar Pousada Bugaendrus
UPDATE hotels 
SET 
    accommodation_units = 15,
    city = 'Búzios',
    state = 'RJ',
    responsible_name = 'Ana Carolina Silva'
WHERE hotel_nome = 'Pousada Bugaendrus';

-- Atualizar O Sócio Hoteleiro Treinamentos
UPDATE hotels 
SET 
    accommodation_units = 8,
    city = 'São Paulo',
    state = 'SP',
    responsible_name = 'Ricardo Santos'
WHERE hotel_nome = 'O Sócio Hoteleiro Treinamentos';

-- Atualizar Rental Acomodações
UPDATE hotels 
SET 
    accommodation_units = 25,
    city = 'Gramado',
    state = 'RS',
    responsible_name = 'Mariana Costa Lima'
WHERE hotel_nome = 'Rental Acomodações';

-- Atualizar Marine Hotel
UPDATE hotels 
SET 
    accommodation_units = 45,
    city = 'Fortaleza',
    state = 'CE',
    responsible_name = 'João Pedro Oliveira'
WHERE hotel_nome = 'Marine Hotel';

-- Atualizar Pousada Trancoso
UPDATE hotels 
SET 
    accommodation_units = 18,
    city = 'Trancoso',
    state = 'BA',
    responsible_name = 'Fernanda Almeida'
WHERE hotel_nome = 'Pousada Trancoso';

-- Atualizar qualquer outro hotel que ainda tenha valores NULL ou 0
UPDATE hotels 
SET 
    accommodation_units = CASE 
        WHEN accommodation_units IS NULL OR accommodation_units = 0 THEN FLOOR(RAND() * 60) + 10
        ELSE accommodation_units
    END,
    city = CASE 
        WHEN city IS NULL THEN 
            CASE FLOOR(RAND() * 5)
                WHEN 0 THEN 'São Paulo'
                WHEN 1 THEN 'Rio de Janeiro'
                WHEN 2 THEN 'Belo Horizonte'
                WHEN 3 THEN 'Salvador'
                ELSE 'Florianópolis'
            END
        ELSE city
    END,
    state = CASE 
        WHEN state IS NULL THEN 
            CASE 
                WHEN city = 'São Paulo' THEN 'SP'
                WHEN city = 'Rio de Janeiro' THEN 'RJ'
                WHEN city = 'Belo Horizonte' THEN 'MG'
                WHEN city = 'Salvador' THEN 'BA'
                WHEN city = 'Florianópolis' THEN 'SC'
                ELSE 'SP'
            END
        ELSE state
    END,
    responsible_name = CASE
        WHEN responsible_name IS NULL THEN
            CASE FLOOR(RAND() * 5)
                WHEN 0 THEN 'Carlos Eduardo Silva'
                WHEN 1 THEN 'Marina Santos Costa'
                WHEN 2 THEN 'Rafael Pereira'
                WHEN 3 THEN 'Amanda Rodrigues'
                ELSE 'Bruno Lima Santos'
            END
        ELSE responsible_name
    END
WHERE accommodation_units IS NULL OR accommodation_units = 0 OR city IS NULL OR state IS NULL OR responsible_name IS NULL;