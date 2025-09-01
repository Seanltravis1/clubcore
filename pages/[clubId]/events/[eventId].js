// File: /pages/[clubId]/events/edit/[eventId].js

import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import HomeButton from '@/components/HomeButton';

export async function getServerSideProps(ctx) {
  // Fetch event data using your backend (withClubAuth + supabaseServer)
  // ... (your code to fetch event, clubId, eventId)
  // For brevity, assume you return: { props: { clubId, eventId, event } }
}

export default function EditEventPage({ clubId, eventId, event }) {
  const router = useRouter();
  const [form, setForm] = useState({
    id: eventId, // <-- always include id!
    name: event.name || '',
    date: event.date ? event.date.slice(0, 10) : '',
    start_time: event.start_time || '',
    end_time: event.end_time || '',
    location: event.location || '',
    is_public: !!event.is_public,
    description: event.description || '',
    notes: event.notes || '',
    flyer_url: event.flyer_url || '',
    recipes_url: event.recipes_url || '',
    menu_url: event.menu_url || '',
    sponsors: Array.isArray(event.sponsors)
      ? event.sponsors.join(', ')
      : (event.sponsors || ''),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const sponsorsArr = form.sponsors
      ? form.sponsors.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const res = await fetch(`/api/${clubId}/events/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        sponsors: sponsorsArr,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) {
      setError('Failed to update event: ' + data.error);
      return;
    }
    router.push(`/${clubId}/events`);
  };

  return (
    <Layout>
      <HomeButton />
      <button onClick={() => router.back()}>⬅️ Back</button>
      <h1>Edit Event</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input name="name" placeholder="Event Name" value={form.name} onChange={handleChange} required />
        <input name="date" type="date" value={form.date} onChange={handleChange} required />
        <div style={{ display: 'flex', gap: 8 }}>
          <input name="start_time" type="time" value={form.start_time} onChange={handleChange} placeholder="Start Time" />
          <input name="end_time" type="time" value={form.end_time} onChange={handleChange} placeholder="End Time" />
        </div>
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
        <label>
          <input name="is_public" type="checkbox" checked={form.is_public} onChange={handleChange} />
          {' '}Public Event
        </label>
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
        <input name="flyer_url" placeholder="Flyer URL" value={form.flyer_url} onChange={handleChange} />
        <input name="recipes_url" placeholder="Recipes URL" value={form.recipes_url} onChange={handleChange} />
        <input name="menu_url" placeholder="Menu URL" value={form.menu_url} onChange={handleChange} />
        <input name="sponsors" placeholder="Sponsors (comma separated)" value={form.sponsors} onChange={handleChange} />
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Update Event'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </Layout>
  );
}
