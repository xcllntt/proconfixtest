#!/bin/bash

# Fully automated startup script - runs setup and starts dev server
# This script handles everything automatically

set -e

echo "🚀 ProCon Application - Automated Startup"
echo "=========================================="
echo ""

# Try to find Node.js in common locations
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin:$HOME/.local/bin:$HOME/.nvm/versions/node/*/bin"

# Source common shell profiles that might have Node.js
[ -f ~/.zshrc ] && source ~/.zshrc 2>/dev/null || true
[ -f ~/.bash_profile ] && source ~/.bash_profile 2>/dev/null || true
[ -f ~/.profile ] && source ~/.profile 2>/dev/null || true

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo ""
    echo "Please install Node.js first:"
    echo "  - Visit: https://nodejs.org/"
    echo "  - Or use Homebrew: brew install node"
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# Detect package manager
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    echo "✅ Using pnpm"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    echo "✅ Using npm"
else
    echo "❌ No package manager found (npm/pnpm)"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies (first time setup)..."
    $PACKAGE_MANAGER install
    echo ""
fi

# Verify environment variables
echo "🔍 Checking environment variables..."
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local not found!"
else
    # Quick check
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.local && \
       grep -q "HUGGINGFACE_API_KEY=hf_" .env.local; then
        echo "✅ Environment variables configured"
    else
        echo "⚠️  Warning: Environment variables may need attention"
    fi
fi

echo ""
echo "💡 Database Setup Reminder:"
echo "   Make sure you've run the SQL script in Supabase:"
echo "   scripts/001_create_decisions_table.sql"
echo ""

# Start dev server
echo "🚀 Starting development server..."
echo "   App will be available at: http://localhost:3000"
echo "   Press Ctrl+C to stop"
echo ""

$PACKAGE_MANAGER run dev
