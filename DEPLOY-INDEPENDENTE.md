# Deploy Independente por Aplicação

Este documento explica como funciona o novo sistema de deploy independente para cada aplicação do projeto Hotel OSH.

## Problema Resolvido

Anteriormente, todas as aplicações eram deployadas juntas usando a mesma branch `master`. Isso causava problemas quando era necessário fazer rollback de apenas uma aplicação, pois trazia versões antigas de todas as outras.

## Solução Implementada

### Estrutura de Branches

Agora cada aplicação tem sua própria branch de deploy:

- **deploy/api** - Para deploy da API Backend
- **deploy/pms** - Para deploy do PMS Frontend
- **deploy/hotel-app** - Para deploy do Hotel App Frontend
- **deploy/extrator-rate-shopper** - Para deploy do Extrator Rate Shopper
- **deploy/automacao** - Para deploy da Automação Frontend

### Configuração do EasyPanel

O arquivo `.easypanel.yml` foi atualizado para que cada serviço aponte para sua própria branch de deploy:

```yaml
services:
  api:
    source:
      branch: deploy/api

  pms:
    source:
      branch: deploy/pms

  hotel-app:
    source:
      branch: deploy/hotel-app

  # etc...
```

## Como Usar

### Deploy Individual

Para fazer deploy de apenas uma aplicação, use os scripts na pasta `/scripts`:

#### Linux/macOS (Bash):
```bash
# Deploy apenas da API
./scripts/deploy-api.sh

# Deploy apenas do PMS
./scripts/deploy-pms.sh

# Deploy apenas do Hotel App
./scripts/deploy-hotel-app.sh

# Deploy apenas do Extrator
./scripts/deploy-extrator.sh

# Deploy apenas da Automação
./scripts/deploy-automacao.sh
```

#### Windows (PowerShell):
```powershell
# Deploy apenas da API
.\scripts\deploy-api.ps1

# Deploy de todas as aplicações
.\scripts\deploy-all.ps1
```

### Deploy de Todas as Aplicações

Se você quiser fazer deploy de todas as aplicações (como antes), use:

```bash
# Linux/macOS
./scripts/deploy-all.sh

# Windows
.\scripts\deploy-all.ps1
```

### Rollback de Aplicação Específica

Para fazer rollback de uma aplicação específica:

```bash
# Rollback de 1 commit
./scripts/rollback.sh api 1

# Rollback de 2 commits
./scripts/rollback.sh pms 2

# Rollback do hotel-app
./scripts/rollback.sh hotel-app 1
```

## Workflow de Desenvolvimento

### 1. Desenvolvimento Normal

- Continue desenvolvendo na branch `master` como sempre
- Faça commits normalmente
- Faça push para `origin/master`

### 2. Deploy Individual

Quando quiser fazer deploy de apenas uma aplicação:

1. Certifique-se de estar na branch `master`
2. Certifique-se de que não há mudanças não commitadas
3. Execute o script de deploy da aplicação desejada
4. O script irá:
   - Fazer merge da `master` na branch de deploy
   - Enviar para o GitHub
   - O EasyPanel fará o deploy automaticamente

### 3. Deploy de Emergência/Rollback

Se uma aplicação específica apresentar problemas:

1. Use o script de rollback para voltar versões anteriores
2. Apenas aquela aplicação será afetada
3. As outras aplicações continuam funcionando normalmente

## Vantagens

✅ **Deploy Granular**: Deploy independente de cada aplicação

✅ **Rollback Específico**: Rollback sem afetar outras aplicações

✅ **Menor Risco**: Problemas em uma aplicação não afetam as outras

✅ **Deploy Mais Rápido**: Deploy apenas do que mudou

✅ **Histórico Separado**: Cada aplicação tem seu próprio histórico de deploy

✅ **Compatível com EasyPanel**: Funciona perfeitamente com auto-deploy

## Scripts Disponíveis

### Scripts de Deploy Individual

- `deploy-api.sh` / `deploy-api.ps1` - Deploy da API
- `deploy-pms.sh` - Deploy do PMS
- `deploy-hotel-app.sh` - Deploy do Hotel App
- `deploy-extrator.sh` - Deploy do Extrator
- `deploy-automacao.sh` - Deploy da Automação

### Scripts de Deploy Múltiplo

- `deploy-all.sh` / `deploy-all.ps1` - Deploy de todas as aplicações

### Scripts de Rollback

- `rollback.sh` - Rollback de aplicação específica

## Exemplos de Uso

### Cenário 1: Bug apenas na API

```bash
# 1. Corrigir bug na master
git add .
git commit -m "Fix: corrigir bug na API"

# 2. Deploy apenas da API
./scripts/deploy-api.sh
```

### Cenário 2: Nova feature no PMS

```bash
# 1. Implementar feature na master
git add pms/
git commit -m "Feature: nova funcionalidade no PMS"

# 2. Deploy apenas do PMS
./scripts/deploy-pms.sh
```

### Cenário 3: Rollback de emergência

```bash
# API com problema - rollback imediato
./scripts/rollback.sh api 1
```

## Verificação de Status

Para verificar o status das branches de deploy:

```bash
# Ver todas as branches
git branch -a

# Ver último commit de cada branch de deploy
git log --oneline -1 deploy/api
git log --oneline -1 deploy/pms
git log --oneline -1 deploy/hotel-app
```

## Troubleshooting

### Problema: Script não encontrado
```bash
# Dar permissão de execução (Linux/macOS)
chmod +x scripts/*.sh
```

### Problema: Branch de deploy não existe
```bash
# Criar branch de deploy manualmente
git checkout -b deploy/nome-app
git push -u origin deploy/nome-app
```

### Problema: Conflito no merge
```bash
# Resolver conflitos manualmente
git checkout deploy/nome-app
git merge master
# Resolver conflitos
git add .
git commit
git push origin deploy/nome-app
```