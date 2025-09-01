import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import AdSpace from '@/components/AdSpace';
import Link from 'next/link';
import { withClubAuth } from '@/utils/withClubAuth';
import { getServerSupabase } from '@/lib/supabaseServer';
import { supabase } from '@/lib/supabase';

// --------- SSR: Fetch Club Name & User ---------
export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if (!result) return { notFound: true };
  if ('redirect' in result) return result;

  const { clubId, clubUser } = result.props;

  const supabaseServer = getServerSupabase(ctx);
  const { data: clubData } = await supabaseServer
    .from('clubs')
    .select('name')
    .eq('id', clubId)
    .single();

  return {
    props: {
      clubId,
      clubUser,
      clubName: clubData?.name || '',
    }
  };
};

export default function ClubDashboard({ clubId, clubUser, clubName }) {
  const [user, setUser] = useState(null);

  // Client auth check (for the warning only)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <Layout>
      {/* Banner: use 'home' and pass clubId so club-specific ads show */}
      <AdSpace location="home" clubId={clubId} />

      <div
        style={{
          maxWidth: 700,
          margin: '38px auto 0',
          background: '#fff',
          padding: 32,
          borderRadius: 16,
          boxShadow: '0 4px 16px #0001'
        }}
      >
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 10 }}>
          🏠 Welcome to {clubName || 'ClubCore'}
        </h1>

        <h2 style={{ fontWeight: 500, fontSize: 20, margin: '14px 0 10px' }}>
          {clubUser?.role ? `You are logged in as: ${clubUser.role}` : ''}
        </h2>

        {!user && (
          <p style={{ color: 'red', marginBottom: 18, fontSize: 17 }}>
            You are not logged in. <Link href="/login">Login here</Link>
          </p>
        )}

        <p style={{ fontSize: 17, color: '#444' }}>
          Use the quick links below to manage your club. You can view, add, or edit events,
          members, rentals, and more.
        </p>

        {/* Quick Nav Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxWidth: 400,
            margin: '28px auto 0'
          }}
        >
          <Link href={`/${clubId}/events`} legacyBehavior>
            <Button type="primary">📅 Events</Button>
          </Link>
          <Link href={`/${clubId}/news`} legacyBehavior>
            <Button type="primary">📰 Club News</Button>
          </Link>
          <Link href={`/${clubId}/calendar`} legacyBehavior>
            <Button type="primary">🗓️ Calendar</Button>
          </Link>
          <Link href={`/${clubId}/members`} legacyBehavior>
            <Button type="primary">👥 Members</Button>
          </Link>
          <Link href={`/${clubId}/rentals`} legacyBehavior>
            <Button type="primary">🏛 Rentals</Button>
          </Link>
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
        </div>
      </div>
    </Layout>
  );
}
