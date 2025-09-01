import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Link from 'next/link';
import AdSpace from '@/components/AdSpace';
import hasAccess from '@/utils/hasAccess';
import { withClubAuth } from '@/utils/withClubAuth';

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if ('redirect' in result) return result;
  return { props: result.props };
};

export default function NewRentalPage({ clubId, clubUser, permissions }) {
  const router = useRouter();
  const [form, setForm] = useState({
    renter_name: '',
    event_type: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    contact_number: '',
    catering: '',
    bar: 'No',
    amount_due: '',
    amount_paid: '',
    security_deposit: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Permission: only allow 'add'
  if (!hasAccess(clubUser, permissions, 'rentals', 'add')) {
    return (
      <Layout>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to create a new rental.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Link href={`/${clubId}`}><Button>🏠 Home</Button></Link>
          <Button onClick={() => window.history.back()}>⬅️ Back</Button>
        </div>
      </Layout>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/${clubId}/rentals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bar: form.bar === 'Yes',
          club_id: clubId,
        }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (!data.success) {
        setError(data.error || 'Failed to create rental');
        return;
      }
      router.push(`/${clubId}/rentals`);
    } catch {
      setSubmitting(false);
      setError('Failed to create rental');
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
        borderRadius: 16,
        padding: 32,
        maxWidth: 540,
        margin: '0 auto',
        boxShadow: '0 2px 18px #0002'
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: '#222' }}>
          ➕ New Rental
        </h1>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          fontSize: 20,
        }}>
          <label style={{ fontWeight: 600 }}>
            Renter Name
            <input name="renter_name" placeholder="Renter Name" value={form.renter_name} onChange={handleChange} required
              style={{ width: '100%', fontSize: 20, padding: 10, borderRadius: 8, marginTop: 6 }} />
          </label>
          <label style={{ fontWeight: 600 }}>
            Event Type
            <input name="event_type" placeholder="Event Type" value={form.event_type} onChange={handleChange} required
              style={{ width: '100%', fontSize: 20, padding: 10, borderRadius: 8, marginTop: 6 }} />
          </label>
          <div style={{ display: 'flex', gap: 14 }}>
            <label style={{ flex: 1, fontWeight: 600 }}>
              Start Date
              <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required
                style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }} />
            </label>
            <label style={{ flex: 1, fontWeight: 600 }}>
              Start Time
              <input name="start_time" type="time" value={form.start_time} onChange={handleChange} required
                style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <label style={{ flex: 1, fontWeight: 600 }}>
              End Date
              <input name="end_date" type="date" value={form.end_date} onChange={handleChange} required
                style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }} />
            </label>
            <label style={{ flex: 1, fontWeight: 600 }}>
              End Time
              <input name="end_time" type="time" value={form.end_time} onChange={handleChange} required
                style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }} />
            </label>
          </div>
          <label style={{ fontWeight: 600 }}>
            Location
            <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required
              style={{ width: '100%', fontSize: 20, padding: 10, borderRadius: 8, marginTop: 6 }} />
          </label>
          <label style={{ fontWeight: 600 }}>
            Contact Number
            <input name="contact_number" placeholder="Contact Number" value={form.contact_number} onChange={handleChange}
              style={{ width: '100%', fontSize: 20, padding: 10, borderRadius: 8, marginTop: 6 }} />
          </label>
          <label style={{ fontWeight: 600 }}>
            Catering Details
            <input name="catering" placeholder="Catering Details" value={form.catering} onChange={handleChange}
              style={{ width: '100%', fontSize: 20, padding: 10, borderRadius: 8, marginTop: 6 }} />
          </label>
          <label style={{ fontWeight: 600 }}>
            Bar Service
            <select name="bar" value={form.bar} onChange={handleChange}
              style={{ width: '100%', fontSize: 18, padding: 10, borderRadius: 8, marginTop: 6 }}>
              <option value="No">Bar: No</option>
              <option value="Yes">Bar: Yes</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 14 }}>
            <label style={{ flex: 1, fontWeight: 600 }}>
              Amount Due
              <input name="amount_due" type="number" step="0.01" placeholder="Amount Due" value={form.amount_due} onChange={handleChange} required
                style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }} />
            </label>
            <label style={{ flex: 1, fontWeight: 600 }}>
              Amount Paid
              <input name="amount_paid" type="number" step="0.01" placeholder="Amount Paid" value={form.amount_paid} onChange={handleChange} required
                style={{ width: '100%', fontSize: 18, padding: 8, borderRadius: 8, marginTop: 6 }} />
            </label>
          </div>
          <label style={{ fontWeight: 600 }}>
            Security Deposit
            <input name="security_deposit" type="number" step="0.01" placeholder="Security Deposit" value={form.security_deposit} onChange={handleChange}
              style={{ width: '100%', fontSize: 20, padding: 10, borderRadius: 8, marginTop: 6 }} />
          </label>
          <label style={{ fontWeight: 600 }}>
            Notes
            <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} rows={3}
              style={{ width: '100%', fontSize: 18, padding: 10, borderRadius: 8, marginTop: 6, resize: 'vertical' }} />
          </label>
          <Button type="success" style={{ width: '200px', fontSize: 22, padding: '12px 0', borderRadius: 10, marginTop: 10 }} disabled={submitting}>
            {submitting ? 'Saving...' : '💾 Save Rental'}
          </Button>
          {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
        </form>
      </div>
    </Layout>
  );
}
