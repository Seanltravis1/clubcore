import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';

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

export async function getServerSideProps(ctx) {
  try {
    const result = await withClubAuth(ctx);
    if (!result) return { notFound: true };
    if ('redirect' in result) return result;

    const { clubId } = result.props;
    const { memberId } = ctx.query;

    const supabase = getServerSupabase(ctx);
    const { data: member, error } = await supabase
      .from('club_members')
      .select('id, name, title, birthdate, phone, email, renewal_date, profession, anniversary, wife_name, wife_birthday, children, dues_paid')
      .eq('club_id', clubId)
      .eq('id', memberId)
      .single();

    if (error || !member) {
      return {
        props: {
          error: error?.message || 'Member not found',
        }
      };
    }

    return {
      props: {
        clubId,
        memberId,
        initialMember: member,
      }
    };
  } catch (e) {
    return { props: { error: e.message || 'Unknown server error' } };
  }
}

export default function EditMemberPage({ clubId, memberId, initialMember, error }) {
  const router = useRouter();
  const [form, setForm] = useState(initialMember || {
    name: '',
    title: '',
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
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (error) {
    return (
      <Layout>
        <p style={{ color: 'red', margin: 32 }}>{error}</p>
      </Layout>
    );
  }

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

  const withDateNulls = (values) => ({
    ...values,
    birthdate: values.birthdate === '' ? null : values.birthdate,
    renewal_date: values.renewal_date === '' ? null : values.renewal_date,
    anniversary: values.anniversary === '' ? null : values.anniversary,
    wife_birthday: values.wife_birthday === '' ? null : values.wife_birthday,
  });

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    if (!form.title) {
      setFormError('Please select a Title for this member.');
      setSubmitting(false);
      return;
    }

    const payload = {
      ...withDateNulls(form),
      full_name: form.name,
      id: memberId,
    };

    const res = await fetch(`/api/${clubId}/members/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!data.success) {
      setFormError(data.error || 'Failed to update member');
    } else {
      router.push(`/${clubId}/members`);
    }
  };

  return (
    <Layout>
      <AdSpace location="members-top" />
      <div style={{
        maxWidth: 460,
        margin: '36px auto',
        background: '#fff',
        padding: 32,
        borderRadius: 16,
        boxShadow: '0 4px 16px #0001'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              marginRight: 16,
              background: '#eee',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Edit Member</h1>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <FormRow label="Full Name" htmlFor="name" required>
            <input
              id="name"
              name="name"
              value={form.name || ''}
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
              value={form.title || ''}
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
                value={form.birthdate ? form.birthdate.slice(0, 10) : ''}
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
                value={form.renewal_date ? form.renewal_date.slice(0, 10) : ''}
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
                value={form.phone || ''}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormRow>
            <FormRow label="Email" htmlFor="email" style={{ flex: 1 }}>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email || ''}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormRow>
          </div>
          <FormRow label="Profession" htmlFor="profession">
            <input
              id="profession"
              name="profession"
              value={form.profession || ''}
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
                value={form.anniversary ? form.anniversary.slice(0, 10) : ''}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormRow>
            <FormRow label="Wife's Birthday" htmlFor="wife_birthday" style={{ flex: 1 }}>
              <input
                id="wife_birthday"
                name="wife_birthday"
                type="date"
                value={form.wife_birthday ? form.wife_birthday.slice(0, 10) : ''}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormRow>
          </div>
          <FormRow label="Wife's Name" htmlFor="wife_name">
            <input
              id="wife_name"
              name="wife_name"
              value={form.wife_name || ''}
              onChange={handleChange}
              style={inputStyle}
            />
          </FormRow>
          <FormRow label="Children" htmlFor="children">
            <input
              id="children"
              name="children"
              placeholder="e.g. Alice (5), Bob (8)"
              value={form.children || ''}
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
            />
          </FormRow>
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 22,
              width: '100%',
              background: '#1976d2',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              padding: '13px 0',
              fontSize: 17,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          {formError && <div style={{ color: 'red', marginTop: 14 }}>{formError}</div>}
        </form>
      </div>
    </Layout>
  );
}

function FormRow({ label, htmlFor, children, required = false, style = {} }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
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
  borderRadius: 6,
  fontSize: 16,
  boxSizing: 'border-box',
};
