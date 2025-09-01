// components/TrialBanner.js
import { useEffect, useState } from 'react';
import { supabase } from '@utils/supabaseClient';

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('club_users')
        .select('trial_ends_at')
        .eq('user_id', user.id)
        .single();

      if (data?.trial_ends_at) {
        const ends = new Date(data.trial_ends_at);
        const now = new Date();
        const diffDays = Math.ceil((ends - now) / (1000 * 60 * 60 * 24));
        setDaysLeft(diffDays);
      }
    })();
  }, []);

  if (daysLeft === null || daysLeft <= 0) return null;

  return (
    <div style={{ background: '#fffae6', padding: '10px', marginBottom: '20px', textAlign: 'center' }}>
      🕒 Your free trial ends in <strong>{daysLeft}</strong> day{daysLeft !== 1 ? 's' : ''}.<br />
      Upgrade anytime via your account.
    </div>
  );
}
