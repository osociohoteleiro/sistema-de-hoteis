#!/bin/bash

# ==============================================
# OSH SYSTEM - BUILD SCRIPT
# ==============================================
# Script para construir todas as imagens Docker

set -e  # Exit on any error

echo "🚀 Iniciando build do OSH System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando! Inicie o Docker primeiro."
    exit 1
fi

print_success "Docker está rodando"

# Set version tag (default to latest)
VERSION=${1:-latest}
print_status "Versão: $VERSION"

# Build each service
print_status "Construindo API..."
if docker build -t osh-api:$VERSION ./api; then
    print_success "API construída com sucesso"
else
    print_error "Erro ao construir API"
    exit 1
fi

print_status "Construindo PMS Frontend..."
if docker build -t osh-pms:$VERSION ./pms; then
    print_success "PMS construído com sucesso"
else
    print_error "Erro ao construir PMS"
    exit 1
fi

print_status "Construindo Hotel App Frontend..."
if docker build -t osh-hotel-app:$VERSION ./hotel-app; then
    print_success "Hotel App construído com sucesso"
else
    print_error "Erro ao construir Hotel App"
    exit 1
fi

print_status "Construindo Automação Frontend..."
if docker build -t osh-automacao:$VERSION ./automacao; then
    print_success "Automação construída com sucesso"
else
    print_error "Erro ao construir Automação"
    exit 1
fi

print_status "Construindo Rate Shopper..."
if docker build -t osh-rate-shopper:$VERSION ./extrator-rate-shopper; then
    print_success "Rate Shopper construído com sucesso"
else
    print_error "Erro ao construir Rate Shopper"
    exit 1
fi

# Show built images
print_status "Imagens construídas:"
docker images | grep "osh-"

print_success "🎉 Build completo! Todas as imagens foram construídas com sucesso."
print_status "Para fazer deploy, execute: ./deploy.sh $VERSION"

# Optional: Clean up build cache
read -p "Deseja limpar o cache de build do Docker? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Limpando cache de build..."
    docker builder prune -f
    print_success "Cache limpo"
fi