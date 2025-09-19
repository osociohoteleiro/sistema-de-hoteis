#!/usr/bin/env node
/**
 * OSH PID Manager
 * Gerencia PIDs e status dos serviços do sistema OSH
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

class PIDManager {
  constructor() {
    this.controlFile = path.join(__dirname, '../../dev-control.json');
    this.pidDir = path.join(__dirname, '.pids');
    this.ensurePidDir();
  }

  /**
   * Garantir que o diretório de PIDs existe
   */
  ensurePidDir() {
    if (!fs.existsSync(this.pidDir)) {
      fs.mkdirSync(this.pidDir, { recursive: true });
    }
  }

  /**
   * Carregar configuração de controle
   */
  loadControl() {
    try {
      const data = fs.readFileSync(this.controlFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Erro ao carregar dev-control.json:', error.message);
      return null;
    }
  }

  /**
   * Salvar configuração de controle
   */
  saveControl(config) {
    try {
      config.last_updated = new Date().toISOString();
      fs.writeFileSync(this.controlFile, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar dev-control.json:', error.message);
      return false;
    }
  }

  /**
   * Verificar se um processo está rodando
   */
  async isProcessRunning(pid) {
    return new Promise((resolve) => {
      if (!pid) {
        resolve(false);
        return;
      }

      exec(`tasklist /FI "PID eq ${pid}"`, (error, stdout) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(stdout.includes(pid.toString()));
      });
    });
  }

  /**
   * Verificar se uma porta está em uso
   */
  async isPortInUse(port) {
    return new Promise((resolve) => {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        resolve(!!stdout.trim());
      });
    });
  }

  /**
   * Obter PID de uma porta
   */
  async getPortPID(port) {
    return new Promise((resolve) => {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          resolve(null);
          return;
        }

        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parseInt(parts[4]);
            if (!isNaN(pid)) {
              resolve(pid);
              return;
            }
          }
        }
        resolve(null);
      });
    });
  }

  /**
   * Iniciar um serviço
   */
  async startService(serviceName) {
    const config = this.loadControl();
    if (!config || !config.services[serviceName]) {
      console.error(`❌ Serviço '${serviceName}' não encontrado`);
      return false;
    }

    const service = config.services[serviceName];

    // Verificar se já está rodando
    const portInUse = await this.isPortInUse(service.port);
    if (portInUse) {
      const existingPID = await this.getPortPID(service.port);
      console.log(`⚠️ Porta ${service.port} já está em uso (PID: ${existingPID})`);

      // Atualizar configuração com PID encontrado
      service.pid = existingPID;
      service.status = 'running';
      this.saveControl(config);

      return false;
    }

    console.log(`🚀 Iniciando ${service.name}...`);

    // Spawnar processo (usar cmd no Windows)
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'cmd' : 'npm';
    const args = isWindows ? ['/c', 'npm', 'run', 'dev'] : ['run', 'dev'];

    const child = spawn(command, args, {
      cwd: path.resolve(service.path),
      detached: true,
      stdio: 'ignore'
    });

    // Aguardar um pouco para o processo inicializar
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se iniciou corretamente
    const portNowInUse = await this.isPortInUse(service.port);
    if (portNowInUse) {
      const newPID = await this.getPortPID(service.port);
      console.log(`✅ ${service.name} iniciado na porta ${service.port} (PID: ${newPID})`);

      service.pid = newPID;
      service.status = 'running';
      this.saveControl(config);

      // Salvar PID em arquivo
      this.savePIDFile(serviceName, newPID);

      return true;
    } else {
      console.error(`❌ Falha ao iniciar ${service.name}`);
      service.status = 'failed';
      this.saveControl(config);
      return false;
    }
  }

  /**
   * Parar um serviço
   */
  async stopService(serviceName, force = false) {
    const config = this.loadControl();
    if (!config || !config.services[serviceName]) {
      console.error(`❌ Serviço '${serviceName}' não encontrado`);
      return false;
    }

    const service = config.services[serviceName];

    // Obter PID atual da porta
    const currentPID = await this.getPortPID(service.port);

    if (!currentPID) {
      console.log(`ℹ️ ${service.name} não está rodando`);
      service.pid = null;
      service.status = 'stopped';
      this.saveControl(config);
      this.removePIDFile(serviceName);
      return true;
    }

    console.log(`🛑 Parando ${service.name} (PID: ${currentPID})...`);

    return new Promise((resolve) => {
      const killCommand = force ? `taskkill /F /PID ${currentPID}` : `taskkill /PID ${currentPID}`;

      exec(killCommand, async (error) => {
        // Aguardar um pouco
        await new Promise(r => setTimeout(r, 1000));

        // Verificar se parou
        const stillRunning = await this.isPortInUse(service.port);

        if (!stillRunning) {
          console.log(`✅ ${service.name} parado com sucesso`);
          service.pid = null;
          service.status = 'stopped';
          this.saveControl(config);
          this.removePIDFile(serviceName);
          resolve(true);
        } else {
          if (!force) {
            console.log(`⚠️ Graceful stop falhou, forçando parada...`);
            resolve(await this.stopService(serviceName, true));
          } else {
            console.error(`❌ Falha ao parar ${service.name}`);
            resolve(false);
          }
        }
      });
    });
  }

  /**
   * Salvar PID em arquivo
   */
  savePIDFile(serviceName, pid) {
    const pidFile = path.join(this.pidDir, `${serviceName}.pid`);
    fs.writeFileSync(pidFile, pid.toString());
  }

  /**
   * Remover arquivo PID
   */
  removePIDFile(serviceName) {
    const pidFile = path.join(this.pidDir, `${serviceName}.pid`);
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  }

  /**
   * Obter status de todos os serviços
   */
  async getStatus() {
    const config = this.loadControl();
    if (!config) return null;

    const status = {};

    for (const [serviceName, service] of Object.entries(config.services)) {
      const portInUse = await this.isPortInUse(service.port);
      const currentPID = await this.getPortPID(service.port);

      status[serviceName] = {
        name: service.name,
        port: service.port,
        pid: currentPID,
        running: portInUse,
        status: portInUse ? 'running' : 'stopped'
      };

      // Atualizar configuração se necessário
      if (service.pid !== currentPID || service.status !== status[serviceName].status) {
        service.pid = currentPID;
        service.status = status[serviceName].status;
      }
    }

    this.saveControl(config);
    return status;
  }

  /**
   * Listar serviços disponíveis
   */
  listServices() {
    const config = this.loadControl();
    if (!config) return [];

    return Object.keys(config.services);
  }
}

