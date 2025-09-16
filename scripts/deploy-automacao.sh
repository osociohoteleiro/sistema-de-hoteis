#!/bin/bash

# Script de Deploy da Automação
# Este script faz o deploy apenas da Automação para a branch deploy/automacao

set -e

echo "🚀 Iniciando deploy da Automação..."

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

# Fazer checkout da branch de deploy
echo "🔄 Fazendo checkout da branch deploy/automacao..."
git checkout deploy/automacao

# Fazer merge da master na branch de deploy
echo "🔀 Fazendo merge da master na deploy/automacao..."
git merge master

# Enviar para o repositório
echo "📤 Enviando para o repositório..."
git push origin deploy/automacao

# Voltar para a branch master
echo "↩️ Voltando para a branch master..."
git checkout master

echo "✅ Deploy da Automação concluído com sucesso!"
echo "🌐 O EasyPanel irá fazer o deploy automaticamente em alguns instantes."