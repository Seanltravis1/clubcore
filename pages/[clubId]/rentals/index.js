import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import AdSpace from '@/components/AdSpace';
import hasAccess from '@/utils/hasAccess';
import { withClubAuth } from '@/utils/withClubAuth';
import { getServerSupabase } from '@/lib/supabaseServer';

// Calendar
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
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
  if ('redirect' in result) return result;
  const { clubId } = result.props;

  const supabase = getServerSupabase(ctx);
  const { data: rentals, error } = await supabase
    .from('rentals')
    .select('*')
    .eq('club_id', clubId)
    .order('start_date', { ascending: true });

  if (error) {
    return { props: { ...result.props, rentals: [], error: error.message } };
  }

  return {
    props: { ...result.props, rentals: rentals || [] },
  };
};

export default function RentalsPage({ clubId, clubUser, permissions, rentals: ssrRentals, error }) {
  const router = useRouter();
  const [rentals, setRentals] = useState(ssrRentals);

  // 🟢 Delete rental handler
  async function handleDelete(rentalId) {
    if (!window.confirm('Are you sure you want to delete this rental?')) return;
    const res = await fetch(`/api/${clubId}/rentals/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rentalId }),
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.error || 'Delete failed.');
      return;
    }
    setRentals(rentals.filter(r => r.id !== rentalId));
  }

  if (!hasAccess(clubUser, permissions, 'rentals', 'view')) {
    return (
      <Layout>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to view rentals.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Button onClick={() => window.history.back()}>⬅️ Back</Button>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <h1>Rentals</h1>
        <p style={{ color: 'red' }}>Error loading rentals: {error}</p>
      </Layout>
    );
  }

  const calendarEvents = rentals.flatMap(rental => {
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
      rental,
    }));
  });

  const onSelectEvent = (event) => {
    router.push(`/${clubId}/rentals/view/${event.id}`);
  };

  return (
    <Layout>
      <div style={{ marginBottom: 16 }}>
        <Button type="outline" onClick={() => window.history.back()}>⬅️ Back</Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="temple">🏛️</span> Rentals
        </h1>
        <Link href={`/${clubId}/rentals/new`} legacyBehavior>
          <Button type="success">➕ New Rental</Button>
        </Link>
      </div>

      <AdSpace location="rentals" clubId={clubId} />

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

      <h2>Rental List</h2>
      <table style={{
        width: '100%', marginTop: 24, background: '#fff', borderRadius: 12,
        boxShadow: '0 1px 8px #0001', borderCollapse: 'collapse', overflow: 'hidden'
      }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={th}>Renter Name</th>
            <th style={th}>Event Type</th>
            <th style={th}>Start Date</th>
            <th style={th}>End Date</th>
            <th style={th}>Amount Still Due</th>
            <th style={th}>Location</th>
            <th style={th}>Bar</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rentals.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#999' }}>No rentals found.</td>
            </tr>
          ) : rentals.map(rental => (
            <tr key={rental.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{rental.item_name}</td>
              <td style={td}>{rental.event_type || '-'}</td>
              <td style={td}>{formatPrettyDate(rental.start_date)}</td>
              <td style={td}>{formatPrettyDate(rental.end_date)}</td>
              <td style={td}>${Math.max((rental.amount_due || 0) - (rental.amount_paid || 0), 0)}</td>
              <td style={td}>{rental.location || '-'}</td>
              <td style={td}>{rental.bar ? 'Yes' : 'No'}</td>
              <td style={td}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Link href={`/${clubId}/rentals/view/${rental.id}`} legacyBehavior>
                    <Button size="sm">View</Button>
                  </Link>
                  {hasAccess(clubUser, permissions, 'rentals', 'edit') && (
                    <Link href={`/${clubId}/rentals/edit/${rental.id}`} legacyBehavior>
                      <Button size="sm" type="outline">Edit</Button>
                    </Link>
                  )}
                  {hasAccess(clubUser, permissions, 'rentals', 'edit') && (
                    <Button
                      size="sm"
                      type="danger"
                      onClick={() => handleDelete(rental.id)}
                    >Delete</Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

const th = {
  padding: '10px 12px', fontWeight: 600, background: '#f1f5f9', borderBottom: '2px solid #e5e7eb', textAlign: 'left'
};
const td = {
  padding: '10px 12px', background: '#fff'
};
