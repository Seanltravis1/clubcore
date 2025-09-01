// components/InviteUserForm.js
import { useState } from 'react'
import { supabase } from '@/utils/supabaseClient'

export default function InviteUserForm({ clubId, roleId }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  const handleInvite = async (e) => {
    e.preventDefault()
    setMessage('')
    setSending(true)
    try {
      // Generate a unique invite token (fallback for older browsers)
      const token = (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now())
      // Insert invite into the invites table
      const { error } = await supabase.from('invites').insert([
        { email, club_id: clubId, role_id: roleId, token }
      ])
      if (error) throw error

      // DEV: Show the invite link for local testing (in production: send via email)
      const inviteLink = `${window.location.origin}/invite/${token}`
      setMessage(`Invite sent! (Dev/test link: ${inviteLink})`)
    } catch (err) {
      setMessage(`Failed: ${err.message}`)
    }
    setSending(false)
    setEmail('')
  }

  return (
    <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="email"
        placeholder="User email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ padding: 4 }}
      />
      <button type="submit" disabled={sending || !email}>Send Invite</button>
      {message && <span style={{ marginLeft: 8 }}>{message}</span>}
    </form>
  )
}
