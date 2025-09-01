// pages/select-club.js
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '@components/Layout';
import Button from '@components/Button';
import AdSpace from '@components/AdSpace';

export default function SelectClubPage() {
  const router = useRouter();
  const [clubId, setClubId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (clubId.trim()) {
      router.push(`/${clubId.trim()}`);
    }
  };

  return (
    <Layout>
      <h1 style={{ marginBottom: '1rem' }}>🏢 Select Your Club</h1>
      <AdSpace location="select-club" />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px' }}>
        <label>
          Club ID:
          <input
            type="text"
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            placeholder="e.g. demo-club"
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </label>
        <Button type="primary">➡️ Go to Club</Button>
      </form>
    </Layout>
  );
}
