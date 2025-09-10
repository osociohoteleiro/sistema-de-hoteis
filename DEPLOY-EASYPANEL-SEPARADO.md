# Deploy EasyPanel - Serviços Separados

## Configuração de Múltiplos Serviços Independentes

No EasyPanel, você pode configurar cada componente como um serviço separado, permitindo controle independente (iniciar/pausar/escalar cada um).

### 📋 Estrutura dos Serviços

```
🗂️ Projeto: hotel-osh-system
├── 🔧 api-backend          (Node.js API)
├── 🖥️ hotel-app-frontend   (React Hotel App)
├── 🖥️ pms-frontend         (React PMS)
├── 🖥️ automacao-frontend   (React Automação)
├── ⚙️ extrator-service     (Rate Shopper)
├── 🐘 postgresql-db        (Banco de dados)
└── 🔴 redis-cache          (Cache)
```

## 🚀 Como Configurar no EasyPanel

### 1. API Backend Service
```yaml
Nome: api-backend
Tipo: App
Repositório: osociohoteleiro/sistema-de-hoteis
Branch: master
Dockerfile: ./api/Dockerfile
Build Context: ./api
Porta: 3001
Domínio: api.seu-dominio.com
```

**Variáveis de Ambiente:**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:password@postgresql-db:5432/osh_hotels
REDIS_URL=redis://redis-cache:6379
JWT_SECRET=seu_jwt_secret_aqui
```

### 2. Hotel App Frontend
```yaml
Nome: hotel-app-frontend
Tipo: App
Repositório: osociohoteleiro/sistema-de-hoteis
Branch: master
Dockerfile: ./hotel-app/Dockerfile
Build Context: ./hotel-app
Porta: 80
Domínio: app.seu-dominio.com
```

**Build Args:**
```bash
VITE_API_URL=https://api.seu-dominio.com/api
VITE_APP_NAME=Hotel OSH
```

### 3. PMS Frontend
```yaml
Nome: pms-frontend
Tipo: App
Repositório: osociohoteleiro/sistema-de-hoteis
Branch: master
Dockerfile: ./pms/Dockerfile
Build Context: ./pms
Porta: 80
Domínio: pms.seu-dominio.com
```

**Build Args:**
```bash
VITE_API_URL=https://api.seu-dominio.com/api
```

### 4. Automação Frontend
```yaml
Nome: automacao-frontend
Tipo: App
Repositório: osociohoteleiro/sistema-de-hoteis
Branch: master
Dockerfile: ./automacao/Dockerfile
Build Context: ./automacao
Porta: 80
Domínio: automacao.seu-dominio.com
```

**Build Args:**
```bash
VITE_API_URL=https://api.seu-dominio.com/api
```

### 5. Extrator Rate Shopper
```yaml
Nome: extrator-service
Tipo: App
Repositório: osociohoteleiro/sistema-de-hoteis
Branch: master
Dockerfile: ./extrator-rate-shopper/Dockerfile
Build Context: ./extrator-rate-shopper
Porta: 3002
Domínio: extrator.seu-dominio.com (opcional)
```

### 6. PostgreSQL Database
```yaml
Nome: postgresql-db
Tipo: PostgreSQL
Versão: 15
Database: osh_hotels
Username: postgres
Password: [gerar senha segura]
Porta: 5432
Volume: /data/postgresql
```

### 7. Redis Cache
```yaml
Nome: redis-cache
Tipo: Redis
Versão: 7-alpine
Porta: 6379
Volume: /data/redis
```

## 🎯 Vantagens desta Configuração

### ✅ Controle Independente
- Iniciar/pausar cada serviço individualmente
- Escalar apenas os serviços que precisam
- Deploy independente de cada componente

### ✅ Monitoramento Granular
- Logs separados por serviço
- Métricas individuais
- Health checks específicos

### ✅ Recursos Otimizados
- CPU/RAM ajustados por necessidade
- Frontends: 256MB RAM, 0.1 CPU
- API: 512MB RAM, 0.5 CPU
- Extrator: 256MB RAM, 0.2 CPU

### ✅ Deploy Inteligente
- Só rebuilda o que mudou
- Cache de layers independente
- Rollback por serviço

## 📝 Passo a Passo no EasyPanel

### 1. Criar Projeto
1. Acesse EasyPanel
2. Criar novo projeto: `hotel-osh-system`

### 2. Adicionar Database
1. Add Service → Database → PostgreSQL
2. Nome: `postgresql-db`
3. Configurar conforme acima

### 3. Adicionar Redis
1. Add Service → Database → Redis
2. Nome: `redis-cache`
3. Configurar conforme acima

### 4. Adicionar API Backend
1. Add Service → App
2. Nome: `api-backend`
3. GitHub: `osociohoteleiro/sistema-de-hoteis`
4. Build Context: `./api`
5. Dockerfile: `./api/Dockerfile`
6. Adicionar variáveis de ambiente

### 5. Adicionar Frontends (repetir para cada)
1. Add Service → App
2. Configurar conforme especificações acima
3. Build Context específico para cada

## 🔧 Configurações Avançadas

### Health Checks
```yaml
# Para API
Health Check Path: /api/health
Health Check Interval: 30s

# Para Frontends
Health Check Path: /
Health Check Interval: 30s
```

### Auto Deploy
```yaml
Auto Deploy: true
Branch: master
Deploy on Push: true
```

### Restart Policy
```yaml
Restart Policy: always
Max Restarts: 5
```

## 🌐 Dominios Sugeridos

```
api.hotel-osh.com         → api-backend
app.hotel-osh.com         → hotel-app-frontend
pms.hotel-osh.com         → pms-frontend
automacao.hotel-osh.com   → automacao-frontend
extrator.hotel-osh.com    → extrator-service
```

## 🚨 Importante

1. **Ordem de Deploy**: Sempre deploye na ordem:
   - PostgreSQL → Redis → API → Frontends

2. **Dependências**: Configure os frontends para aguardar a API estar online

3. **Secrets**: Use o sistema de secrets do EasyPanel para JWT_SECRET e senhas

4. **Backup**: Configure backup automático do PostgreSQL

## 💡 Dicas

- Use tags específicas para production
- Configure alertas para cada serviço
- Monitore uso de recursos individualmente
- Configure SSL automático para todos os domínios