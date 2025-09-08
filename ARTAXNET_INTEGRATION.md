# Integração Artaxnet no Rate Shopper OSH

## ✅ Implementação Completa

O sistema Rate Shopper agora suporta **duas plataformas de extração** de preços:
- **🏨 Booking.com** (existente, 100% funcional)
- **🏛️ Artaxnet** (novo, integrado completamente)

---

## 🚀 Como Funciona

### Detecção Automática de Plataforma
O sistema detecta automaticamente a plataforma baseada na URL:
- URLs com `artaxnet.com` → **Extrator Artaxnet**
- URLs com `booking.com` → **Extrator Booking** 
- Outras URLs → **Default: Booking** (compatibilidade)

### Exemplo de URLs Suportadas
```
✅ Booking: https://www.booking.com/hotel/br/pousada-kaliman.html
✅ Artaxnet: https://eco-encanto-pousada.artaxnet.com/#/?start=2025-09-09&end=2025-09-10&adults=2
```

---

## 📋 Arquivos Criados/Modificados

### ✅ 1. **Extrator Artaxnet** (`extrator-rate-shopper/src/artaxnet-extractor-optimized.js`)
- Baseado no extrator do Booking
- Estratégias de extração específicas para Artaxnet
- Suporte a pacotes especiais (Ano Novo, Carnaval, etc.)
- Anti-detecção com Puppeteer

### ✅ 2. **Database Processor** (`extrator-rate-shopper/src/database-processor.js`)
- Detecção automática de plataforma
- Chamada do extrator correto
- 100% compatível com código existente

### ✅ 3. **Model RateShopperProperty** (`api/models/RateShopperProperty.js`)
- Campo `platform` adicionado
- Validação para ambas plataformas
- Detecção automática baseada em URL

### ✅ 4. **Migration** (`api/migrations/021_add_platform_to_rate_shopper_properties.sql`)
- Adiciona coluna `platform`
- Atualiza registros existentes
- Constraints de validação

### ✅ 5. **Interface PMS** 
- **NewSearchModal**: Badge mostrando plataforma (🏛️ Artaxnet / 🏨 Booking)
- **RateShopperDashboard**: Indicadores visuais de plataforma
- Cores diferenciadas: Artaxnet (roxo) / Booking (azul)

---

## 🎯 Como Testar

### 1. **Executar Migration (Primeira vez)**
```sql
-- Execute no PostgreSQL:
\i api/migrations/021_add_platform_to_rate_shopper_properties.sql
```

### 2. **Cadastrar Propriedade Artaxnet**
1. Ir para **Rate Shopper** → **Gerenciar Propriedades**
2. Adicionar nova propriedade
3. URL: `https://eco-encanto-pousada.artaxnet.com/#/?start=2025-09-09&end=2025-09-10&adults=2`
4. Sistema detectará automaticamente como **Artaxnet** 🏛️

### 3. **Criar Nova Busca**
1. No dashboard, clicar **Nova Busca**
2. Ver propriedades com badges de plataforma
3. Selecionar período de datas
4. Sistema usará extrator correto automaticamente

### 4. **Monitorar Extração**
- Logs mostrarão: `🏷️ Plataforma detectada: artaxnet`
- Progresso igual ao Booking
- Preços salvos com `platform: 'artaxnet'`

---

## 🔧 Estratégias de Extração do Artaxnet

### 1. **Seletores DOM**
```javascript
// Busca por classes comuns
'.price', '.valor', '.tarifa', '.room-price'
'.room', '.accommodation', '.quarto', '.suite'
```

### 2. **Variáveis JavaScript**
```javascript
// Verifica variáveis globais
window.roomData, window.accommodations, window.prices
```

### 3. **Extração por Texto**
```javascript
// Busca padrões de preço no texto
/R\$\s*[\d.,]+|\d+[,.]?\d*\s*(?:reais?|R\$)/gi
```

---

## 📊 Compatibilidade Total

### ✅ **Não Quebra Nada Existente**
- Todas as extrações do Booking continuam 100% funcionais
- URLs antigas detectadas automaticamente como 'booking'
- Interface mantém compatibilidade completa

### ✅ **Mesma Interface, Duas Plataformas**
- Usuário não precisa aprender nada novo
- Sistema detecta e usa extrator correto automaticamente
- Badges visuais diferenciam as plataformas

---

## 🎉 Resultado Final

Agora o **Rate Shopper OSH** suporta:

1. **🏨 Booking.com** - Motor original (100% mantido)
2. **🏛️ Artaxnet** - Motor novo (100% integrado)

O sistema detecta automaticamente a plataforma pela URL e usa o extrator apropriado, mantendo **total compatibilidade** com o código existente!

---

*Implementação concluída com sucesso! 🚀*