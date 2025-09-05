const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Store de processos ativos por hotel
const activeExtractions = new Map();

/**
 * Inicia extração de preços para um hotel específico
 * POST /api/rate-shopper/:hotel_id/start-extraction
 */
router.post('/:hotel_id/start-extraction', async (req, res) => {
  const hotelId = req.params.hotel_id;
  const { search_ids, properties } = req.body;

  try {
    // Verificar se já há extração rodando para este hotel
    if (activeExtractions.has(hotelId)) {
      return res.status(400).json({
        success: false,
        error: 'Já existe uma extração em andamento para este hotel'
      });
    }

    // Iniciar processo de extração
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'cmd' : 'sh';
    const args = isWindows 
      ? ['/c', 'npm run process-database:saas'] 
      : ['-c', 'npm run process-database:saas'];
    
    const extractionProcess = spawn(command, args, {
      cwd: path.join(process.cwd(), '..', 'extrator-rate-shopper'),
      env: { 
        ...process.env, 
        HEADLESS: 'true',
        HOTEL_ID: hotelId,
        SEARCH_IDS: search_ids?.join(',') || ''
      },
      shell: false
    });

    // Store do processo
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

    activeExtractions.set(hotelId, extractionData);

    // Listen para output do processo
    extractionProcess.stdout.on('data', (data) => {
      const output = data.toString();
      extractionData.logs.push({
        timestamp: new Date(),
        message: output,
        type: 'info'
      });

      // Parse progress from logs
      if (output.includes('Progress:')) {
        const progressMatch = output.match(/Progress: (\d+)\/(\d+)/);
        if (progressMatch) {
          extractionData.progress.current = parseInt(progressMatch[1]);
          extractionData.progress.total = parseInt(progressMatch[2]);
        }
      }

      if (output.includes('Price extracted')) {
        extractionData.progress.extractedPrices++;
      }

      if (output.includes('Processando:')) {
        const propertyMatch = output.match(/Processando: (.+)/);
        if (propertyMatch) {
          extractionData.progress.currentProperty = propertyMatch[1];
        }
      }
    });

    extractionProcess.stderr.on('data', (data) => {
      extractionData.logs.push({
        timestamp: new Date(),
        message: data.toString(),
        type: 'error'
      });
    });

    extractionProcess.on('close', (code) => {
      extractionData.status = code === 0 ? 'COMPLETED' : 'FAILED';
      extractionData.endTime = new Date();
      
      // Remove do store após 5 minutos
      setTimeout(() => {
        activeExtractions.delete(hotelId);
      }, 5 * 60 * 1000);
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
  const hotelId = req.params.hotel_id;

  try {
    const extraction = activeExtractions.get(hotelId);
    
    if (!extraction) {
      return res.status(404).json({
        success: false,
        error: 'Nenhuma extração ativa encontrada para este hotel'
      });
    }

    // Matar o processo (compatível com Windows e Linux)
    try {
      if (!extraction.process.killed) {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
          // No Windows, usar taskkill para garantir que o processo e filhos sejam mortos
          const { spawn } = require('child_process');
          const killProcess = spawn('taskkill', ['/pid', extraction.process.pid, '/t', '/f'], {
            stdio: 'ignore'
          });
          
          killProcess.on('close', (code) => {
            console.log(`🔴 Processo de extração do hotel ${hotelId} terminado via taskkill (código: ${code})`);
          });
          
          // Fallback: tentar kill normal também
          setTimeout(() => {
            try {
              extraction.process.kill('SIGKILL');
            } catch (e) {
              // Ignorar erro se processo já foi morto
            }
          }, 2000);
        } else {
          // Linux/Mac: usar SIGTERM primeiro, depois SIGKILL se necessário
          extraction.process.kill('SIGTERM');
          
          // Se não morrer em 5 segundos, usar SIGKILL
          setTimeout(() => {
            try {
              if (!extraction.process.killed) {
                extraction.process.kill('SIGKILL');
                console.log(`🔴 Processo de extração do hotel ${hotelId} forçado com SIGKILL`);
              }
            } catch (e) {
              // Ignorar erro se processo já foi morto
            }
          }, 5000);
        }
        
        console.log(`🔴 Iniciado processo de terminação para hotel ${hotelId}`);
      } else {
        console.log(`⚠️ Processo do hotel ${hotelId} já estava terminado`);
      }
    } catch (killError) {
      console.error(`Erro ao matar processo do hotel ${hotelId}:`, killError.message);
      // Continuar mesmo se não conseguir matar o processo
    }
    
    extraction.status = 'CANCELLED';
    extraction.endTime = new Date();

    // ATUALIZAR STATUS NO BANCO DE DADOS
    try {
      const db = require('../config/database');
      
      // Verificar se está conectado ao banco
      if (!db.usingFallback) {
        await db.query(`
          UPDATE rate_shopper_searches 
          SET status = 'CANCELLED', completed_at = CURRENT_TIMESTAMP 
          WHERE hotel_id = ? AND status = 'RUNNING'
        `, [hotelId]);
        
        console.log(`✅ Searches do hotel ${hotelId} marcadas como CANCELLED no banco`);
      } else {
        console.log(`⚠️ Usando fallback - não foi possível atualizar status no banco para hotel ${hotelId}`);
      }
    } catch (dbError) {
      console.error('Erro ao atualizar status no banco:', dbError.message);
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
  const hotelId = req.params.hotel_id;

  try {
    const extraction = activeExtractions.get(hotelId);

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
    
    let killedCount = 0;
    const isWindows = process.platform === 'win32';
    
    // Parar todos os processos ativos no store
    for (const [hotelId, extraction] of activeExtractions.entries()) {
      try {
        if (!extraction.process.killed) {
          if (isWindows) {
            const { spawn } = require('child_process');
            spawn('taskkill', ['/pid', extraction.process.pid, '/t', '/f'], { stdio: 'ignore' });
            killedCount++;
          } else {
            extraction.process.kill('SIGKILL');
            killedCount++;
          }
        }
        extraction.status = 'CANCELLED';
        extraction.endTime = new Date();
      } catch (e) {
        console.error(`Erro ao matar processo do hotel ${hotelId}:`, e.message);
      }
    }
    
    // Limpar todos os processos Node relacionados ao database-processor (Windows)
    if (isWindows) {
      try {
        const { spawn } = require('child_process');
        spawn('taskkill', ['/f', '/im', 'node.exe', '/fi', 'WINDOWTITLE eq *database-processor*'], { stdio: 'ignore' });
        
        // Matar processos Chrome órfãos também
        spawn('taskkill', ['/f', '/im', 'chrome.exe', '/fi', 'PID gt 1'], { stdio: 'ignore' });
        
        console.log('🔄 Comandos de limpeza enviados (Windows)');
      } catch (e) {
        console.error('Erro na limpeza Windows:', e.message);
      }
    } else {
      try {
        const { spawn } = require('child_process');
        spawn('pkill', ['-f', 'database-processor'], { stdio: 'ignore' });
        spawn('pkill', ['-f', 'chrome'], { stdio: 'ignore' });
        
        console.log('🔄 Comandos de limpeza enviados (Linux/Mac)');
      } catch (e) {
        console.error('Erro na limpeza Linux/Mac:', e.message);
      }
    }
    
    // Limpar store
    activeExtractions.clear();
    
    // Atualizar banco de dados
    try {
      const db = require('../config/database');
      if (!db.usingFallback) {
        await db.query(`
          UPDATE rate_shopper_searches 
          SET status = 'CANCELLED', completed_at = CURRENT_TIMESTAMP 
          WHERE status = 'RUNNING'
        `);
        console.log('✅ Todas as searches marcadas como CANCELLED no banco');
      }
    } catch (dbError) {
      console.error('Erro ao atualizar banco:', dbError.message);
    }
    
    res.json({
      success: true,
      message: 'Parada de emergência executada',
      data: {
        processes_killed: killedCount,
        active_extractions_cleared: true,
        database_updated: true
      }
    });
    
  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro na parada de emergência'
    });
  }
});

/**
 * Lista todas as extrações ativas (admin)
 * GET /api/rate-shopper/active-extractions
 */
router.get('/active-extractions', async (req, res) => {
  try {
    const activeList = [];
    
    for (const [hotelId, extraction] of activeExtractions.entries()) {
      activeList.push({
        hotelId: hotelId,
        status: extraction.status,
        progress: extraction.progress,
        startTime: extraction.startTime,
        duration: Math.floor((Date.now() - extraction.startTime) / 1000)
      });
    }

    res.json({
      success: true,
      data: {
        totalActive: activeList.length,
        extractions: activeList
      }
    });

  } catch (error) {
    console.error('Get active extractions error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar extrações ativas'
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