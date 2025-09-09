#!/bin/bash

# Rate Shopper - Linux Installation Script
# Este script instala todas as dependências necessárias para rodar o Rate Shopper em Linux/VPS

set -e

echo "🚀 Installing Rate Shopper for Linux/VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detectar distribuição Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    OS=$(uname -s)
    VER=$(uname -r)
fi

log_info "Detected OS: $OS $VER"

# Instalar Node.js se não estiver instalado
if ! command -v node &> /dev/null; then
    log_warn "Node.js not found. Installing Node.js..."
    
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs npm
    else
        log_error "Cannot install Node.js automatically. Please install Node.js manually."
        exit 1
    fi
else
    log_info "Node.js found: $(node --version)"
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    log_error "Node.js version 16+ required. Current: $(node --version)"
    exit 1
fi

# Instalar dependências do sistema para Puppeteer
log_info "Installing system dependencies for Puppeteer..."

if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    sudo apt-get update
    sudo apt-get install -y \
        wget \
        gnupg \
        ca-certificates \
        procps \
        libxss1 \
        libgconf-2-4 \
        libxrandr2 \
        libasound2 \
        libpangocairo-1.0-0 \
        libatk1.0-0 \
        libcairo-gobject2 \
        libgtk-3-0 \
        libgdk-pixbuf2.0-0 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxfixes3 \
        libxi6 \
        libxrender1 \
        libxtst6 \
        libglib2.0-0 \
        libnss3 \
        libxss1 \
        libdrm2 \
        libgbm1
        
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    sudo yum install -y \
        wget \
        gnupg \
        ca-certificates \
        procps \
        libXss \
        libXrandr \
        alsa-lib \
        pango \
        atk \
        cairo-gobject \
        gtk3 \
        gdk-pixbuf2 \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXfixes \
        libXi \
        libXrender \
        libXtst \
        glib2 \
        nss \
        libdrm \
        libgbm
else
    log_warn "Cannot install system dependencies automatically. Please install Puppeteer dependencies manually."
fi

# Instalar dependências do Node.js
log_info "Installing Node.js dependencies..."
npm install

# Criar diretórios necessários
log_info "Creating required directories..."
mkdir -p results/extracted-data/csv
mkdir -p results/extracted-data/xlsx
mkdir -p logs

# Criar script de execução para VPS
log_info "Creating VPS execution scripts..."

cat > run-headless.sh << 'EOF'
#!/bin/bash
# Execução em modo headless para VPS
export HEADLESS=true
export NODE_ENV=production
npm start
EOF

cat > run-debug.sh << 'EOF'
#!/bin/bash
# Execução com debug (apenas para desenvolvimento local)
export DEBUG=true
export LOG_LEVEL=debug
npm start
EOF

chmod +x run-headless.sh
chmod +x run-debug.sh

# Criar arquivo de configuração para produção
log_info "Creating production configuration..."

cat > .env.production << 'EOF'
# Configuração para ambiente de produção (VPS)
HEADLESS=true
NODE_ENV=production
LOG_LEVEL=info
USE_OLD_EXTRACTOR=false
EOF

# Criar serviço systemd (opcional)
if command -v systemctl &> /dev/null; then
    log_info "Creating systemd service..."
    
    cat > rate-shopper.service << EOF
[Unit]
Description=Rate Shopper - Booking Price Extractor
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=HEADLESS=true
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    log_info "To install the service, run:"
    log_info "  sudo cp rate-shopper.service /etc/systemd/system/"
    log_info "  sudo systemctl daemon-reload"
    log_info "  sudo systemctl enable rate-shopper"
    log_info "  sudo systemctl start rate-shopper"
fi

# Teste de instalação
log_info "Testing installation..."
export HEADLESS=true
timeout 30s node -e "
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { getBrowserConfig } = require('./src/browser-config');

async function test() {
  try {
    const browser = await puppeteer.launch(getBrowserConfig());
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    await browser.close();
    console.log('✅ Puppeteer test successful');
  } catch (error) {
    console.log('❌ Puppeteer test failed:', error.message);
    process.exit(1);
  }
}
test();
" 2>/dev/null && log_info "Puppeteer test passed!" || log_error "Puppeteer test failed!"

echo ""
log_info "🎉 Installation completed successfully!"
echo ""
echo "📝 Usage Instructions:"
echo "  - For VPS (headless): ./run-headless.sh"
echo "  - For development: ./run-debug.sh"
echo "  - Manual headless: HEADLESS=true npm start"
echo ""
echo "📁 Important files:"
echo "  - Configuration: src/config.json"
echo "  - Results: results/extracted-data/"
echo "  - Logs: logs/"
echo ""
echo "🔧 Environment variables:"
echo "  - HEADLESS=true (for VPS)"
echo "  - DEBUG=true (for development)"
echo "  - USE_OLD_EXTRACTOR=true (fallback)"
echo ""
log_info "Ready to run Rate Shopper on Linux! 🚀"