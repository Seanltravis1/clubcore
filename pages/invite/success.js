// pages/invite/success.js
import Link from 'next/link'

export default function InviteSuccess() {
  return (
    <div style={{
      maxWidth: 400,
      margin: '3rem auto',
      padding: 32,
      border: '1px solid #eee',
      borderRadius: 12,
      textAlign: 'center'
    }}>
      <h2 style={{ fontSize: '2rem', marginBottom: 20 }}>🎉 Welcome to ClubCore!</h2>
      <p>Your account has been created and you’ve joined your club.</p>
      <p style={{ margin: '1.5rem 0' }}>You can now log in below:</p>
      <Link href="/login" legacyBehavior>
        <a style={{
          display: 'inline-block',
          padding: '10px 24px',
          background: '#6C47FF',
          color: 'white',
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: 'none'
        }}>➡️ Go to Login</a>
      </Link>
    </div>
  )
}
