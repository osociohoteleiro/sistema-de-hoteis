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
      console.log('🔄 Conectando ao banco de dados...');
      await this.db.connect();

      console.log('📊 Buscando searches pendentes...');
      
      // Suporte a filtros via variáveis de ambiente
      const hotelId = process.env.HOTEL_ID || null;
      const searchIds = process.env.SEARCH_IDS || null;
      
      const pendingSearches = await this.db.getPendingSearches(hotelId, searchIds);

      if (pendingSearches.length === 0) {
        console.log('✅ Nenhuma busca pendente encontrada!');
        return;
      }

      console.log(`🎯 Encontradas ${pendingSearches.length} searches pendentes:`);
      pendingSearches.forEach((search, index) => {
        console.log(`${index + 1}. ${search.property_name} (${search.start_date} → ${search.end_date})`);
      });

      // Processar cada busca
      for (const search of pendingSearches) {
        await this.processSearch(search);
      }

      console.log('🎉 Processamento concluído!');

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

    try {
      console.log(`\n🏨 Processando: ${dbSearch.property_name}`);
      
      // Atualizar status para RUNNING
      await this.db.updateSearchStatus(searchId, 'RUNNING');

      // Converter para formato do extrator
      const extractorSearch = this.db.searchToExtractorFormat(dbSearch);
      
      // Debug: mostrar dados que serão enviados
      console.log('🔧 Dados enviados para extrator:', JSON.stringify(extractorSearch, null, 2));

      // Preparar parâmetros para o extrator
      const startDate = new Date(extractorSearch.start_date);
      const endDate = new Date(extractorSearch.end_date);
      
      // Usar timestamp para nome do arquivo (mesmo padrão do extrator original)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const resultsFile = path.join(process.cwd(), 'results', 'extracted-data', 'csv', 
        `${extractorSearch.name}_${timestamp}_from_${extractorSearch.start_date}_to_${extractorSearch.end_date}.csv`);

      // Garantir que o diretório existe
      await fs.mkdir(path.dirname(resultsFile), { recursive: true });

      // Garantir modo headless em produção
      process.env.HEADLESS = 'true';
      
      console.log(`🌐 Extraindo preços de: ${extractorSearch.url}`);
      console.log(`📅 Período: ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`);
      
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