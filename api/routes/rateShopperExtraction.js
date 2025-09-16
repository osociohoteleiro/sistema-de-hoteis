const express = require('express');
const router = express.Router();
const path = require('path');
const ProcessManager = require('../utils/processManager');
const ExtractionStore = require('../utils/extractionStore');

// Instância do store persistente (será inicializada no primeiro uso)
let extractionStore = null;

// Inicializar store na primeira requisição
async function getExtractionStore() {
  if (!extractionStore) {
    const db = require('../config/database');
    extractionStore = new ExtractionStore(db);
    await extractionStore.ensureTable();
  }
  return extractionStore;
}

/**
 * Inicia extração de preços para um hotel específico
 * POST /api/rate-shopper/:hotel_id/start-extraction
 */
router.post('/:hotel_id/start-extraction', async (req, res) => {
  const hotel_id = req.params.hotel_id;
  const { search_ids, properties } = req.body;

  try {
    const Hotel = require('../models/Hotel');
    
    // Converter UUID para ID se necessário
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }
    const store = await getExtractionStore();

    // Verificar se já há extração rodando para este hotel
    const hasActive = await store.hasActiveExtraction(hotelId);
    if (hasActive) {
      return res.status(400).json({
        success: false,
        error: 'Já existe uma extração em andamento para este hotel'
      });
    }

    // Iniciar processo de extração usando ProcessManager
    const extractorPath = process.env.NODE_ENV === 'production'
      ? '/app/extrator-rate-shopper'
      : path.join(process.cwd(), '..', 'extrator-rate-shopper');

    console.log(`🔧 Usando diretório do extrator: ${extractorPath}`);

    const extractionProcess = ProcessManager.spawn('npm', ['run', 'process-database:saas'], {
      cwd: extractorPath,
      env: {
        ...process.env,
        HEADLESS: 'true',
        HOTEL_ID: hotelId,
        SEARCH_IDS: search_ids?.join(',') || ''
      }
    });

    // Dados da extração
    const extractionData = {
      process: extractionProcess,
      hotelId: hotelId,
      startTime: new Date(),
      status: 'RUNNING',
      progress: {
        current: 0,
        total: properties?.length || 0,
        currentProperty: null,
        extractedPrices: 0
      },
      logs: []
    };

    // Registrar no store persistente
    await store.setActiveExtraction(hotelId, extractionData);

    // Listen para output do processo
    extractionProcess.stdout.on('data', async (data) => {
      const output = data.toString();
      const logEntry = {
        timestamp: new Date(),
        message: output,
        type: 'info'
      };
      extractionData.logs.push(logEntry);

      // Parse progress from logs
      let progressChanged = false;

      if (output.includes('Progress:')) {
        const progressMatch = output.match(/Progress: (\d+)\/(\d+)/);
        if (progressMatch) {
          extractionData.progress.current = parseInt(progressMatch[1]);
          extractionData.progress.total = parseInt(progressMatch[2]);
          progressChanged = true;
        }
      }

      if (output.includes('Price extracted')) {
        extractionData.progress.extractedPrices++;
        progressChanged = true;
      }

      if (output.includes('Processando:')) {
        const propertyMatch = output.match(/Processando: (.+)/);
        if (propertyMatch) {
          extractionData.progress.currentProperty = propertyMatch[1];
          progressChanged = true;
        }
      }

      // Atualizar store se houve mudança no progresso
      if (progressChanged) {
        await store.updateProgress(hotelId, {
          ...extractionData.progress,
          logs: extractionData.logs.slice(-10) // Manter apenas últimos 10 logs
        });
      }
    });

    extractionProcess.stderr.on('data', async (data) => {
      const logEntry = {
        timestamp: new Date(),
        message: data.toString(),
        type: 'error'
      };
      extractionData.logs.push(logEntry);

      // Atualizar logs no store
      await store.updateProgress(hotelId, {
        ...extractionData.progress,
        logs: extractionData.logs.slice(-10)
      });
    });

    extractionProcess.on('close', async (code) => {
      const finalStatus = code === 0 ? 'COMPLETED' : 'FAILED';
      extractionData.status = finalStatus;
      extractionData.endTime = new Date();

      // Remover do store persistente
      await store.removeActiveExtraction(hotelId, finalStatus);
      console.log(`🧹 Extração finalizada para hotel ${hotelId} com status ${finalStatus}, liberando para próximas extrações`);
    });

    extractionProcess.on('error', async (error) => {
      console.error('❌ Erro no processo de extração:', error);
      extractionData.status = 'FAILED';
      extractionData.endTime = new Date();

      // Remover do store em caso de erro
      await store.removeActiveExtraction(hotelId, 'FAILED');
      console.log(`🧹 Extração com erro para hotel ${hotelId}, liberando para próximas extrações`);
    });

    res.json({
      success: true,
      message: 'Extração iniciada com sucesso',
      data: {
        hotelId: hotelId,
        status: 'RUNNING',
        startTime: extractionData.startTime
      }
    });

  } catch (error) {
    console.error('Start extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar extração'
    });
  }
});

