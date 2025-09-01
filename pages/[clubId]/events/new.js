import Layout from '@/components/Layout';
import { withClubAuth } from '@/utils/withClubAuth';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import HomeButton from '@/components/HomeButton';
import Button from '@/components/Button';

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if ('redirect' in result) return result;
  return { props: { clubId: result.props.clubId } };
};

export default function NewEvent({ clubId }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    date: '',        // <--- start date (column: "date")
    start_time: '',
    end_date: '',    // <--- end date (column: "end_date")
    end_time: '',
    location: '',
    is_public: false,
    description: '',
    sponsors: '',
    notes: '',
  });
  const [flyers, setFlyers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handles all non-file inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handles multi-file input
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'flyers') setFlyers(Array.from(files));
    if (name === 'recipes') setRecipes(Array.from(files));
    if (name === 'menus') setMenus(Array.from(files));
  };

  // Upload each file, return array of public URLs
  async function uploadFiles(bucket, clubId, files, label) {
    if (!files || files.length === 0) return [];
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop();
      const path = `${clubId}/events/${label}-${Date.now()}-${i}.${ext}`;
      let { error } = await supabase.storage.from(bucket).upload(path, file);
      if (!error) {
        urls.push(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`);
      }
    }
    return urls;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const flyer_urls = await uploadFiles('flyers', clubId, flyers, 'flyer');
    const recipes_urls = await uploadFiles('recipes', clubId, recipes, 'recipes');
    const menu_urls = await uploadFiles('menus', clubId, menus, 'menu');

    const { error: insertError } = await supabase
      .from('events')
      .insert({
        name: form.name,
        title: form.name,
        date: form.date,                 // start date (column: "date")
        start_time: form.start_time,
        end_date: form.end_date,         // end date (column: "end_date")
        end_time: form.end_time,
        location: form.location,
        is_public: form.is_public,
        description: form.description,
        notes: form.notes,
        flyer_url: flyer_urls,
        recipes_url: recipes_urls,
        menu_url: menu_urls,
        sponsors: form.sponsors,
        club_id: clubId,
      });

    setLoading(false);
    if (insertError) {
      setError(`Failed to create event: ${insertError.message}`);
      return;
    }
    router.push(`/${clubId}/events`);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <HomeButton />
        <Button type="outline" style={{ marginLeft: 16 }} onClick={() => router.back()}>⬅️ Back</Button>
      </div>
      <h1 style={{ textAlign: 'center', marginBottom: 30, fontSize: 34, fontWeight: 700 }}>Create New Event</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 540,
          margin: '0 auto',
          padding: 32,
          borderRadius: 16,
          boxShadow: '0 2px 18px #0002',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          fontSize: 20,
        }}
      >
        <label style={{ fontWeight: 600 }}>
          Event Name
          <input
            name="name"
            placeholder="Event Name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ width: '100%', fontSize: 20, padding: 10, borderRadius: 8, marginTop: 6 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 14 }}>
          <label style={{ flex: 1, fontWeight: 600 }}>
            Start Date
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
              style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }}
            />
          </label>
          <label style={{ flex: 1, fontWeight: 600 }}>
            Start Time
            <input
              name="start_time"
              type="time"
              value={form.start_time}
              onChange={handleChange}
              required
              style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <label style={{ flex: 1, fontWeight: 600 }}>
            End Date
            <input
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
              required
              style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }}
            />
          </label>
          <label style={{ flex: 1, fontWeight: 600 }}>
            End Time
            <input
              name="end_time"
              type="time"
              value={form.end_time}
              onChange={handleChange}
              required
              style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }}
            />
          </label>
        </div>
        <label style={{ fontWeight: 600 }}>
          Location
          <input
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
            style={{ width: '100%', fontSize: 20, padding: 10, borderRadius: 8, marginTop: 6 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
          <input
            type="checkbox"
            name="is_public"
            checked={form.is_public}
            onChange={handleChange}
            style={{ width: 20, height: 20 }}
          />
          Public Event
        </label>
        <label style={{ fontWeight: 600 }}>
          Description
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            style={{ width: '100%', fontSize: 18, padding: 10, borderRadius: 8, marginTop: 6, resize: 'vertical' }}
          />
        </label>
        <label style={{ fontWeight: 600 }}>
          Notes
          <textarea
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            style={{ width: '100%', fontSize: 18, padding: 10, borderRadius: 8, marginTop: 6, resize: 'vertical' }}
          />
        </label>
        <label style={{ fontWeight: 600 }}>
          Flyer(s)
          <input
            name="flyers"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            multiple
            style={{ width: '100%', fontSize: 18, marginTop: 6 }}
          />
        </label>
        <label style={{ fontWeight: 600 }}>
          Recipes (PDF/TXT)
          <input
            name="recipes"
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            multiple
            style={{ width: '100%', fontSize: 18, marginTop: 6 }}
          />
        </label>
        <label style={{ fontWeight: 600 }}>
          Menu (PDF/TXT)
          <input
            name="menus"
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            multiple
            style={{ width: '100%', fontSize: 18, marginTop: 6 }}
          />
        </label>
        <label style={{ fontWeight: 600 }}>
          Sponsors <span style={{ color: '#888', fontWeight: 400, fontSize: 16 }}>(comma separated)</span>
          <input
            name="sponsors"
            placeholder="Sponsors"
            value={form.sponsors}
            onChange={handleChange}
            style={{ width: '100%', fontSize: 20, padding: 10, borderRadius: 8, marginTop: 6 }}
          />
        </label>
        <Button type="primary" disabled={loading} style={{ fontSize: 22, padding: '12px 0', borderRadius: 10 }}>
          {loading ? 'Creating...' : 'Create Event'}
        </Button>
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
      </form>
    </Layout>
  );
}
