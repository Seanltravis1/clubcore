import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function EventsPage({ params }) {
  const supabase = createServerComponentClient({ cookies });
  const clubId = params.clubId;

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return redirect('/login');
  }

  const {
    data: clubUser,
    error: clubUserError,
  } = await supabase
    .from('club_users')
    .select('id, role, club_id')
    .eq('user_id', session.user.id)
    .eq('club_id', clubId)
    .single();

  if (!clubUser || clubUserError) {
    return redirect('/not-authorized');
  }

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  if (eventsError) {
    return <div>Error loading events: {eventsError.message}</div>;
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Events for Club {clubId}</h1>
      <ul>
        {events?.map((event) => (
          <li key={event.id} className="mb-2 border p-2 rounded">
            <div className="font-semibold">{event.title}</div>
            <div className="text-sm text-gray-500">{event.date}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