/**
 * Para extração de preços para um hotel específico  
 * POST /api/rate-shopper/:hotel_id/stop-extraction
 */
router.post('/:hotel_id/stop-extraction', async (req, res) => {
  const hotel_id = req.params.hotel_id;

  try {
    const Hotel = require('../models/Hotel');
    
    // Converter UUID para ID se necessário (igual ao start-extraction)
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ 
          success: false,
          error: 'Hotel not found' 
        });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }

    const store = await getExtractionStore();
    const extraction = await store.getActiveExtraction(hotelId);

    if (!extraction) {
      console.log(`⚠️ Extração não encontrada no store para hotel ${hotelId}. Verificando extrações órfãs...`);

      // Executar limpeza automática de extrações órfãs
      try {
        const cleanupResult = await store.cleanupStaleExtractions();

        if (cleanupResult.cleanedCount > 0) {
          console.log(`🧹 Limpeza automática executada: ${cleanupResult.cleanedCount} extrações órfãs detectadas e canceladas`);

          // Atualizar também as searches no banco
          const RateShopperSearch = require('../models/RateShopperSearch');

          for (const cleanedHotelId of cleanupResult.cleanedHotelIds) {
            const runningSearches = await RateShopperSearch.findByHotel(cleanedHotelId, { status: 'RUNNING' });

            for (const staleSearch of runningSearches) {
              await staleSearch.updateStatus('CANCELLED', {
                error_log: 'Extração órfã detectada durante tentativa de pausa - limpeza automática'
              });
              console.log(`✅ Search ID ${staleSearch.id} marcada como CANCELLED automaticamente`);
            }
          }

          return res.json({
            success: true,
            message: 'Extrações órfãs foram detectadas e limpas automaticamente. A página será recarregada.',
            data: {
              hotelId: hotelId,
              status: 'CLEANED',
              stale_extractions_cleaned: cleanupResult.cleanedCount
            }
          });
        }

        // Se chegou aqui, realmente não há extração ativa
        return res.status(404).json({
          success: false,
          error: 'Nenhuma extração ativa encontrada para este hotel'
        });

      } catch (cleanupError) {
        console.error('Erro durante limpeza automática:', cleanupError);
        return res.status(404).json({
          success: false,
          error: 'Nenhuma extração ativa encontrada para este hotel'
        });
      }
    }

    // Matar o processo usando ProcessManager
    try {
      if (extraction.process && !extraction.process.killed) {
        console.log(`🔴 Iniciando terminação do processo PID ${extraction.process.pid} para hotel ${hotelId}`);

        // Usar ProcessManager para terminação multiplataforma
        await ProcessManager.killProcess(extraction.process);

      } else {
        console.log(`⚠️ Processo do hotel ${hotelId} já estava terminado`);
      }
    } catch (killError) {
      console.error(`❌ Erro ao matar processo do hotel ${hotelId}:`, killError.message);
      // Continuar mesmo se não conseguir matar o processo
    }
    
    // Remover do store persistente
    await store.removeActiveExtraction(hotelId, 'CANCELLED');

    // ATUALIZAR STATUS NO BANCO DE DADOS
    try {
      const db = require('../config/database');

      // Verificar se está conectado ao banco
      if (!db.usingFallback) {
        await db.query(`
          UPDATE rate_shopper_searches
          SET status = 'CANCELLED', completed_at = CURRENT_TIMESTAMP
          WHERE hotel_id = $1 AND status = 'RUNNING'
        `, [hotelId]);

        console.log(`✅ Searches do hotel ${hotelId} marcadas como CANCELLED no banco`);
      } else {
        console.log(`⚠️ Usando fallback - não foi possível atualizar status no banco para hotel ${hotelId}`);
      }
    } catch (dbError) {
      console.error('❌ Erro ao atualizar status no banco:', dbError.message);
      // Não falhar a operação por causa do erro de banco
    }

    res.json({
      success: true,
      message: 'Extração pausada com sucesso',
      data: {
        hotelId: hotelId,
        status: 'CANCELLED'
      }
    });

  } catch (error) {
    console.error('Stop extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao pausar extração'
    });
  }
});

