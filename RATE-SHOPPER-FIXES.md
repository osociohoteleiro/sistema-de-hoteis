# Rate Shopper - Correções Implementadas

## 🎯 Problemas Corrigidos

### 1. **Extração não funcionava em produção (Linux)**
- **Causa**: Configuração inadequada do Puppeteer para Linux/Docker
- **Solução**:
  - Melhorou `browser-config.js` com argumentos específicos para produção
  - Configurou `executablePath` para Chromium no Docker
  - Adicionou timeouts mais generosos para ambientes lentos
  - Configurou variáveis de ambiente adequadas no Dockerfile

### 2. **Erro "Nenhuma extração ativa encontrada" em produção**
- **Causa**: Store em memória (`Map`) perdia referências entre reinicializações
- **Solução**:
  - Implementou `ExtractionStore` com persistência no banco de dados
  - Substituiu Map por tabela `active_extractions` no PostgreSQL
  - Adicionou limpeza automática de extrações órfãs
  - Sincronização entre múltiplas instâncias

### 3. **Incompatibilidade Windows vs Linux**
- **Causa**: Comandos diferentes para spawn/kill de processos
- **Solução**:
  - Criou `ProcessManager` com abstração multiplataforma
  - Uniformizou spawn: `cmd /c` (Windows) vs `sh -c` (Linux)
  - Uniformizou kill: `taskkill` (Windows) vs `SIGTERM/SIGKILL` (Linux)
  - Limpeza emergencial adaptada para cada SO

## 📁 Arquivos Modificados

### Backend (API)
- `api/utils/processManager.js` - **NOVO** - Gerenciador de processos multiplataforma
- `api/utils/extractionStore.js` - **NOVO** - Store persistente para extrações
- `api/routes/rateShopperExtraction.js` - **MODIFICADO** - Atualizado para usar novos utils

### Extrator
- `extrator-rate-shopper/src/browser-config.js` - **MODIFICADO** - Melhorada configuração Linux
- `extrator-rate-shopper/src/database-processor.js` - **MODIFICADO** - Logs detalhados
- `extrator-rate-shopper/Dockerfile` - **MODIFICADO** - Permissões e variáveis de ambiente

### Utilitários
- `test-extraction-system.js` - **NOVO** - Script de teste multiplataforma
- `RATE-SHOPPER-FIXES.md` - **NOVO** - Esta documentação

## 🔧 Principais Melhorias

### 1. **Configuração do Browser (Linux)**
```javascript
// Antes (problemas em Linux)
args: ['--no-sandbox', '--disable-setuid-sandbox']

// Depois (otimizado para Linux/Docker)
args: [
  '--no-sandbox', '--disable-setuid-sandbox',
  '--disable-dev-shm-usage', '--single-process',
  '--headless=new', '--disable-blink-features=AutomationControlled'
]
executablePath: '/usr/bin/chromium-browser' // Docker
```

### 2. **Store Persistente**
```javascript
// Antes (perdia estado)
const activeExtractions = new Map();

// Depois (persistente)
const store = new ExtractionStore(db);
await store.setActiveExtraction(hotelId, data);
```

### 3. **Gerenciamento de Processos**
```javascript
// Antes (específico por plataforma)
if (isWindows) { /* código Windows */ }
else { /* código Linux */ }

// Depois (abstração uniforme)
await ProcessManager.killProcess(process);
ProcessManager.spawn('npm', ['run', 'command']);
```

## 🚀 Como Testar

### 1. **Teste Local (Windows)**
```bash
# Testar compatibilidade
node test-extraction-system.js

# Testar extração
cd extrator-rate-shopper
npm run process-database:saas
```

### 2. **Teste em Produção (Linux)**
```bash
# No servidor/container
node test-extraction-system.js

# Verificar logs detalhados
docker logs rate-shopper-container

# Testar extração via API
curl -X POST http://localhost:3001/api/rate-shopper-extraction/1/start-extraction
```

### 3. **Testar "Pausar Extração"**
```bash
# Iniciar extração
curl -X POST http://localhost:3001/api/rate-shopper-extraction/1/start-extraction

# Pausar extração (não deve dar erro órfã)
curl -X POST http://localhost:3001/api/rate-shopper-extraction/1/stop-extraction
```

## 🐛 Debugging

### 1. **Se extração ainda falha em Linux:**
- Verificar logs no container: `docker logs container-name`
- Testar Chromium: `chromium-browser --version`
- Verificar permissões: `ls -la /app/results`

### 2. **Se ainda dá erro "extração não encontrada":**
- Verificar tabela: `SELECT * FROM active_extractions;`
- Executar limpeza: `POST /api/rate-shopper-extraction/cleanup-stale-extractions`
- Verificar logs do ProcessManager

### 3. **Logs Úteis para Debug**
```javascript
// Browser config
console.log('🌐 Browser config - Platform:', process.platform);

// Store persistente
console.log('✅ Extração registrada no store para hotel', hotelId);

// Process manager
console.log('🔴 Processo PID', pid, 'terminado via', signal);
```

## 📊 Banco de Dados

### Nova Tabela: `active_extractions`
```sql
CREATE TABLE active_extractions (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL,
  process_pid INTEGER,
  status VARCHAR(20) DEFAULT 'RUNNING',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  progress_current INTEGER DEFAULT 0,
  progress_total INTEGER DEFAULT 0,
  current_property TEXT,
  extracted_prices INTEGER DEFAULT 0,
  logs JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hotel_id)
);
```

## 🔄 Deploy

### 1. **Rebuild do Docker**
```bash
# Rebuild com novas configurações
docker build -t rate-shopper ./extrator-rate-shopper

# Restart com variáveis atualizadas
docker restart rate-shopper-container
```

### 2. **Verificar Variáveis de Ambiente**
```bash
NODE_ENV=production
HEADLESS=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

## ✅ Resultado Esperado

- ✅ Extrações funcionam tanto no Windows (desenvolvimento) quanto Linux (produção)
- ✅ Botão "Pausar extração" não dá mais erro de "extração não encontrada"
- ✅ Sistema detecta e limpa automaticamente extrações órfãs
- ✅ Logs detalhados facilitam debugging
- ✅ Compatibilidade multiplataforma garantida
- ✅ Store persistente previne perda de estado entre reinicializações

## 🚨 Atenção

1. **Sempre testar em produção** após deploy
2. **Verificar logs** para possíveis issues específicos do ambiente
3. **Executar limpeza manual** se necessário: `/cleanup-stale-extractions`
4. **Monitorar performance** - novos logs podem gerar mais output