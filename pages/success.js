// pages/success.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@components/Layout';
import Button from '@components/Button';
import AdSpace from '@components/AdSpace';
import { supabase } from '@utils/supabaseClient';

export default function SuccessPage() {
  const router = useRouter();
  const [clubId, setClubId] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('club_users')
          .select('club_id')
          .eq('user_id', user.id)
          .single();

        if (data?.club_id) setClubId(data.club_id);
      }
    })();
  }, []);

  return (
    <Layout>
      <h1 style={{ marginBottom: '1rem' }}>🎉 Welcome to ClubCore</h1>
      <p style={{ marginBottom: '2rem' }}>Your account has been created and you're ready to go.</p>

      <AdSpace location="success" />

      {clubId && (
        <Button type="primary" onClick={() => router.push(`/${clubId}`)}>
          🏠 Go to My Club
        </Button>
      )}
    </Layout>
  );
}
