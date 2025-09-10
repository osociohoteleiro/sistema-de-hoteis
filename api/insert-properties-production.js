// Script para inserir propriedades diretamente no banco de produção
require('dotenv').config();

const { Pool } = require('pg');

class ProductionDataInserter {
  constructor() {
    // Configuração PostgreSQL de PRODUÇÃO usando a URL fornecida
    // postgres://postgres:OSH4040()Xx!..nn@osh_sistemas_postgresql-db:5432/osh_hotels?sslmode=disable
    this.productionConfig = {
      host: 'osh_sistemas_postgresql-db',
      port: 5432,
      user: 'postgres',
      password: 'OSH4040()Xx!..nn',
      database: 'osh_hotels',
      ssl: false
    };

    // Configuração do banco LOCAL para buscar dados
    this.localConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      user: process.env.POSTGRES_USER || 'osh_user',
      password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
      database: process.env.POSTGRES_DB || 'osh_db',
      max: 10
    };

    this.prodPool = null;
    this.localPool = null;
  }

  async connect() {
    try {
      console.log('🔄 Conectando aos bancos de dados...');
      
      // Conectar banco local
      this.localPool = new Pool(this.localConfig);
      const localClient = await this.localPool.connect();
      await localClient.query('SELECT NOW()');
      localClient.release();
      console.log('✅ PostgreSQL Local conectado');

      // Conectar banco de produção
      this.prodPool = new Pool(this.productionConfig);
      const prodClient = await this.prodPool.connect();
      await prodClient.query('SELECT NOW()');
      prodClient.release();
      console.log('✅ PostgreSQL Produção conectado');

    } catch (error) {
      console.error('❌ Erro na conexão:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.localPool) {
      await this.localPool.end();
      console.log('🔒 PostgreSQL Local desconectado');
    }
    
    if (this.prodPool) {
      await this.prodPool.end();
      console.log('🔒 PostgreSQL Produção desconectado');
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
        ORDER BY rsp.hotel_id, rsp.property_name
      `);

      console.log(`✅ Encontradas ${result.rows.length} propriedades no banco local`);
      return result.rows;

    } catch (error) {
      console.error('❌ Erro ao buscar dados locais:', error.message);
      return [];
    }
  }

  async insertPropertiesInProduction(properties) {
    console.log('📝 Inserindo propriedades no banco de produção...');
    
    let insertedCount = 0;
    let skippedCount = 0;

    for (const prop of properties) {
      try {
        // 1. Verificar se o hotel existe na produção
        const hotelCheck = await this.prodPool.query(
          'SELECT id FROM hotels WHERE hotel_uuid = $1',
          [prop.hotel_uuid]
        );

        if (hotelCheck.rows.length === 0) {
          console.log(`⚠️ Hotel não encontrado: ${prop.hotel_name} (${prop.hotel_uuid})`);
          skippedCount++;
          continue;
        }

        const prodHotelId = hotelCheck.rows[0].id;

        // 2. Verificar se a propriedade já existe
        const existingProp = await this.prodPool.query(
          'SELECT id FROM rate_shopper_properties WHERE hotel_id = $1 AND property_name = $2',
          [prodHotelId, prop.property_name]
        );

        if (existingProp.rows.length > 0) {
          console.log(`⚠️ Propriedade já existe: ${prop.property_name}`);
          skippedCount++;
          continue;
        }

        // 3. Inserir a propriedade
        const insertQuery = `
          INSERT INTO rate_shopper_properties 
          (hotel_id, property_name, booking_url, location, category, competitor_type, 
           ota_name, max_bundle_size, platform, is_main_property, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `;

        const result = await this.prodPool.query(insertQuery, [
          prodHotelId,
          prop.property_name,
          prop.booking_url,
          prop.location,
          prop.category,
          prop.competitor_type,
          prop.ota_name,
          prop.max_bundle_size || 7,
          prop.platform || 'booking',
          prop.is_main_property || false,
          prop.active !== undefined ? prop.active : true,
          prop.created_at || new Date(),
          new Date()
        ]);

        insertedCount++;
        console.log(`✅ Inserida: ${prop.property_name} (ID: ${result.rows[0].id}) - ${prop.hotel_name}`);

      } catch (error) {
        console.error(`❌ Erro ao inserir ${prop.property_name}:`, error.message);
        skippedCount++;
      }
    }

    return { insertedCount, skippedCount };
  }

  async validateInsertion() {
    try {
      console.log('🔍 Validando inserção...');
      
      // Contar propriedades por hotel na produção
      const result = await this.prodPool.query(`
        SELECT 
          h.name as hotel_name,
          COUNT(rsp.id) as property_count,
          STRING_AGG(rsp.property_name, ', ') as properties
        FROM hotels h
        LEFT JOIN rate_shopper_properties rsp ON h.id = rsp.hotel_id AND rsp.active = true
        GROUP BY h.id, h.name
        HAVING COUNT(rsp.id) > 0
        ORDER BY h.name
      `);

      console.log(`📊 Propriedades por hotel na produção:`);
      result.rows.forEach(row => {
        console.log(`   ${row.hotel_name}: ${row.property_count} propriedades`);
        console.log(`      - ${row.properties}`);
      });

    } catch (error) {
      console.error('❌ Erro na validação:', error.message);
    }
  }

  async insert() {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Iniciando inserção direta de dados no banco de produção');
      
      await this.connect();
      
      // Buscar propriedades do banco local
      const properties = await this.getLocalProperties();
      
      if (properties.length === 0) {
        console.log('⚠️ Nenhuma propriedade encontrada no banco local');
        return;
      }

      // Inserir propriedades na produção
      const { insertedCount, skippedCount } = await this.insertPropertiesInProduction(properties);
      
      // Validar inserção
      await this.validateInsertion();
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`\n🎉 Inserção concluída em ${duration}s`);
      console.log(`📊 Resumo:`);
      console.log(`   - Total no banco local: ${properties.length}`);
      console.log(`   - Inseridas: ${insertedCount}`);
      console.log(`   - Puladas: ${skippedCount}`);
      
    } catch (error) {
      console.error(`💥 Erro na inserção: ${error.message}`);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Executar inserção
if (require.main === module) {
  console.log('📢 Este script inserirá dados DIRETAMENTE no banco de PRODUÇÃO');
  console.log('📢 Conectando em: osh_sistemas_postgresql-db:5432/osh_hotels');
  console.log('');
  
  const inserter = new ProductionDataInserter();
  inserter.insert().catch(console.error);
}

module.exports = ProductionDataInserter;