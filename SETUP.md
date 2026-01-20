# Setup Instructions

## Prerequisites
- Node.js 18+ installed
- pnpm or npm installed
- Supabase account and project
- Hugging Face account and API token

## Quick Start

### 1. Install Dependencies

If you have pnpm (recommended):
```bash
pnpm install
```

Or with npm:
```bash
npm install
```

### 2. Environment Variables

The `.env.local` file should already be created. Make sure it contains your actual API keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

**Get Supabase credentials:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the `Project URL` and `anon public` key

**Get Hugging Face API key:**
1. Go to https://huggingface.co/settings/tokens
2. Create a new token (or use existing)
3. Copy the token

### 3. Set Up Database

The application requires database tables to be created in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `scripts/001_create_decisions_table.sql`

This will create the following tables:
- `decisions` - Stores decision sessions
- `clarifying_questions` - Stores generated questions
- `clarifying_answers` - Stores user answers
- `analysis_results` - Stores AI-generated analysis

### 4. Start Development Server

```bash
# With pnpm
pnpm dev

# Or with npm
npm run dev
```

The application will be available at http://localhost:3000

## Troubleshooting

### "Supabase URL and Key are required" error
- Make sure `.env.local` exists and has valid values
- Ensure variables start with `NEXT_PUBLIC_` for Supabase (required for client-side access)
- Restart the dev server after updating `.env.local`

### "HUGGINGFACE_API_KEY is not set" error
- Check that `HUGGINGFACE_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

### Database errors
- Ensure you've run the SQL setup script in Supabase
- Check that your Supabase URL and keys are correct
- Verify your Supabase project is active

## Additional Notes

- `.env.local` is in `.gitignore` and won't be committed
- The `.env.example` file shows what variables are needed
- The database uses UUID primary keys and has proper indexes for performance
