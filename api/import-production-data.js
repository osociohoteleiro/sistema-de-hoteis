// Script para importar dados do banco local para produção (EasyPanel)
// OSH Hotel System - Rate Shopper Properties
require('dotenv').config({ path: '.env.import' });

const { Pool } = require('pg');
const fs = require('fs');

class ProductionDataImporter {
  constructor() {
    // Configuração PostgreSQL LOCAL (fonte dos dados)
    this.localConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      user: process.env.POSTGRES_USER || 'osh_user',
      password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
      database: process.env.POSTGRES_DB || 'osh_db',
      max: 10
    };

    // Configuração PostgreSQL PRODUÇÃO (EasyPanel)
    // Você deve configurar essas variáveis no .env para apontar para o banco de produção
    this.productionConfig = {
      host: process.env.PROD_POSTGRES_HOST || 'postgres',
      port: parseInt(process.env.PROD_POSTGRES_PORT) || 5432,
      user: process.env.PROD_POSTGRES_USER || 'hotel_user',
      password: process.env.PROD_POSTGRES_PASSWORD,
      database: process.env.PROD_POSTGRES_DB || 'hotel_osh_db',
      max: 10,
      ssl: process.env.PROD_POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

    this.localPool = null;
    this.prodPool = null;
    this.importLog = [];
  }

