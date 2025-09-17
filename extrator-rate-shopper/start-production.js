#!/usr/bin/env node

/**
 * Script de inicialização para produção
 * Garante que todas as variáveis de ambiente estejam configuradas
 * e inicia o auto-processor corretamente
 */

console.log('🚀 Rate Shopper Extrator - Production Startup');
console.log('=' * 50);

// Configurar variáveis de ambiente para produção
process.env.NODE_ENV = 'production';
process.env.HEADLESS = 'true';

// Verificar variáveis de banco (OPCIONAIS - adaptativo para produção sem config explícita)
const preferredEnvVars = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD'
];

console.log('🔧 Verificando variáveis de ambiente (opcionais):');
let missingVars = [];
let hasAnyDbVar = false;

preferredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    hasAnyDbVar = true;
    // Não mostrar password completa
    const displayValue = varName.includes('PASSWORD') ?
      `${value.substring(0, 3)}***${value.substring(value.length - 3)}` :
      value;
    console.log(`   ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`   ⚠️  ${varName}: NOT SET (usando detecção automática)`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  if (hasAnyDbVar) {
    console.log('\n⚠️  AVISO: Algumas variáveis de banco não definidas, mas continuando...');
    console.log('   O extrator tentará usar detecção automática de ambiente.');
  } else {
    console.log('\n🔄 INFO: Nenhuma variável de banco explícita encontrada.');
    console.log('   Modo adaptativo: usando detecção automática de ambiente.');
    console.log('   Isso é normal em produções como EasyPanel que fazem linking automático.');
  }
}

// Verificar Chromium
console.log('\n🖥️  Verificando Chromium:');
try {
  const { execSync } = require('child_process');
  const version = execSync('chromium-browser --version', { encoding: 'utf8' });
  console.log(`   ✅ Chromium disponível: ${version.trim()}`);
} catch (error) {
  console.log(`   ⚠️  Chromium check failed: ${error.message}`);
  console.log('   Continuando mesmo assim (pode funcionar com --no-sandbox)');
}

console.log('\n📊 Informações do sistema:');
console.log(`   Platform: ${process.platform}`);
console.log(`   Node version: ${process.version}`);
console.log(`   PID: ${process.pid}`);
console.log(`   Working directory: ${process.cwd()}`);

console.log('\n🎯 Iniciando auto-processor...');
console.log('');

// Iniciar auto-processor
try {
  const AutoProcessor = require('./src/auto-processor.js');

  // Configurar intervalo baseado no ambiente
  const isProduction = process.env.NODE_ENV === 'production';
  const interval = parseInt(process.env.AUTO_PROCESSOR_INTERVAL) || (isProduction ? 60 : 30);

  console.log(`⏰ Configurando intervalo: ${interval}s (${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'})`);

  // Instanciar e iniciar auto-processor
  const autoProcessor = new AutoProcessor(interval);

  // Iniciar o auto-processador
  autoProcessor.start().then(success => {
    if (!success) {
      console.error('💥 Falha ao iniciar auto-processador');
      process.exit(1);
    }

    console.log(`🚀 Auto-processador iniciado com sucesso em modo ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
    console.log(`⏰ Intervalo configurado: ${interval}s`);
    console.log(`🔄 Processamento automático ativo`);

  }).catch((error) => {
    console.error('💥 Erro fatal no auto-processador:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });

  // Tratamento de sinais para parar graciosamente
  let isShuttingDown = false;

  const gracefulShutdown = (signal) => {
    if (isShuttingDown) {
      console.log(`\n🔴 Forçando saída (${signal})...`);
      process.exit(1);
    }

    isShuttingDown = true;
    console.log(`\n🛑 Recebido ${signal}, parando auto-processador graciosamente...`);

    autoProcessor.stop();

    setTimeout(() => {
      console.log('✅ Auto-processador parado. Saindo...');
      process.exit(0);
    }, 2000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

} catch (error) {
  console.error('💥 ERRO FATAL ao iniciar auto-processor:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}