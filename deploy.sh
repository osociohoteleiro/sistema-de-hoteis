#!/bin/bash

# ==============================================
# OSH SYSTEM - DEPLOY SCRIPT
# ==============================================
# Script para fazer deploy no ambiente de produção

set -e  # Exit on any error

echo "🚀 Iniciando deploy do OSH System..."

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

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production não encontrado! Copie e configure o arquivo primeiro."
    print_status "Exemplo: cp .env.production.example .env.production"
    exit 1
fi

print_success "Arquivo .env.production encontrado"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando! Inicie o Docker primeiro."
    exit 1
fi

print_success "Docker está rodando"

# Set version tag (default to latest)
VERSION=${1:-latest}
print_status "Versão para deploy: $VERSION"

# Check if we need to build first
if [[ "$2" == "--build" ]] || [[ "$1" == "--build" ]]; then
    print_status "Executando build primeiro..."
    if ./build.sh $VERSION; then
        print_success "Build concluído"
    else
        print_error "Erro no build"
        exit 1
    fi
fi

# Stop existing containers (if any)
print_status "Parando containers existentes..."
docker-compose -f docker-compose.production.yml down --remove-orphans

# Pull latest base images
print_status "Atualizando imagens base..."
docker-compose -f docker-compose.production.yml pull postgres redis

# Create backup of current database (if exists)
if docker ps -a --format 'table {{.Names}}' | grep -q osh_postgres_prod; then
    print_warning "Criando backup do banco de dados..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    if docker exec osh_postgres_prod pg_dump -U osh_user osh_db_prod > "backups/$BACKUP_FILE" 2>/dev/null; then
        print_success "Backup criado: backups/$BACKUP_FILE"
    else
        print_warning "Não foi possível criar backup (banco pode estar vazio)"
    fi
fi

# Start services
print_status "Iniciando serviços..."
docker-compose -f docker-compose.production.yml up -d

# Wait for database to be ready
print_status "Aguardando banco de dados..."
sleep 10

# Check if all services are running
print_status "Verificando status dos serviços..."
SERVICES=(osh_postgres_prod osh_redis_prod osh_api_prod osh_pms_prod osh_hotel_app_prod osh_automacao_prod osh_rate_shopper_prod)

for service in "${SERVICES[@]}"; do
    if docker ps --format 'table {{.Names}}' | grep -q $service; then
        print_success "$service está rodando"
    else
        print_error "$service não está rodando!"
        # Show logs for debugging
        print_status "Logs do $service:"
        docker logs $service --tail 20
        exit 1
    fi
done

# Show running services
print_status "Serviços ativos:"
docker-compose -f docker-compose.production.yml ps

# Show access URLs
print_status "🌐 URLs de Acesso:"
echo "  📊 PMS:        http://localhost:5175"
echo "  🏨 Hotel App:  http://localhost:5173"
echo "  🤖 Automação: http://localhost:5174"
echo "  🔧 API:       http://localhost:3001"
echo "  📈 Rate Shop: http://localhost:3002 (background)"

# Health checks
print_status "Executando health checks..."
sleep 5

# Check API health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "API está saudável"
else
    print_warning "API pode estar iniciando ainda..."
fi

# Check frontends
for port in 5175 5173 5174; do
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        print_success "Frontend na porta $port está saudável"
    else
        print_warning "Frontend na porta $port pode estar iniciando ainda..."
    fi
done

print_success "🎉 Deploy concluído!"
print_status "Monitore os logs com: docker-compose -f docker-compose.production.yml logs -f"
print_warning "Lembre-se de configurar SSL/HTTPS no seu servidor de produção!"

# Optional: Show resource usage
echo ""
print_status "📊 Uso de recursos:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"