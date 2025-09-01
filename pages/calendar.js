// pages/calendar.js

import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export const getServerSideProps = async (ctx) => {
  const { req, res } = ctx;
  const supabase = createPagesServerClient({ req, res });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session?.user) {
    console.warn('🔒 No session. Redirecting to /login');
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const { data: clubUser, error: clubUserError } = await supabase
    .from('club_users')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const clubId = clubUser?.club_id;

  if (!clubId || clubUserError) {
    console.error('❌ Invalid or missing clubId from clubUser:', clubUser);
    return {
      redirect: {
        destination: '/not-authorized',
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: `/${clubId}/calendar`,
      permanent: false,
    },
  };
};

export default function CalendarRedirectPage() {
  return null;
}
