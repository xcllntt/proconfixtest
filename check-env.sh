#!/bin/bash
echo "🔍 Checking environment variables..."
echo ""

if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "✅ .env.local file exists"
echo ""

# Check each variable
if grep -q "^NEXT_PUBLIC_SUPABASE_URL=https://" .env.local; then
    URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2- | tr -d ' ')
    if [ -n "$URL" ]; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL is set: ${URL:0:40}..."
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL is empty"
    fi
else
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not found or invalid"
fi

if grep -q "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local; then
    KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d '=' -f2- | tr -d ' ')
    if [ -n "$KEY" ]; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set (length: ${#KEY})"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is empty"
    fi
else
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found"
fi

if grep -q "^HUGGINGFACE_API_KEY=hf_" .env.local; then
    HF_KEY=$(grep "^HUGGINGFACE_API_KEY=" .env.local | cut -d '=' -f2- | tr -d ' ')
    if [ -n "$HF_KEY" ]; then
        echo "✅ HUGGINGFACE_API_KEY is set"
    else
        echo "❌ HUGGINGFACE_API_KEY is empty"
    fi
else
    echo "❌ HUGGINGFACE_API_KEY not found or invalid"
fi

echo ""
echo "💡 If variables are set but still getting errors:"
echo "   1. Stop the dev server (Ctrl+C)"
echo "   2. Restart it: ./start.sh or pnpm dev"
