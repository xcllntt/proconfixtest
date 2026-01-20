# Quick Start Guide

## Automated Setup (Recommended)

Simply run one of these commands in your terminal:

### Option 1: Quick Start (Recommended)
```bash
./start.sh
```

This will:
- ✅ Check for Node.js and package manager
- ✅ Install dependencies automatically
- ✅ Verify environment variables
- ✅ Start the development server

### Option 2: Interactive Setup
```bash
./automate-setup.sh
```

This provides a guided setup with interactive prompts.

### Option 3: Using npm/pnpm scripts
```bash
# With pnpm
pnpm run quick-start

# With npm
npm run quick-start
```

## Manual Setup (If automated fails)

### 1. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 2. Verify Environment Variables
Make sure `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
HUGGINGFACE_API_KEY=your_hf_key
```

### 3. Set Up Database
1. Go to https://supabase.com/dashboard/project/_/sql
2. Run the SQL from `scripts/001_create_decisions_table.sql`

### 4. Start Server
```bash
pnpm dev
# or
npm run dev
```

## Troubleshooting

### "Permission denied" when running scripts
```bash
chmod +x start.sh automate-setup.sh
```

### Node.js not found
- Install Node.js from https://nodejs.org/
- Or use Homebrew: `brew install node`

### Port 3000 already in use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

## Environment Variables Fixed ✅

The following have been automatically fixed:
- ✅ Hugging Face API key format corrected
- ✅ Environment file template created (`.env.example`)

## Next Steps After Setup

1. **Set up Supabase database tables** (required)
   - Run the SQL script in Supabase dashboard
   - See `scripts/001_create_decisions_table.sql`

2. **Test the application**
   - Open http://localhost:3000
   - Try creating a decision
   - Verify API integrations work

3. **Deploy** (optional)
   - Push to your repository
   - Connect to Vercel or your hosting platform
