# 🚀 PostgreSQL + Redis para OSH Hotel System

Setup completo de PostgreSQL + Redis para substituir o MariaDB atual com maior escalabilidade e performance.

## 📋 O que foi implementado

### ✅ Infraestrutura
- **Docker Compose** com PostgreSQL 15 + Redis 7
- **pgAdmin** para gerenciar PostgreSQL (porta 8080)
- **Redis Commander** para gerenciar Redis (porta 8081)
- **Configurações otimizadas** para desenvolvimento

### ✅ Backend
- **Adaptador PostgreSQL** com pool de conexões
- **Sistema de Cache Redis** com TTL inteligente
- **Service de Cache** com métodos específicos por entidade
- **Migrations SQL** com schema completo
- **Script de teste** de conectividade

## 🏁 Como iniciar

### 1. Iniciar os bancos de dados
```bash
# Windows - usar o arquivo .bat
start-postgres-redis.bat

# Linux/Mac - usar docker-compose
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo
copy api\.env.postgres api\.env

# Editar .env conforme necessário
```

### 3. Testar conectividade
```bash
cd api
node test-databases.js
```

## 🔗 URLs de acesso

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **pgAdmin**: http://localhost:8080
  - Email: `admin@osh.com`
  - Senha: `osh_admin_2024`
- **Redis Commander**: http://localhost:8081

## 📊 Schema PostgreSQL

### Principais tabelas criadas:
- `users` - Usuários do sistema
- `hotels` - Hotéis
- `configs` - Configurações por hotel
- `workspaces` - Áreas de trabalho
- `bots` - Bots de automação
- `flows` - Fluxos de trabalho
- `rate_shopper_*` - Dados do Rate Shopper

### Recursos avançados:
- **UUIDs** como chaves primárias
- **JSONB** para dados flexíveis
- **Triggers** para atualização automática
- **Índices otimizados** para consultas frequentes
- **Extensões** pg_trgm para busca textual

## 🚀 Sistema de Cache Redis

### Cache por entidade:
```javascript
// Cache de usuários (30min TTL)
await cacheService.setUser(userId, userData);
const user = await cacheService.getUser(userId);

// Cache de hotéis (2h TTL)  
await cacheService.setHotel(hotelId, hotelData);

// Cache de sessões (24h TTL)
await cacheService.setSession(sessionId, sessionData);
```

### Cache de rotas automático:
```javascript
// Middleware para cache automático
app.get('/api/users', cacheService.cacheMiddleware(1800), getUsersHandler);
```

### Invalidação inteligente:
```javascript
// Invalidar cache relacionado a um usuário
await cacheService.invalidateUser(userId);

// Invalidar cache por padrão
await cacheService.invalidatePattern('osh:user:*');
```

## ⚡ Performance vs MariaDB

### PostgreSQL advantages:
- **Pool maior**: 50 conexões vs 15
- **JSONB nativo** para dados flexíveis
- **Particionamento** automático por hotel
- **Full-text search** nativo
- **Melhor otimizador** de queries

### Redis advantages:
- **Cache distribuído** reduz carga no banco
- **TTL automático** por tipo de dado
- **Invalidação inteligente** por padrão
- **Sub-second response** para dados cacheados

## 🔄 Migração gradual

Para migrar gradualmente do MariaDB:

1. **Manter ambos** bancos rodando
2. **Novos módulos** usam PostgreSQL
3. **Módulos críticos** migrar primeiro
4. **Sincronizar dados** via API
5. **Deprecar MariaDB** quando estável

## 📈 Monitoramento

### pgAdmin queries úteis:
```sql
-- Conexões ativas
SELECT count(*) FROM pg_stat_activity;

-- Queries mais lentas
SELECT query, mean_time, calls FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

### Redis stats:
```bash
# Via Redis Commander ou CLI
INFO memory
INFO stats
```

## 🛠️ Troubleshooting

### PostgreSQL não conecta:
1. Verificar se Docker está rodando
2. Verificar portas disponíveis
3. Checar logs: `docker-compose logs postgres`

### Redis não conecta:
1. Verificar configuração redis.conf
2. Checar logs: `docker-compose logs redis`

### Performance lenta:
1. Verificar índices nas queries
2. Analisar cache hit rate
3. Ajustar pool de conexões

---

**🎯 Resultado esperado**: 3-5x melhor performance com PostgreSQL + Redis vs MariaDB puro.