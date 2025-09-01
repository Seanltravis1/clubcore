// pages/api/auth/set-session.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { event, session } = req.body
  console.log('[set-session] Incoming event:', event)
  console.log('[set-session] Incoming session:', session)

  if (!session?.access_token || !session?.refresh_token) {
    console.log('[set-session] Missing access or refresh token')
    return res.status(400).json({ error: 'Missing tokens' })
  }

  const supabase = createPagesServerClient({ req, res })

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  })

  return res.status(200).json({ success: true })
}
