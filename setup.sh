#!/bin/bash

# Setup script for the ProCon application

echo "🚀 Setting up ProCon application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check for pnpm (preferred) or npm
if command -v pnpm &> /dev/null; then
    echo "✅ Using pnpm as package manager"
    PACKAGE_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    echo "✅ Using npm as package manager"
    PACKAGE_MANAGER="npm"
else
    echo "❌ No package manager found. Please install pnpm or npm."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
$PACKAGE_MANAGER install

# Check if .env.local exists and has values
if [ -f .env.local ]; then
    echo "✅ .env.local file exists"
    
    # Check if Supabase keys are set
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here" .env.local; then
        echo "⚠️  Warning: Supabase URL still has placeholder value"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here" .env.local; then
        echo "⚠️  Warning: Supabase Anon Key still has placeholder value"
    fi
    
    if grep -q "HUGGINGFACE_API_KEY=your_huggingface_api_key_here" .env.local; then
        echo "⚠️  Warning: Hugging Face API Key still has placeholder value"
    fi
else
    echo "⚠️  Warning: .env.local file not found. Please create it with your API keys."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure .env.local has your actual API keys (not placeholders)"
echo "   2. Run: $PACKAGE_MANAGER run dev"
echo ""
echo "💡 If you need to set up the database:"
echo "   - Run the SQL script in scripts/001_create_decisions_table.sql"
echo "   - In your Supabase dashboard SQL editor"
