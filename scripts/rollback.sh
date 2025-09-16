#!/bin/bash

# Script de Rollback
# Este script faz rollback de uma aplicação específica para o commit anterior

set -e

if [ -z "$1" ]; then
    echo "❌ Uso: ./rollback.sh [app] [commits-to-rollback]"
    echo "Aplicações disponíveis: api, pms, hotel-app, extrator-rate-shopper, automacao"
    echo "Exemplo: ./rollback.sh api 1"
    echo "Exemplo: ./rollback.sh pms 2"
    exit 1
fi

app="$1"
commits_back="${2:-1}"

# Verificar se a aplicação é válida
valid_apps=("api" "pms" "hotel-app" "extrator-rate-shopper" "automacao")
if [[ ! " ${valid_apps[@]} " =~ " ${app} " ]]; then
    echo "❌ Aplicação inválida: $app"
    echo "Aplicações disponíveis: ${valid_apps[@]}"
    exit 1
fi

branch="deploy/$app"

echo "🔄 Fazendo rollback do $app ($commits_back commit(s) atrás)..."

# Fazer checkout da branch de deploy
echo "🔄 Fazendo checkout da branch $branch..."
git checkout "$branch"

# Mostrar os últimos commits
echo "📋 Últimos commits na branch $branch:"
git log --oneline -n 5

echo ""
read -p "Confirma o rollback de $commits_back commit(s)? (y/N): " confirm

if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "❌ Rollback cancelado."
    git checkout master
    exit 0
fi

# Fazer o rollback
echo "⏪ Fazendo rollback de $commits_back commit(s)..."
git reset --hard "HEAD~$commits_back"

# Enviar para o repositório (força necessária)
echo "📤 Enviando rollback para o repositório..."
git push --force-with-lease origin "$branch"

# Voltar para a branch master
echo "↩️ Voltando para a branch master..."
git checkout master

echo "✅ Rollback do $app concluído com sucesso!"
echo "🌐 O EasyPanel irá fazer o deploy da versão anterior automaticamente."