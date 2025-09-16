const os = require('os');
const { spawn } = require('child_process');
const fs = require('fs');

/**
 * Gerenciador de processos multiplataforma
 * Resolve diferenças entre Windows/Linux para spawning e killing de processos
 */
class ProcessManager {

  /**
   * Encontra o caminho do Node.js no sistema
   */
  static findNodePath() {
    const possiblePaths = [
      process.execPath, // Caminho do Node.js atual
      '/usr/local/bin/node',
      '/usr/bin/node',
      '/opt/node/bin/node',
      'node' // último recurso
    ];

    for (const path of possiblePaths) {
      try {
        if (path === 'node' || fs.existsSync(path)) {
          console.log(`🔍 Node.js encontrado em: ${path}`);
          return path;
        }
      } catch (e) {
        continue;
      }
    }

    console.log(`⚠️ Node.js não encontrado, usando fallback: node`);
    return 'node';
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
        // Linux/EasyPanel: usar npm via shell (mais confiável)
        actualCommand = '/bin/sh';
        actualArgs = ['-c', 'cd /app/extrator-rate-shopper && npm run process-database:saas'];
        console.log(`🐧 Linux: Usando npm via shell - /bin/sh`);
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