# 🚀 EASYPANEL SETUP - APPS INDIVIDUAIS
## Guia passo-a-passo para Easypanel que aceita apenas Dockerfile

### 📋 **Ordem de Deployment (IMPORTANTE!)**

**⚠️ SEMPRE nesta ordem:**
1. 🗄️ **PostgreSQL** (banco de dados)
2. ⚡ **Redis** (cache)
3. 🔧 **API** (backend)
4. 📊 **PMS** (frontend principal)
5. 🏨 **Hotel App** (frontend hotel)
6. 🤖 **Automação** (frontend automação)
7. 📈 **Rate Shopper** (extrator)

---

## 🗄️ **1. PostgreSQL Database**

### No Easypanel:
1. **Templates** → **Database** → **PostgreSQL**
2. **App Name**: `osh-postgres`
3. **Database**: `osh_db_prod`
4. **Username**: `osh_user`
5. **Password**: `SuaSenhaSegura123!` ⚠️ **ANOTE ESTA SENHA!**
6. **Deploy**

**✅ Resultado**: PostgreSQL rodando na porta `5432`

---

## ⚡ **2. Redis Cache**  

### No Easypanel:
1. **Templates** → **Database** → **Redis**
2. **App Name**: `osh-redis`
3. **Password**: (deixe vazio ou configure)
4. **Deploy**

**✅ Resultado**: Redis rodando na porta `6379`

---

## 🔧 **3. API Backend**

### No Easypanel:
1. **Apps** → **Create App**
2. **App Type**: **Dockerfile**
3. **App Name**: `osh-api`
4. **Source**: **Upload** pasta `api/`

### Environment Variables:
```env
NODE_ENV=production
POSTGRES_HOST=osh-postgres.railway.internal
POSTGRES_PORT=5432
POSTGRES_USER=osh_user
POSTGRES_PASSWORD=SuaSenhaSegura123!
POSTGRES_DB=osh_db_prod
REDIS_HOST=osh-redis.railway.internal
REDIS_PORT=6379
JWT_SECRET=SeuJWTSecretMuitoSeguro456!
PORT=3001
CORS_ORIGIN=https://seu-dominio.com
```

### Port Settings:
- **Internal Port**: `3001`
- **External Port**: `3001` (ou automático)
- **Public**: ✅ Yes

**✅ Resultado**: API rodando em `https://osh-api.easypanel.host`

---

## 📊 **4. PMS Frontend**

### No Easypanel:
1. **Apps** → **Create App** 
2. **App Type**: **Dockerfile**
3. **App Name**: `osh-pms`
4. **Source**: **Upload** pasta `pms/`

### Environment Variables:
```env
VITE_API_URL=https://osh-api.easypanel.host/api
NODE_ENV=production
```

### Port Settings:
- **Internal Port**: `80`
- **External Port**: `80` (ou automático)
- **Public**: ✅ Yes

**✅ Resultado**: PMS rodando em `https://osh-pms.easypanel.host`

---

## 🏨 **5. Hotel App Frontend**

### No Easypanel:
1. **Apps** → **Create App**
2. **App Type**: **Dockerfile** 
3. **App Name**: `osh-hotel-app`
4. **Source**: **Upload** pasta `hotel-app/`

### Environment Variables:
```env
VITE_API_URL=https://osh-api.easypanel.host/api
NODE_ENV=production
```

### Port Settings:
- **Internal Port**: `80`
- **Public**: ✅ Yes

**✅ Resultado**: Hotel App rodando em `https://osh-hotel-app.easypanel.host`

---

## 🤖 **6. Automação Frontend**

### No Easypanel:
1. **Apps** → **Create App**
2. **App Type**: **Dockerfile**
3. **App Name**: `osh-automacao` 
4. **Source**: **Upload** pasta `automacao/`

### Environment Variables:
```env
VITE_API_URL=https://osh-api.easypanel.host/api
NODE_ENV=production
```

### Port Settings:
- **Internal Port**: `80`
- **Public**: ✅ Yes

**✅ Resultado**: Automação rodando em `https://osh-automacao.easypanel.host`

---

## 📈 **7. Rate Shopper (Opcional)**

### No Easypanel:
1. **Apps** → **Create App**
2. **App Type**: **Dockerfile**
3. **App Name**: `osh-rate-shopper`
4. **Source**: **Upload** pasta `extrator-rate-shopper/`

### Environment Variables:
```env
NODE_ENV=production
POSTGRES_HOST=osh-postgres.railway.internal
POSTGRES_PORT=5432
POSTGRES_USER=osh_user
POSTGRES_PASSWORD=SuaSenhaSegura123!
POSTGRES_DB=osh_db_prod
HEADLESS=true
```

### Port Settings:
- **Internal Port**: `3002`
- **Public**: ❌ No (serviço interno)

**✅ Resultado**: Rate Shopper rodando em background

---

## 🌐 **URLs Finais**

Após deployment completo:

- **📊 PMS**: `https://osh-pms.easypanel.host`
- **🏨 Hotel App**: `https://osh-hotel-app.easypanel.host`  
- **🤖 Automação**: `https://osh-automacao.easypanel.host`
- **🔧 API**: `https://osh-api.easypanel.host`

---

## 📦 **Preparar Uploads**

Execute este script para criar pastas separadas:

```bash
# No Windows
mkdir easypanel-uploads
mkdir easypanel-uploads\\api
mkdir easypanel-uploads\\pms
mkdir easypanel-uploads\\hotel-app
mkdir easypanel-uploads\\automacao
mkdir easypanel-uploads\\extrator-rate-shopper

# Copiar arquivos
xcopy /E api easypanel-uploads\\api
xcopy /E pms easypanel-uploads\\pms  
xcopy /E hotel-app easypanel-uploads\\hotel-app
xcopy /E automacao easypanel-uploads\\automacao
xcopy /E extrator-rate-shopper easypanel-uploads\\extrator-rate-shopper
```

---

## ⚠️ **IMPORTANTE - Network Communication**

No Easypanel, apps se comunicam via:
- **Internal URL**: `nome-do-app.railway.internal`
- **External URL**: `https://nome-do-app.easypanel.host`

**Para API calls entre apps**, use as URLs internas quando possível.

---

## 🔧 **Troubleshooting**

### App não inicia:
1. **Logs** → Verifique erros
2. **Environment** → Confirme variáveis
3. **Build** → Rebuild se necessário

### Database connection failed:
1. Confirme PostgreSQL está rodando
2. Verifique credenciais
3. Teste conexão no PostgreSQL app

### Frontend em branco:
1. Confirme `VITE_API_URL` correto
2. Verifique CORS na API
3. Inspect → Network → Verifique requests

---

## 🚀 **Deploy Rápido**

**Para facilitar**, criamos pastas separadas para cada app!