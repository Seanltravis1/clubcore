import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient'; // 👈 Use your Supabase client!

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState('email'); // email | chooseClub | final
  const [email, setEmail] = useState('');
  const [matchingClubs, setMatchingClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [clubName, setClubName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Find clubs by email (server API)
  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setMatchingClubs([]);
    setSelectedClubId('');
    setClubName('');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch('/api/members-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const { data, error: apiError } = await res.json();

      if (apiError) throw new Error(apiError);

      if (!data || data.length === 0) {
        setError("We couldn't find any clubs with that email. Please contact your club administrator.");
      } else if (data.length === 1) {
        setSelectedClubId(data[0].club_id);
        setClubName(data[0].club_name || '');
        setStep('final');
      } else {
        setMatchingClubs(data);
        setStep('chooseClub');
      }
    } catch (err) {
      setError(err.message || "Failed to check email.");
    }
    setLoading(false);
  }

  // Step 2: Choose club if more than one
  function handleClubChoice(e) {
    const clubId = e.target.value;
    setSelectedClubId(clubId);
    const club = matchingClubs.find(c => c.club_id === clubId);
    setClubName(club?.club_name || '');
  }

  // Step 3: Final signup
  async function handleFinalSignup(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!password.trim()) throw new Error('Password required.');
      const normalizedEmail = email.trim().toLowerCase();

      // Register user with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });
      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error('Signup failed.');

      // Grant access: **NOTE updated API route!**
      const accessRes = await fetch('/api/auth/grant_club_access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, club_id: selectedClubId }),
      });
      const { error: accessError } = await accessRes.json();
      if (accessError) throw new Error(accessError);

      // Log in and redirect (optional)
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (loginError) throw loginError;

      router.push(`/${selectedClubId}`);
    } catch (err) {
      setError(err?.message || "Unknown error during signup.");
    }
    setLoading(false);
  }

  return (
    <Layout>
      <AdSpace location="signup" />
      <div style={{
        maxWidth: 420,
        margin: '30px auto',
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 16px #0001',
        padding: 28
      }}>
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2>Sign Up</h2>
            <label htmlFor="email" style={{ fontWeight: 700 }}>Enter your email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{ padding: 10, fontSize: 16 }}
              autoFocus
            />
            <Button type="primary" disabled={!email || loading}>{loading ? 'Checking...' : 'Next'}</Button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </form>
        )}

        {step === 'chooseClub' && (
          <form onSubmit={e => { e.preventDefault(); if (selectedClubId) setStep('final'); }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2>Select Your Club</h2>
            <label style={{ fontWeight: 700 }}>
              We found your email at multiple clubs.<br />Choose your club to continue:
            </label>
            <select value={selectedClubId} onChange={handleClubChoice} style={{ padding: 10, fontSize: 16 }}>
              <option value="">Select...</option>
              {matchingClubs.map(row => (
                <option key={row.club_id} value={row.club_id}>{row.club_name || row.club_id}</option>
              ))}
            </select>
            <Button type="primary" disabled={!selectedClubId}>Continue</Button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </form>
        )}

        {step === 'final' && (
          <form onSubmit={handleFinalSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2>Set Password for <span style={{ color: "#0077cc" }}>{clubName}</span></h2>
            <label htmlFor="password" style={{ fontWeight: 700 }}>Choose a Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              required
              style={{ padding: 10, fontSize: 16 }}
            />
            <Button type="primary" disabled={!password || loading}>{loading ? 'Creating...' : 'Finish Signup'}</Button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </form>
        )}
      </div>
    </Layout>
  );
}
