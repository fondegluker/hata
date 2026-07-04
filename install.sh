#!/bin/bash

# ===========================================
# Hata Installation Script
# For Ubuntu/Debian in WSL2
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Detect system
detect_system() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        log_error "Cannot detect OS"
        exit 1
    fi
    
    log_info "Detected OS: $OS $VER"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_warning "Running as root is not recommended. Please run as a regular user."
        exit 1
    fi
}

# Install system dependencies
install_dependencies() {
    log_info "Updating system packages..."
    sudo apt-get update
    
    log_info "Installing system dependencies..."
    sudo apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        libpq-dev \
        libssl-dev \
        libffi-dev \
        python3-dev \
        python3-pip \
        python3-venv \
        nodejs \
        npm \
        postgresql \
        postgresql-contrib \
        libnss3 \
        libnspr4 \
        libnss3 \
        libnspr4 \
        libatk1.0-0t64 \
        libatk-bridge2.0-0t64 \
        libcups2t64 \
        libdrm2 \
        libdbus-1-3 \
        libxkbcommon0 \
        libatspi2.0-0t64 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libgbm1 \
        libasound2t64 \
        libpango-1.0-0 \
        libcairo2
    
    log_success "System dependencies installed"
}

# Install Python 3.11+
install_python() {
    if command -v python3.11 &> /dev/null; then
        log_success "Python 3.11 already installed"
        return
    fi
    
    log_info "Installing Python 3.11..."
    
    if [ "$OS" = "ubuntu" ]; then
        sudo add-apt-repository -y ppa:deadsnakes/ppa
        sudo apt-get update
        sudo apt-get install -y python3.11 python3.11-venv python3.11-dev
    elif [ "$OS" = "debian" ]; then
        # Install from source or use pyenv
        log_warning "Please install Python 3.11+ manually on Debian"
        return
    fi
    
    # Set python3.11 as default
    sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
    
    log_success "Python installed: $(python3 --version)"
}

# Install Node.js 20+
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VER" -ge 18 ]; then
            log_success "Node.js $(node -v) already installed"
            return
        fi
    fi
    
    log_info "Installing Node.js 20..."
    
    # Install using NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    log_success "Node.js installed: $(node -v)"
    log_success "npm installed: $(npm -v)"
}

# Install Playwright browsers
install_playwright() {
    log_info "Installing Playwright browsers..."
    
    cd backend
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    pip install playwright
    playwright install chromium
    playwright install-deps chromium
    
    log_success "Playwright browsers installed"
    
    cd ..
}

# Setup PostgreSQL
setup_postgres() {
    log_info "Setting up PostgreSQL..."
    
    # Check if PostgreSQL is running
    if ! pg_isready -q; then
        log_info "Starting PostgreSQL service..."
        sudo service postgresql start
    fi
    
    # Create database and user
    log_info "Creating database and user..."
    sudo -u postgres psql -c "CREATE USER hata WITH PASSWORD 'hata';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE hata OWNER hata;" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hata TO hata;" 2>/dev/null || true
    
    log_success "PostgreSQL configured"
}

# Setup Python backend
setup_backend() {
    log_info "Setting up Python backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    # Activate and install dependencies
    source venv/bin/activate
    pip install --upgrade pip
    
    # Install dependencies from requirements.txt
    pip install -r requirements.txt
    
    # Create .env file if not exists
    if [ ! -f ".env" ]; then
        cp .env.example .env
        log_warning "Created .env file from template. Please review and update settings."
    fi
    
    # Create storage directories
    mkdir -p storage/photos storage/logs
    
    # Run migrations
    log_info "Running database migrations..."
    alembic upgrade head
    
    cd ..
    
    log_success "Backend setup complete"
}

# Setup React frontend
setup_frontend() {
    log_info "Setting up React frontend..."
    
    cd frontend
    
    # Install dependencies
    npm install --legacy-peer-deps
    
    cd ..
    
    log_success "Frontend setup complete"
}

# Create systemd service (optional)
create_systemd_service() {
    log_info "Creating systemd services..."
    
    # Backend service
    sudo tee /etc/systemd/system/hata-backend.service > /dev/null <<EOF
[Unit]
Description=Hata Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/backend
Environment="PATH=$(pwd)/backend/venv/bin"
ExecStart=$(pwd)/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service (using serve)
    sudo tee /etc/systemd/system/hata-frontend.service > /dev/null <<EOF
[Unit]
Description=Hata Frontend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/frontend
ExecStart=$(which npm) run preview -- --host 0.0.0.0 --port 5173
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    
    log_success "Systemd services created"
    log_info "Enable services with: sudo systemctl enable --now hata-backend hata-frontend"
}

# Generate secret key
generate_secret() {
    log_info "Generating secret key..."
    
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    
    # Update .env file
    if [ -f "backend/.env" ]; then
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" backend/.env
        log_success "Secret key generated and saved to .env"
    fi
}

# Print usage
print_usage() {
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}Hata Installation Complete!${NC}"
    echo -e "${GREEN}======================================${NC}"
    echo ""
    echo "To start the application:"
    echo ""
    echo "  1. Start PostgreSQL:"
    echo "     sudo service postgresql start"
    echo ""
    echo "  2. Start Backend:"
    echo "     cd backend && source venv/bin/activate"
    echo "     uvicorn app.main:app --reload"
    echo ""
    echo "  3. Start Frontend (in another terminal):"
    echo "     cd frontend && npm run dev"
    echo ""
    echo "  4. Open http://localhost:5173 in your browser"
    echo ""
    echo "For production deployment with Docker:"
    echo "     docker-compose up -d"
    echo ""
    echo -e "${YELLOW}Important: Edit backend/.env and update SECRET_KEY and other settings!${NC}"
    echo ""
}

# Main installation
main() {
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}Hata Installation Script${NC}"
    echo -e "${GREEN}======================================${NC}"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "backend/pyproject.toml" ] || [ ! -f "frontend/package.json" ]; then
        log_error "Please run this script from the hata root directory"
        exit 1
    fi
    
    detect_system
    check_root
    
    # Ask for confirmation
    read -p "This will install Hata and all dependencies. Continue? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Installation cancelled"
        exit 0
    fi
    
    # Install dependencies
    install_dependencies
    install_python
    install_nodejs
    setup_postgres
    
    # Setup application
    setup_backend
    setup_frontend
    install_playwright
    generate_secret
    
    # Ask about systemd
    read -p "Create systemd services for auto-start? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_systemd_service
    fi
    
    print_usage
}

# Run main
main "$@"
