#!/usr/bin/env node

/**
 * Script de Sincronização Automática de Contatos
 *
 * Este script pode ser executado como cron job para sincronizar automaticamente
 * dados de contatos desatualizados com a Evolution API.
 *
 * Uso:
 * node scripts/auto-sync-contacts.js [options]
 *
 * Opções:
 * --days=N       Sincronizar contatos não atualizados há N dias (padrão: 7)
 * --max=N        Máximo de contatos para processar (padrão: 50)
 * --api-url=URL  URL base da API (padrão: http://localhost:3001)
 *
 * Exemplo de cron job (executar todo dia às 2h da manhã):
 * 0 2 * * * cd /path/to/project && node scripts/auto-sync-contacts.js >> logs/auto-sync.log 2>&1
 */

const axios = require('axios');

// Configurações padrão
const DEFAULT_CONFIG = {
  daysOld: 7,
  maxContacts: 50,
  apiUrl: 'http://localhost:3001'
};

// Processar argumentos da linha de comando
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  args.forEach(arg => {
    if (arg.startsWith('--days=')) {
      config.daysOld = parseInt(arg.split('=')[1]) || DEFAULT_CONFIG.daysOld;
    } else if (arg.startsWith('--max=')) {
      config.maxContacts = parseInt(arg.split('=')[1]) || DEFAULT_CONFIG.maxContacts;
    } else if (arg.startsWith('--api-url=')) {
      config.apiUrl = arg.split('=')[1] || DEFAULT_CONFIG.apiUrl;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Script de Sincronização Automática de Contatos

Uso: node scripts/auto-sync-contacts.js [options]

Opções:
  --days=N       Sincronizar contatos não atualizados há N dias (padrão: ${DEFAULT_CONFIG.daysOld})
  --max=N        Máximo de contatos para processar (padrão: ${DEFAULT_CONFIG.maxContacts})
  --api-url=URL  URL base da API (padrão: ${DEFAULT_CONFIG.apiUrl})
  --help, -h     Mostrar esta ajuda

Exemplos:
  node scripts/auto-sync-contacts.js
  node scripts/auto-sync-contacts.js --days=14 --max=100
  node scripts/auto-sync-contacts.js --api-url=https://api.exemplo.com

Cron job exemplo (todo dia às 2h):
  0 2 * * * cd /path/to/project && node scripts/auto-sync-contacts.js >> logs/auto-sync.log 2>&1
      `);
      process.exit(0);
    }
  });

  return config;
}

// Função principal
async function main() {
  const config = parseArgs();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] 🚀 Iniciando sincronização automática de contatos`);
  console.log(`[${timestamp}] ⚙️ Configuração:`, {
    daysOld: config.daysOld,
    maxContacts: config.maxContacts,
    apiUrl: config.apiUrl
  });

  try {
    // Verificar se a API está acessível
    console.log(`[${timestamp}] 🔍 Verificando conectividade com a API...`);

    const healthResponse = await axios.get(`${config.apiUrl}/api/health`, {
      timeout: 10000
    }).catch(() => null);

    if (!healthResponse) {
      console.log(`[${timestamp}] ❌ API não está acessível em ${config.apiUrl}`);
      console.log(`[${timestamp}] ℹ️  Certifique-se de que o servidor está rodando`);
      process.exit(1);
    }

    // Executar sincronização
    console.log(`[${timestamp}] 🔄 Executando sincronização automática...`);

    const syncResponse = await axios.post(`${config.apiUrl}/api/leads/auto-sync-outdated`, {
      daysOld: config.daysOld,
      maxContacts: config.maxContacts
    }, {
      timeout: 300000 // 5 minutos
    });

    if (syncResponse.data.success) {
      const { processed, updated, errors } = syncResponse.data.data;

      console.log(`[${timestamp}] ✅ Sincronização concluída com sucesso!`);
      console.log(`[${timestamp}] 📊 Resultados:`);
      console.log(`[${timestamp}]    - Contatos processados: ${processed}`);
      console.log(`[${timestamp}]    - Contatos atualizados: ${updated}`);
      console.log(`[${timestamp}]    - Erros: ${errors}`);

      if (errors > 0) {
        console.log(`[${timestamp}] ⚠️  ${errors} contatos tiveram erros durante a sincronização`);
      }

      // Mostrar detalhes se poucos contatos foram processados
      if (processed <= 10) {
        console.log(`[${timestamp}] 📋 Detalhes dos contatos processados:`);
        syncResponse.data.data.details.forEach((detail, index) => {
          const status = detail.error ? '❌' : (detail.nameUpdated || detail.pictureUpdated) ? '✅' : '🔄';
          console.log(`[${timestamp}]    ${index + 1}. ${status} ${detail.phone_number} (${detail.daysOld} dias) ${detail.cached ? '[cache]' : '[fresh]'}`);
          if (detail.error) {
            console.log(`[${timestamp}]       Erro: ${detail.error}`);
          } else if (detail.nameUpdated || detail.pictureUpdated) {
            const updates = [];
            if (detail.nameUpdated) updates.push('nome');
            if (detail.pictureUpdated) updates.push('foto');
            console.log(`[${timestamp}]       Atualizado: ${updates.join(', ')}`);
          }
        });
      }

      process.exit(0);
    } else {
      console.log(`[${timestamp}] ❌ Falha na sincronização: ${syncResponse.data.error || 'Erro desconhecido'}`);
      process.exit(1);
    }

  } catch (error) {
    console.log(`[${timestamp}] ❌ Erro durante a execução:`, error.message);

    if (error.response) {
      console.log(`[${timestamp}] 📡 Status HTTP: ${error.response.status}`);
      console.log(`[${timestamp}] 📄 Resposta: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log(`[${timestamp}] 🔌 Erro de conexão: não foi possível conectar à API`);
    }

    process.exit(1);
  }
}

// Tratamento de sinais para finalização limpa
process.on('SIGINT', () => {
  console.log(`\n[${new Date().toISOString()}] 🛑 Recebido SIGINT, finalizando...`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n[${new Date().toISOString()}] 🛑 Recebido SIGTERM, finalizando...`);
  process.exit(0);
});

// Executar script se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error(`[${new Date().toISOString()}] ❌ Erro não tratado:`, error);
    process.exit(1);
  });
}

module.exports = { main, parseArgs };