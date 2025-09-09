# Rate Shopper Scheduler

Sistema de agendamento automático para extração de preços do Booking.com.

## Recursos

- ⏰ Execuções agendadas via cron
- 🔄 Sistema de retry automático
- 📊 Logs detalhados de execução
- 🌐 Suporte completo ao Linux/VPS
- 🛠️ Interface CLI para gerenciamento
- ⚙️ Configuração flexível via JSON

## Instalação

```bash
cd extrator-rate-shopper
npm install
```

## Comandos CLI

### Iniciar o agendador
```bash
npm run scheduler:start
```

### Ver status
```bash
npm run scheduler:status
```

### Executar extração manual
```bash
npm run scheduler:run
```

### Ver configuração
```bash
npm run scheduler:config
```

### Ver logs
```bash
npm run scheduler:logs
```

### Help
```bash
npm run scheduler
```

## Configuração

O arquivo `src/scheduler-config.json` é criado automaticamente na primeira execução com configuração padrão:

```json
{
  "enabled": true,
  "timezone": "America/Sao_Paulo",
  "schedules": [
    {
      "name": "daily_morning_extraction",
      "enabled": true,
      "cron": "0 8 * * *",
      "description": "Extração diária matinal",
      "properties": "all"
    },
    {
      "name": "weekly_full_analysis",
      "enabled": false,
      "cron": "0 2 * * 1",
      "description": "Análise completa semanal",
      "properties": "all"
    }
  ]
}
```

## Padrões Cron

- `0 8 * * *` - Todos os dias às 8h
- `0 2 * * 1` - Segundas-feiras às 2h
- `*/30 * * * *` - A cada 30 minutos
- `0 */4 * * *` - A cada 4 horas

## Logs

Os logs são salvos em:
- `logs/rate-shopper-YYYY-MM-DD.log`

Formato JSON estruturado para facilitar análise e monitoramento.

## Execução em Produção

### Como Daemon (Linux)
```bash
nohup npm run scheduler:start > scheduler.log 2>&1 &
```

### Com PM2 (Recomendado)
```bash
npm install -g pm2
pm2 start "npm run scheduler:start" --name "rate-shopper-scheduler"
pm2 save
pm2 startup
```

### Verificar Processo
```bash
pm2 status
pm2 logs rate-shopper-scheduler
pm2 restart rate-shopper-scheduler
```

## Monitoramento

- Logs automáticos de início/fim de execução
- Heartbeat a cada 5 minutos
- Contadores de sucesso/erro por propriedade
- Tracking de duração de execuções
- Sistema de retry com log detalhado

## Troubleshooting

### Scheduler não inicia
```bash
# Verificar configuração
npm run scheduler:config

# Ver logs
npm run scheduler:logs
```

### Execução manual falha
```bash
# Testar extração simples
npm run start:headless

# Ver logs detalhados
npm run scheduler:logs -n 100
```

### Problemas de memória no VPS
- O sistema usa configuração otimizada para Linux
- Browser em modo headless
- Recursos bloqueados (imagens, CSS, fonts)
- User-agent rotativo para evitar bloqueios