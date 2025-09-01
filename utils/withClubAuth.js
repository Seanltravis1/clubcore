import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { validate as isUUID } from 'uuid';

const IGNORED_ROUTES = ['favicon.ico', 'not-authorized', 'robots.txt', 'api', undefined, null];

export async function withClubAuth(ctx) {
  const { req, res, params } = ctx;
  const supabase = createPagesServerClient({ req, res });

  // 1. Require an authenticated session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // 2. Validate clubId param (ignore static and known non-clubId routes)
  const clubId = params?.clubId;
  if (!clubId || !isUUID(clubId)) {
    if (!IGNORED_ROUTES.includes(clubId)) {
      console.warn('❌ Invalid clubId:', clubId);
    }
    return { redirect: { destination: '/not-authorized', permanent: false } };
  }

  // 3. Fetch the user's club role and related role name
  const { data: clubUser, error } = await supabase
    .from('club_users')
    .select('*, roles:role_id(name)')
    .eq('user_id', session.user.id)
    .eq('club_id', clubId)
    .maybeSingle();

  if (!clubUser || error) {
    console.warn('❌ clubUser error:', error);
    return { redirect: { destination: '/not-authorized', permanent: false } };
  }

  // Always set clubUser.role to the resolved role name from roles table
  const roleName = clubUser.roles?.name || 'member';

  // 4. Permissions map, now including Club News!
  const permissions = {
    members:     { view: ['admin', 'member'], edit: ['admin'], add: ['admin'] },
    events:      { view: ['admin', 'member'], edit: ['admin'], add: ['admin'] },
    calendar:    { view: ['admin', 'member'], add: ['admin'] },
    rentals:     { view: ['admin', 'member'], edit: ['admin'], add: ['admin'] },
    finance:     { view: ['admin', 'member'], edit: ['admin'], add: ['admin'] },
    vendors:     { view: ['admin', 'member'], edit: ['admin'], add: ['admin'], delete: ['admin'] },
    reminders:   { view: ['admin', 'member'], edit: ['admin'], add: ['admin'] },
    documents:   { view: ['admin', 'member'], edit: ['admin'], add: ['admin'] },
    maintenance: { view: ['admin', 'member'], edit: ['admin'], add: ['admin'], delete: ['admin'] },
    'ads-manager': { view: ['admin'] },
    // 📰 Club News permissions (add/edit/delete only for admin; all members can view)
    news: {
      view: ['admin', 'member'],
      add: ['admin'],
      edit: ['admin'],
      delete: ['admin'],
    },
  };

  return {
    props: {
      user: session.user,
      clubUser: {
        ...clubUser,
        role: roleName,
      },
      clubId,
      permissions,
    },
  };
}

export const getServerSideProps = withClubAuth;
