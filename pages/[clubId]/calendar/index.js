import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import { withClubAuth } from '@/utils/withClubAuth';
import { getServerSupabase } from '@/lib/supabaseServer';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let current = new Date(startDate);
  const last = new Date(endDate);
  while (current <= last) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if (!result) return { notFound: true };
  if ('redirect' in result) return result;

  const { clubId } = result.props;
  const supabase = getServerSupabase(ctx);

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, date, location')
    .eq('club_id', clubId)
    .order('date', { ascending: true });

  const { data: rentals, error: rentalsError } = await supabase
    .from('rentals')
    .select('*')
    .eq('club_id', clubId)
    .order('start_date', { ascending: true });

  if (eventsError || rentalsError) {
    return {
      props: {
        ...result.props,
        events: events || [],
        rentals: rentals || [],
        error: eventsError?.message || rentalsError?.message || 'Error loading data',
      }
    };
  }

  return {
    props: {
      ...result.props,
      events: events || [],
      rentals: rentals || [],
    }
  };
};

export default function JointCalendarPage({ events: ssrEvents = [], rentals: ssrRentals = [], clubId, error }) {
  const [events, setEvents] = useState(ssrEvents);
  const [rentals, setRentals] = useState(ssrRentals);
  const router = useRouter();

  if (error) {
    return (
      <Layout>
        <div style={{ maxWidth: 950, margin: "0 auto", marginTop: 24, marginBottom: 18 }}>
          <Link href={`/${clubId}`} legacyBehavior>
            <button style={{ fontSize: 19, marginBottom: 16, border: "1px solid #ccc", borderRadius: 8, background: "#fff", padding: "8px 18px", cursor: "pointer" }}>
              🏠 Home
            </button>
          </Link>
        </div>
        <h1>📅 Combined Calendar</h1>
        <div style={{ color: 'red', margin: 24 }}>Error: {error}</div>
      </Layout>
    );
  }

  const calendarEvents = [
    ...events.map(e => ({
      id: e.id,
      title: e.name,
      start: new Date(e.date),
      end: new Date(e.date),
      type: 'event',
      location: e.location,
    })),
    ...rentals.flatMap(rental => {
      const start = rental.start_date ? new Date(rental.start_date) : null;
      const end = rental.end_date ? new Date(rental.end_date) : start;
      if (!start || !end) return [];
      const dates = getDatesInRange(start, end);
      return dates.map(date => ({
        id: rental.id,
        title: rental.item_name || 'Rental',
        start: date,
        end: date,
        allDay: true,
        type: 'rental',
        rental,
      }));
    }),
  ];

  const combinedList = [
    ...events.map(ev => ({ ...ev, type: 'event', sortDate: new Date(ev.date) })),
    ...rentals.map(r => ({ ...r, type: 'rental', sortDate: new Date(r.start_date) })),
  ].sort((a, b) => a.sortDate - b.sortDate);

  const onSelectEvent = (event) => {
    if (event.type === 'event') {
      router.push(`/${clubId}/events/edit/${event.id}`);
    } else if (event.type === 'rental') {
      router.push(`/${clubId}/rentals/view/${event.id}`);
    }
  };

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
  <button
    style={{
      fontSize: 19,
      marginBottom: 16,
      border: "1px solid #ccc",
      borderRadius: 8,
      background: "#f3f4f6",    // <--- grey background
      padding: "8px 18px",
      cursor: "pointer"
    }}
  >
    🏠 Home
  </button>
</Link>

      </div>
      {/* 🟢 Banner Ads */}
      <AdSpace location="calendar" clubId={clubId} />

      <h1>📅 Combined Events & Rentals Calendar</h1>

      <div style={{ marginBottom: 32 }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          style={{ height: 500 }}
          onSelectEvent={onSelectEvent}
        />
      </div>

      <h2>Upcoming Events & Rentals</h2>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
        <Link href={`/${clubId}/events/new`} legacyBehavior>
          <button>➕ Add Event</button>
        </Link>
        <Link href={`/${clubId}/rentals/new`} legacyBehavior>
          <button>➕ Add Rental</button>
        </Link>
      </div>

      <table style={{
        width: '100%', marginTop: 24, background: '#fff', borderRadius: 12,
        boxShadow: '0 1px 8px #0001', borderCollapse: 'collapse', overflow: 'hidden'
      }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={th}>Date</th>
            <th style={th}>Name</th>
            <th style={th}>Type</th>
            <th style={th}>Location</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {combinedList.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#999' }}>No upcoming events or rentals.</td></tr>
          ) : combinedList.map(item => (
            <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{formatPrettyDate(item.date || item.start_date)}</td>
              <td style={td}>{item.name || item.item_name}</td>
              <td style={td}>{item.type === 'event' ? 'Event' : 'Rental'}</td>
              <td style={td}>{item.location || item.bar || '-'}</td>
              <td style={td}>
                {item.type === 'event' ? (
                  <Link href={`/${clubId}/events/edit/${item.id}`} legacyBehavior>
                    <button style={{ marginRight: 8 }}>✏️ Edit</button>
                  </Link>
                ) : (
                  <Link href={`/${clubId}/rentals/view/${item.id}`} legacyBehavior>
                    <button style={{ marginRight: 8 }}>👁️ View</button>
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

function formatPrettyDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date)) return '-';
  const day = date.getDate();
  const ordinal = (n) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${day}${ordinal(day)} ${year}`;
}

const th = {
  padding: '10px 12px', fontWeight: 600, background: '#f1f5f9', borderBottom: '2px solid #e5e7eb', textAlign: 'left'
};
const td = {
  padding: '10px 12px', background: '#fff'
};
