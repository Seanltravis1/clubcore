import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/Button';
import AdSpace from '../components/AdSpace';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [clubId, setClubId] = useState(null);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // Get logged in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (user && !userError) {
        setUser(user);

        // Fetch club_id for user
        const { data: userRecord, error: clubUserError } = await supabase
          .from('club_users')
          .select('club_id')
          .eq('user_id', user.id)
          .single();

        if (!clubUserError && userRecord?.club_id) {
          setClubId(userRecord.club_id);

          // Fetch club name
          const { data: clubData, error: clubError } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', userRecord.club_id)
            .single();

          if (!clubError && clubData?.name) {
            setClubName(clubData.name);
          }
        }
      }
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <h1>🏠 Welcome to {clubName || 'ClubCore'}</h1>
      {!user ? (
        <p style={{ color: 'red', marginBottom: 20 }}>
          You are not logged in. <Link href="/login">Login here</Link>
        </p>
      ) : null}

      <AdSpace location="home" />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: 400
      }}>
        {clubId && (
          <>
            <Link href={`/${clubId}/events`} legacyBehavior>
              <Button type="primary">📅 Events</Button>
            </Link> <Link href={`/${clubId}/news`} legacyBehavior>
  <Button type="primary">📰 Club News</Button>
</Link>

            <Link href={`/${clubId}/calendar`} legacyBehavior>
              <Button type="primary">🗓️ Calendar</Button>
            </Link>
            <Link href={`/${clubId}/members`} legacyBehavior>
              <Button type="primary">👥 Members</Button>
            </Link>
            <Link href={`/${clubId}/rentals`} legacyBehavior>
              <Button type="primary">🏢 Rentals</Button>
            </Link>
            {/* ---- MAINTENANCE BUTTON ADDED HERE ---- */}
            <Link href={`/${clubId}/maintenance`} legacyBehavior>
              <Button type="primary">🛠️ Maintenance</Button>
            </Link>
            <Link href={`/${clubId}/finance`} legacyBehavior>
              <Button type="primary">💰 Finance</Button>
            </Link>
            <Link href={`/${clubId}/vendors`} legacyBehavior>
              <Button type="primary">📋 Vendors</Button>
            </Link>
            <Link href={`/${clubId}/reminders`} legacyBehavior>
              <Button type="primary">🔔 Reminders</Button>
            </Link>
            <Link href={`/${clubId}/documents`} legacyBehavior>
              <Button type="primary">📂 Documents</Button>
            </Link>
            <Link href={`/${clubId}/ads`} legacyBehavior>
              <Button type="primary">📢 Ads Manager</Button>
            </Link>
          </>
        )}
      </div>
    </Layout>
  );
}
