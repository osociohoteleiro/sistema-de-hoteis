# Sistema de Chat ao Vivo - Documentação Técnica

## Visão Geral

O sistema de Chat ao Vivo é uma funcionalidade crítica do OSH que permite comunicação em tempo real via WhatsApp através da Evolution API, utilizando WebSocket para atualizações instantâneas no frontend.

## Arquitetura do Sistema

### Componentes Principais

1. **Evolution API**: Gerencia as instâncias do WhatsApp
2. **API Backend** (Node.js): Processa webhooks e gerencia WebSocket
3. **Frontend React**: Interface do Chat ao Vivo com conexão WebSocket
4. **PostgreSQL**: Armazena mensagens e configurações
5. **Cloudflare Tunnel**: Exposição local para desenvolvimento

### Fluxo de Dados

```
WhatsApp → Evolution API → Webhook → API Backend → WebSocket → Frontend React
```

## Estrutura dos Arquivos

### Backend (API)
- `api/routes/evolution-webhook.js` - Processa webhooks da Evolution
- `api/routes/bots.js` - API para listagem de bots/instâncias
- `api/models/Bot.js` - Modelo de dados dos bots
- `api/services/websocketService.js` - Gerenciamento do WebSocket servidor

### Frontend (Automação)
- `automacao/src/pages/WorkspaceChatAoVivo.jsx` - Interface principal do chat
- `automacao/src/services/websocketService.js` - Cliente WebSocket

## Pontos Críticos para Manutenção

### 1. Compatibilidade UUID vs ID Numérico

**CRÍTICO**: O sistema deve suportar tanto UUID quanto ID numérico para workspaces.

```javascript
// api/routes/bots.js - CORRETO
let isUuid = isNaN(parseInt(workspaceIdentifier)) || workspaceIdentifier.includes('-');
if (isUuid) {
  bots = await Bot.findByWorkspaceUuid(workspaceIdentifier, filters);
} else {
  let workspaceIdNum = parseInt(workspaceIdentifier);
  bots = await Bot.findByWorkspace(workspaceIdNum, filters);
}
```

### 2. Queries PostgreSQL

**CRÍTICO**: Usar formato PostgreSQL (`$1`, `$2`) ao invés de MySQL (`?`).

```javascript
// api/models/Bot.js - CORRETO
const query = `
  SELECT * FROM evolution_instances
  WHERE workspace_uuid = $1
  AND status = $2
`;
const result = await db.query(query, [workspaceUuid, 'active']);
```

### 3. WebSocket Event Listeners

**CRÍTICO**: Garantir que os listeners React sejam registrados corretamente.

```javascript
// automacao/src/services/websocketService.js
addEventListener(event, callback) {
  if (!this.eventListeners.has(event)) {
    this.eventListeners.set(event, new Set());
  }
  this.eventListeners.get(event).add(callback);
  return () => this.removeEventListener(event, callback);
}
```

### 4. Webhook da Evolution API

**FORMATO ESPERADO**:
```json
{
  "instance": "WHATSAPP-5511916264619",
  "event": "MESSAGES_UPSERT",
  "data": {
    "key": {
      "remoteJid": "5511916264619@s.whatsapp.net",
      "fromMe": false,
      "id": "message_id"
    },
    "message": {
      "conversation": "Texto da mensagem"
    },
    "messageTimestamp": 1632480000
  }
}
```

## Configuração Local com Cloudflare Tunnel

### Setup do Túnel
```bash
# Instalar cloudflared
# Executar túnel para expor localhost:3001
./cloudflared.exe tunnel --url localhost:3001
```

### URLs do Desenvolvimento
- **API Local**: `http://localhost:3001`
- **Frontend Automação**: `http://localhost:5174`
- **Chat ao Vivo**: `http://localhost:5174/workspace/{uuid}/chat-ao-vivo`
- **Cloudflare Tunnel**: `https://xxx.trycloudflare.com` (varia a cada execução)

### Configuração da Evolution
- **Webhook URL**: `https://xxx.trycloudflare.com/api/evolution-webhook`
- **Eventos**: `MESSAGES_UPSERT`, `MESSAGES_UPDATE`, `CONNECTION_UPDATE`

## Problemas Comuns e Soluções

### 1. WebSocket não conecta
**Causa**: URL incorreta ou serviço não rodando
**Solução**: Verificar se a API está rodando na porta 3001

### 2. Mensagens não aparecem em tempo real
**Causa**: Listeners React não registrados
**Solução**: Verificar se `addEventListener` está sendo chamado corretamente

### 3. Erro 400 na rota de bots
**Causa**: Rota esperando ID numérico mas recebendo UUID
**Solução**: Implementar detecção de UUID vs ID (já corrigido)

### 4. Queries PostgreSQL falham
**Causa**: Uso de sintaxe MySQL (`?`) ao invés de PostgreSQL (`$n`)
**Solução**: Converter todas as queries para formato PostgreSQL

## Testes e Debugging

### Endpoints de Teste
- `GET /api/evolution-webhook/test-new-message` - Testa evento WebSocket
- `GET /api/evolution-webhook/test-direct` - Testa comunicação direta
- `GET /api/evolution-webhook/stats` - Estatísticas do WebSocket

### Debug no Console
```javascript
// Verificar conexão WebSocket
websocketService.getStatus()

// Verificar listeners registrados
console.log(websocketService.eventListeners)

// Testar evento manualmente
websocketService.emitToListeners('new-message', { test: true })
```

## Checklist de Deploy

- [ ] Verificar se todas as queries usam sintaxe PostgreSQL
- [ ] Confirmar suporte a UUID e ID numérico nas rotas
- [ ] Testar WebSocket connection
- [ ] Configurar webhook da Evolution com URL correta
- [ ] Verificar logs de error no console
- [ ] Testar fluxo completo: WhatsApp → Evolution → Backend → Frontend

## Monitoramento

### Logs Importantes
- `📨 Webhook Evolution recebido` - Chegada de webhooks
- `✅ WebSocket conectado com sucesso` - Conexão estabelecida
- `🎧 REGISTRANDO LISTENER` - Registro de listeners React
- `🎯 EMITINDO EVENTO` - Emissão de eventos WebSocket

### Métricas de Saúde
- Conexões WebSocket ativas
- Taxa de entrega de mensagens
- Latência da comunicação
- Erro rate nos webhooks

## Correções Implementadas

### Data: 2025-09-20

**Problema**: Chat ao vivo não atualizava mensagens em tempo real

**Correções Aplicadas**:

1. **Rota de Bots (api/routes/bots.js)**:
   - Adicionada detecção automática entre UUID e ID numérico
   - Implementado fallback para ambos os formatos

2. **Modelo Bot (api/models/Bot.js)**:
   - Corrigidas queries PostgreSQL (de `?` para `$n`)
   - Adicionado método `findByWorkspaceUuid`

3. **WebSocket Service Frontend (automacao/src/services/websocketService.js)**:
   - Adicionados logs detalhados para debug
   - Melhorado sistema de emissão de eventos
   - Corrigido registro de listeners React

4. **Página Chat ao Vivo (automacao/src/pages/WorkspaceChatAoVivo.jsx)**:
   - Implementada lógica de fallback para adição forçada de mensagens
   - Melhorado gerenciamento de subscriptions WebSocket

**Resultado**: Sistema funcionando perfeitamente com atualizações em tempo real.

---

**Autor**: Claude Code
**Data**: Setembro 2025
**Versão**: 1.0