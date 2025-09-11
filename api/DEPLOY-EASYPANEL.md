# 🚀 Deploy da API no EasyPanel

## ✅ Arquivos Necessários

- `Dockerfile` - Configurado e testado
- `.dockerignore` - Otimizado para produção
- `.env.production` - Variáveis de ambiente
- `package.json` - Dependências da aplicação

## 📋 Passos para Deploy

### 1. Fazer Build da Imagem Docker

```bash
cd api
docker build -t osh-api:latest .
```

### 2. Configurar no EasyPanel

#### 2.1 Substituir a API Atual

1. Acesse o EasyPanel: https://osh-sistemas-api-backend.d32pnk.easypanel.host
2. Vá para o serviço da API atual
3. Pare o serviço atual (se estiver rodando)

#### 2.2 Configurar Novo Deploy

**Opção A: Deploy via Git (Recomendado)**
1. Configure o repositório Git no EasyPanel
2. Branch: `master` 
3. Build Path: `/api`
4. Dockerfile Path: `Dockerfile`

**Opção B: Upload Manual**
1. Faça upload dos arquivos da pasta `api/`
2. Configure o Dockerfile

### 3. Variáveis de Ambiente

Configure as seguintes variáveis no EasyPanel:

```env
NODE_ENV=production
DB_MODE=postgres

# PostgreSQL - Ajustar conforme sua configuração
DATABASE_URL=postgresql://postgres:SUA_SENHA@postgresql-db:5432/osh_hotels
POSTGRES_HOST=postgresql-db
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SUA_SENHA
POSTGRES_DB=osh_hotels

# JWT
JWT_SECRET=osh_jwt_secret_production_2024_hotel_system
JWT_EXPIRES_IN=24h

# API
PORT=3001
API_URL=http://localhost:3001

# CORS - Ajustar conforme seus domínios
CORS_ORIGINS=https://osh-sistemas-pms-frontend.d32pnk.easypanel.host,https://osh-sistemas-hotel-app-frontend.d32pnk.easypanel.host,https://pms.osociohoteleiro.com.br
```

### 4. Configurações de Rede

- **Porta Interna**: 3001 (conforme Dockerfile)
- **Porta Externa**: 80 ou 443 (configurar no EasyPanel)
- **Health Check**: `/api/health`

### 5. Verificação Pós-Deploy

Após o deploy, verifique:

#### 5.1 Health Check
```bash
curl https://osh-sistemas-api-backend.d32pnk.easypanel.host/api/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-10T...",
  "database": "connected",
  "environment": "production"
}
```

#### 5.2 Endpoints Principais
```bash
# Verificar auth
curl -X POST https://osh-sistemas-api-backend.d32pnk.easypanel.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Verificar hotels
curl https://osh-sistemas-api-backend.d32pnk.easypanel.host/api/hotels
```

## 🔧 Troubleshooting

### Erro de Conexão com Banco
- Verificar variáveis `POSTGRES_*`
- Certificar que o banco PostgreSQL está rodando
- Verificar rede entre containers

### Erro 500 Internal Server Error  
- Verificar logs da aplicação
- Verificar se migrations foram aplicadas
- Certificar que `.env.production` está sendo carregado

### Problema com CORS
- Verificar `CORS_ORIGINS`
- Adicionar domínios corretos dos frontends

## 📊 Logs

Para visualizar logs:
```bash
# No EasyPanel, acesse a seção de Logs do serviço
# Ou via Docker:
docker logs CONTAINER_ID -f
```

## 🎯 Resultado Esperado

Após o deploy bem-sucedido:
- ✅ API respondendo em https://osh-sistemas-api-backend.d32pnk.easypanel.host/api/health
- ✅ Banco de dados conectado
- ✅ Endpoints funcionando corretamente
- ✅ CORS configurado para os frontends
- ✅ Health check retornando status healthy

---

## 🆘 Suporte

Se algo der errado:
1. Verificar logs da aplicação
2. Testar health check
3. Verificar conectividade com banco
4. Confirmar variáveis de ambiente