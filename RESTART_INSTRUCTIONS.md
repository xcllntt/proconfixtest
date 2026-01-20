# Fixing Supabase Environment Variable Error

If you're seeing this error:
```
Your project's URL and Key are required to create a Supabase client!
```

## Quick Fix (Most Common Solution)

**The dev server needs to be restarted to load environment variables from `.env.local`**

### Steps:

1. **Stop the current dev server** (if running)
   - Press `Ctrl+C` in the terminal where the dev server is running

2. **Kill any processes on port 3000** (optional, if server won't stop)
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

3. **Restart the dev server**
   ```bash
   ./start.sh
   ```
   OR
   ```bash
   pnpm dev
   ```
   OR
   ```bash
   npm run dev
   ```

## Verify Environment Variables

Run this to check if variables are loaded:
```bash
./check-env.sh
```

## Common Issues

### Issue 1: Server wasn't restarted
- **Solution**: Stop and restart the dev server
- Next.js only loads `.env.local` on startup

### Issue 2: Wrong file location
- **Solution**: Make sure `.env.local` is in the project root (same directory as `package.json`)

### Issue 3: Variables have spaces or quotes
- **Solution**: Check `.env.local` format:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
  ```
  - No spaces around `=`
  - No quotes needed (unless value has spaces)
  - No trailing spaces

### Issue 4: Wrong Supabase key type
- Make sure you're using the **anon/public** key from Supabase
- Go to: https://supabase.com/dashboard/project/_/settings/api
- Use the `anon` `public` key (not the `service_role` key)

## Verify Your Supabase Setup

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Verify:
   - **Project URL**: Should be like `https://xxxxx.supabase.co`
   - **anon public key**: Should start with `eyJ` (JWT) or `sb_` depending on your Supabase version

## After Restart

Once you restart the server, the error should disappear. If it persists:

1. Check the terminal output when starting the server
2. Look for any environment variable warnings
3. Verify `.env.local` exists and has correct values
4. Make sure you're using the correct Supabase project credentials
