import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import Button from '@/components/Button';
import Link from 'next/link';

const TITLES = [
  'President',
  'Vice President',
  'Treasurer',
  'Secretary',
  'Board Member',
  'Trustee',
  'Sick Director',
  'Member'
];

export default function NewMemberPage() {
  const router = useRouter();
  const { clubId } = router.query;

  const [form, setForm] = useState({
    name: '',
    title: '', // <- new field!
    birthdate: '',
    phone: '',
    email: '',
    renewal_date: '',
    profession: '',
    anniversary: '',
    wife_name: '',
    wife_birthday: '',
    children: '',
    dues_paid: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!clubId || clubId === 'undefined') {
    return (
      <Layout>
        <p style={{ color: 'red' }}>Error: Invalid club. Please go back and try again.</p>
      </Layout>
    );
  }

  const handleChange = e => {
    const { name, type, checked, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const withCleanFields = (values) => ({
    ...values,
    email: values.email ? values.email.trim().toLowerCase() : '',
    birthdate: values.birthdate === '' ? null : values.birthdate,
    renewal_date: values.renewal_date === '' ? null : values.renewal_date,
    anniversary: values.anniversary === '' ? null : values.anniversary,
    wife_birthday: values.wife_birthday === '' ? null : values.wife_birthday,
  });

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!form.title) {
      setError('Please select a Title for this member.');
      setSubmitting(false);
      return;
    }

    const payload = {
      ...withCleanFields(form),
      full_name: form.name,
      club_id: clubId,
    };

    const res = await fetch(`/api/${clubId}/members/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSubmitting(false);
    if (!data.success) {
      setError(data.error || 'Failed to add member');
    } else {
      router.push(`/${clubId}/members`);
    }
  };

  return (
    <Layout>
      <AdSpace location="members-top" />
      <div style={{ maxWidth: 540, margin: '0 auto', marginTop: 32 }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
          <Link href={`/${clubId}/members`}><Button type="outline">⬅️ Back to Members</Button></Link>
          <Link href={`/${clubId}`}><Button type="outline">🏠 Home</Button></Link>
        </div>
        <div style={{
          background: '#fff',
          padding: 32,
          borderRadius: 16,
          boxShadow: '0 4px 16px #0001'
        }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#222' }}>
            ➕ Add New Member
          </h1>
          <form onSubmit={handleSubmit} autoComplete="off" style={{
            display: 'flex', flexDirection: 'column', gap: 18, fontSize: 20
          }}>
            <FormRow label="Full Name" htmlFor="name" required>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="off"
                required
                style={inputStyle}
              />
            </FormRow>

            <FormRow label="Title" htmlFor="title" required>
              <select
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">Select a Title...</option>
                {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormRow>

            <div style={{ display: 'flex', gap: 16 }}>
              <FormRow label="Birthday" htmlFor="birthdate" required style={{ flex: 1 }}>
                <input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  value={form.birthdate}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </FormRow>
              <FormRow label="Renewal Date" htmlFor="renewal_date" style={{ flex: 1 }}>
                <input
                  id="renewal_date"
                  name="renewal_date"
                  type="date"
                  value={form.renewal_date}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormRow>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <FormRow label="Phone" htmlFor="phone" style={{ flex: 1 }}>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormRow>
              <FormRow label="Email" htmlFor="email" style={{ flex: 1 }}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormRow>
            </div>
            <FormRow label="Profession" htmlFor="profession">
              <input
                id="profession"
                name="profession"
                value={form.profession}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormRow>
            <div style={{ display: 'flex', gap: 16 }}>
              <FormRow label="Anniversary" htmlFor="anniversary" style={{ flex: 1 }}>
                <input
                  id="anniversary"
                  name="anniversary"
                  type="date"
                  value={form.anniversary}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormRow>
              <FormRow label="Wife's Birthday" htmlFor="wife_birthday" style={{ flex: 1 }}>
                <input
                  id="wife_birthday"
                  name="wife_birthday"
                  type="date"
                  value={form.wife_birthday}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormRow>
            </div>
            <FormRow label="Wife's Name" htmlFor="wife_name">
              <input
                id="wife_name"
                name="wife_name"
                value={form.wife_name}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormRow>
            <FormRow label="Children" htmlFor="children">
              <input
                id="children"
                name="children"
                placeholder='e.g. Alice (5), Bob (8)'
                value={form.children}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormRow>
            <FormRow label="Dues Paid" htmlFor="dues_paid">
              <input
                id="dues_paid"
                name="dues_paid"
                type="checkbox"
                checked={!!form.dues_paid}
                onChange={handleChange}
                style={{ width: 22, height: 22, marginTop: 2 }}
              />
            </FormRow>
            <Button
              type="primary"
              disabled={submitting}
              style={{
                marginTop: 22,
                width: '100%',
                fontSize: 22,
                fontWeight: 700,
                borderRadius: 10,
                padding: '14px 0'
              }}
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </Button>
            {error && <div style={{ color: 'red', marginTop: 14 }}>{error}</div>}
          </form>
        </div>
      </div>
    </Layout>
  );
}

// --- Clean, reusable form row
function FormRow({ label, htmlFor, children, required = false, style = {} }) {
  return (
    <div style={{ marginBottom: 6, ...style }}>
      <label htmlFor={htmlFor} style={{ fontWeight: 500, display: 'block', marginBottom: 5 }}>
        {label}{required ? <span style={{ color: '#d32f2f' }}> *</span> : null}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 10px',
  border: '1px solid #bbb',
  borderRadius: 8,
  fontSize: 18,
  boxSizing: 'border-box'
};
