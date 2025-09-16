# Script de Deploy da API (PowerShell)
# Este script faz o deploy apenas da API para a branch deploy/api

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deploy da API..." -ForegroundColor Green

# Verificar se estamos na branch master
$currentBranch = git branch --show-current
if ($currentBranch -ne "master") {
    Write-Host "❌ Você deve estar na branch master para fazer o deploy" -ForegroundColor Red
    Write-Host "Branch atual: $currentBranch" -ForegroundColor Yellow
    exit 1
}

# Verificar se há mudanças não commitadas
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "❌ Há mudanças não commitadas. Faça commit antes do deploy." -ForegroundColor Red
    git status --short
    exit 1
}

# Atualizar master
Write-Host "📥 Atualizando branch master..." -ForegroundColor Cyan
git pull origin master

# Fazer checkout da branch de deploy
Write-Host "🔄 Fazendo checkout da branch deploy/api..." -ForegroundColor Cyan
git checkout deploy/api

# Fazer merge da master na branch de deploy
Write-Host "🔀 Fazendo merge da master na deploy/api..." -ForegroundColor Cyan
git merge master

# Enviar para o repositório
Write-Host "📤 Enviando para o repositório..." -ForegroundColor Cyan
git push origin deploy/api

# Voltar para a branch master
Write-Host "↩️ Voltando para a branch master..." -ForegroundColor Cyan
git checkout master

Write-Host "✅ Deploy da API concluído com sucesso!" -ForegroundColor Green
Write-Host "🌐 O EasyPanel irá fazer o deploy automaticamente em alguns instantes." -ForegroundColor Yellow