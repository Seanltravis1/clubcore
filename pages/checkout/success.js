// pages/checkout/success.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@utils/supabaseClient';
import Layout from 'components/Layout';
import Button from 'components/Button';

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const extendTrial = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newTrialEnd = new Date();
      newTrialEnd.setFullYear(newTrialEnd.getFullYear() + 1);

      await supabase
        .from('club_users')
        .update({ trial_ends_at: newTrialEnd.toISOString() })
        .eq('user_id', user.id);

      setTimeout(() => {
        router.push('/select-club');
      }, 3000);
    };

    extendTrial();
  }, [router]);

  return (
    <Layout>
      <h1>✅ Payment Successful</h1>
      <p>Your membership has been activated. Redirecting you to your dashboard...</p>
      <Button onClick={() => router.push('/select-club')}>🚀 Go Now</Button>
    </Layout>
  );
}
