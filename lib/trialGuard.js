import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export async function trialGuard(ctx) {
  if (!ctx?.req || !ctx?.res) {
    console.log('[trialGuard] Missing req/res in ctx')
    return false
  }

  const supabase = createPagesServerClient(ctx)

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  console.log('[trialGuard] User in GSSP:', user)

  if (error || !user) {
    console.log('[trialGuard] No user found:', error)
    return false
  }

  const { data: clubUser, error: clubUserError } = await supabase
    .from('club_users')
    .select('club_id')
    .eq('user_id', user.id)
    .single()

  console.log('[trialGuard] clubUser:', clubUser)
  if (clubUserError) console.error('[trialGuard] clubUserError:', clubUserError)

  if (!clubUser?.club_id) {
    console.log('[trialGuard] No club found for user.')
    return false
  }

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('trial_ends_at')
    .eq('id', clubUser.club_id)
    .single()

  console.log('[trialGuard] club:', club)
  if (clubError) console.error('[trialGuard] clubError:', clubError)

  const now = new Date()
  const trialValid = !!club?.trial_ends_at && new Date(club.trial_ends_at) > now

  console.log('[trialGuard] Now:', now.toISOString())
  console.log('[trialGuard] trial_ends_at:', club?.trial_ends_at)
  console.log('[trialGuard] Trial valid:', trialValid)

  return trialValid
}
