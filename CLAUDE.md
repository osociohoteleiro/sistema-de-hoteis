# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

Este é um ecossistema completo de gestão hoteleira OSH (Onscreen Hotels) composto por múltiplos módulos integrados:

- **API Backend**: Node.js/Express com PostgreSQL e Redis
- **Hotel App**: Aplicação principal de gestão hoteleira (React)
- **PMS**: Sistema de Property Management System (React)
- **Automação**: Interface de automação e workflows (React)
- **Extrator Rate Shopper**: Serviço de monitoramento de preços da concorrência
- **Site Hoteleiro**: Website institucional para hotéis
- **Scripts**: Ferramentas de deploy e automação do sistema

## Estrutura do Projeto

```
/
├── hotel-app/          # Aplicação React frontend principal (porta 5173)
│   ├── src/           # Código fonte React
│   ├── public/        # Assets públicos
│   ├── package.json   # Dependências frontend
│   └── ...
├── api/               # API backend Node.js/Express (porta 3001)
│   ├── routes/        # Rotas da API
│   ├── models/        # Modelos de dados
│   ├── services/      # Serviços
│   ├── package.json   # Dependências backend
│   └── server.js      # Servidor principal
├── pms/               # Sistema PMS frontend (porta 5175)
│   ├── src/           # Código fonte React PMS
│   ├── public/        # Assets públicos PMS
│   └── package.json   # Dependências PMS
├── automacao/         # Sistema de automação frontend (porta 5174)
│   ├── src/           # Código fonte React automação
│   ├── public/        # Assets públicos automação
│   └── package.json   # Dependências automação
├── extrator-rate-shopper/ # Serviço extrator de preços (porta 3002)
│   ├── src/           # Código fonte do extrator
│   ├── package.json   # Dependências extrator
│   └── server.js      # Servidor do extrator
├── site-hoteleiro/    # Site hoteleiro institucional
│   ├── src/           # Código fonte site
│   ├── public/        # Assets públicos site
│   └── package.json   # Dependências site
├── scripts/           # Scripts de deploy e automação
├── .git/              # Controle de versão
└── CLAUDE.md          # Este arquivo
```

## Configuração de Portas (FIXAS)

**IMPORTANTE**: As portas estão configuradas de forma fixa para evitar conflitos durante o desenvolvimento.

