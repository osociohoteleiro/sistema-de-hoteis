const DatabaseIntegration = require('./database-integration');
const { extract_prices_from_booking } = require('./booking-extractor-single-date');
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
      
      // Executar extração (esta função não retorna dados, escreve em arquivo)
      await extract_prices_from_booking(
        extractorSearch.url,
        startDate,
        endDate,
        extractorSearch.max_bundle_size,
        resultsFile
      );

      // Ler dados do arquivo gerado (formato: data_checkin;data_checkout;preco;tipo_quarto)
      let pricesCount = 0;
      try {
        const csvContent = await fs.readFile(resultsFile, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        console.log(`📋 Arquivo encontrado: ${lines.length} linhas`);
        
        // Processar todas as linhas (não há cabeçalho)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          try {
            // Formato: data_checkin;data_checkout;preco_brasileiro;tipo_quarto
            const columns = line.split(';');
            if (columns.length >= 3) {
              const priceData = {
                check_in_date: columns[0]?.trim(),
                check_out_date: columns[1]?.trim(),
                price: parseFloat(columns[2]?.trim().replace(',', '.')), // Converter vírgula brasileira para ponto
                room_type: columns[3]?.trim() || 'Standard',
                currency: 'BRL'
              };

              if (priceData.price && !isNaN(priceData.price)) {
                await this.db.savePrice(searchId, propertyId, priceData);
                pricesCount++;
                console.log(`💰 Preço salvo: ${priceData.check_in_date} → R$ ${priceData.price}`);
              }
            }
          } catch (lineError) {
            logger.error('Failed to parse CSV line', { 
              searchId, 
              line, 
              error: lineError.message 
            });
          }
        }
        
        // Manter arquivo para auditoria (não deletar)
        console.log(`📁 Arquivo salvo em: ${resultsFile}`);
        
      } catch (csvError) {
        logger.error('Failed to read CSV results', { 
          searchId, 
          resultsFile, 
          error: csvError.message 
        });
      }

      // Atualizar status para COMPLETED
      await this.db.updateSearchStatus(searchId, 'COMPLETED', {
        total_prices_found: pricesCount,
        processed_dates: dbSearch.total_dates
      });

      console.log(`✅ ${dbSearch.property_name}: ${pricesCount} preços extraídos`);

    } catch (error) {
      logger.error('Search processing error', { 
        searchId, 
        property: dbSearch.property_name,
        error: error.message 
      });

      // Atualizar status para FAILED
      await this.db.updateSearchStatus(searchId, 'FAILED', {
        error_log: error.message
      });

      console.error(`❌ Erro ao processar ${dbSearch.property_name}:`, error.message);
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