# 🚀 Sistema de Gerenciamento de Serviços OSH

## 📋 SCRIPTS DISPONÍVEIS

### **1. Monitor de Cache**
```bash
cd api && node scripts/monitor-cache-stats.js
```
**Função**: Monitora estatísticas do cache de contatos
**Frequência recomendada**: A cada hora durante horários de pico

### **2. Criar Tabela de Cache**
```bash
cd api && node scripts/create-cache-table.js
```
**Função**: Cria tabela contacts_cache no banco
**Uso**: Apenas uma vez na configuração inicial

---

## 📊 MÉTRICAS IMPORTANTES A MONITORAR

### **⚠️ ALERTAS CRÍTICOS:**

#### **Cache Hit Rate < 80%**
```bash
# Se o cache hit rate estiver baixo, investigar:
- Muitos contatos novos sendo buscados
- Cache expirando muito rápido
- Possível problema no sistema de cache
```

#### **Mais de 200 Requisições/Hora**
```bash
# Calcular requisições aproximadas:
# Polling conversas (30s) = 120 req/hora
# Polling mensagens (10s) = 360 req/hora para 1 conversa ativa
# Cache misses devem ser < 20 req/hora
```

#### **Contatos Problemáticos Detectados**
```bash
# O script detecta automaticamente:
- Números com muitos dígitos iguais
- Números de 15 dígitos (suspeitos)
- Padrões conhecidos problemáticos
```

---

## 🚨 COMANDOS DE EMERGÊNCIA

### **Parar Todos os Pollings (Emergência)**
Se detectar pico excessivo de requisições:

```bash
# 1. Parar automação
taskkill /f /im node.exe

# 2. Verificar processos
tasklist | findstr node

# 3. Verificar porta API
netstat -an | findstr :3001

# 4. Limpar cache local no navegador
# localStorage.clear() no console do browser
```

### **Verificar Rate Limits Evolution API**
```bash
# Testar se API está respondendo:
curl -X GET "http://localhost:3001/api/health"

# Verificar logs de erro 429:
grep -i "rate limit\|429" logs/*.log
```

---

## 📈 BOAS PRÁTICAS DE MONITORAMENTO

### **Horários de Pico (9h-18h)**
- Monitorar cache stats a cada hora
- Verificar logs de requisições
- Acompanhar performance da aplicação

### **Horários Normais (18h-9h)**
- Monitorar cache stats a cada 4 horas
- Executar limpeza de cache expirado
- Verificar integridade do banco

### **Finais de Semana**
- Monitoramento reduzido
- Backups e manutenção preventiva
- Análise de métricas da semana

---

## 🔧 CONFIGURAÇÕES DE ALERTA

### **Thresholds Recomendados:**

```javascript
// Métricas críticas:
const ALERT_THRESHOLDS = {
  cache_hit_rate_min: 80,        // Mínimo 80%
  requests_per_hour_max: 200,    // Máximo 200 req/h
  error_rate_max: 5,             // Máximo 5% de erros
  contacts_per_minute_max: 10,   // Máximo 10 contatos/min
  problematic_numbers_max: 5     // Máximo 5 números suspeitos/hora
};
```

### **Ações Automáticas Recomendadas:**

1. **Cache Hit < 80%**: Aumentar TTL do cache
2. **Req/Hour > 200**: Aumentar intervalos de polling
3. **Erros > 5%**: Investigar Evolution API
4. **Contatos > 10/min**: Ativar throttling mais agressivo

---

## 📝 LOG DE MONITORAMENTO

### **Registrar Diariamente:**
```
Data: ___/___/_____
Hora: ___:___

📊 Métricas:
- Cache Hit Rate: ____%
- Requisições/Hora: ____
- Contatos em Cache: ____
- Erros Detectados: ____

⚠️ Alertas:
□ Cache hit rate baixo
□ Pico de requisições
□ Números problemáticos
□ Erros de API

✅ Ações Tomadas:
- ________________________________
- ________________________________
- ________________________________

👤 Responsável: _______________
```

---

## 🎯 OBJETIVOS DE PERFORMANCE

### **Metas Diárias:**
- ✅ Cache hit rate > 90%
- ✅ < 150 requisições/hora total
- ✅ Zero números problemáticos detectados
- ✅ < 1% de erro rate

### **Metas Semanais:**
- ✅ Análise de tendências
- ✅ Otimização de TTL cache
- ✅ Review de padrões suspeitos
- ✅ Backup e cleanup de logs

### **Metas Mensais:**
- ✅ Relatório de performance
- ✅ Ajustes de thresholds
- ✅ Implementação de melhorias
- ✅ Treinamento da equipe

---

## 📞 CONTATOS DE EMERGÊNCIA

### **Em caso de Banimento:**
1. **Parar imediatamente** todas as requisições
2. **Documentar** horário e contexto
3. **Analisar logs** das últimas 24h
4. **Implementar correções** antes de reativação
5. **Testar em ambiente isolado**

### **Checklist Pós-Incidente:**
- [ ] Logs analisados e salvos
- [ ] Causa raiz identificada
- [ ] Correções implementadas
- [ ] Testes realizados
- [ ] Documentação atualizada
- [ ] Equipe notificada
- [ ] Prevenção implementada

---

**⚠️ LEMBRETE**: Este sistema de monitoramento é CRÍTICO para evitar banimentos. Nunca pular verificações durante horários de operação.