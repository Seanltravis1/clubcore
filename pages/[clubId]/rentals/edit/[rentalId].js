// File: /pages/[clubId]/rentals/edit/[rentalId].js

import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Link from 'next/link';
import AdSpace from '@/components/AdSpace';
import hasAccess from '@/utils/hasAccess';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';

// --------- SSR: Fetch rental for editing ---------
export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if (!result) return { notFound: true };
  if ('redirect' in result) return result;

  const { clubId, clubUser, permissions } = result.props;
  const { rentalId } = ctx.query;

  if (!clubId || !rentalId) {
    return { props: { error: 'Missing clubId or rentalId.' } };
  }

  const supabase = getServerSupabase(ctx);
  const { data: rental, error } = await supabase
    .from('rentals')
    .select('*')
    .eq('club_id', clubId)
    .eq('id', rentalId)
    .single();

  if (error || !rental) {
    return {
      props: {
        error: 'Rental Not Found. Could not load rental.',
        clubId,
      }
    };
  }

  return {
    props: {
      clubId,
      clubUser,
      permissions,
      rentalId,
      initialRental: rental
    }
  };
};

// --------- Main Page ---------
export default function EditRentalPage({ clubId, clubUser, permissions, rentalId, initialRental, error }) {
  const router = useRouter();

  const [form, setForm] = useState(initialRental || {
    item_name: '',
    event_type: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    contact_number: '',
    catering: '',
    bar: '',
    amount_due: '',
    amount_paid: '',
    security_deposit: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (error) {
    return (
      <Layout>
        <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
          <Link href={`/${clubId}/rentals`}><Button type="outline">⬅️ Back to Rentals</Button></Link>
          <Link href="/" legacyBehavior>
  <a>
    <button
      type="button"
      style={{
        background: '#eee',
        border: 'none',
        borderRadius: 6,
        padding: '8px 20px',
        cursor: 'pointer',
        fontWeight: 500,
        marginRight: 8,
      }}
    >
      🏠 Home
    </button>
  </a>
</Link>

        </div>
        <h1>Rental Not Found</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </Layout>
    );
  }

  if (!hasAccess(clubUser, permissions, 'rentals', 'edit')) {
    return (
      <Layout>
        <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
          <Link href={`/${clubId}/rentals`}><Button type="outline">⬅️ Back to Rentals</Button></Link>
          <Link href={`/${clubId}`}><Button type="outline">🏠 Home</Button></Link>
        </div>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to edit rentals.</p>
      </Layout>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`/api/${clubId}/rentals/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: rentalId, club_id: clubId }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (!data.success) {
        setFormError(data.error || 'Failed to update rental');
        return;
      }
      router.push(`/${clubId}/rentals`);
    } catch (err) {
      setSubmitting(false);
      setFormError('Failed to update rental');
    }
  };

  return (
    <Layout>
      <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
        <Link href={`/${clubId}/rentals`}><Button type="outline">⬅️ Back to Rentals</Button></Link>
        <Link href={`/${clubId}`}><Button type="outline">🏠 Home</Button></Link>
      </div>
      <AdSpace location="rentals" />
      <div style={{
        background: '#fff',
        borderRadius: 14,
        padding: 32,
        maxWidth: 540,
        margin: '0 auto',
        boxShadow: '0 2px 14px #0001'
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 18, color: '#333' }}>✏️ Edit Rental</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input name="item_name" placeholder="Item Name" value={form.item_name || ''} onChange={handleChange} required />
          <input name="event_type" placeholder="Event Type" value={form.event_type || ''} onChange={handleChange} />
          <div style={{ display: 'flex', gap: 12 }}>
            <input name="start_date" type="date" value={form.start_date ? form.start_date.slice(0, 10) : ''} onChange={handleChange} required style={{ flex: 1 }} />
            <input name="start_time" type="time" value={form.start_time || ''} onChange={handleChange} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input name="end_date" type="date" value={form.end_date ? form.end_date.slice(0, 10) : ''} onChange={handleChange} required style={{ flex: 1 }} />
            <input name="end_time" type="time" value={form.end_time || ''} onChange={handleChange} style={{ flex: 1 }} />
          </div>
          <input name="location" placeholder="Location" value={form.location || ''} onChange={handleChange} />
          <input name="contact_number" placeholder="Contact Number" value={form.contact_number || ''} onChange={handleChange} />
          <input name="catering" placeholder="Catering" value={form.catering || ''} onChange={handleChange} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input name="bar" type="checkbox" checked={!!form.bar} onChange={handleChange} />
            Bar
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input name="amount_due" type="number" step="0.01" placeholder="Amount Due" value={form.amount_due || ''} onChange={handleChange} />
            <input name="amount_paid" type="number" step="0.01" placeholder="Amount Paid" value={form.amount_paid || ''} onChange={handleChange} />
          </div>
          <input name="security_deposit" type="number" step="0.01" placeholder="Security Deposit" value={form.security_deposit || ''} onChange={handleChange} />
          <textarea name="notes" placeholder="Notes" value={form.notes || ''} onChange={handleChange} />
          <Button type="success" style={{ width: '180px', marginTop: 10 }} disabled={submitting}>
            {submitting ? 'Saving...' : '💾 Save Changes'}
          </Button>
          {formError && <div style={{ color: 'red', marginTop: 10 }}>{formError}</div>}
        </form>
      </div>
    </Layout>
  );
}
