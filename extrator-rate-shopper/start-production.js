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

// Garantir que variáveis de banco estejam definidas
const requiredEnvVars = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD'
];

console.log('🔧 Verificando variáveis de ambiente:');
let missingVars = [];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Não mostrar password completa
    const displayValue = varName.includes('PASSWORD') ?
      `${value.substring(0, 3)}***${value.substring(value.length - 3)}` :
      value;
    console.log(`   ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName}: NOT SET`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error('\n❌ ERRO: Variáveis de ambiente obrigatórias não definidas:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nDefina essas variáveis antes de executar o extrator.');
  process.exit(1);
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
  require('./src/auto-processor.js');
} catch (error) {
  console.error('💥 ERRO FATAL ao iniciar auto-processor:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}