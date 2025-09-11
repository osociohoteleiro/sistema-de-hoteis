# 🚀 Deploy do PMS no EasyPanel

## ✅ Arquivos Necessários

- `Dockerfile` - Multi-stage build (Node.js 20 + Nginx)
- `.dockerignore` - Otimizado para build
- `nginx.conf` - Configuração do servidor web
- `.env.production` - Variáveis de ambiente para produção
- `package.json` - Dependências da aplicação

## 📋 Passos para Deploy

### 1. Fazer Build da Imagem Docker

```bash
cd pms
docker build -t osh-pms:latest .
```

### 2. Configurar no EasyPanel

#### 2.1 Substituir o PMS Atual

1. Acesse o EasyPanel para o PMS frontend
2. Vá para o serviço do PMS atual
3. Pare o serviço atual (se estiver rodando)

#### 2.2 Configurar Novo Deploy

**Opção A: Deploy via Git (Recomendado)**
1. Configure o repositório Git no EasyPanel
2. Branch: `master` 
3. Build Path: `/pms`
4. Dockerfile Path: `Dockerfile`

**Opção B: Upload Manual**
1. Faça upload dos arquivos da pasta `pms/`
2. Configure o Dockerfile

### 3. Variáveis de Ambiente

Configure as seguintes variáveis no EasyPanel:

```env
# URL da API - Ajustar conforme sua configuração
VITE_API_BASE_URL=https://osh-sistemas-api-backend.d32pnk.easypanel.host/api
VITE_SOCKET_URL=https://osh-sistemas-api-backend.d32pnk.easypanel.host

# Para produção, certifique-se que a API está funcionando
```

**IMPORTANTE**: As variáveis `VITE_*` são compiladas durante o build, então elas devem estar corretas no momento do build.

### 4. Configurações de Rede

- **Porta Interna**: 80 (nginx)
- **Porta Externa**: 80 ou 443 (configurar no EasyPanel)
- **Health Check**: `/health`

### 5. Verificação Pós-Deploy

Após o deploy, verifique:

#### 5.1 Health Check
```bash
curl https://seu-dominio-pms.easypanel.host/health
```

Resposta esperada:
```
healthy
```

#### 5.2 Aplicação Funcionando
1. Acesse o frontend no navegador
2. Verifique se carrega a página inicial
3. Teste login/autenticação
4. Verifique se conecta com a API corretamente

## 🔧 Troubleshooting

### Erro de Conexão com API
- Verificar `VITE_API_BASE_URL` nas variáveis de ambiente
- Certificar que a API está rodando e acessível
- Verificar CORS na API (deve incluir domínio do frontend)

### Erro 404 em Rotas
- Verificar se `nginx.conf` está configurado corretamente
- O nginx deve estar configurado para SPA (Single Page Application)
- Todas as rotas devem retornar `index.html`

### Problemas com Build
- Verificar se todas as dependências estão no `package.json`
- Certificar que Node.js 20+ está sendo usado
- Verificar logs de build no EasyPanel

### Erro de Assets Estáticos
- Verificar se o build foi feito corretamente
- Certificar que arquivos estão em `/usr/share/nginx/html`
- Verificar configuração de cache no nginx

## 📊 Arquitetura do Deploy

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │───▶│  PMS Frontend    │───▶│   API Backend   │
│                 │    │  (Nginx + React) │    │  (Node.js API)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Fluxo do Build:
1. **Stage 1 (Builder)**: Node.js 20 instala deps e faz build do React/Vite
2. **Stage 2 (Production)**: Nginx serve os arquivos estáticos gerados
3. **Frontend**: Chama API via JavaScript (sem proxy server-side)

## 📁 Estrutura de Arquivos

```
pms/
├── Dockerfile              # Multi-stage: Node build + Nginx serve
├── nginx.conf             # Configuração Nginx (SPA routing)
├── .dockerignore          # Arquivos excluídos do build
├── .env.production        # Variáveis de ambiente
├── package.json           # Dependências e scripts
├── src/                   # Código fonte React
└── dist/                  # Build output (criado durante build)
```

## 🎯 Resultado Esperado

Após o deploy bem-sucedido:
- ✅ Frontend respondendo em sua URL do EasyPanel
- ✅ Health check retornando "healthy"
- ✅ Aplicação React carregando corretamente
- ✅ Conectividade com API funcionando
- ✅ Roteamento SPA funcionando (todas as rotas)
- ✅ Assets estáticos servidos com cache otimizado

---

## 🆘 Suporte

Se algo der errado:
1. Verificar logs do container no EasyPanel
2. Testar health check: `/health`
3. Verificar se API está acessível
4. Confirmar variáveis de ambiente `VITE_*`
5. Testar build local: `npm run build`

## 📝 Notas Importantes

- **Variáveis VITE_**: São compiladas no build time, não runtime
- **Nginx**: Configurado para SPA routing (todas rotas → index.html)
- **Cache**: Assets estáticos têm cache de 1 ano
- **Compressão**: Gzip habilitado para melhor performance
- **Segurança**: Headers de segurança configurados