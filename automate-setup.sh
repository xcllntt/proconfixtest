#!/bin/bash

# Automated Setup Script for ProCon Application
set -e

echo "🚀 Starting automated setup for ProCon application..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Check Node.js
echo "📋 Step 1: Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "   Please install Node.js from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Step 2: Check package manager
echo ""
echo "📋 Step 2: Checking package manager..."
PACKAGE_MANAGER=""
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    print_success "Using pnpm (preferred)"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    print_success "Using npm"
else
    print_error "No package manager found (pnpm or npm)"
    exit 1
fi

# Step 3: Check environment variables
echo ""
echo "📋 Step 3: Verifying environment variables..."
ENV_OK=true

if [ ! -f .env.local ]; then
    print_error ".env.local file not found!"
    ENV_OK=false
else
    print_success ".env.local file exists"
    
    # Check Supabase URL
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here" .env.local || ! grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.local; then
        print_warning "Supabase URL may not be set correctly"
        ENV_OK=false
    else
        SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2-)
        print_success "Supabase URL is set: ${SUPABASE_URL:0:30}..."
    fi
    
    # Check Supabase Key
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here" .env.local || ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local; then
        print_warning "Supabase Anon Key may not be set correctly"
        ENV_OK=false
    else
        print_success "Supabase Anon Key is set"
    fi
    
    # Check Hugging Face API Key
    if grep -q "HUGGINGFACE_API_KEY=your_huggingface_api_key_here" .env.local || ! grep -q "HUGGINGFACE_API_KEY=hf_" .env.local; then
        print_warning "Hugging Face API Key may not be set correctly"
        ENV_OK=false
    else
        print_success "Hugging Face API Key is set"
    fi
fi

if [ "$ENV_OK" = false ]; then
    echo ""
    print_warning "Some environment variables may need attention. Continuing anyway..."
fi

# Step 4: Install dependencies
echo ""
echo "📋 Step 4: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies (this may take a minute)..."
    $PACKAGE_MANAGER install
    print_success "Dependencies installed successfully"
else
    print_info "node_modules exists, checking if update is needed..."
    print_info "Running install to ensure all dependencies are up to date..."
    $PACKAGE_MANAGER install
    print_success "Dependencies are ready"
fi

# Step 5: Database setup reminder
echo ""
echo "📋 Step 5: Database setup check..."
print_info "Before running the app, make sure your Supabase database tables are created:"
echo "   1. Go to: https://supabase.com/dashboard/project/_/sql"
echo "   2. Run the SQL from: scripts/001_create_decisions_table.sql"
echo ""

# Ask if user wants to continue
read -p "Have you set up the database tables? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Database tables not set up yet."
    print_info "You can set them up later, but the app won't work fully until you do."
    echo ""
fi

# Step 6: Start development server
echo ""
echo "📋 Step 6: Starting development server..."
echo ""
print_success "Setup complete! Starting development server..."
print_info "The app will be available at: http://localhost:3000"
print_info "Press Ctrl+C to stop the server"
echo ""

# Start the dev server
$PACKAGE_MANAGER run dev
