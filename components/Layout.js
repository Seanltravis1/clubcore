// components/Layout.js
import { useEffect, useState } from 'react';
import LogoutButton from './LogoutButton';
import { supabase } from '../lib/supabase';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '30px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>ClubCore</h1>
        {user && <LogoutButton />}
      </header>

      {children}
    </div>
  );
}