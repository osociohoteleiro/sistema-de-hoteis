const DatabaseIntegration = require('./database-integration');
const { extract_prices_from_booking } = require('./booking-extractor-optimized');
const { extract_prices_from_artaxnet } = require('./artaxnet-extractor-optimized');
const { logger } = require('./logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Processador que busca searches PENDING no banco e executa extrações
 */
class DatabaseProcessor {
  constructor() {
    this.db = new DatabaseIntegration();
    this.isProcessing = false;
  }

  /**
   * Inicia o processamento das buscas pendentes
   */
  async start() {
    try {
      const startTime = Date.now();
      const platform = process.platform;
      const nodeEnv = process.env.NODE_ENV || 'development';

      // Garantir que HEADLESS está sempre ativo
      if (!process.env.HEADLESS) {
        process.env.HEADLESS = 'true';
      }

      console.log('🚀 INICIANDO DATABASE PROCESSOR');
      console.log(`📋 Plataforma: ${platform}, Ambiente: ${nodeEnv}, PID: ${process.pid}`);
      console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
      console.log(`🖥️  Modo Headless: ${process.env.HEADLESS}`);
      console.log(`🔧 Variáveis de ambiente carregadas:`);
      console.log(`   - POSTGRES_HOST: ${process.env.POSTGRES_HOST || 'não definido'}`);
      console.log(`   - POSTGRES_PORT: ${process.env.POSTGRES_PORT || 'não definido'}`);
      console.log(`   - POSTGRES_DB: ${process.env.POSTGRES_DB || 'não definido'}`);
      console.log(`   - POSTGRES_USER: ${process.env.POSTGRES_USER || 'não definido'}`);
      console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
      console.log(`   - PGSSLDISABLE: ${process.env.PGSSLDISABLE || 'não definido'}`);

      console.log('🔄 Conectando ao banco de dados...');
      await this.db.connect();
      console.log('✅ Conexão com banco estabelecida');

      console.log('📊 Buscando searches pendentes...');

      // Suporte a filtros via variáveis de ambiente
      const hotelId = process.env.HOTEL_ID || null;
      const searchIds = process.env.SEARCH_IDS || null;

      console.log(`🔍 Filtros aplicados - Hotel ID: ${hotelId}, Search IDs: ${searchIds}`);

      const pendingSearches = await this.db.getPendingSearches(hotelId, searchIds);

      if (pendingSearches.length === 0) {
        console.log('✅ Nenhuma busca pendente encontrada!');
        console.log(`⏱️  Tempo total: ${Date.now() - startTime}ms`);
        return;
      }

      console.log(`🎯 Encontradas ${pendingSearches.length} searches pendentes:`);
      pendingSearches.forEach((search, index) => {
        console.log(`   ${index + 1}. ID:${search.id} | ${search.property_name} | ${search.start_date} → ${search.end_date} | Platform: ${search.platform || 'booking'}`);
      });

      console.log('🏁 Iniciando processamento das searches...');

      // Processar cada busca
      for (let i = 0; i < pendingSearches.length; i++) {
        const search = pendingSearches[i];
        console.log(`\n📊 Progresso: ${i + 1}/${pendingSearches.length} searches processadas`);
        await this.processSearch(search);
      }

      const totalTime = Date.now() - startTime;
      console.log('\n🎉 PROCESSAMENTO CONCLUÍDO!');
      console.log(`⏱️  Tempo total: ${totalTime}ms (${Math.round(totalTime/1000)}s)`);
      console.log(`📈 Média por search: ${Math.round(totalTime/pendingSearches.length)}ms`);

    } catch (error) {
      logger.error('Database processor error', { error: error.message });
      console.error('❌ Erro no processador:', error.message);
    } finally {
      await this.db.close();
    }
  }

  /**
   * Processa uma busca específica
   */
  async processSearch(dbSearch) {
    const searchId = dbSearch.id;
    const propertyId = dbSearch.property_id;
    const searchStartTime = Date.now();

    try {
      console.log(`\n🏨 PROCESSANDO SEARCH ID ${searchId}: ${dbSearch.property_name}`);
      console.log(`📋 Detalhes: Property ID ${propertyId}, Hotel ID ${dbSearch.hotel_id}`);

      // Atualizar status para RUNNING
      console.log('🔄 Atualizando status para RUNNING...');
      await this.db.updateSearchStatus(searchId, 'RUNNING');
      console.log('✅ Status atualizado no banco');

      // Converter para formato do extrator
      const extractorSearch = this.db.searchToExtractorFormat(dbSearch);

      // Debug: mostrar dados que serão enviados
      console.log('🔧 Dados enviados para extrator:');
      console.log(`   - Nome: ${extractorSearch.name}`);
      console.log(`   - URL: ${extractorSearch.url}`);
      console.log(`   - Data início: ${extractorSearch.start_date}`);
      console.log(`   - Data fim: ${extractorSearch.end_date}`);
      console.log(`   - Bundle size: ${extractorSearch.max_bundle_size || 7}`);

      // Preparar parâmetros para o extrator
      const startDate = new Date(extractorSearch.start_date);
      const endDate = new Date(extractorSearch.end_date);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      console.log(`📅 Período: ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()} (${daysDiff} dias)`);

      // Usar timestamp para nome do arquivo (mesmo padrão do extrator original)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const resultsFile = path.join(process.cwd(), 'results', 'extracted-data', 'csv',
        `${extractorSearch.name}_${timestamp}_from_${extractorSearch.start_date}_to_${extractorSearch.end_date}.csv`);

      console.log(`📁 Arquivo de resultado: ${resultsFile}`);

      // Garantir que o diretório existe
      console.log('📂 Criando diretórios necessários...');
      await fs.mkdir(path.dirname(resultsFile), { recursive: true });
      console.log('✅ Diretórios criados');

      // Garantir modo headless em produção
      const originalHeadless = process.env.HEADLESS;
      process.env.HEADLESS = 'true';
      console.log(`🖥️  Modo headless: ${process.env.HEADLESS}`);

      console.log(`🌐 Extraindo preços de: ${extractorSearch.url}`);

      // Detectar plataforma baseada na URL
      const platform = this.detectPlatform(extractorSearch.url);
      console.log(`🏷️  Plataforma detectada: ${platform}`);
      
      // Executar extração com o extrator correto
      if (platform === 'artaxnet') {
        await extract_prices_from_artaxnet(
          extractorSearch.url,
          startDate,
          endDate,
          extractorSearch.max_bundle_size,
          resultsFile,
          this.db, // Passar instância da database integration
          searchId, // ID da busca
          propertyId, // ID da propriedade
          dbSearch.hotel_id // ID do hotel para APIs
        );
      } else {
        // Default para Booking (compatibilidade)
        await extract_prices_from_booking(
          extractorSearch.url,
          startDate,
          endDate,
          extractorSearch.max_bundle_size,
          resultsFile,
          this.db, // Passar instância da database integration
          searchId, // ID da busca
          propertyId, // ID da propriedade
          dbSearch.hotel_id // ID do hotel para APIs
        );
      }

      // Contar preços salvos diretamente no banco durante a extração
      const pricesCount = await this.db.getSearchPricesCount(searchId);
      console.log(`💰 Total de preços extraídos e salvos: ${pricesCount}`);

      // Atualizar status para COMPLETED
      await this.db.updateSearchStatus(searchId, 'COMPLETED', {
        total_prices_found: pricesCount,
        processed_dates: dbSearch.total_dates
      });

      console.log(`✅ ${dbSearch.property_name}: ${pricesCount} preços extraídos`);

    } catch (error) {
      // Log detalhado do erro para debug
      console.error(`❌ Erro ao processar ${dbSearch.property_name}:`);
      console.error(`   Mensagem: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      console.error(`   Tipo: ${error.constructor.name}`);
      
      logger.error('Search processing error', { 
        searchId, 
        property: dbSearch.property_name,
        error: error.message,
        stack: error.stack,
        errorType: error.constructor.name
      });

      // Atualizar status para FAILED
      await this.db.updateSearchStatus(searchId, 'FAILED', {
        error_log: error.message
      });
    }
  }

  /**
   * Detecta a plataforma baseada na URL
   * @param {string} url - URL da propriedade
   * @returns {string} - 'booking', 'artaxnet', etc.
   */
  detectPlatform(url) {
    try {
      const urlLower = url.toLowerCase();
      
      if (urlLower.includes('artaxnet.com') || urlLower.includes('artax')) {
        return 'artaxnet';
      }
      
      if (urlLower.includes('booking.com')) {
        return 'booking';
      }
      
      // Default para booking (compatibilidade com dados existentes)
      return 'booking';
    } catch (error) {
      console.warn('⚠️  Erro ao detectar plataforma da URL:', url, error.message);
      return 'booking'; // Fallback seguro
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const processor = new DatabaseProcessor();
  processor.start()
    .then(() => {
      console.log('🏁 Processamento finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = DatabaseProcessor;