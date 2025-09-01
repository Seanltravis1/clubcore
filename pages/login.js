// pages/login.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import AdSpace from '@/components/AdSpace'
import { supabase } from '@/utils/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    console.log('[Login] Response data:', data)
    if (loginError) return setError(loginError.message)

    const { session } = data
    if (!session) return setError('Login failed')

    console.log('[Login] Sending to /api/auth/set-session:', session)

    const res = await fetch('/api/auth/set-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'SIGNED_IN', session })
    })

    if (!res.ok) {
      const msg = await res.text()
      console.error('[Login] Failed session post', msg)
      return setError('Failed to persist session')
    }

    const { data: clubUser, error: clubErr } = await supabase
      .from('club_users')
      .select('club_id, role_id')
      .eq('user_id', session.user.id)
      .single()

    if (clubErr || !clubUser?.club_id || !clubUser?.role_id) return setError('User is missing club or role')

    const { data: permissions } = await supabase
      .from('permissions')
      .select('section, action')
      .eq('role_id', clubUser.role_id)

    const structured = {}
    permissions?.forEach(({ section, action }) => {
      if (!structured[section]) structured[section] = {}
      if (!structured[section][action]) structured[section][action] = []
      structured[section][action].push('admin') // static role for now
    })

    localStorage.setItem('clubcore-role', 'admin')
    localStorage.setItem('clubcore-permissions', JSON.stringify(structured))

    router.push(`/${clubUser.club_id}`)
  }

  return (
    <Layout>
      <h1 style={{ marginBottom: '1rem' }}>🔐 Log In to ClubCore</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <AdSpace location="login" />
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <Button type="primary">➡️ Log In</Button>
      </form>
    </Layout>
  )
}
