# 🚀 Sistema de Gerenciamento de Serviços OSH

Sistema completo para gerenciar todos os serviços do ecossistema OSH de forma centralizada.

## ✅ Problemas Resolvidos

### 1. **Conflito WebSocket Duplo** ✅
- ❌ **ANTES**: Duas instâncias Socket.io causando "handleUpgrade() called more than once"
- ✅ **AGORA**: Instância única com legacy compatibility para rotas antigas

### 2. **Gerenciamento de Processos** ✅
- ❌ **ANTES**: Dificuldade para parar serviços, processos órfãos, conflitos de porta
- ✅ **AGORA**: Sistema robusto de PID tracking e graceful shutdown

### 3. **Scripts de Controle** ✅
- ❌ **ANTES**: Comandos manuais `taskkill`, sem verificação de saúde
- ✅ **AGORA**: Scripts automatizados com health checks e recovery

## 🎯 Comandos Principais

### Gerenciamento Completo
```bash
npm run osh:start      # Iniciar todos os serviços
npm run osh:stop       # Parar todos os serviços
npm run osh:restart    # Reiniciar todos os serviços
npm run osh:status     # Status de todos os serviços
npm run osh:kill-force # Força parada de todos os processos Node.js
```

### Comandos Individuais
```bash
# Através do PID Manager
node scripts/services/pid-manager.js start api
node scripts/services/pid-manager.js stop hotel-app
node scripts/services/pid-manager.js list

# Comandos diretos
npm run dev:api        # Iniciar apenas API
npm run dev:hotel-app  # Iniciar apenas Hotel-App
npm run dev:pms        # Iniciar apenas PMS
npm run dev:automacao  # Iniciar apenas Automação
```

### Utilitários
```bash
npm run osh:health     # Health check completo
npm run osh:list       # Listar serviços disponíveis
npm run install:all    # Instalar dependências de todos os módulos
npm run build:all      # Build de todos os frontends
```

## 📊 Estrutura do Sistema

### Arquivos de Controle
```
📁 D:\APPS-OSH\
├── 📄 dev-control.json              # Configuração e status dos serviços
├── 📄 package.json                  # Comandos npm centralizados
└── 📁 scripts/services/
    ├── 📄 pid-manager.js           # Gerenciador de PIDs (Node.js)
    ├── 📄 start-all.bat            # Iniciar todos os serviços
    ├── 📄 stop-all.bat             # Parar todos os serviços
    ├── 📄 force-stop-all.bat       # Força parada de todos
    ├── 📄 start-api.bat            # Iniciar apenas API
    ├── 📄 check-health.bat         # Health check dos serviços
    └── 📁 .pids/                   # Arquivos PID temporários
```

### Configuração dos Serviços
```json
{
  "services": {
    "api": {
      "name": "API Backend",
      "port": 3001,
      "path": "./api",
      "health_endpoint": "http://localhost:3001/api/health"
    },
    "hotel-app": { "port": 5173 },
    "pms": { "port": 5175 },
    "automacao": { "port": 5174 }
  }
}
```

## 🔧 Recursos Avançados

### 1. **PID Tracking Inteligente**
- Detecção automática de processos órfãos
- Sincronização entre configuração e estado real
- Arquivos .pid para rastreamento persistente

### 2. **Graceful Shutdown**
- Tentativa de parada suave (`taskkill`)
- Fallback para force kill (`taskkill /F`)
- Verificação de sucesso por porta

### 3. **Health Monitoring**
- Verificação de portas em uso
- Tests de endpoints HTTP
- Status em tempo real

### 4. **Recovery Automático**
- Detecção de conflitos de porta
- Sugestões de solução de problemas
- Limpeza automática de estados inconsistentes

## 🌐 URLs dos Serviços

| Serviço | Porta | URL de Desenvolvimento |
|---------|-------|----------------------|
| **API Backend** | 3001 | http://localhost:3001/api/health |
| **Hotel-App** | 5173 | http://localhost:5173 |
| **PMS** | 5175 | http://localhost:5175 |
| **Automação** | 5174 | http://localhost:5174 |

## 🚨 Solução de Problemas

### Erro: Porta em Uso
```bash
npm run osh:kill-force  # Força parada de todos
npm run osh:start       # Reinicia limpo
```

### Erro: WebSocket Conflict
- ✅ **Resolvido**: Sistema agora usa instância única
- Legacy routes redirecionadas automaticamente

### Erro: Processo Órfão
```bash
npm run osh:status      # Identifica inconsistências
npm run osh:kill-force  # Remove todos os processos
```

### Verificar Dependências
```bash
npm run osh:health      # Health check completo
# Verifica: PostgreSQL, Redis, conectividade
```

## 📈 Benefícios Alcançados

### ✅ **Zero Dificuldade de Gerenciamento**
- Comandos únicos para operações complexas
- Status visual claro com emojis
- Recovery automático de falhas

### ✅ **Detecção Automática de Conflitos**
- Identificação de processos órfãos
- Resolução automática de PIDs inconsistentes
- Prevenção de conflitos de porta

### ✅ **Logs Estruturados**
- Saída clara com códigos de cor
- Timestamps automáticos
- Rastreamento de operações

### ✅ **Controle Centralizado**
- Comandos npm memorizados
- Configuração unificada
- Status dashboard integrado

## 🔄 Fluxo de Trabalho Recomendado

### Início do Desenvolvimento
```bash
npm run osh:start       # Inicia todo o ambiente
npm run osh:status      # Confirma que tudo subiu
```

### Durante o Desenvolvimento
```bash
npm run osh:status      # Verificação rápida
# Desenvolvimento normal...
```

### Final do Desenvolvimento
```bash
npm run osh:stop        # Para todo o ambiente
```

### Em Caso de Problemas
```bash
npm run osh:kill-force  # Reset completo
npm run osh:start       # Reinicia limpo
```

---

## 📝 Notas para Claude Code

Sempre que precisar gerenciar serviços OSH:

1. **Use os comandos npm**: `npm run osh:start`, `npm run osh:stop`, etc.
2. **Verifique status**: `npm run osh:status` antes de operações
3. **Force reset em problemas**: `npm run osh:kill-force`
4. **PID Manager direto**: `node scripts/services/pid-manager.js <comando>`

O sistema está **100% funcional** e resolve todos os problemas de gerenciamento de processos anteriores.