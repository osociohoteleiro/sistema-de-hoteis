# 🔄 Configuração de Sincronização Automática de Fotos de Perfil

Este documento explica como configurar e usar o sistema de sincronização automática de fotos de perfil e dados de contatos do WhatsApp.

## 📋 Visão Geral

O sistema implementado permite:

1. **Sincronização manual**: Via botão no modal de edição de lead
2. **Sincronização automática**: Via script executado periodicamente
3. **Priorização inteligente**: Banco principal → Cache → Evolution API
4. **Prevenção de banimento**: Rate limiting e delays automáticos

## 🚀 Como Usar

### 1. Sincronização Manual (Interface)

No modal de edição de qualquer lead:

1. Clique no botão "**Atualizar dados**" na seção azul
2. O sistema buscará automaticamente:
   - Nome atualizado do contato
   - Foto de perfil mais recente
3. Mostrará se houve mudanças ou se dados já estão atualizados
4. Respeita rate limiting (5 minutos entre atualizações do mesmo contato)

### 2. Sincronização Individual (API)

```bash
POST /api/leads/{workspaceUuid}/{leadId}/sync-whatsapp

# Exemplo:
curl -X POST http://localhost:3001/api/leads/workspace-123/lead-456/sync-whatsapp
```

### 3. Sincronização Automática em Lote (API)

```bash
POST /api/leads/auto-sync-outdated

# Parâmetros opcionais:
{
  "daysOld": 7,        // Contatos não sincronizados há X dias
  "maxContacts": 50    // Máximo de contatos por execução
}

# Exemplo:
curl -X POST http://localhost:3001/api/leads/auto-sync-outdated \
  -H "Content-Type: application/json" \
  -d '{"daysOld": 14, "maxContacts": 100}'
```

## 🤖 Script Automático

### Uso Básico

```bash
# Executar uma vez
node scripts/auto-sync-contacts.js

# Com opções personalizadas
node scripts/auto-sync-contacts.js --days=14 --max=100 --api-url=http://localhost:3001
```

### Opções Disponíveis

| Opção | Descrição | Padrão |
|-------|-----------|--------|
| `--days=N` | Sincronizar contatos não atualizados há N dias | 7 |
| `--max=N` | Máximo de contatos para processar | 50 |
| `--api-url=URL` | URL base da API | http://localhost:3001 |
| `--help` | Mostrar ajuda | - |

### Exemplos de Uso

```bash
# Sincronizar contatos antigos (mais de 14 dias)
node scripts/auto-sync-contacts.js --days=14

# Processar muitos contatos de uma vez
node scripts/auto-sync-contacts.js --max=200

# Usar API em produção
node scripts/auto-sync-contacts.js --api-url=https://api.meudominio.com
```

## ⏰ Configuração de Cron Job

### Linux/Mac (crontab)

```bash
# Editar crontab
crontab -e

# Adicionar linha para executar todo dia às 2h da manhã
0 2 * * * cd /path/to/projeto && node scripts/auto-sync-contacts.js >> logs/auto-sync.log 2>&1

# Ou executar duas vezes ao dia (2h e 14h)
0 2,14 * * * cd /path/to/projeto && node scripts/auto-sync-contacts.js >> logs/auto-sync.log 2>&1

# Executar apenas aos domingos (para sincronização semanal)
0 2 * * 0 cd /path/to/projeto && node scripts/auto-sync-contacts.js --days=7 --max=200 >> logs/auto-sync.log 2>&1
```

### Windows (Agendador de Tarefas)

1. Abrir "Agendador de Tarefas"
2. Criar tarefa básica:
   - Nome: "Sincronizar Contatos WhatsApp"
   - Acionador: Diário às 02:00
   - Ação: Iniciar programa
   - Programa: `node`
   - Argumentos: `scripts/auto-sync-contacts.js`
   - Iniciar em: `C:\path\to\projeto`

### Docker/Kubernetes

```yaml
# cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: sync-whatsapp-contacts
spec:
  schedule: "0 2 * * *"  # Todo dia às 2h
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: sync-contacts
            image: node:18
            command:
            - /bin/sh
            - -c
            - cd /app && node scripts/auto-sync-contacts.js --api-url=http://api-service:3001
            volumeMounts:
            - name: app-code
              mountPath: /app
          volumes:
          - name: app-code
            configMap:
              name: app-scripts
          restartPolicy: OnFailure
```

## 📊 Monitoramento e Logs

### Logs do Script

O script gera logs detalhados:

```bash
[2025-09-19T10:00:00.000Z] 🚀 Iniciando sincronização automática de contatos
[2025-09-19T10:00:00.000Z] ⚙️ Configuração: {"daysOld":7,"maxContacts":50,"apiUrl":"http://localhost:3001"}
[2025-09-19T10:00:01.000Z] 🔍 Verificando conectividade com a API...
[2025-09-19T10:00:01.000Z] 🔄 Executando sincronização automática...
[2025-09-19T10:00:05.000Z] ✅ Sincronização concluída com sucesso!
[2025-09-19T10:00:05.000Z] 📊 Resultados:
[2025-09-19T10:00:05.000Z]    - Contatos processados: 25
[2025-09-19T10:00:05.000Z]    - Contatos atualizados: 8
[2025-09-19T10:00:05.000Z]    - Erros: 0
```

