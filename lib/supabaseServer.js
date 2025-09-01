import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

// Returns a configured Supabase client for server-side usage (SSR/API)
export function getServerSupabase(ctx) {
  return createPagesServerClient(ctx);
}