### Portas dos Módulos
- **API Backend**: Porta 3001 (http://localhost:3001)
- **PMS Frontend**: Porta 5175 (http://localhost:5175)
- **Hotel-App Frontend**: Porta 5173 (http://localhost:5173)
- **Automação Frontend**: Porta 5174 (http://localhost:5174)
- **Extrator Rate Shopper**: Porta 3002 (serviço em background)

### Portas do Banco de Dados
- **PostgreSQL**: Porta 5432
- **Redis**: Porta 6379

## Getting Started

### 1. Backend (API) - SEMPRE INICIAR PRIMEIRO
```bash
cd api
npm install
npm run dev  # Porta 3001
```

### 2. PMS Frontend
```bash
cd pms
npm install
npm run dev  # Porta 5175
```

### 3. Hotel App Frontend
```bash
cd hotel-app
npm install
npm run dev  # Porta 5173
```

### 4. Automação Frontend
```bash
cd automacao
npm install
npm run dev  # Porta 5174
```

### Verificar Portas em Uso
```bash
# Windows
netstat -an | findstr :3001 :5173 :5174 :5175

# Para matar todos os processos node (se necessário)
taskkill /f /im node.exe
```

### Arquivos de Configuração
- Veja `ports-config.json` na raiz para configuração completa
- Cada módulo tem seu próprio `.env` com portas fixas
- Scripts do `package.json` já configurados com portas

## Development Workflow

### Comandos de Desenvolvimento
- `cd hotel-app && npm run dev` - Inicia servidor de desenvolvimento React
- `cd api && npm run dev` - Inicia servidor de desenvolvimento da API
- `cd hotel-app && npm run build` - Build da aplicação frontend
- `cd hotel-app && npm run lint` - Verificação de código frontend

### Estrutura da API
- Porta padrão: 3001
- Banco de dados: PostgreSQL
- Cache: Redis
- Autenticação: JWT
- CORS configurado para desenvolvimento

### Tecnologias Frontend
- React 19.1.1
- Vite para build/dev
- Tailwind CSS
- React Router DOM
- Axios para API calls
- AWS S3 SDK

## Architecture

### Frontend (React)
- Estrutura baseada em componentes
- Context API para gerenciamento de estado global
- Roteamento com React Router
- Integração com AWS S3 para uploads
- Sistema de autenticação JWT

### Backend (Express)
- API RESTful
- Middleware de autenticação
- Validação com Joi
- Integração com serviços externos (Evolution, Qdrant, Flowise)
- Sistema de upload para S3

### Integrações
- WhatsApp via Evolution API
- Vector database via Qdrant
- AI/Chatbot via Flowise
- Cloud storage via AWS S3

## Deploy e Produção

### Deploy Independente por Aplicação
- **Sistema Implementado**: Deploy independente por aplicação usando branches específicas
- **Documentação**: Ver `DEPLOY-INDEPENDENTE.md` para guia completo
- **Scripts**: Pasta `/scripts` com scripts de deploy individuais

#### Branches de Deploy:
- `deploy/api` - API Backend
- `deploy/pms` - PMS Frontend
- `deploy/hotel-app` - Hotel App Frontend
- `deploy/extrator-rate-shopper` - Extrator Rate Shopper
- `deploy/automacao` - Automação Frontend

#### Scripts de Deploy:
```bash
# Deploy individual
./scripts/deploy-api.sh          # Deploy apenas da API
./scripts/deploy-pms.sh          # Deploy apenas do PMS
./scripts/deploy-hotel-app.sh    # Deploy apenas do Hotel App
./scripts/deploy-extrator.sh     # Deploy apenas do Extrator
./scripts/deploy-automacao.sh    # Deploy apenas da Automação

# Deploy de todas as aplicações
./scripts/deploy-all.sh

# Rollback de aplicação específica
./scripts/rollback.sh api 1      # Rollback da API (1 commit)
```

### EasyPanel Deploy
- **Dockerfiles**: Já configurados para todos os módulos
- **Configuração**: Ver `.easypanel.yml` (atualizado com branches específicas)
- **Auto-Deploy**: Ativado para cada branch de deploy
- **Health Checks**: Configurados automaticamente
- **SSL**: Certificados automáticos via Let's Encrypt

### Arquivos de Deploy
- `api/Dockerfile` - Container da API backend
- `hotel-app/Dockerfile` - Container do frontend principal
- `pms/Dockerfile` - Container do PMS
- `extrator-rate-shopper/Dockerfile` - Container do Extrator
- `automacao/Dockerfile` - Container da Automação
- `.easypanel.yml` - Configuração dos serviços (com branches independentes)
- `DEPLOY-INDEPENDENTE.md` - Guia completo do novo sistema de deploy
- `/scripts/` - Scripts de deploy e rollback
- Sempre responda em portugues br. Sempre analise todo o contexto da aplicação antes de alterar o código, para evitar desfazer partes importantes que já estão funcionando e evitar loop de desenvolvimento

## Padrões Obrigatórios de Desenvolvimento

### UUIDs nas URLs
- **OBRIGATÓRIO**: Toda URL da aplicação deve usar UUID ao invés de ID numérico
- **Formato**: `/workspace/{workspace_uuid}/chat-ao-vivo` (CORRETO)
- **Evitar**: `/workspace/{workspace_id}/bots` (INCORRETO)
- **Padrão**: Workspaces, bots, hotéis e todos recursos principais usam UUID
- **Validação**: Sempre validar se o UUID está presente e é válido antes de fazer requisições

### Estrutura de Navegação do Workspace
- **Página principal**: `/workspace/{uuid}/chat-ao-vivo` (redirecionamento padrão)
- **Gerenciamento**: `/workspace/{uuid}/bots`
- **Configuração**: `/workspace/{uuid}/configuracoes`
- **Chat ao Vivo**: É a interface principal de trabalho no workspace
- **Fluxo**: Usuário entra no workspace → vai direto para chat ao vivo

### Interface de Mensagens Integrada
- **Chat ao Vivo**: Interface unificada dentro do workspace
- **Evolution API**: Integrada na aba "Evolution API"
- **WhatsApp Cloud**: Integrada na aba "WhatsApp Cloud"
- **Localização**: `/workspace/{uuid}/chat-ao-vivo` (não mais `/whatsapp`)
- **Contexto**: Sempre dentro do workspace específico