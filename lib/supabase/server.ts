import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Your project's URL and Key are required to create a Supabase client!\n\n" +
      "Check your Supabase project's API settings to find these values\n\n" +
      "https://supabase.com/dashboard/project/_/settings/api"
    )
  }

  // Fail fast on placeholder-like values to avoid confusing "fetch failed" errors.
  if (/your_supabase|your-project|example\.com|placeholder/i.test(supabaseUrl)) {
    throw new Error(
      "Supabase URL looks like a placeholder. Update `.env.local` with your real Project URL (e.g. https://xxxx.supabase.co) and restart the dev server."
    )
  }

  if (!/^https?:\/\//i.test(supabaseUrl)) {
    throw new Error("Supabase URL must start with `http://` or `https://`. Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.")
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have proxy refreshing user sessions.
        }
      },
    },
  })
}
