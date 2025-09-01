
// File: /pages/index.js

import Link from 'next/link';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import AdSpace from '@/components/AdSpace';

export default function LandingPage() {
  return (
    <Layout>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉 Welcome to ClubCore</h1>

      <p style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
        ClubCore is the all-in-one platform to manage your social club — events, rentals, members, vendors, finances, reminders, and more.<br />
        Whether you're running a VFW, Polish Hall, or Elk Lodge, we help your club thrive.
      </p>

      <AdSpace location="landing" />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '300px',
        marginTop: '2rem'
      }}>
        <Link href="/login" passHref legacyBehavior>
          <Button type="primary">🔐 Log In</Button>
        </Link>

        <Link href="/signup" passHref legacyBehavior>
          <Button type="primary">🏛️ Sign Up Your Club</Button>
        </Link>

        <Link href="/member-signup" passHref legacyBehavior>
          <Button type="outline">👤 Member Sign Up</Button>
        </Link>
      </div>

      <footer style={{ marginTop: '3rem', fontSize: '0.875rem', color: '#666' }}>
        Questions? Email <a href="mailto:support@clubcore.app">support@clubcore.app</a>
      </footer>
    </Layout>
  );
}
