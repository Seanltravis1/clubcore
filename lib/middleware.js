import { withMiddlewareAuth } from '@supabase/auth-helpers-nextjs'

export const middleware = withMiddlewareAuth()

export const config = {
  matcher: [
    /*
      Protect any pages that rely on server-side session:
      You can modify these paths accordingly.
    */
    '/((?!_next|favicon.ico|api/auth).*)',
  ],
}
