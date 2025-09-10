// Script para enviar dados do banco local para API de produção
// OSH Hotel System - Rate Shopper Properties
require('dotenv').config({ path: './api/.env' });

const { Pool } = require('pg');
const axios = require('axios');

class ProductionDataSender {
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

    // URL da API de produção
    this.productionApiUrl = 'https://osh-sistemas-api-backend.d32pnk.easypanel.host';

    this.localPool = null;
  }

  async connect() {
    try {
      console.log('🔄 Conectando ao banco local...');
      
      // Conectar PostgreSQL Local
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
        ORDER BY rsp.hotel_id, rsp.property_name
      `);

      console.log(`✅ Encontradas ${result.rows.length} propriedades no banco local`);
      return result.rows;

    } catch (error) {
      console.error('❌ Erro ao buscar dados locais:', error.message);
      return [];
    }
  }

  async sendToProduction(properties) {
    try {
      console.log('📡 Enviando dados para API de produção...');
      
      const response = await axios.post(
        `${this.productionApiUrl}/api/data-import/import-properties`,
        { properties },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.success) {
        console.log('✅ Dados enviados com sucesso!');
        console.log('📊 Estatísticas:');
        console.log(`   - Total: ${response.data.statistics.total}`);
        console.log(`   - Importadas: ${response.data.statistics.imported}`);
        console.log(`   - Puladas: ${response.data.statistics.skipped}`);
        
        // Mostrar detalhes dos erros se houver
        const errors = response.data.results.filter(r => r.status === 'error');
        if (errors.length > 0) {
          console.log('⚠️ Erros encontrados:');
          errors.forEach(error => {
            console.log(`   - ${error.property_name}: ${error.reason}`);
          });
        }
      } else {
        console.error('❌ Erro na resposta da API:', response.data.error);
      }

      return response.data;

    } catch (error) {
      console.error('❌ Erro ao enviar para produção:', error.message);
      if (error.response) {
        console.error('📄 Resposta da API:', error.response.data);
      }
      throw error;
    }
  }

  async import() {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Iniciando envio de dados para produção via API');
      
      await this.connect();
      
      // Buscar propriedades do banco local
      const properties = await this.getLocalProperties();
      
      if (properties.length === 0) {
        console.log('⚠️ Nenhuma propriedade encontrada no banco local');
        return;
      }

      // Enviar para produção
      await this.sendToProduction(properties);
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`🎉 Envio concluído em ${duration}s`);
      
    } catch (error) {
      console.error(`💥 Erro no envio: ${error.message}`);
    } finally {
      await this.disconnect();
    }
  }
}

// Executar envio
if (require.main === module) {
  console.log('📢 Este script enviará dados do banco LOCAL para a API de PRODUÇÃO');
  console.log('📢 URL de destino: https://osh-sistemas-api-backend.d32pnk.easypanel.host');
  console.log('');
  
  const sender = new ProductionDataSender();
  sender.import().catch(console.error);
}

module.exports = ProductionDataSender;