### Verificação da API

```bash
# Verificar se API está funcionando
curl http://localhost:3001/api/health

# Resposta esperada:
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-09-19T10:00:00.000Z",
  "uptime": 12345,
  "version": "1.0.0"
}
```

### Estatísticas do Cache

```bash
curl http://localhost:3001/api/contacts-cache/stats

# Resposta:
{
  "success": true,
  "data": {
    "totalContacts": 1250,
    "validCache": 892,
    "expiredCache": 45,
    "hitRate": "71.4%"
  }
}
```

## 🛡️ Segurança e Rate Limiting

### Proteções Implementadas

1. **Rate Limiting por Contato**: 5 minutos entre atualizações
2. **Delays entre Requisições**: 2 segundos entre contatos
3. **Cache Inteligente**: TTL de 24 horas para contatos existentes
4. **Validação de Números**: Bloqueia números suspeitos
5. **Limite de Lote**: Máximo 200 contatos por execução

### Prevenção de Banimento

O sistema segue todas as diretrizes do documento `PREVENCAO-BANIMENTO-WHATSAPP.md`:

- ✅ Usa WebSocket sempre que possível
- ✅ Cache com TTL adequado
- ✅ Rate limiting em múltiplas camadas
- ✅ Delays automáticos entre requisições
- ✅ Validação de números problemáticos

## 🔧 Configurações Avançadas

### Ajuste de Performance

Para ambientes com muitos contatos:

```bash
# Processar mais contatos, mas com delay maior
node scripts/auto-sync-contacts.js --max=200 --days=14
```

### Configuração por Ambiente

```bash
# Desenvolvimento (mais agressivo)
node scripts/auto-sync-contacts.js --days=3 --max=20

# Produção (mais conservador)
node scripts/auto-sync-contacts.js --days=14 --max=50
```

### Logging Personalizado

```bash
# Redirecionar logs para arquivo específico
node scripts/auto-sync-contacts.js >> logs/sync-$(date +%Y%m%d).log 2>&1

# Rotacionar logs automaticamente (Linux)
0 2 * * * cd /path/to/projeto && node scripts/auto-sync-contacts.js >> logs/sync-$(date +\%Y\%m\%d).log 2>&1
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **API não acessível**:
   ```bash
   # Verificar se servidor está rodando
   curl http://localhost:3001/api/health
   ```

2. **Rate limiting ativo**:
   ```
   [2025-09-19T10:00:05.000Z] ⏳ Rate limited para 5511999999999, pulando
   ```
   - Normal, o sistema aguardará automaticamente

3. **Muitos erros**:
   ```
   [2025-09-19T10:00:05.000Z] ❌ Erro ao sincronizar 5511999999999: Número inválido
   ```
   - Verificar qualidade dos dados no banco

### Comandos de Diagnóstico

```bash
# Verificar logs do servidor
tail -f logs/api.log | grep -i sync

# Verificar estatísticas do cache
curl http://localhost:3001/api/contacts-cache/stats

# Limpar cache expirado manualmente
curl -X DELETE http://localhost:3001/api/contacts-cache/clean
```

## 📈 Métricas e Relatórios

### Acompanhar Efetividade

```sql
-- Contatos sincronizados recentemente
SELECT
  COUNT(*) as total_contatos,
  COUNT(CASE WHEN last_sync_at > NOW() - INTERVAL '7 days' THEN 1 END) as sincronizados_7_dias,
  COUNT(CASE WHEN profile_picture_url IS NOT NULL THEN 1 END) as com_foto
FROM whatsapp_contacts;

-- Contatos que precisam de sincronização
SELECT
  instance_name,
  COUNT(*) as contatos_desatualizados
FROM whatsapp_contacts
WHERE last_sync_at < NOW() - INTERVAL '7 days' OR last_sync_at IS NULL
GROUP BY instance_name
ORDER BY contatos_desatualizados DESC;
```

### Dashboard de Monitoramento

O componente `WebSocketStats` no chat ao vivo mostra:
- Status da conexão WebSocket
- Economia de requisições em tempo real
- Qualidade da conexão com Evolution API

---

## 📝 Resumo de Comandos

```bash
# Setup inicial (uma vez)
npm install

# Teste manual
node scripts/auto-sync-contacts.js --help

# Execução única
node scripts/auto-sync-contacts.js

# Cron job recomendado (todo dia às 2h)
0 2 * * * cd /path/to/projeto && node scripts/auto-sync-contacts.js >> logs/auto-sync.log 2>&1

# Verificar saúde da API
curl http://localhost:3001/api/health

# Estatísticas do cache
curl http://localhost:3001/api/contacts-cache/stats
```

Com essa configuração, o sistema manterá automaticamente as fotos de perfil e nomes dos contatos atualizados, respeitando todas as limitações para evitar banimento do WhatsApp.