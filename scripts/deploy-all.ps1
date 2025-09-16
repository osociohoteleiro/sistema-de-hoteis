# Script de Deploy de Todas as Aplicações (PowerShell)
# Este script faz o deploy de todas as aplicações de uma vez

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deploy de TODAS as aplicações..." -ForegroundColor Green

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

# Lista de aplicações para deploy
$apps = @("api", "pms", "hotel-app", "extrator-rate-shopper", "automacao")

foreach ($app in $apps) {
    Write-Host ""
    Write-Host "🔄 Fazendo deploy do $app..." -ForegroundColor Cyan

    # Fazer checkout da branch de deploy
    git checkout "deploy/$app"

    # Fazer merge da master na branch de deploy
    git merge master

    # Enviar para o repositório
    git push origin "deploy/$app"

    Write-Host "✅ Deploy do $app concluído!" -ForegroundColor Green
}

# Voltar para a branch master
Write-Host "↩️ Voltando para a branch master..." -ForegroundColor Cyan
git checkout master

Write-Host ""
Write-Host "🎉 Deploy de TODAS as aplicações concluído com sucesso!" -ForegroundColor Green
Write-Host "🌐 O EasyPanel irá fazer o deploy automaticamente em alguns instantes." -ForegroundColor Yellow
Write-Host ""
Write-Host "Aplicações atualizadas:" -ForegroundColor Cyan
foreach ($app in $apps) {
    Write-Host "  - $app" -ForegroundColor White
}