const express = require('express');
const router = express.Router();
const ExtractionStore = require('../utils/extractionStore');
const { emitExtractionProgress } = require('../utils/socketEmitters');
const db = require('../config/database');

const extractionStore = new ExtractionStore(db);

/**
 * Endpoint para simular uma extração longa para teste de pause
 */
router.post('/:hotel_uuid/simulate-long-extraction', async (req, res) => {
  const hotel_uuid = req.params.hotel_uuid;

  try {
    console.log(`🧪 Iniciando simulação de extração longa para hotel ${hotel_uuid}`);

    // Registrar extração ativa no store
    await extractionStore.setActiveExtraction(hotel_uuid, {
      status: 'RUNNING',
      startTime: new Date(),
      process: { pid: 999999 } // PID fake para simulação
    });

    console.log(`✅ Extração simulada registrada no store para hotel UUID ${hotel_uuid}`);

    // Simular progresso lento (para dar tempo de pausar)
    let progress = 0;
    const totalSteps = 100;

    const simulateProgress = async () => {
      const io = req.app.get('socketio');

      const interval = setInterval(async () => {
        try {
          // Verificar se extração ainda está ativa (não foi pausada)
          const activeExtraction = await extractionStore.getActiveExtraction(hotel_uuid);
          if (!activeExtraction) {
            console.log(`⏸️ Simulação pausada para hotel ${hotel_uuid}`);
            clearInterval(interval);
            return;
          }

          progress += 1;
          console.log(`📊 Progresso simulado: ${progress}/${totalSteps} (${progress}%)`);

          // Emitir progresso via Socket.io
          emitExtractionProgress(io, hotel_uuid, {
            searchId: 'SIMULATION',
            id: 'SIMULATION',
            status: 'RUNNING',
            processed_dates: progress,
            total_dates: totalSteps,
            progress_percentage: progress,
            total_prices_found: progress * 2,
            duration_seconds: Math.floor(Date.now() / 1000),
            started_at: new Date(),
            completed_at: null,
            property_name: 'Simulação de Teste',
            error_log: null
          });

          if (progress >= totalSteps) {
            console.log(`✅ Simulação concluída para hotel ${hotel_uuid}`);
            await extractionStore.removeActiveExtraction(hotel_uuid, 'COMPLETED');
            clearInterval(interval);
          }
        } catch (error) {
          console.error(`❌ Erro na simulação:`, error);
          clearInterval(interval);
        }
      }, 2000); // Atualizar a cada 2 segundos
    };

    // Iniciar simulação em background
    simulateProgress();

    res.json({
      success: true,
      message: 'Simulação de extração longa iniciada',
      data: {
        hotelUuid: hotel_uuid,
        status: 'RUNNING',
        type: 'SIMULATION',
        totalSteps: totalSteps,
        updateInterval: '2 segundos'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar simulação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar simulação de extração'
    });
  }
});

module.exports = router;