# 🚀 Deploy Hotel OSH no EasyPanel

Este guia completo te ajudará a fazer o deploy do sistema Hotel OSH no EasyPanel usando Dockerfiles.

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Instalação do EasyPanel](#instalação-do-easypanel)
3. [Configuração dos Serviços](#configuração-dos-serviços)
4. [Deploy Passo a Passo](#deploy-passo-a-passo)
5. [Configurações Avançadas](#configurações-avançadas)
6. [Troubleshooting](#troubleshooting)

## 🔧 Pré-requisitos

### Servidor
- **Linux Server** (preferencialmente Ubuntu 20.04+)
- **Mínimo 2GB RAM** (recomendado 4GB+)
- **20GB+ de armazenamento**
- **Portas 80 e 443 livres**
- **Acesso root/sudo**

### Domínios
Você precisará configurar os seguintes subdomínios:
- `api.seu-dominio.com` → API Backend
- `app.seu-dominio.com` → Frontend Principal
- `pms.seu-dominio.com` → PMS (opcional)

### Repositório
- Código no **GitHub** (público ou privado)
- Branch principal: `main` ou `master`

## 🏗️ Instalação do EasyPanel

### 1. Conecte no seu servidor

```bash
ssh root@SEU-IP-DO-SERVIDOR
```

### 2. Instale o Docker

```bash
curl -sSL https://get.docker.com | sh
```

### 3. Instale o EasyPanel

```bash
docker run --rm -it \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel setup
```

### 4. Acesse o painel

1. Abra `http://SEU-IP-DO-SERVIDOR:3000`
2. Faça login com as credenciais criadas

## 🎯 Configuração dos Serviços

### 1. Criar Projeto

1. **Clique em "Create Project"**
2. **Nome**: `hotel-osh`
3. **Descrição**: "Sistema de Gestão de Hotéis OSH"

### 2. Configurar PostgreSQL

1. **Create Service** → **PostgreSQL**
2. **Nome**: `postgres`
3. **Version**: `15`
4. **Environment Variables**:
   ```env
   POSTGRES_DB=hotel_osh_db
   POSTGRES_USER=hotel_user
   POSTGRES_PASSWORD=SUA_SENHA_SEGURA_AQUI
   ```
5. **Mounts**:
   - Container Path: `/var/lib/postgresql/data`
   - Host Path: `/data/hotel-osh/postgres`

### 3. Configurar Redis (Opcional)

1. **Create Service** → **Redis**
2. **Nome**: `redis`
3. **Version**: `7-alpine`
4. **Mounts**:
   - Container Path: `/data`
   - Host Path: `/data/hotel-osh/redis`

## 🚀 Deploy Passo a Passo

### 1. Deploy da API Backend

1. **Create Service** → **App**
2. **Nome**: `api-backend`

#### Aba Source
- **Type**: GitHub
- **Repository**: `seu-usuario/hotel-osh`
- **Branch**: `main`

#### Aba Build
- **Type**: Dockerfile
- **File**: `api/Dockerfile`

#### Aba Environment
```env
NODE_ENV=production
PORT=3001

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=hotel_user
POSTGRES_PASSWORD=SUA_SENHA_SEGURA_AQUI
POSTGRES_DB=hotel_osh_db

# JWT
JWT_SECRET=sua-chave-jwt-super-segura-minimo-32-caracteres
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://app.seu-dominio.com,https://pms.seu-dominio.com

# Cache
CACHE_TTL_DEFAULT=3600
CACHE_TTL_USER=1800
CACHE_TTL_HOTEL=7200

# Pool de Conexões
PG_POOL_MIN=5
PG_POOL_MAX=20
PG_POOL_IDLE_TIMEOUT=30000
PG_POOL_CONNECTION_TIMEOUT=10000

# Logs
LOG_LEVEL=info

# Redis (se configurado)
REDIS_HOST=redis
REDIS_PORT=6379
```

#### Aba Domains
- **Domain**: `api.seu-dominio.com`
- **HTTPS**: ✅ Enabled
- **Proxy Port**: `3001`

#### Aba Mounts
```
Container Path: /app/uploads
Host Path: /data/hotel-osh/uploads

Container Path: /app/logs  
Host Path: /data/hotel-osh/logs
```

### 2. Deploy do Frontend

1. **Create Service** → **App**
2. **Nome**: `hotel-frontend`

#### Aba Source
- **Type**: GitHub
- **Repository**: `seu-usuario/hotel-osh`
- **Branch**: `main`

#### Aba Build
- **Type**: Dockerfile
- **File**: `hotel-app/Dockerfile`
- **Build Args**:
  ```
  VITE_API_URL=https://api.seu-dominio.com/api
  VITE_APP_NAME=Hotel OSH
  VITE_APP_VERSION=1.0.0
  ```

#### Aba Domains
- **Domain**: `app.seu-dominio.com`
- **HTTPS**: ✅ Enabled
- **Proxy Port**: `80`

### 3. Deploy do PMS (Opcional)

Repita o processo do Frontend, mas:
- **Nome**: `pms-frontend`
- **Dockerfile**: `pms/Dockerfile`
- **Domain**: `pms.seu-dominio.com`

## ⚙️ Configurações Avançadas

### Auto-Deploy do GitHub

1. **Na aba Deploy do serviço**
2. **Enable Auto Deploy**: ✅
3. **Copie o Webhook URL**
4. **No GitHub**: Settings → Webhooks → Add webhook
5. **Cole o Webhook URL**
6. **Content type**: `application/json`
7. **Events**: Push events

### Health Checks

Os Dockerfiles já incluem health checks:
- **API**: `GET /api/health`
- **Frontend**: `GET /health`

### Backup Automático

Configure backup do PostgreSQL:
1. **No serviço postgres**
2. **Aba Deploy**
3. **Add Cron Job**:
   ```bash
   # Todo dia às 2:00 AM
   0 2 * * * pg_dump -h postgres -U hotel_user hotel_osh_db > /data/hotel-osh/backups/backup-$(date +%Y%m%d_%H%M%S).sql
   ```

### SSL Certificados

EasyPanel gerencia automaticamente certificados SSL via Let's Encrypt.

## 📊 Monitoramento

### Logs
- **API**: `docker service logs hotel-osh_api-backend`
- **Frontend**: `docker service logs hotel-osh_hotel-frontend`

### Status dos Serviços
- Acesse o dashboard do EasyPanel
- Veja status, CPU, memória e tráfego

### Métricas
- Health checks automáticos
- Alertas por email (configurável)

## 🔧 Troubleshooting

### Problemas Comuns

#### ❌ Build Failed
**Erro**: Dockerfile build failed
**Solução**:
1. Verifique se o Dockerfile path está correto
2. Confira se todas as dependências estão no package.json
3. Veja os logs de build no EasyPanel

#### ❌ Database Connection Error
**Erro**: Cannot connect to database
**Solução**:
1. Verifique se o serviço PostgreSQL está rodando
2. Confira as variáveis de ambiente
3. Teste a conexão: `pg_isready -h postgres -p 5432`

#### ❌ Health Check Failed
**Erro**: Health check timeout
**Solução**:
1. Verifique se a aplicação está escutando na porta correta
2. Teste o endpoint manualmente
3. Aumente o timeout se necessário

#### ❌ CORS Error
**Erro**: CORS policy blocked
**Solução**:
1. Adicione o domínio frontend no `CORS_ORIGIN`
2. Verifique se HTTPS está funcionando
3. Confira se não há typos nos domínios

### Comandos Úteis

```bash
# Ver logs em tempo real
docker service logs -f hotel-osh_api-backend

# Resetar senha do EasyPanel
docker run --rm -it \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel reset-password

# Backup manual do PostgreSQL
docker exec -it $(docker ps -q -f name=postgres) \
  pg_dump -U hotel_user hotel_osh_db > backup.sql

# Restaurar backup
docker exec -i $(docker ps -q -f name=postgres) \
  psql -U hotel_user hotel_osh_db < backup.sql

# Verificar uso de recursos
docker stats

# Limpar containers órfãos
docker system prune -f
```

## 📝 Checklist de Deploy

### Antes do Deploy
- [ ] Servidor configurado com Docker
- [ ] EasyPanel instalado e funcionando
- [ ] Domínios apontando para o servidor
- [ ] Repositório GitHub configurado
- [ ] Variáveis de ambiente preparadas

### Durante o Deploy
- [ ] PostgreSQL criado e rodando
- [ ] API deployada com sucesso
- [ ] Frontend deployado com sucesso
- [ ] Health checks passando
- [ ] Certificados SSL ativos
- [ ] Auto-deploy configurado

### Depois do Deploy
- [ ] Banco de dados inicializado
- [ ] Dados de teste inseridos
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

## 🆘 Suporte

### Links Úteis
- **EasyPanel Docs**: https://easypanel.io/docs
- **Docker Docs**: https://docs.docker.com
- **PostgreSQL Docs**: https://postgresql.org/docs

### Contato
Em caso de problemas, verifique:
1. Logs do EasyPanel
2. Status dos serviços
3. Documentação oficial
4. GitHub Issues do projeto

---

## 🎉 Parabéns!

Se você chegou até aqui, seu sistema Hotel OSH deve estar rodando perfeitamente no EasyPanel! 

**URLs de acesso**:
- 🌐 **Frontend**: https://app.seu-dominio.com
- 🔧 **API**: https://api.seu-dominio.com
- 📊 **PMS**: https://pms.seu-dominio.com
- 🎛️ **EasyPanel**: http://SEU-IP:3000

**Próximos passos**:
1. Configure os dados do hotel
2. Adicione usuários admin
3. Configure integrações (WhatsApp, S3, etc.)
4. Realize testes completos
5. Configure backups regulares

Bom trabalho! 🚀