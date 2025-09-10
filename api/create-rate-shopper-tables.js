// Script para criar tabelas do RateShopper e outras que faltaram na produção
const db = require('./config/database');

async function createRateShopperTables() {
    try {
        console.log('📊 CRIANDO tabelas do RateShopper na produção...');
        
        // 1. rate_shopper_properties
        console.log('🏨 Criando rate_shopper_properties...');
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS rate_shopper_properties (
                    id SERIAL PRIMARY KEY,
                    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                    property_name VARCHAR(255) NOT NULL,
                    property_url TEXT,
                    booking_engine VARCHAR(100),
                    is_main_property BOOLEAN DEFAULT FALSE,
                    active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ rate_shopper_properties criada');
        } catch (e) {
            console.log('⚠️', e.message);
        }
        
        // 2. rate_shopper_configs
        console.log('⚙️ Criando rate_shopper_configs...');
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS rate_shopper_configs (
                    id SERIAL PRIMARY KEY,
                    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                    search_frequency INTEGER DEFAULT 60,
                    max_concurrent_searches INTEGER DEFAULT 3,
                    enable_alerts BOOLEAN DEFAULT TRUE,
                    alert_threshold_percentage DECIMAL(5,2) DEFAULT 10.00,
                    active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ rate_shopper_configs criada');
        } catch (e) {
            console.log('⚠️', e.message);
        }
        
        // 3. rate_shopper_searches
        console.log('🔍 Criando rate_shopper_searches...');
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS rate_shopper_searches (
                    id SERIAL PRIMARY KEY,
                    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                    property_id INTEGER REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
                    check_in DATE NOT NULL,
                    check_out DATE NOT NULL,
                    adults INTEGER DEFAULT 2,
                    children INTEGER DEFAULT 0,
                    rooms INTEGER DEFAULT 1,
                    search_status VARCHAR(50) DEFAULT 'pending',
                    total_results INTEGER DEFAULT 0,
                    duration_seconds INTEGER,
                    error_message TEXT,
                    search_metadata JSONB,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ rate_shopper_searches criada');
        } catch (e) {
            console.log('⚠️', e.message);
        }
        
        // 4. rate_shopper_prices
        console.log('💰 Criando rate_shopper_prices...');
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS rate_shopper_prices (
                    id SERIAL PRIMARY KEY,
                    search_id INTEGER NOT NULL REFERENCES rate_shopper_searches(id) ON DELETE CASCADE,
                    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                    property_id INTEGER REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
                    room_type VARCHAR(255),
                    rate_plan VARCHAR(255),
                    price DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(10) DEFAULT 'BRL',
                    availability_status VARCHAR(50),
                    booking_url TEXT,
                    source_engine VARCHAR(100),
                    captured_at TIMESTAMP DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ rate_shopper_prices criada');
        } catch (e) {
            console.log('⚠️', e.message);
        }
        
        // 5. rate_shopper_price_history
        console.log('📈 Criando rate_shopper_price_history...');
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS rate_shopper_price_history (
                    id SERIAL PRIMARY KEY,
                    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                    property_id INTEGER REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
                    check_in DATE NOT NULL,
                    check_out DATE NOT NULL,
                    room_type VARCHAR(255),
                    price DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(10) DEFAULT 'BRL',
                    source_engine VARCHAR(100),
                    price_change_percentage DECIMAL(5,2),
                    captured_at TIMESTAMP DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ rate_shopper_price_history criada');
        } catch (e) {
            console.log('⚠️', e.message);
        }
        
        // 6. rate_shopper_alerts
        console.log('🚨 Criando rate_shopper_alerts...');
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS rate_shopper_alerts (
                    id SERIAL PRIMARY KEY,
                    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                    property_id INTEGER REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
                    alert_type VARCHAR(50) NOT NULL,
                    threshold_value DECIMAL(10,2),
                    threshold_percentage DECIMAL(5,2),
                    alert_message TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    notification_emails TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ rate_shopper_alerts criada');
        } catch (e) {
            console.log('⚠️', e.message);
        }
        
        // 7. rate_shopper_alert_history
        console.log('📋 Criando rate_shopper_alert_history...');
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS rate_shopper_alert_history (
                    id SERIAL PRIMARY KEY,
                    alert_id INTEGER NOT NULL REFERENCES rate_shopper_alerts(id) ON DELETE CASCADE,
                    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                    triggered_price DECIMAL(10,2),
                    trigger_reason TEXT,
                    notification_sent BOOLEAN DEFAULT FALSE,
                    notification_method VARCHAR(50),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ rate_shopper_alert_history criada');
        } catch (e) {
            console.log('⚠️', e.message);
        }
        
        // 8. rate_shopper_reports
        console.log('📊 Criando rate_shopper_reports...');
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS rate_shopper_reports (
                    id SERIAL PRIMARY KEY,
                    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                    report_type VARCHAR(50) NOT NULL,
                    date_from DATE NOT NULL,
                    date_to DATE NOT NULL,
                    report_data JSONB,
                    file_path TEXT,
                    status VARCHAR(50) DEFAULT 'generated',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ rate_shopper_reports criada');
        } catch (e) {
            console.log('⚠️', e.message);
        }
        
        // 9. rate_shopper_queue
        console.log('⏳ Criando rate_shopper_queue...');
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS rate_shopper_queue (
                    id SERIAL PRIMARY KEY,
                    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
                    property_id INTEGER REFERENCES rate_shopper_properties(id) ON DELETE CASCADE,
                    job_type VARCHAR(50) NOT NULL,
                    job_data JSONB,
                    priority INTEGER DEFAULT 1,
                    status VARCHAR(50) DEFAULT 'pending',
                    attempts INTEGER DEFAULT 0,
                    max_attempts INTEGER DEFAULT 3,
                    scheduled_at TIMESTAMP,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ rate_shopper_queue criada');
        } catch (e) {
            console.log('⚠️', e.message);
        }
        
        console.log('🎉 TODAS AS TABELAS DO RATE SHOPPER CRIADAS!');
        
        // Verificar se as tabelas foram criadas
        console.log('🔍 Verificando tabelas criadas...');
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'rate_shopper_%'
            ORDER BY table_name
        `);
        
        console.log('📋 Tabelas RateShopper existentes:');
        tables.forEach(table => {
            console.log(`   ✅ ${table.table_name}`);
        });
        
        console.log('');
        console.log('🚀 PRÓXIMO PASSO:');
        console.log('Execute novamente: node import-missing-tables.js');
        console.log('Agora as tabelas existem e os dados poderão ser importados!');
        
    } catch (error) {
        console.error('❌ ERRO AO CRIAR TABELAS:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
createRateShopperTables();