  async connect() {
    try {
      console.log('🔄 Conectando aos bancos de dados...');
      
      // Conectar PostgreSQL Local
      this.localPool = new Pool(this.localConfig);
      const localClient = await this.localPool.connect();
      await localClient.query('SELECT NOW()');
      localClient.release();
      console.log('✅ PostgreSQL Local conectado');

      // Conectar PostgreSQL Produção
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

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.importLog.push(logEntry);
    
    const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async verifyProductionConnection() {
    try {
      this.log('🔍 Verificando conexão com produção...');
      
      const result = await this.prodPool.query('SELECT COUNT(*) as total FROM hotels');
      const hotelCount = result.rows[0].total;
      
      this.log(`Encontrados ${hotelCount} hotéis na produção`);
      
      if (hotelCount === 0) {
        this.log('⚠️ Nenhum hotel encontrado na produção. Certifique-se de que o banco está corretamente inicializado.', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`Erro ao verificar produção: ${error.message}`, 'error');
      return false;
    }
  }

  async getLocalData(query, params = []) {
    try {
      const result = await this.localPool.query(query, params);
      return result.rows;
    } catch (error) {
      this.log(`Erro ao buscar dados locais: ${error.message}`, 'error');
      return [];
    }
  }

  async importRateShopperProperties() {
    this.log('📋 Importando propriedades do Rate Shopper...');
    
    // Buscar propriedades do banco local
    const localProperties = await this.getLocalData(`
      SELECT 
        rsp.*,
        h.name as hotel_name,
        h.hotel_uuid
      FROM rate_shopper_properties rsp
      JOIN hotels h ON rsp.hotel_id = h.id
      WHERE rsp.active = true
      ORDER BY rsp.hotel_id, rsp.property_name
    `);

    if (localProperties.length === 0) {
      this.log('⚠️ Nenhuma propriedade encontrada no banco local', 'warning');
      return;
    }

    this.log(`Encontradas ${localProperties.length} propriedades no banco local`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const prop of localProperties) {
      try {
        // Primeiro, verificar se o hotel existe na produção
        const hotelCheck = await this.prodPool.query(
          'SELECT id FROM hotels WHERE hotel_uuid = $1',
          [prop.hotel_uuid]
        );

        if (hotelCheck.rows.length === 0) {
          this.log(`⚠️ Hotel ${prop.hotel_name} (${prop.hotel_uuid}) não encontrado na produção. Pulando propriedade ${prop.property_name}`, 'warning');
          skippedCount++;
          continue;
        }

        const prodHotelId = hotelCheck.rows[0].id;

        // Inserir ou atualizar propriedade na produção
        const insertQuery = `
          INSERT INTO rate_shopper_properties 
          (hotel_id, property_name, booking_url, location, category, competitor_type, 
           ota_name, max_bundle_size, platform, is_main_property, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (hotel_id, property_name) DO UPDATE SET
            booking_url = EXCLUDED.booking_url,
            location = EXCLUDED.location,
            category = EXCLUDED.category,
            competitor_type = EXCLUDED.competitor_type,
            ota_name = EXCLUDED.ota_name,
            max_bundle_size = EXCLUDED.max_bundle_size,
            platform = EXCLUDED.platform,
            is_main_property = EXCLUDED.is_main_property,
            active = EXCLUDED.active,
            updated_at = EXCLUDED.updated_at
        `;

        await this.prodPool.query(insertQuery, [
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
          prop.active,
          prop.created_at,
          new Date()
        ]);

        importedCount++;
        this.log(`✅ Importada: ${prop.property_name} (${prop.hotel_name})`);

      } catch (error) {
        this.log(`Erro ao importar propriedade ${prop.property_name}: ${error.message}`, 'error');
        skippedCount++;
      }
    }

    this.log(`📊 Resumo da importação:`);
    this.log(`   - Importadas: ${importedCount}`);
    this.log(`   - Puladas: ${skippedCount}`);
    this.log(`   - Total: ${localProperties.length}`);
  }

  async importRateShopperSearches() {
    this.log('🔍 Importando buscas do Rate Shopper (se necessário)...');
    
    // Buscar buscas recentes e bem-sucedidas do banco local
    const localSearches = await this.getLocalData(`
      SELECT 
        rs.*,
        rsp.property_name,
        h.hotel_uuid
      FROM rate_shopper_searches rs
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      JOIN hotels h ON rs.hotel_id = h.id
      WHERE rs.status = 'COMPLETED' 
        AND rs.total_prices_found > 0
        AND rs.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY rs.created_at DESC
      LIMIT 50
    `);

    this.log(`Encontradas ${localSearches.length} buscas recentes no banco local`);
    
    if (localSearches.length === 0) {
      return;
    }

    let importedCount = 0;

    for (const search of localSearches) {
      try {
        // Verificar se hotel e propriedade existem na produção
        const propCheck = await this.prodPool.query(`
          SELECT rsp.id
          FROM rate_shopper_properties rsp
          JOIN hotels h ON rsp.hotel_id = h.id
          WHERE h.hotel_uuid = $1 AND rsp.property_name = $2
        `, [search.hotel_uuid, search.property_name]);

        if (propCheck.rows.length === 0) {
          continue;
        }

        const prodPropertyId = propCheck.rows[0].id;

        // Inserir busca na produção (apenas como histórico)
        const insertQuery = `
          INSERT INTO rate_shopper_searches 
          (hotel_id, property_id, uuid, start_date, end_date, status, total_dates, 
           processed_dates, total_prices_found, search_type, started_at, completed_at, created_at)
          VALUES (
            (SELECT id FROM hotels WHERE hotel_uuid = $1),
            $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
          ON CONFLICT (uuid) DO NOTHING
        `;

        await this.prodPool.query(insertQuery, [
          search.hotel_uuid,
          prodPropertyId,
          search.uuid,
          search.start_date,
          search.end_date,
          search.status,
          search.total_dates,
          search.processed_dates,
          search.total_prices_found,
          search.search_type || 'MANUAL',
          search.started_at,
          search.completed_at,
          search.created_at
        ]);

        importedCount++;

      } catch (error) {
        // Ignorar erros de conflito ou chaves duplicadas
        if (!error.message.includes('duplicate') && !error.message.includes('conflict')) {
          this.log(`Erro ao importar busca ${search.uuid}: ${error.message}`, 'error');
        }
      }
    }

    this.log(`✅ Importadas ${importedCount} buscas como histórico`);
  }

  async validateImport() {
    this.log('🔍 Validando importação...');
    
    try {
      // Contar propriedades importadas
      const prodPropsResult = await this.prodPool.query('SELECT COUNT(*) FROM rate_shopper_properties');
      const prodPropsCount = parseInt(prodPropsResult.rows[0].count);
      
      // Contar hotéis na produção
      const prodHotelsResult = await this.prodPool.query('SELECT COUNT(*) FROM hotels');
      const prodHotelsCount = parseInt(prodHotelsResult.rows[0].count);

      this.log(`📊 Estado da produção após importação:`);
      this.log(`   - Hotéis: ${prodHotelsCount}`);
      this.log(`   - Propriedades Rate Shopper: ${prodPropsCount}`);

      // Listar algumas propriedades para verificação
      const sampleProps = await this.prodPool.query(`
        SELECT 
          rsp.property_name,
          rsp.platform,
          rsp.is_main_property,
          h.name as hotel_name
        FROM rate_shopper_properties rsp
        JOIN hotels h ON rsp.hotel_id = h.id
        ORDER BY h.name, rsp.property_name
        LIMIT 10
      `);

      this.log(`📋 Amostra de propriedades importadas:`);
      sampleProps.rows.forEach((prop, index) => {
        const mainIndicator = prop.is_main_property ? ' ⭐' : '';
        this.log(`   ${index + 1}. ${prop.property_name} (${prop.platform})${mainIndicator} - ${prop.hotel_name}`);
      });

    } catch (error) {
      this.log(`Erro na validação: ${error.message}`, 'error');
    }
  }

  async saveImportLog() {
    const logFile = `import-production-log-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(logFile, JSON.stringify(this.importLog, null, 2));
    this.log(`📄 Log salvo em: ${logFile}`);
  }

  async import() {
    const startTime = Date.now();
    
    try {
      this.log('🚀 Iniciando importação de dados para produção');
      this.log('📋 Importante: Este script importa dados do banco LOCAL para o banco de PRODUÇÃO');
      
      await this.connect();
      
      // Verificar conexão com produção
      const canConnect = await this.verifyProductionConnection();
      if (!canConnect) {
        throw new Error('Não foi possível conectar ou validar o banco de produção');
      }
      
      // Importar dados
      await this.importRateShopperProperties();
      await this.importRateShopperSearches();
      
      // Validar importação
      await this.validateImport();
      
      const duration = (Date.now() - startTime) / 1000;
      this.log(`🎉 Importação concluída em ${duration}s`);
      
    } catch (error) {
      this.log(`💥 Erro na importação: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.saveImportLog();
      await this.disconnect();
    }
  }
}

// Executar importação
if (require.main === module) {
  console.log('📢 ATENÇÃO: Este script irá importar dados do banco LOCAL para PRODUÇÃO');
  console.log('📢 Certifique-se de que as variáveis de ambiente PROD_* estão configuradas corretamente');
  console.log('📢 Pressione Ctrl+C nos próximos 10 segundos para cancelar...');
  
  setTimeout(() => {
    const importer = new ProductionDataImporter();
    importer.import().catch(console.error);
  }, 10000);
}

module.exports = ProductionDataImporter;