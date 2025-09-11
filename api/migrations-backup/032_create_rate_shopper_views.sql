-- Migration: Create rate shopper views and summary tables
-- Esta migration cria as views e tabelas de resumo do rate shopper

-- Criar view rate_shopper_dashboard_summary
CREATE OR REPLACE VIEW rate_shopper_dashboard_summary AS
SELECT 
    h.id as hotel_id,
    h.name as hotel_name,
    COUNT(DISTINCT rsp.id) as total_properties,
    COUNT(DISTINCT rss.id) as total_searches,
    COUNT(DISTINCT rsp2.id) as total_prices,
    ROUND(AVG(rsp2.price), 2) as avg_price,
    MIN(rsp2.price) as min_price,
    MAX(rsp2.price) as max_price,
    MAX(rss.completed_at) as last_search
FROM hotels h
LEFT JOIN rate_shopper_properties rsp ON h.id = rsp.hotel_id
LEFT JOIN rate_shopper_searches rss ON h.id = rss.hotel_id
LEFT JOIN rate_shopper_prices rsp2 ON h.id = rsp2.hotel_id
WHERE h.status = 'ACTIVE'
GROUP BY h.id, h.name;

-- Criar view rate_shopper_latest_prices  
CREATE OR REPLACE VIEW rate_shopper_latest_prices AS
SELECT DISTINCT ON (rsp.id, rsp2.check_in_date)
    rsp.id as property_id,
    rsp.property_name,
    rsp.hotel_id,
    rsp2.check_in_date,
    rsp2.check_out_date,
    rsp2.price,
    rsp2.currency,
    rsp2.availability_status,
    rsp2.scraped_at,
    rss.search_type
FROM rate_shopper_properties rsp
JOIN rate_shopper_prices rsp2 ON rsp.id = rsp2.property_id
JOIN rate_shopper_searches rss ON rsp2.search_id = rss.id
WHERE rsp.active = TRUE
ORDER BY rsp.id, rsp2.check_in_date, rsp2.scraped_at DESC;