/**
 * Status da extração em tempo real
 * GET /api/rate-shopper/:hotel_id/extraction-status
 */
router.get('/:hotel_id/extraction-status', async (req, res) => {
  const hotel_id = req.params.hotel_id;

  try {
    const Hotel = require('../models/Hotel');
    
    // Converter UUID para ID se necessário (igual aos outros endpoints)
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ 
          success: false,
          error: 'Hotel not found' 
        });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }

    const store = await getExtractionStore();
    const extraction = await store.getActiveExtraction(hotelId);

    if (!extraction) {
      return res.json({
        success: true,
        data: {
          status: 'IDLE',
          message: 'Nenhuma extração em andamento'
        }
      });
    }

    const duration = extraction.endTime
      ? extraction.endTime - extraction.startTime
      : Date.now() - extraction.startTime;

    res.json({
      success: true,
      data: {
        hotelId: hotelId,
        status: extraction.status,
        progress: extraction.progress,
        duration: Math.floor(duration / 1000), // em segundos
        startTime: extraction.startTime,
        endTime: extraction.endTime,
        recentLogs: extraction.logs.slice(-10), // últimos 10 logs
        estimatedTimeRemaining: calculateEstimatedTime(extraction)
      }
    });

  } catch (error) {
    console.error('Get extraction status error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status da extração'
    });
  }
});

/**
 * Parar todas as extrações ativas (emergência)
 * POST /api/rate-shopper-extraction/emergency-stop-all
 */
router.post('/emergency-stop-all', async (req, res) => {
  try {
    console.log('🚨 PARADA DE EMERGÊNCIA INICIADA - Matando todos os processos');

    const store = await getExtractionStore();
    const allActiveExtractions = await store.getAllActiveExtractions();

    let killedCount = 0;

    // Parar todos os processos ativos
    for (const extraction of allActiveExtractions) {
      try {
        if (extraction.process && !extraction.process.killed) {
          await ProcessManager.killProcess(extraction.process);
          killedCount++;
        }

        // Remover do store
        await store.removeActiveExtraction(extraction.hotelId, 'CANCELLED');

      } catch (e) {
        console.error(`❌ Erro ao matar processo do hotel ${extraction.hotelId}:`, e.message);
      }
    }

    // Limpeza global de processos órfãos
    const cleanupSuccess = await ProcessManager.emergencyCleanup('database-processor');

    // Atualizar banco de dados
    try {
      const db = require('../config/database');
      if (!db.usingFallback) {
        await db.query(`
          UPDATE rate_shopper_searches
          SET status = 'CANCELLED', completed_at = CURRENT_TIMESTAMP
          WHERE status = 'RUNNING'
        `);

        // Limpar também extrações órfãs no store
        await store.cleanupStaleExtractions();

        console.log('✅ Todas as searches marcadas como CANCELLED no banco');
      }
    } catch (dbError) {
      console.error('❌ Erro ao atualizar banco:', dbError.message);
    }

    res.json({
      success: true,
      message: 'Parada de emergência executada',
      data: {
        processes_killed: killedCount,
        active_extractions_cleared: allActiveExtractions.length,
        system_cleanup: cleanupSuccess,
        database_updated: true,
        platform: ProcessManager.getPlatformInfo().platform
      }
    });

  } catch (error) {
    console.error('❌ Emergency stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro na parada de emergência: ' + error.message
    });
  }
});

