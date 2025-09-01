import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import Button from '@/components/Button';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';

// Calendar imports
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import addDays from 'date-fns/addDays';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// -------- SSR: Fetch events --------
export const getServerSideProps = async (ctx) => {
  try {
    const result = await withClubAuth(ctx);
    if (!result) return { notFound: true };
    if ('redirect' in result) return result;

    const { clubId } = result.props;

    const supabase = getServerSupabase(ctx);
    const { data: events, error } = await supabase
      .from('events')
      .select('id, name, date, end_date, location')
      .eq('club_id', clubId)
      .order('date', { ascending: true });

    if (error) return { props: { error: error.message } };

    return {
      props: {
        ...result.props,
        events: events || [],
      }
    };
  } catch (e) {
    return { props: { error: e.message || 'Unknown server error' } };
  }
};

export default function EventsCalendarPage({ events: ssrEvents = [], clubId, error }) {
  const [events, setEvents] = useState(ssrEvents);
  const router = useRouter();

  // Expand events spanning multiple days into multiple calendar events (one per day)
  const expandEvents = (events) => {
    const expanded = [];
    events.forEach(e => {
      const startDate = new Date(e.date);
      const endDate = e.end_date ? new Date(e.end_date) : startDate;
      const lastDate = endDate < startDate ? startDate : endDate;
      const dayCount = Math.floor((lastDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      for (let i = 0; i < dayCount; i++) {
        const currentDate = addDays(startDate, i);
        expanded.push({
          id: e.id,
          title: e.name,
          start: currentDate,
          end: currentDate,
          location: e.location,
        });
      }
    });
    return expanded;
  };

  const calendarEvents = expandEvents(events);

  const onSelectEvent = (event) => {
    router.push(`/${clubId}/events/edit/${event.id}`);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    const res = await fetch(`/api/${clubId}/events/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId }),
    });
    const data = await res.json();
    if (!data.success) return alert(data.error || 'Delete failed.');
    setEvents(events.filter(e => e.id !== eventId));
  };

  if (error) {
    return (
      <Layout>
        <div style={{ maxWidth: 950, margin: "0 auto", marginTop: 24, marginBottom: 18 }}>
          <Link href={`/${clubId}`} legacyBehavior>
            <Button type="outline" style={{ fontSize: 19 }}>
              🏠 Home
            </Button>
          </Link>
        </div>
        <h1>Events Calendar</h1>
        <div style={{ color: 'red', margin: 24 }}>Error: {error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* --- Home button row, top-left only --- */}
      <div style={{
        maxWidth: 950,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: 24,
        marginBottom: 18
      }}>
        <Link href={`/${clubId}`} legacyBehavior>
          <Button type="outline" style={{ fontSize: 19 }}>
            🏠 Home
          </Button>
        </Link>
      </div>

      <AdSpace location="events" clubId={clubId} />

      <h1>📅 Events Calendar</h1>
      <div style={{ marginBottom: 32 }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          style={{ height: 500, marginBottom: 32 }}
          onSelectEvent={onSelectEvent}
        />
      </div>

      <h2>Upcoming Events</h2>
      <Link href={`/${clubId}/events/new`} legacyBehavior>
        <button style={{ margin: '16px 0' }}>➕ Add Event</button>
      </Link>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center' }}>No events found.</td>
            </tr>
          ) : (
            events.map(ev => (
              <tr key={ev.id}>
                <td>{ev.date}</td>
                <td>{ev.name}</td>
                <td>{ev.location}</td>
                <td>
                  <Link href={`/${clubId}/events/edit/${ev.id}`} legacyBehavior>
                    <button style={{ marginRight: 8 }}>✏️ Edit</button>
                  </Link>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    style={{ color: 'white', background: 'red' }}
                  >🗑️ Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Layout>
  );
}
