// File: /pages/signup.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';

export default function ClubSignupPage() {
  const router = useRouter();
  const [clubName, setClubName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!clubName.trim() || !adminEmail.trim() || !password.trim()) {
        throw new Error('All fields are required.');
      }

      // 1. Create the admin user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail.trim().toLowerCase(),
        password,
      });
      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error('Signup failed.');

      // 2. Create the club (and capture the new club's ID)
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .insert([{ name: clubName.trim() }])
        .select('id')
        .single();
      if (clubError) throw clubError;
      const clubId = clubData.id;

      // 3. Find/create the "admin" role for this club (one-time, per club)
      // Try to find an admin role first
      let { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('club_id', clubId)
        .eq('name', 'admin')
        .single();

      if (roleError && roleError.code !== 'PGRST116') throw roleError; // Ignore "no rows" error

      // If no admin role exists, create it
      let roleId = role?.id;
      if (!roleId) {
        const { data: newRole, error: newRoleError } = await supabase
          .from('roles')
          .insert([{ club_id: clubId, name: 'admin' }])
          .select('id')
          .single();
        if (newRoleError) throw newRoleError;
        roleId = newRole.id;
      }

      // 4. Add the user to club_users as an admin
      const { error: linkError } = await supabase
        .from('club_users')
        .insert([{ user_id: userId, club_id: clubId, role_id: roleId }]);
      if (linkError) throw linkError;

      // 5. Optionally, auto-log in and redirect
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim().toLowerCase(),
        password,
      });
      if (loginError) throw loginError;

      router.push(`/${clubId}`);
    } catch (err) {
      setError(err?.message || "Unknown error during club signup.");
    }
    setLoading(false);
  }

  return (
    <Layout>
      <AdSpace location="signup-club" />
      <div style={{
        maxWidth: 420,
        margin: '30px auto',
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 16px #0001',
        padding: 28
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2>Register Your Club</h2>
          <label htmlFor="clubName" style={{ fontWeight: 700 }}>Club Name</label>
          <input
            id="clubName"
            type="text"
            value={clubName}
            onChange={e => setClubName(e.target.value)}
            placeholder="Your Club Name"
            required
            style={{ padding: 10, fontSize: 16 }}
            autoFocus
          />
          <label htmlFor="adminEmail" style={{ fontWeight: 700 }}>Admin Email</label>
          <input
            id="adminEmail"
            type="email"
            value={adminEmail}
            onChange={e => setAdminEmail(e.target.value)}
            placeholder="admin@email.com"
            required
            style={{ padding: 10, fontSize: 16 }}
          />
          <label htmlFor="password" style={{ fontWeight: 700 }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Choose a strong password"
            required
            style={{ padding: 10, fontSize: 16 }}
          />
          <Button type="primary" disabled={loading}>{loading ? 'Creating...' : 'Register Club'}</Button>
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </form>
      </div>
    </Layout>
  );
}
