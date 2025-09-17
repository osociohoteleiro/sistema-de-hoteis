#!/usr/bin/env node

/**
 * Script de teste para verificar compatibilidade Linux/Docker
 * Testa todas as funcionalidades críticas do extrator
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 TESTE DE COMPATIBILIDADE LINUX/DOCKER');
console.log('=' * 50);

const results = {
  tests: 0,
  passed: 0,
  failed: 0,
  errors: []
};

async function test(name, fn) {
  results.tests++;
  console.log(`\n🔍 Testando: ${name}`);

  try {
    const result = await fn();
    if (result === true || result === undefined) {
      console.log(`✅ ${name}: PASSOU`);
      results.passed++;
    } else {
      console.log(`❌ ${name}: FALHOU - ${result}`);
      results.failed++;
      results.errors.push(`${name}: ${result}`);
    }
  } catch (error) {
    console.log(`❌ ${name}: ERRO - ${error.message}`);
    results.failed++;
    results.errors.push(`${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log(`📊 Platform: ${process.platform}`);
  console.log(`🔧 Node version: ${process.version}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🐳 Docker: ${fs.existsSync('/.dockerenv') ? 'Yes' : 'No'}`);

  // Teste 1: Verificar imports básicos
  await test('Imports básicos', () => {
    require('./src/logger');
    require('./src/browser-config');
    require('./src/database-integration');
    require('./src/auto-processor');
    return true;
  });

  // Teste 2: Configuração do browser
  await test('Configuração do browser', () => {
    const { getBrowserConfig } = require('./src/browser-config');
    const config = getBrowserConfig();

    if (!config || !config.args || !Array.isArray(config.args)) {
      return 'Configuração inválida';
    }

    if (!config.args.includes('--no-sandbox')) {
      return 'Flag --no-sandbox ausente (necessária para Docker)';
    }

    return true;
  });

  // Teste 3: Sistema de logs
  await test('Sistema de logs', () => {
    const { logger, logEnvironmentInfo } = require('./src/logger');

    if (!logger || typeof logger.info !== 'function') {
      return 'Logger não inicializado corretamente';
    }

    logger.info('Teste de log funcionando');
    logEnvironmentInfo();
    return true;
  });

  // Teste 4: Detecção de ambiente
  await test('Detecção de ambiente', () => {
    const DatabaseIntegration = require('./src/database-integration');
    const db = new DatabaseIntegration();

    // Não vamos conectar, só testar se a classe instancia
    if (!db) {
      return 'DatabaseIntegration não instanciou';
    }

    return true;
  });

  // Teste 5: Criação de diretórios
  await test('Criação de diretórios', () => {
    const testDir = path.join(process.cwd(), 'test-temp-dir');

    try {
      fs.mkdirSync(testDir, { recursive: true });

      // Testar escrita
      const testFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(testFile, 'test');

      // Verificar leitura
      const content = fs.readFileSync(testFile, 'utf8');
      if (content !== 'test') {
        return 'Falha na leitura/escrita de arquivo';
      }

      // Limpeza
      fs.unlinkSync(testFile);
      fs.rmdirSync(testDir);

      return true;
    } catch (error) {
      return `Erro de filesystem: ${error.message}`;
    }
  });

  // Teste 6: AutoProcessor
  await test('AutoProcessor', () => {
    const AutoProcessor = require('./src/auto-processor');
    const processor = new AutoProcessor(10);

    if (!processor || typeof processor.getStatus !== 'function') {
      return 'AutoProcessor não funcional';
    }

    const status = processor.getStatus();
    if (!status || typeof status.isRunning === 'undefined') {
      return 'Status do AutoProcessor inválido';
    }

    return true;
  });

  // Teste 7: Verificar Puppeteer/Chromium (se disponível)
  await test('Puppeteer/Chromium', async () => {
    try {
      const puppeteer = require('puppeteer-extra');
      const { getBrowserConfig } = require('./src/browser-config');

      const config = getBrowserConfig();

      // Se há executablePath, verificar se existe
      if (config.executablePath) {
        if (!fs.existsSync(config.executablePath)) {
          return `Chromium não encontrado em: ${config.executablePath}`;
        }
      }

      // Tentar verificar versão via comando (se disponível)
      try {
        const { execSync } = require('child_process');
        const paths = [
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
          '/usr/bin/google-chrome'
        ];

        let found = false;
        for (const chromePath of paths) {
          if (fs.existsSync(chromePath)) {
            try {
              const version = execSync(`${chromePath} --version`, {
                encoding: 'utf8',
                timeout: 5000,
                stdio: ['ignore', 'pipe', 'ignore']
              });
              console.log(`   📋 Chromium encontrado: ${chromePath} - ${version.trim()}`);
              found = true;
              break;
            } catch (e) {
              // Continuar tentando outros paths
            }
          }
        }

        if (!found && process.platform === 'linux') {
          return 'Nenhuma versão funcional do Chromium encontrada no Linux';
        }
      } catch (e) {
        console.log(`   ⚠️  Não foi possível verificar versão do Chromium: ${e.message}`);
      }

      return true;
    } catch (error) {
      return `Erro no Puppeteer: ${error.message}`;
    }
  });

  // Resumo dos resultados
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(50));
  console.log(`✅ Testes passou: ${results.passed}/${results.tests}`);
  console.log(`❌ Testes falharam: ${results.failed}/${results.tests}`);

  if (results.errors.length > 0) {
    console.log('\n🚨 ERROS ENCONTRADOS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  const success = results.failed === 0;
  console.log(`\n${success ? '🎉' : '💥'} ${success ? 'TODOS OS TESTES PASSARAM!' : 'ALGUNS TESTES FALHARAM!'}`);

  if (success) {
    console.log('✅ Sistema compatível com Linux/Docker');
  } else {
    console.log('❌ Sistema precisa de correções para Linux/Docker');
  }

  process.exit(success ? 0 : 1);
}

// Executar testes
runTests().catch(error => {
  console.error('💥 Erro fatal nos testes:', error);
  process.exit(1);
});