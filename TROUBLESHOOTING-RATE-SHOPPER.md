# 🔧 TROUBLESHOOTING - Rate Shopper Extrator

> **DOCUMENTAÇÃO CRÍTICA**: Este arquivo contém soluções para problemas RESOLVIDOS no sistema de extração de preços. **NÃO MODIFICAR** as configurações aqui documentadas sem análise prévia.

## 📋 HISTÓRICO DE PROBLEMAS RESOLVIDOS

### 🚨 PROBLEMA #1: "column hotel_uuid does not exist" (RESOLVIDO ✅)

**Data**: 17/09/2025
**Sintomas**:
- Erro HTTP 404 ao pausar extrações
- Log: `column "hotel_uuid" does not exist`
- Falha na limpeza de extrações órfãs

**CAUSA RAIZ**:
- Tabela `active_extractions` criada com estrutura antiga (usando `hotel_id`)
- Código atualizado para usar `hotel_uuid` mas migração não aplicada
- Incompatibilidade entre store e schema do banco

**SOLUÇÃO IMPLEMENTADA**:

1. **Migração da tabela `active_extractions`**:
```sql
-- Adicionar coluna hotel_uuid
ALTER TABLE active_extractions ADD COLUMN IF NOT EXISTS hotel_uuid VARCHAR(36);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_active_extractions_hotel_uuid ON active_extractions(hotel_uuid);

-- Adicionar constraint UNIQUE
ALTER TABLE active_extractions ADD CONSTRAINT active_extractions_hotel_uuid_key UNIQUE (hotel_uuid);
```

2. **Atualização do ExtractionStore** (`api/utils/extractionStore.js`):
- Método `setActiveExtraction()` agora salva tanto `hotel_id` quanto `hotel_uuid`
- Compatibilidade total entre IDs numéricos e UUIDs

3. **Correção das variáveis** (`api/routes/rateShopperExtraction.js`):
- `ex.hotelId` → `ex.hotelUuid` (linha 485)
- `activeHotelIds` → `activeHotelUuids` (linha 487 e 528)
- Lógica de comparação corrigida (linhas 491-502)

**RESULTADO**: ✅ Erro completamente eliminado, pausar extrações funciona corretamente.

---

### 🚨 PROBLEMA #2: Extrator não extrai preços (Windows) (RESOLVIDO ✅)

**Data**: 17/09/2025
**Sintomas**:
- Extrações iniciadas mas não processam dados
- Processo falha instantaneamente (338ms)
- Searches ficam órfãs com status RUNNING/PENDING
- Erro: `'HEADLESS' não é reconhecido como um comando interno`

**CAUSA RAIZ**:
- Scripts npm usando sintaxe Unix: `HEADLESS=true node script.js`
- Windows não reconhece essa sintaxe de variáveis de ambiente
- `cross-env` estava instalado mas não utilizado nos scripts

**SOLUÇÃO IMPLEMENTADA**:

**Arquivo**: `extrator-rate-shopper/package.json`

**ANTES** (INCORRETO):
```json
{
  "scripts": {
    "start:headless": "HEADLESS=true node src/index.js",
    "process-database:headless": "HEADLESS=true node src/database-processor.js",
    "process-database:saas": "HEADLESS=true node src/database-processor.js",
    "auto-processor:saas": "HEADLESS=true node src/auto-processor.js"
  }
}
```

**DEPOIS** (CORRETO):
```json
{
  "scripts": {
    "start:headless": "cross-env HEADLESS=true node src/index.js",
    "process-database:headless": "cross-env HEADLESS=true node src/database-processor.js",
    "process-database:saas": "cross-env HEADLESS=true node src/database-processor.js",
    "auto-processor:saas": "cross-env HEADLESS=true node src/auto-processor.js"
  }
}
```

**RESULTADO**: ✅ Extrator funciona perfeitamente:
- 4/4 datas processadas com sucesso
- 4 preços extraídos (R$ 201,60 cada)
- Duração: 31 segundos
- Status COMPLETED

---

## ⚠️ CONFIGURAÇÕES CRÍTICAS - NÃO MODIFICAR

### 1. **Scripts NPM no Extrator**
**NUNCA** remover o `cross-env` dos scripts que usam variáveis de ambiente:

```json
// ✅ CORRETO - MANTER SEMPRE
"process-database:saas": "cross-env HEADLESS=true node src/database-processor.js"

// ❌ INCORRETO - NUNCA USAR
"process-database:saas": "HEADLESS=true node src/database-processor.js"
```

### 2. **Schema da Tabela active_extractions**
**MANTER** sempre as duas colunas para compatibilidade:

```sql
-- ✅ ESTRUTURA CORRETA - NÃO MODIFICAR
CREATE TABLE active_extractions (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER,           -- Para compatibilidade
  hotel_uuid VARCHAR(36),     -- Chave primária lógica
  process_pid INTEGER,
  status VARCHAR(20),
  -- ... outras colunas
  UNIQUE(hotel_uuid)
);
```

### 3. **Rotas da API**
**MANTER** sempre a lógica de conversão UUID → ID:

```javascript
// ✅ PADRÃO CORRETO - NÃO MODIFICAR
const hotel = await Hotel.findByUuid(hotelUuid);
const hotelId = hotel ? hotel.id : null;

// Usar AMBOS nos inserts para compatibilidade
INSERT INTO active_extractions (hotel_id, hotel_uuid, ...)
```

---

## 🔍 COMANDOS DE DIAGNÓSTICO

### Verificar se extrator está funcionando:
```bash
cd extrator-rate-shopper
npm run process-database:saas
```

### Verificar tabela active_extractions:
```bash
cd api
node -e "
const db = require('./config/database');
(async () => {
  const result = await db.query('SELECT column_name FROM information_schema.columns WHERE table_name = \\'active_extractions\\'');
  console.log('Colunas:', result.rows.map(r => r.column_name));
  process.exit(0);
})();
"
```

### Verificar extrações ativas:
```bash
curl -s "http://localhost:3001/api/rate-shopper-extraction/active-extractions"
```

---

## 📚 DEPENDÊNCIAS CRÍTICAS

### No extrator-rate-shopper:
- `cross-env`: ^10.0.0 (ESSENCIAL para Windows)
- `puppeteer`: ^23.5.3
- `pg`: ^8.16.3

### Na API:
- PostgreSQL com extensões UUID
- Tabela `hotels` com campo `hotel_uuid`
- Tabela `active_extractions` com ambos `hotel_id` e `hotel_uuid`

---

## 🚨 CHECKLIST ANTES DE MODIFICAÇÕES

Antes de alterar qualquer código relacionado ao rate-shopper:

- [ ] ✅ Scripts npm usam `cross-env` para variáveis de ambiente?
- [ ] ✅ Tabela `active_extractions` tem ambas as colunas (`hotel_id` e `hotel_uuid`)?
- [ ] ✅ Código usa UUID para identificação de hotéis, mas mantém ID para compatibilidade?
- [ ] ✅ Testes rodando em ambiente Windows e Linux?

---

## 📞 CONTATO PARA DÚVIDAS

Se precisar modificar algo relacionado ao rate-shopper, **CONSULTE ESTE DOCUMENTO PRIMEIRO**.

**Última atualização**: 17/09/2025
**Status**: ✅ Todos os problemas documentados foram RESOLVIDOS
**Ambiente testado**: Windows 10, Node.js v22.17.0, PostgreSQL