// CLI Interface
const manager = new PIDManager();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const serviceName = args[1];

  switch (command) {
    case 'start':
      if (!serviceName) {
        console.error('❌ Especifique o serviço: node pid-manager.js start <service>');
        process.exit(1);
      }
      const started = await manager.startService(serviceName);
      process.exit(started ? 0 : 1);

    case 'stop':
      if (!serviceName) {
        console.error('❌ Especifique o serviço: node pid-manager.js stop <service>');
        process.exit(1);
      }
      const stopped = await manager.stopService(serviceName);
      process.exit(stopped ? 0 : 1);

    case 'status':
      const status = await manager.getStatus();
      if (status) {
        console.log('\n📊 Status dos Serviços OSH:');
        console.log('='.repeat(50));
        for (const [name, info] of Object.entries(status)) {
          const icon = info.running ? '✅' : '❌';
          const pidText = info.pid ? ` (PID: ${info.pid})` : '';
          console.log(`${icon} ${info.name.padEnd(20)} porta ${info.port}${pidText}`);
        }
        console.log('');
      }
      break;

    case 'list':
      const services = manager.listServices();
      console.log('\n📋 Serviços Disponíveis:');
      services.forEach(service => console.log(`  - ${service}`));
      console.log('');
      break;

    default:
      console.log(`
OSH PID Manager - Gerenciador de Processos

Uso:
  node pid-manager.js start <service>   - Iniciar serviço
  node pid-manager.js stop <service>    - Parar serviço
  node pid-manager.js status            - Status de todos os serviços
  node pid-manager.js list              - Listar serviços disponíveis

Serviços disponíveis: ${manager.listServices().join(', ')}
`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PIDManager;
