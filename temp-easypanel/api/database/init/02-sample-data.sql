-- Dados de exemplo para desenvolvimento
-- Este arquivo será executado apenas em desenvolvimento

-- Hotel de exemplo
INSERT INTO hotels (id, name, address, city, state, country, email, phone) 
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Hotel OSH Demo',
    'Rua das Flores, 123',
    'São Paulo',
    'SP',
    'Brasil',
    'contato@hoteldemo.com',
    '+55 11 99999-9999'
) ON CONFLICT (id) DO NOTHING;

-- Usuário administrador de exemplo
INSERT INTO users (id, name, email, password_hash, role, hotel_id) 
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'Admin OSH',
    'admin@osh.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password123'
    'admin',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
) ON CONFLICT (email) DO NOTHING;

-- Workspace de exemplo
INSERT INTO workspaces (id, name, hotel_id, description)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'Workspace Principal',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Workspace principal do hotel demo'
) ON CONFLICT (id) DO NOTHING;

-- Configurações de exemplo
INSERT INTO configs (hotel_id, config_key, config_value)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'theme', '{"primaryColor": "#3B82F6", "secondaryColor": "#10B981"}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'features', '{"rateShopper": true, "whatsapp": true, "analytics": true}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'notifications', '{"email": true, "sms": false, "push": true}')
ON CONFLICT (hotel_id, config_key) DO NOTHING;

-- Rate Shopper Properties de exemplo
INSERT INTO rate_shopper_properties (hotel_id, property_name, property_url, location, is_competitor)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Hotel OSH Demo', 'https://booking.com/hotel-osh-demo', 'São Paulo, SP', false),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Competitor A', 'https://booking.com/competitor-a', 'São Paulo, SP', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Competitor B', 'https://booking.com/competitor-b', 'São Paulo, SP', true)
ON CONFLICT DO NOTHING;