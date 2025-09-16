#!/bin/bash

# Script de Deploy de Todas as Aplicações
# Este script faz o deploy de todas as aplicações de uma vez

set -e

echo "🚀 Iniciando deploy de TODAS as aplicações..."

# Verificar se estamos na branch master
current_branch=$(git branch --show-current)
if [ "$current_branch" != "master" ]; then
    echo "❌ Você deve estar na branch master para fazer o deploy"
    echo "Branch atual: $current_branch"
    exit 1
fi

# Verificar se há mudanças não commitadas
if ! git diff-index --quiet HEAD --; then
    echo "❌ Há mudanças não commitadas. Faça commit antes do deploy."
    git status --short
    exit 1
fi

# Atualizar master
echo "📥 Atualizando branch master..."
git pull origin master

# Lista de aplicações para deploy
apps=("api" "pms" "hotel-app" "extrator-rate-shopper" "automacao")

for app in "${apps[@]}"; do
    echo ""
    echo "🔄 Fazendo deploy do $app..."

    # Fazer checkout da branch de deploy
    git checkout "deploy/$app"

    # Fazer merge da master na branch de deploy
    git merge master

    # Enviar para o repositório
    git push origin "deploy/$app"

    echo "✅ Deploy do $app concluído!"
done

# Voltar para a branch master
echo "↩️ Voltando para a branch master..."
git checkout master

echo ""
echo "🎉 Deploy de TODAS as aplicações concluído com sucesso!"
echo "🌐 O EasyPanel irá fazer o deploy automaticamente em alguns instantes."
echo ""
echo "Aplicações atualizadas:"
for app in "${apps[@]}"; do
    echo "  - $app"
done