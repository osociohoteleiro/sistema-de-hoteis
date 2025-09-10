// Script para popular dados iniciais do RateShopper na produção
const db = require('./config/database');

async function populateRateShopperData() {
    try {
        console.log('📊 POPULANDO dados iniciais do RateShopper...');
        
        // 1. Verificar se há hotéis cadastrados
        const hotels = await db.query('SELECT id, hotel_uuid, name FROM hotels LIMIT 5');
        console.log('🏨 Hotéis disponíveis:');
        hotels.forEach(hotel => {
            console.log(`   - ${hotel.name} (ID: ${hotel.id}, UUID: ${hotel.hotel_uuid})`);
        });
        
        if (hotels.length === 0) {
            console.log('❌ Nenhum hotel encontrado! Precisa cadastrar hotéis primeiro.');
            process.exit(1);
        }
        
        // 2. Verificar propriedades existentes
        const existingProperties = await db.query('SELECT COUNT(*) as total FROM rate_shopper_properties');
        console.log(`📋 Propriedades RateShopper existentes: ${existingProperties[0].total}`);
        
        // 3. Se não há propriedades, criar algumas de exemplo
        if (existingProperties[0].total === 0) {
            console.log('🆕 Criando propriedades de exemplo...');
            
            const mainHotel = hotels[0]; // Usar primeiro hotel como principal
            
            // Propriedades concorrentes de exemplo
            const sampleProperties = [
                {
                    name: 'Hotel Maranduba Premium',
                    url: 'https://eco-encanto-pousada.artaxnet.com/',
                    platform: 'artaxnet',
                    is_main: false
                },
                {
                    name: 'Pousada Kaliman',
                    url: 'https://kaliman-pousada.artaxnet.com/',
                    platform: 'artaxnet', 
                    is_main: false
                },
                {
                    name: 'Resort Vila do Mar',
                    url: 'https://vila-do-mar.artaxnet.com/',
                    platform: 'artaxnet',
                    is_main: false
                },
                {
                    name: mainHotel.name,
                    url: 'https://meu-hotel.artaxnet.com/',
                    platform: 'artaxnet',
                    is_main: true
                }
            ];
            
            for (const property of sampleProperties) {
                try {
                    await db.query(`
                        INSERT INTO rate_shopper_properties 
                        (hotel_id, property_name, property_url, booking_engine, is_main_property, active)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        mainHotel.id,
                        property.name,
                        property.url,
                        property.platform,
                        property.is_main,
                        true
                    ]);
                    
                    console.log(`   ✅ ${property.name} ${property.is_main ? '(PRINCIPAL)' : ''}`);
                } catch (e) {
                    console.log(`   ⚠️ Erro ao criar ${property.name}:`, e.message);
                }
            }
        }
        
        // 4. Verificar configurações existentes
        const existingConfigs = await db.query('SELECT COUNT(*) as total FROM rate_shopper_configs');
        console.log(`⚙️ Configurações RateShopper existentes: ${existingConfigs[0].total}`);
        
        // 5. Se não há configurações, criar uma padrão
        if (existingConfigs[0].total === 0) {
            console.log('🆕 Criando configuração padrão...');
            
            for (const hotel of hotels) {
                try {
                    await db.query(`
                        INSERT INTO rate_shopper_configs
                        (hotel_id, search_frequency, max_concurrent_searches, enable_alerts, alert_threshold_percentage, active)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        hotel.id,
                        60, // 60 minutos
                        3,  // 3 buscas simultâneas
                        true, // alertas habilitados
                        10.00, // 10% threshold
                        true
                    ]);
                    
                    console.log(`   ✅ Configuração criada para ${hotel.name}`);
                } catch (e) {
                    console.log(`   ⚠️ Erro ao criar config para ${hotel.name}:`, e.message);
                }
            }
        }
        
        // 6. Verificar resultado final
        console.log('🔍 Verificando dados finais...');
        
        const finalProperties = await db.query(`
            SELECT rsp.id, rsp.property_name, rsp.booking_engine, rsp.is_main_property, h.name as hotel_name
            FROM rate_shopper_properties rsp
            JOIN hotels h ON rsp.hotel_id = h.id
            ORDER BY rsp.is_main_property DESC, rsp.property_name
        `);
        
        console.log('📋 Propriedades do RateShopper:');
        finalProperties.forEach(prop => {
            console.log(`   ${prop.is_main_property ? '🏆' : '🏨'} ${prop.property_name} (${prop.booking_engine}) - Hotel: ${prop.hotel_name}`);
        });
        
        const finalConfigs = await db.query(`
            SELECT rsc.id, rsc.search_frequency, h.name as hotel_name
            FROM rate_shopper_configs rsc 
            JOIN hotels h ON rsc.hotel_id = h.id
        `);
        
        console.log('⚙️ Configurações do RateShopper:');
        finalConfigs.forEach(config => {
            console.log(`   🔧 ${config.hotel_name}: busca a cada ${config.search_frequency} minutos`);
        });
        
        console.log('🎉 DADOS DO RATE SHOPPER POPULADOS COM SUCESSO!');
        console.log('');
        console.log('🚀 PRÓXIMOS PASSOS:');
        console.log('1. Acesse /rate-shopper/properties no PMS');
        console.log('2. Você deve ver as propriedades concorrentes listadas');
        console.log('3. Configure as URLs e detalhes conforme necessário');
        
    } catch (error) {
        console.error('❌ ERRO AO POPULAR DADOS:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
populateRateShopperData();