/**
 * Limpa extrações com status RUNNING que não estão realmente ativas
 * POST /api/rate-shopper-extraction/cleanup-stale-extractions
 */
router.post('/cleanup-stale-extractions', async (req, res) => {
  try {
    console.log('🧹 Iniciando limpeza de extrações órfãs...');

    const store = await getExtractionStore();
    const RateShopperSearch = require('../models/RateShopperSearch');

    // Buscar todas as extrações com status RUNNING no banco
    const runningSearches = await RateShopperSearch.findRunning();
    console.log(`🔍 Encontradas ${runningSearches.length} extrações marcadas como RUNNING no banco`);

    // Verificar quais estão realmente ativas no store
    const allActiveExtractions = await store.getAllActiveExtractions();
    const activeHotelIds = allActiveExtractions.map(ex => ex.hotelId);

    console.log(`🔍 Extrações ativas no store: [${activeHotelIds.join(', ')}]`);

    const staleSearches = [];
    for (const search of runningSearches) {
      const isActuallyActive = activeHotelIds.includes(search.hotel_id);
      console.log(`🔍 Search ID ${search.id} (hotel_id: ${search.hotel_id}) - Ativa no store: ${isActuallyActive}`);

      if (!isActuallyActive) {
        staleSearches.push(search);
      }
    }

    console.log(`🧹 Encontradas ${staleSearches.length} extrações órfãs para limpar`);

    // Limpar extrações órfãs no store também
    const storeCleanupResult = await store.cleanupStaleExtractions();

    // Marcar extrações órfãs como CANCELLED
    let cleanedCount = 0;
    for (const staleSearch of staleSearches) {
      try {
        await staleSearch.updateStatus('CANCELLED', {
          error_log: 'Extração órfã - processo não encontrado (limpeza automática)'
        });
        cleanedCount++;
        console.log(`✅ Search ID ${staleSearch.id} marcada como CANCELLED`);
      } catch (error) {
        console.error(`❌ Erro ao limpar search ID ${staleSearch.id}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Limpeza concluída: ${cleanedCount} extrações órfãs foram marcadas como CANCELLED`,
      data: {
        total_running_in_db: runningSearches.length,
        total_active_in_store: activeHotelIds.length,
        stale_extractions_found: staleSearches.length,
        extractions_cleaned: cleanedCount,
        store_cleanup_count: storeCleanupResult.cleanedCount,
        cleaned_search_ids: staleSearches.map(s => s.id),
        platform: ProcessManager.getPlatformInfo().platform
      }
    });

  } catch (error) {
    console.error('❌ Cleanup stale extractions error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar extrações órfãs: ' + error.message
    });
  }
});

/**
 * Lista todas as extrações ativas (admin)
 * GET /api/rate-shopper/active-extractions
 */
router.get('/active-extractions', async (req, res) => {
  try {
    const store = await getExtractionStore();
    const allActiveExtractions = await store.getAllActiveExtractions();

    const activeList = allActiveExtractions.map(extraction => ({
      hotelId: extraction.hotelId,
      status: extraction.status,
      progress: extraction.progress,
      startTime: extraction.startTime,
      duration: Math.floor((Date.now() - extraction.startTime) / 1000),
      lastUpdate: extraction.updatedAt,
      processPid: extraction.process?.pid
    }));

    res.json({
      success: true,
      data: {
        totalActive: activeList.length,
        extractions: activeList,
        platform: ProcessManager.getPlatformInfo()
      }
    });

  } catch (error) {
    console.error('❌ Get active extractions error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar extrações ativas: ' + error.message
    });
  }
});

/**
 * Calcula tempo estimado restante
 */
function calculateEstimatedTime(extraction) {
  if (extraction.progress.current === 0) return null;
  
  const elapsed = Date.now() - extraction.startTime;
  const avgTimePerItem = elapsed / extraction.progress.current;
  const remaining = extraction.progress.total - extraction.progress.current;
  
  return Math.floor((avgTimePerItem * remaining) / 1000); // segundos
}

module.exports = router;