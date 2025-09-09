# 🚀 GUIA DE DEPLOYMENT - OSH SYSTEM NO EASYPANEL

Este guia explica como fazer deploy do sistema OSH completo no Easypanel com apenas alguns cliques!

## 📋 Pré-requisitos

- ✅ VPS com Docker instalado
- ✅ Easypanel configurado na VPS
- ✅ Domínio configurado (opcional, mas recomendado)
- ✅ SSH/Git access à VPS

## 🎯 Método Easypanel (Recomendado)

### Passo 1: Preparar o Projeto

1. **Configure as variáveis de produção:**
   ```bash
   cp .env.production .env.production.local
   # Edite o arquivo e altere TODAS as senhas padrão!
   ```

2. **Arquivos importantes criados:**
   - ✅ `docker-compose.production.yml` - Configuração completa
   - ✅ `Dockerfile` em cada aplicação
   - ✅ `.env.production` - Template de variáveis
   - ✅ `build.sh` - Script de build
   - ✅ `deploy.sh` - Script de deploy
   - ✅ `nginx/nginx.conf` - Proxy reverso

### Passo 2: Upload no Easypanel

1. **Acesse seu Easypanel**
2. **Crie um novo projeto** com nome "OSH-System"
3. **Escolha o template "Docker Compose"**
4. **Upload dos arquivos:**
   - Faça upload da pasta completa do projeto
   - Ou clone via Git se tiver repositório

### Passo 3: Configurar no Easypanel

1. **Template Docker Compose:**
   - Use o arquivo `docker-compose.production.yml`
   - Easypanel detectará automaticamente

2. **Variáveis de ambiente:**
   - Carregue o `.env.production` configurado
   - Certifique-se que as senhas foram alteradas

3. **Domínios (opcional):**
   - Configure domínio principal para PMS
   - Subdomínios para cada aplicação:
     - `pms.seudominio.com`
     - `hotel.seudominio.com` 
     - `automacao.seudominio.com`

### Passo 4: Deploy com 1 Clique

1. **Clique em "Deploy"** no Easypanel
2. **Aguarde o build** (5-10 minutos na primeira vez)
3. **Verifique os logs** se necessário

## 🌐 URLs de Acesso

Após o deploy bem-sucedido:

- **📊 PMS**: `http://sua-vps:5175` ou `https://pms.seudominio.com`
- **🏨 Hotel App**: `http://sua-vps:5173` ou `https://hotel.seudominio.com`
- **🤖 Automação**: `http://sua-vps:5174` ou `https://automacao.seudominio.com`
- **🔧 API**: `http://sua-vps:3001` ou `https://api.seudominio.com`

## 📊 Monitoramento

### Health Checks Automáticos
- ✅ Todos os serviços têm health checks
- ✅ Easypanel mostra status em tempo real
- ✅ Restart automático se serviço falhar

### Logs
```bash
# No Easypanel ou via SSH
docker-compose -f docker-compose.production.yml logs -f
```

### Recursos
```bash
# Status dos containers
docker stats --no-stream
```

## 🔧 Atualizações Futuras

### Atualizações de Código (SEM perda de dados)
1. **Upload do código atualizado**
2. **Rebuild no Easypanel** 
3. **Os dados permanecem intactos nos volumes**

### Processo Automático
```bash
# Via SSH (opcional)
./build.sh v1.1.0
./deploy.sh v1.1.0
```

## 🛡️ Segurança em Produção

### ⚠️ OBRIGATÓRIO - Antes do Deploy

1. **Altere TODAS as senhas padrão em `.env.production`:**
   - ✅ `POSTGRES_PASSWORD`
   - ✅ `JWT_SECRET`  
   - ✅ `META_APP_SECRET`

2. **Configure CORS com seu domínio real:**
   ```env
   CORS_ORIGIN=https://seudominio.com,https://pms.seudominio.com
   ```

3. **SSL/HTTPS (Recomendado):**
   - Easypanel pode configurar SSL automático
   - Ou use Cloudflare/Let's Encrypt

## 📂 Estrutura de Volumes (Dados Persistentes)

```yaml
# Estes volumes NUNCA são perdidos em atualizações
volumes:
  postgres_data:        # 🗄️ Banco de dados
  redis_data:          # ⚡ Cache
  api_uploads:         # 📁 Arquivos enviados
  rate_shopper_results: # 📊 Resultados do Rate Shopper
```

## 🔄 Backup Automático

### Configuração
- ✅ Backup diário automático do PostgreSQL
- ✅ Retenção de 30 dias
- ✅ Backup salvo em volume persistente

### Backup Manual
```bash
# Via SSH se necessário
docker exec osh_postgres_prod pg_dump -U osh_user osh_db_prod > backup.sql
```

## 🆘 Solução de Problemas

### Serviço não inicia
```bash
# Verificar logs
docker logs osh_api_prod
docker logs osh_pms_prod
```

### Problema com banco de dados
```bash
# Verificar saúde do PostgreSQL
docker exec osh_postgres_prod pg_isready -U osh_user
```

### Reset completo (CUIDADO - Apaga dados!)
```bash
# Apenas se necessário
docker-compose -f docker-compose.production.yml down -v
```

## 🎉 Resultado Final

Após seguir este guia você terá:

- ✅ **5 aplicações rodando** em containers Docker
- ✅ **Banco PostgreSQL** com dados persistentes
- ✅ **Cache Redis** para performance
- ✅ **Health checks** automáticos
- ✅ **Backups** diários do banco
- ✅ **SSL/HTTPS** (se configurado)
- ✅ **Monitoramento** via Easypanel
- ✅ **Atualizações** sem perda de dados

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** no Easypanel
2. **Confira as variáveis** de ambiente 
3. **Verifique as portas** (podem estar ocupadas)
4. **Consulte a documentação** do Easypanel

---

**🔥 IMPORTANTE**: Sempre teste em ambiente de staging antes de fazer deploy em produção!