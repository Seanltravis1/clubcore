// lib/supabaseServer.js
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

// Returns a configured Supabase client for server-side usage (SSR)
export function getServerSupabase(ctx) {
  return createServerSupabaseClient(ctx)
}
