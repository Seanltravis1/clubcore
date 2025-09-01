import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import HomeButton from '@/components/HomeButton';
import Button from '@/components/Button';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';
import { supabase } from '@/lib/supabase';

// SERVER SIDE AUTH
export async function getServerSideProps(ctx) {
  const { clubId, eventId } = ctx.query;

  // Check login & permissions
  const authResult = await withClubAuth(ctx);
  if ('redirect' in authResult) return authResult;
  const { clubUser } = authResult.props;

  // Block members from editing (show access denied, not 404)
  if (clubUser?.role?.toLowerCase() === "member") {
    return {
      props: {
        accessDenied: true,
        clubId,
      }
    };
  }

  const supabaseServer = getServerSupabase(ctx);
  const { data: event, error } = await supabaseServer
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('club_id', clubId)
    .single();

  if (error || !event) return { notFound: true };

  return { props: { clubId, eventId, event, accessDenied: false } };
}

// COMPONENT
export default function EditEventPage({ clubId, eventId, event, accessDenied }) {
  const router = useRouter();

  // Blocked users see Access Denied
  if (accessDenied) {
    return (
      <Layout>
        <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
          <h1 style={{ color: "#d32f2f" }}>🚫 Access Denied</h1>
          <p>You do not have permission to edit events.</p>
          <Button type="outline" onClick={() => router.push(`/${clubId}/events`)}>
            ⬅️ Back to Events
          </Button>
        </div>
      </Layout>
    );
  }

  // Normal form for those with permission
  const [form, setForm] = useState({
    name: event.name || '',
    date: event.date ? event.date.slice(0, 10) : '',
    end_date: event.end_date ? event.end_date.slice(0, 10) : '',
    start_time: event.start_time || '',
    end_time: event.end_time || '',
    location: event.location || '',
    is_public: !!event.is_public,
    description: event.description || '',
    notes: event.notes || '',
    sponsors: Array.isArray(event.sponsors)
      ? event.sponsors.join(', ')
      : (event.sponsors || ''),
  });

  const [existingFlyers, setExistingFlyers] = useState(event.flyer_urls || []);
  const [existingRecipes, setExistingRecipes] = useState(event.recipes_urls || []);
  const [existingMenus, setExistingMenus] = useState(event.menu_urls || []);
  const [newFlyers, setNewFlyers] = useState([]);
  const [newRecipes, setNewRecipes] = useState([]);
  const [newMenus, setNewMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const fileList = Array.from(files);
      if (name === 'flyers') setNewFlyers(prev => [...prev, ...fileList]);
      if (name === 'recipes') setNewRecipes(prev => [...prev, ...fileList]);
      if (name === 'menus') setNewMenus(prev => [...prev, ...fileList]);
    } else if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const removeExisting = (type, url) => {
    if (type === 'flyers') setExistingFlyers(existingFlyers.filter(u => u !== url));
    if (type === 'recipes') setExistingRecipes(existingRecipes.filter(u => u !== url));
    if (type === 'menus') setExistingMenus(existingMenus.filter(u => u !== url));
  };

  const removeNewFile = (type, index) => {
    if (type === 'flyers') setNewFlyers(newFlyers.filter((_, i) => i !== index));
    if (type === 'recipes') setNewRecipes(newRecipes.filter((_, i) => i !== index));
    if (type === 'menus') setNewMenus(newMenus.filter((_, i) => i !== index));
  };

  async function uploadFiles(bucket, clubId, files, label) {
    if (!files || files.length === 0) return [];
    const urls = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, '_');
      const path = `${clubId}/events/${label}-${eventId}-${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) {
        setError(`Error uploading ${label} file: ${error.message}`);
        return null;
      }
      urls.push(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`);
    }
    return urls;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const flyerUrls = newFlyers.length > 0 ? await uploadFiles('flyers', clubId, newFlyers, 'flyer') : [];
    const recipeUrls = newRecipes.length > 0 ? await uploadFiles('recipes', clubId, newRecipes, 'recipes') : [];
    const menuUrls = newMenus.length > 0 ? await uploadFiles('menus', clubId, newMenus, 'menu') : [];

    if (flyerUrls === null || recipeUrls === null || menuUrls === null) {
      setLoading(false);
      return;
    }

    const updatedFlyers = [...existingFlyers, ...flyerUrls];
    const updatedRecipes = [...existingRecipes, ...recipeUrls];
    const updatedMenus = [...existingMenus, ...menuUrls];

    const sponsorsArr = form.sponsors
      ? form.sponsors.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const { error: updateError } = await supabase
      .from('events')
      .update({
        name: form.name,
        date: form.date,
        end_date: form.end_date || null,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location,
        is_public: form.is_public,
        description: form.description,
        notes: form.notes,
        sponsors: sponsorsArr,
        flyer_urls: updatedFlyers,
        recipes_urls: updatedRecipes,
        menu_urls: updatedMenus,
      })
      .eq('id', eventId)
      .eq('club_id', clubId);

    setLoading(false);

    if (updateError) {
      setError('Failed to update event: ' + updateError.message);
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
      <h1 style={{ textAlign: 'center', marginBottom: 30, fontSize: 34, fontWeight: 700 }}>Edit Event</h1>
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
        {/* --- FORM FIELDS (same as your version) --- */}
        {/* Event Name, Dates, Times, Location, Public, Description, Notes, Flyers, Recipes, Menus, Sponsors */}
        {/* ...paste your field code here... */}
        {/* See your previous code, unchanged */}
        {/* --- keep your form fields as before --- */}
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
            End Date
            <input
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
              style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
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
          <label style={{ flex: 1, fontWeight: 600 }}>
            End Time
            <input
              name="end_time"
              type="time"
              value={form.end_time}
              onChange={handleChange}
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
        {/* Flyers */}
        <label style={{ fontWeight: 600 }}>
          Flyers (images)
          <div>
            {existingFlyers.length > 0 && existingFlyers.map((url, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                <a href={url} target="_blank" rel="noopener noreferrer">View flyer {i + 1}</a>
                <button
                  type="button"
                  style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => removeExisting('flyers', url)}
                >Remove</button>
              </div>
            ))}
            {newFlyers.length > 0 && newFlyers.map((file, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                <span>{file.name}</span>
                <button
                  type="button"
                  style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => removeNewFile('flyers', i)}
                >Remove</button>
              </div>
            ))}
          </div>
          <input
            name="flyers"
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            style={{ width: '100%', fontSize: 18, marginTop: 6 }}
          />
        </label>
        {/* Recipes */}
        <label style={{ fontWeight: 600 }}>
          Recipes (PDF/TXT)
          <div>
            {existingRecipes.length > 0 && existingRecipes.map((url, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                <a href={url} target="_blank" rel="noopener noreferrer">View recipe {i + 1}</a>
                <button
                  type="button"
                  style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => removeExisting('recipes', url)}
                >Remove</button>
              </div>
            ))}
            {newRecipes.length > 0 && newRecipes.map((file, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                <span>{file.name}</span>
                <button
                  type="button"
                  style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => removeNewFile('recipes', i)}
                >Remove</button>
              </div>
            ))}
          </div>
          <input
            name="recipes"
            type="file"
            accept=".pdf,.txt"
            multiple
            onChange={handleChange}
            style={{ width: '100%', fontSize: 18, marginTop: 6 }}
          />
        </label>
        {/* Menus */}
        <label style={{ fontWeight: 600 }}>
          Menus (PDF/TXT)
          <div>
            {existingMenus.length > 0 && existingMenus.map((url, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                <a href={url} target="_blank" rel="noopener noreferrer">View menu {i + 1}</a>
                <button
                  type="button"
                  style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => removeExisting('menus', url)}
                >Remove</button>
              </div>
            ))}
            {newMenus.length > 0 && newMenus.map((file, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                <span>{file.name}</span>
                <button
                  type="button"
                  style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => removeNewFile('menus', i)}
                >Remove</button>
              </div>
            ))}
          </div>
          <input
            name="menus"
            type="file"
            accept=".pdf,.txt"
            multiple
            onChange={handleChange}
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
          {loading ? 'Saving...' : 'Update Event'}
        </Button>
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
      </form>
    </Layout>
  );
}
