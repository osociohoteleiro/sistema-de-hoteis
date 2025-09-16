const os = require('os');
const { spawn } = require('child_process');
const fs = require('fs');

/**
 * Gerenciador de processos multiplataforma
 * Resolve diferenças entre Windows/Linux para spawning e killing de processos
 */
class ProcessManager {

  /**
   * Cria um processo inline que executa código diretamente
   * (fallback quando spawn não funciona)
   */
  static createInlineProcess(options) {
    const EventEmitter = require('events');
    const path = require('path');

    const fakeProcess = new EventEmitter();
    fakeProcess.pid = Math.floor(Math.random() * 10000) + 1000; // PID fake
    fakeProcess.killed = false;
    fakeProcess.stdout = new EventEmitter();
    fakeProcess.stderr = new EventEmitter();

    // Configurar variáveis de ambiente
    const env = { ...process.env, ...options.env };

    console.log(`🔧 Processo inline criado - PID fake: ${fakeProcess.pid}`);
    console.log(`🔧 Variáveis de ambiente: HOTEL_ID=${env.HOTEL_ID}, SEARCH_IDS=${env.SEARCH_IDS}`);

    // Executar o código do database-processor diretamente
    setTimeout(async () => {
      try {
        // Simular mudança de diretório
        const originalCwd = process.cwd();
        const extractorPath = '/app/extrator-rate-shopper';

        // Configurar environment
        Object.assign(process.env, env);

        fakeProcess.stdout.emit('data', `🚀 INICIANDO DATABASE PROCESSOR (INLINE MODE)\n`);
        fakeProcess.stdout.emit('data', `📋 Plataforma: linux, PID: ${fakeProcess.pid}\n`);

        // Encontrar caminho correto do database processor
        const possiblePaths = [
          '/app/extrator-rate-shopper/src/database-processor.js',
          path.join(process.cwd(), '..', 'extrator-rate-shopper', 'src', 'database-processor.js'),
          path.join(process.cwd(), 'extrator-rate-shopper', 'src', 'database-processor.js'),
          './extrator-rate-shopper/src/database-processor.js'
        ];

        let DatabaseProcessor = null;
        let foundPath = null;

        for (const testPath of possiblePaths) {
          try {
            console.log(`🔍 Testando caminho: ${testPath}`);
            if (fs.existsSync(testPath)) {
              DatabaseProcessor = require(testPath);
              foundPath = testPath;
              console.log(`✅ Encontrado em: ${foundPath}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!DatabaseProcessor) {
          throw new Error(`Database processor não encontrado em nenhum dos caminhos: ${possiblePaths.join(', ')}`);
        }

        const processor = new DatabaseProcessor();

        await processor.start();

        fakeProcess.stdout.emit('data', `✅ Processamento concluído com sucesso\n`);
        fakeProcess.emit('close', 0);

      } catch (error) {
        console.error(`❌ Erro no processo inline:`, error);
        fakeProcess.stderr.emit('data', `Erro: ${error.message}\n`);
        fakeProcess.emit('close', 1);
      }
    }, 100);

    // Método kill
    fakeProcess.kill = (signal) => {
      fakeProcess.killed = true;
      fakeProcess.emit('close', 0);
    };

    return fakeProcess;
  }

  /**
   * Spawna um processo de forma consistente entre plataformas
   */
  static spawn(command, args, options = {}) {
    const isWindows = os.platform() === 'win32';

    // Ajustar comando para Windows vs Linux
    let actualCommand, actualArgs;

    // Detecção especial para comandos npm que podem falhar no Linux
    if (command === 'npm' && args.includes('process-database:saas')) {
      console.log(`🔧 Detectado comando rate-shopper, ajustando para plataforma: ${os.platform()}`);

      if (isWindows) {
        actualCommand = 'cmd';
        actualArgs = ['/c', command, ...args];
      } else {
        // Linux/EasyPanel: Fallback para usar require direto (sem spawn)
        console.log(`🐧 Linux: Executando rate-shopper via require direto (sem spawn)`);

        // Retornar um processo fake que executa o código diretamente
        const fakeProcess = ProcessManager.createInlineProcess(options);
        return fakeProcess;
      }
    } else {
      // Comportamento padrão para outros comandos
      if (isWindows) {
        actualCommand = 'cmd';
        actualArgs = ['/c', command, ...args];
      } else {
        actualCommand = 'sh';
        actualArgs = ['-c', `${command} ${args.join(' ')}`];
      }
    }

    console.log(`🚀 Spawning process - Platform: ${os.platform()}, Command: ${actualCommand}, Args: ${actualArgs.join(' ')}`);

    const childProcess = spawn(actualCommand, actualArgs, {
      ...options,
      shell: false,
      stdio: options.stdio || ['ignore', 'pipe', 'pipe']
    });

    console.log(`✅ Process spawned successfully - PID: ${childProcess.pid}`);

    childProcess.on('error', (error) => {
      console.error(`❌ Process spawn error - PID: ${childProcess.pid}:`, error.message);
    });

    return childProcess;
  }

  /**
   * Mata um processo de forma adequada para cada plataforma
   */
  static async killProcess(process, signal = 'SIGTERM') {
    return new Promise((resolve) => {
      const isWindows = os.platform() === 'win32';
      const pid = process.pid;

      if (!process || process.killed) {
        console.log(`⚠️ Processo PID ${pid} já estava terminado`);
        resolve(true);
        return;
      }

      try {
        if (isWindows) {
          console.log(`🔴 [Windows] Terminando processo PID ${pid} via taskkill`);

          // Windows: usar taskkill para garantir que árvore de processos seja morta
          const killProcess = spawn('taskkill', ['/pid', pid, '/t', '/f'], {
            stdio: 'ignore'
          });

          killProcess.on('close', (code) => {
            console.log(`✅ [Windows] Processo PID ${pid} terminado via taskkill (código: ${code})`);
            resolve(true);
          });

          killProcess.on('error', (error) => {
            console.error(`❌ [Windows] Erro no taskkill para PID ${pid}:`, error.message);
            // Fallback: tentar kill normal
            try {
              process.kill('SIGKILL');
              console.log(`🔴 [Windows] Fallback kill para PID ${pid} executado`);
            } catch (e) {
              console.error(`❌ [Windows] Fallback kill falhou para PID ${pid}:`, e.message);
            }
            resolve(false);
          });

        } else {
          console.log(`🔴 [Linux] Terminando processo PID ${pid} via ${signal}`);

          // Linux: usar SIGTERM primeiro, depois SIGKILL se necessário
          process.kill(signal);

          // Dar tempo para terminação graceful, depois forçar
          const timeout = setTimeout(() => {
            try {
              if (!process.killed) {
                console.log(`🔴 [Linux] Forçando SIGKILL para PID ${pid}`);
                process.kill('SIGKILL');
              }
            } catch (e) {
              console.error(`❌ [Linux] Erro no SIGKILL para PID ${pid}:`, e.message);
            }
            resolve(true);
          }, 5000);

          // Se processo terminar antes do timeout, limpar timeout
          process.on('exit', () => {
            clearTimeout(timeout);
            console.log(`✅ [Linux] Processo PID ${pid} terminado gracefully`);
            resolve(true);
          });
        }

      } catch (error) {
        console.error(`❌ Erro ao matar processo PID ${pid}:`, error.message);
        resolve(false);
      }
    });
  }

  /**
   * Limpa todos os processos relacionados a um padrão (emergência)
   */
  static async emergencyCleanup(pattern) {
    const isWindows = os.platform() === 'win32';

    console.log(`🚨 LIMPEZA DE EMERGÊNCIA - Padrão: ${pattern}, Platform: ${os.platform()}`);

    return new Promise((resolve) => {
      try {
        if (isWindows) {
          // Windows: matar processos node.exe relacionados
          const cleanup1 = spawn('taskkill', ['/f', '/im', 'node.exe'], { stdio: 'ignore' });
          const cleanup2 = spawn('taskkill', ['/f', '/im', 'chrome.exe'], { stdio: 'ignore' });

          let completed = 0;
          const checkComplete = () => {
            completed++;
            if (completed >= 2) {
              console.log('✅ [Windows] Limpeza de emergência concluída');
              resolve(true);
            }
          };

          cleanup1.on('close', checkComplete);
          cleanup2.on('close', checkComplete);

          // Timeout de segurança
          setTimeout(() => {
            console.log('⏰ [Windows] Timeout na limpeza de emergência');
            resolve(false);
          }, 10000);

        } else {
          // Linux: usar pkill
          const cleanup1 = spawn('pkill', ['-f', pattern], { stdio: 'ignore' });
          const cleanup2 = spawn('pkill', ['-f', 'chrome'], { stdio: 'ignore' });

          let completed = 0;
          const checkComplete = () => {
            completed++;
            if (completed >= 2) {
              console.log('✅ [Linux] Limpeza de emergência concluída');
              resolve(true);
            }
          };

          cleanup1.on('close', checkComplete);
          cleanup2.on('close', checkComplete);

          // Timeout de segurança
          setTimeout(() => {
            console.log('⏰ [Linux] Timeout na limpeza de emergência');
            resolve(false);
          }, 10000);
        }

      } catch (error) {
        console.error('❌ Erro na limpeza de emergência:', error.message);
        resolve(false);
      }
    });
  }

  /**
   * Retorna informações sobre a plataforma
   */
  static getPlatformInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      isWindows: os.platform() === 'win32',
      isLinux: os.platform() === 'linux',
      hostname: os.hostname(),
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + 'GB'
    };
  }
}

module.exports = ProcessManager;