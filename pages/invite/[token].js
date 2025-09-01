// pages/invite/[token].js
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseClient'
import AdSpace from '@/components/AdSpace'

export default function InviteAcceptPage() {
  const router = useRouter()
  const { token } = router.query
  const [invite, setInvite] = useState(null)
  const [club, setClub] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    (async () => {
      setLoading(true)
      const { data: inviteData, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .single()
      if (inviteError || !inviteData || inviteData.accepted) {
        setError('Invalid or expired invite link.')
        setLoading(false)
        return
      }
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invite has expired.')
        setLoading(false)
        return
      }
      setInvite(inviteData)
      // Fetch club info
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', inviteData.club_id)
        .single()
      if (clubData) setClub(clubData)
      setLoading(false)
    })()
  }, [token])

  const handleAccept = async (e) => {
    e.preventDefault()
    setError(null)
    // Register user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password
    })
    if (signUpError) return setError(signUpError.message)

    // Log in
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password
    })
    if (loginError) return setError('Account created, but failed to log in: ' + loginError.message)
    const userId = loginData.user.id

    // Add to club_users
    const { error: linkErr } = await supabase
      .from('club_users')
      .insert([{ user_id: userId, club_id: invite.club_id, role_id: invite.role_id }])
    if (linkErr) return setError(linkErr.message)

    // Mark invite as accepted
    await supabase.from('invites').update({ accepted: true }).eq('id', invite.id)

    // Redirect to club dashboard
    router.push(`/${invite.club_id}`)
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div style={{ color: 'red' }}>{error}</div>
  if (!invite) return null

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <AdSpace location="invite" />
      {club && (
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
          👋 You’ve been invited to join <b>{club.name}</b>
        </h2>
      )}
      <form
        onSubmit={handleAccept}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div>Accepting invite for: <b>{invite.email}</b></div>
        <input
          type="password"
          placeholder="Set password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Create Account &amp; Join Club</button>
      </form>
    </div>
  )
}
