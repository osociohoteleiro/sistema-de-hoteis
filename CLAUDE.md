# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

Este é um sistema de gestão de hotéis OSH (Onscreen Hotels) composto por uma aplicação frontend React e uma API backend Node.js/Express.

## Estrutura do Projeto

```
/
├── hotel-app/          # Aplicação React frontend (porta 5173/5174)
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
├── .git/              # Controle de versão
└── CLAUDE.md          # Este arquivo
```

## Getting Started

### Frontend (hotel-app)
```bash
cd hotel-app
npm install
npm run dev
```

### Backend (api)
```bash
cd api
npm install
npm run dev
```

## Development Workflow

### Comandos de Desenvolvimento
- `cd hotel-app && npm run dev` - Inicia servidor de desenvolvimento React
- `cd api && npm run dev` - Inicia servidor de desenvolvimento da API
- `cd hotel-app && npm run build` - Build da aplicação frontend
- `cd hotel-app && npm run lint` - Verificação de código frontend

### Estrutura da API
- Porta padrão: 3001
- Banco de dados: MariaDB/MySQL
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