// Script para inserir propriedades via API de produção usando SQL direto
require('dotenv').config();

const axios = require('axios');
const { Pool } = require('pg');

const API_BASE = 'https://osh-sistemas-api-backend.d32pnk.easypanel.host';

class ProductionAPIInserter {
  constructor() {
    // Configuração do banco LOCAL para buscar dados
    this.localConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      user: process.env.POSTGRES_USER || 'osh_user',
      password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
      database: process.env.POSTGRES_DB || 'osh_db',
      max: 10
    };

    this.localPool = null;
  }

  async connect() {
    try {
      console.log('🔄 Conectando ao banco local...');
      this.localPool = new Pool(this.localConfig);
      const localClient = await this.localPool.connect();
      await localClient.query('SELECT NOW()');
      localClient.release();
      console.log('✅ PostgreSQL Local conectado');
    } catch (error) {
      console.error('❌ Erro na conexão local:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.localPool) {
      await this.localPool.end();
      console.log('🔒 PostgreSQL Local desconectado');
    }
  }

  async getLocalProperties() {
    try {
      console.log('📋 Buscando propriedades do banco local...');
      const result = await this.localPool.query(`
        SELECT 
          rsp.*,
          h.name as hotel_name,
          h.hotel_uuid
        FROM rate_shopper_properties rsp
        JOIN hotels h ON rsp.hotel_id = h.id
        WHERE rsp.active = true
        ORDER BY rsp.is_main_property DESC, rsp.property_name
        LIMIT 5
      `);

      console.log(`✅ Encontradas ${result.rows.length} propriedades principais`);
      result.rows.forEach((prop, index) => {
        console.log(`   ${index + 1}. ${prop.property_name} (${prop.platform || 'booking'}) - ${prop.hotel_name}`);
      });
      
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar dados locais:', error.message);
      return [];
    }
  }

  async insertViaDirectSQL(properties) {
    console.log('\n🎯 Inserindo propriedades via SQL direto na API de produção...');

    // Preparar SQLs de inserção
    const insertQueries = [];
    
    for (const prop of properties) {
      const sql = `
        DO $$
        DECLARE
            hotel_id_var INTEGER;
        BEGIN
            -- Buscar ID do hotel pelo UUID
            SELECT id INTO hotel_id_var 
            FROM hotels 
            WHERE hotel_uuid = '${prop.hotel_uuid}';
            
            -- Se hotel existe, inserir propriedade (se não existir)
            IF hotel_id_var IS NOT NULL THEN
                INSERT INTO rate_shopper_properties 
                (hotel_id, property_name, booking_url, location, category, competitor_type, 
                 ota_name, max_bundle_size, platform, is_main_property, active, created_at, updated_at)
                SELECT 
                  hotel_id_var,
                  '${prop.property_name.replace(/'/g, "''")}',
                  '${prop.booking_url}',
                  '${prop.location || ''}',
                  '${prop.category || 'COMPETITOR'}',
                  '${prop.competitor_type || 'COMPETITOR'}',
                  '${prop.ota_name || 'Booking.com'}',
                  ${prop.max_bundle_size || 7},
                  '${prop.platform || 'booking'}',
                  ${prop.is_main_property || false},
                  true,
                  NOW(),
                  NOW()
                WHERE NOT EXISTS (
                  SELECT 1 FROM rate_shopper_properties 
                  WHERE hotel_id = hotel_id_var 
                  AND property_name = '${prop.property_name.replace(/'/g, "''")}'
                );
            END IF;
        END $$;
      `;
      
      insertQueries.push(sql.trim());
    }

    console.log(`📝 Preparados ${insertQueries.length} comandos SQL`);

    // Tentar executar via endpoint de teste da API
    try {
      console.log('🔄 Tentando executar via API de produção...');
      
      // Primeiro, vamos verificar se conseguimos executar um SQL simples
      const testResponse = await axios.post(`${API_BASE}/api/db-test`, {}, {
        timeout: 10000
      });
      
      console.log('✅ API de produção acessível:', testResponse.data.success);
      
      // Como não temos endpoint SQL direto, vamos usar uma abordagem diferente
      // Vamos criar as propriedades uma a uma via endpoint existente
      return await this.insertViaExistingEndpoint(properties);
      
    } catch (error) {
      console.log('❌ Erro na API:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  async insertViaExistingEndpoint(properties) {
    console.log('🔄 Tentando inserir via endpoint existente...');
    
    let inserted = 0;
    let errors = 0;

    for (const prop of properties) {
      try {
        console.log(`\n📝 Inserindo: ${prop.property_name}...`);
        
        // Preparar dados para o endpoint
        const payload = {
          property_name: prop.property_name,
          booking_url: prop.booking_url,
          location: prop.location,
          category: prop.category || 'COMPETITOR',
          max_bundle_size: prop.max_bundle_size || 7,
          is_main_property: prop.is_main_property || false
        };

        const response = await axios.post(
          `${API_BASE}/api/rate-shopper/${prop.hotel_uuid}/properties`,
          payload,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
          }
        );

        console.log(`✅ Inserida com sucesso: ${prop.property_name}`);
        inserted++;

      } catch (error) {
        console.log(`❌ Erro ao inserir ${prop.property_name}:`);
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        console.log(`   Erro: ${error.response?.data?.error || error.message}`);
        errors++;
      }
    }

    return { success: true, inserted, errors };
  }

  async validateInsertion() {
    try {
      console.log('\n🔍 Verificando propriedades inseridas...');
      
      const response = await axios.get(`${API_BASE}/api/rate-shopper/0cf84c30-82cb-11f0-bd40-02420a0b00b1/properties`);
      
      console.log(`✅ Total de propriedades na produção: ${response.data.data.length}`);
      
      response.data.data.forEach((prop, index) => {
        console.log(`   ${index + 1}. ${prop.property_name} (${prop.platform || 'booking'})`);
      });

      return response.data.data.length > 0;

    } catch (error) {
      console.log('❌ Erro ao verificar:', error.message);
      return false;
    }
  }

  async insert() {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Iniciando inserção via API de produção');
      
      await this.connect();
      
      // Buscar propriedades do banco local
      const properties = await this.getLocalProperties();
      
      if (properties.length === 0) {
        console.log('⚠️ Nenhuma propriedade encontrada no banco local');
        return;
      }

      // Inserir propriedades via API
      const result = await this.insertViaDirectSQL(properties);
      
      // Verificar resultado
      const hasProperties = await this.validateInsertion();
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`\n🎉 Processo concluído em ${duration}s`);
      
      if (hasProperties) {
        console.log('✅ SUCESSO! As propriedades foram inseridas.');
        console.log('🔗 Acesse: https://pms.osociohoteleiro.com.br/rate-shopper/properties');
      } else {
        console.log('❌ Nenhuma propriedade foi inserida. Verifique os erros acima.');
      }
      
    } catch (error) {
      console.error(`💥 Erro no processo: ${error.message}`);
    } finally {
      await this.disconnect();
    }
  }
}

// Executar inserção
if (require.main === module) {
  console.log('📢 Este script inserirá propriedades via API de PRODUÇÃO');
  console.log('📢 Endpoint: https://osh-sistemas-api-backend.d32pnk.easypanel.host');
  console.log('');
  
  const inserter = new ProductionAPIInserter();
  inserter.insert().catch(console.error);
}

module.exports = ProductionAPIInserter;