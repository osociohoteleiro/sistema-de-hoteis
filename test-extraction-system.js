#!/usr/bin/env node

/**
 * Script de teste para validar sistema de extração
 * Testa compatibilidade entre Windows e Linux
 */

const ProcessManager = require('./api/utils/processManager');

async function testPlatformCompatibility() {
  console.log('🧪 TESTE DE COMPATIBILIDADE MULTIPLATAFORMA');
  console.log('=' .repeat(50));

  // 1. Testar informações da plataforma
  const platformInfo = ProcessManager.getPlatformInfo();
  console.log('\n📋 Informações da Plataforma:');
  console.log(`   Platform: ${platformInfo.platform}`);
  console.log(`   Architecture: ${platformInfo.arch}`);
  console.log(`   Is Windows: ${platformInfo.isWindows}`);
  console.log(`   Is Linux: ${platformInfo.isLinux}`);
  console.log(`   Hostname: ${platformInfo.hostname}`);
  console.log(`   Total Memory: ${platformInfo.totalMemory}`);
  console.log(`   Free Memory: ${platformInfo.freeMemory}`);

  // 2. Testar spawn de processo simples
  console.log('\n🚀 Testando spawn de processo...');
  try {
    const testProcess = ProcessManager.spawn('node', ['--version']);

    let output = '';
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    testProcess.on('close', (code) => {
      console.log(`   ✅ Processo terminado com código: ${code}`);
      console.log(`   📄 Output: ${output.trim()}`);
    });

    testProcess.on('error', (error) => {
      console.error(`   ❌ Erro no spawn: ${error.message}`);
    });

  } catch (error) {
    console.error(`   ❌ Erro ao spawnar processo: ${error.message}`);
  }

  // 3. Testar configuração do browser
  console.log('\n🌐 Testando configuração do browser...');
  try {
    const { getBrowserConfig } = require('./extrator-rate-shopper/src/browser-config');
    const config = getBrowserConfig();

    console.log(`   ✅ Browser config carregado`);
    console.log(`   🖥️  Headless: ${config.headless}`);
    console.log(`   📐 Viewport: ${config.defaultViewport.width}x${config.defaultViewport.height}`);
    console.log(`   ⚙️  Args count: ${config.args.length}`);

    if (config.executablePath) {
      console.log(`   🔧 Executable path: ${config.executablePath}`);
    }

    if (config.timeout) {
      console.log(`   ⏰ Timeout: ${config.timeout}ms`);
    }

  } catch (error) {
    console.error(`   ❌ Erro na configuração do browser: ${error.message}`);
  }

  // 4. Testar conexão com banco (se disponível)
  console.log('\n💾 Testando conexão com banco...');
  try {
    const ExtractionStore = require('./api/utils/extractionStore');
    const db = require('./api/config/database');

    if (!db.usingFallback) {
      const store = new ExtractionStore(db);
      await store.ensureTable();
      console.log(`   ✅ Conexão com banco funcionando`);
      console.log(`   🗄️  Tabela active_extractions verificada`);

      // Testar limpeza de extrações órfãs
      const cleanupResult = await store.cleanupStaleExtractions();
      console.log(`   🧹 Limpeza órfãs: ${cleanupResult.cleanedCount} extrações limpas`);

    } else {
      console.log(`   ⚠️  Usando fallback - banco não disponível`);
    }

  } catch (error) {
    console.error(`   ❌ Erro na conexão com banco: ${error.message}`);
  }

  // 5. Testar variáveis de ambiente críticas
  console.log('\n🌍 Testando variáveis de ambiente...');
  const criticalEnvVars = [
    'NODE_ENV',
    'HEADLESS',
    'PUPPETEER_EXECUTABLE_PATH',
    'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD'
  ];

  criticalEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.log(`   ✅ ${envVar}: ${value}`);
    } else {
      console.log(`   ⚠️  ${envVar}: não definida`);
    }
  });

  console.log('\n🎯 RESULTADO DO TESTE:');
  console.log(`   Plataforma: ${platformInfo.platform} ${platformInfo.arch}`);
  console.log(`   Sistema: ${platformInfo.isWindows ? 'Windows' : platformInfo.isLinux ? 'Linux' : 'Outros'}`);
  console.log(`   Memória disponível: ${platformInfo.freeMemory}`);
  console.log('   Status: ✅ Testes concluídos');

  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('   1. Execute este teste em produção (Linux)');
  console.log('   2. Compare resultados entre Windows e Linux');
  console.log('   3. Verifique se extrações funcionam em ambos');
  console.log('   4. Teste função "Pausar extração"');
  console.log('   5. Verifique limpeza automática de órfãs');
}

// Executar teste
testPlatformCompatibility().catch(error => {
  console.error('❌ ERRO NO TESTE:', error);
  process.exit(1);
});