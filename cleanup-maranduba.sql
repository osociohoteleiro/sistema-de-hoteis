-- Remover URLs incorretas do Hotel Maranduba
-- Manter apenas a URL correta: maranduba-ubatuba12.pt-br.html (ID 1)

-- Primeiro, verificar quais searches usam as URLs incorretas
SELECT 'Searches usando URLs incorretas:' as info;
SELECT rs.id, rs.property_id, rsp.property_name, rsp.booking_url, rs.status
FROM rate_shopper_searches rs
JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
WHERE rsp.id IN (4, 7);

-- Deletar searches que usam as URLs incorretas (se houver)
DELETE FROM rate_shopper_searches 
WHERE property_id IN (4, 7);

-- Deletar as propriedades com URLs incorretas
DELETE FROM rate_shopper_properties 
WHERE id IN (4, 7) 
AND property_name = 'HOTEL MARANDUBA'
AND booking_url LIKE '%maranduba.html';

-- Verificar resultado final
SELECT 'Hotel Maranduba após limpeza:' as info;
SELECT id, property_name, booking_url, active
FROM rate_shopper_properties 
WHERE property_name = 'HOTEL MARANDUBA';