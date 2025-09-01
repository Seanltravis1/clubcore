import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';
import Link from 'next/link';
import { useState } from 'react';

// Helpers
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

function formatPhone(phone) {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return phone;
  return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
}

export const getServerSideProps = async (ctx) => {
  try {
    const result = await withClubAuth(ctx);
    if (!result) return { notFound: true };
    if ('redirect' in result) return result;

    const { clubId } = result.props;
    const supabase = getServerSupabase(ctx);

    const { data: members, error } = await supabase
      .from('club_members')
      .select('id, name, birthdate, phone, email, renewal_date, dues_paid')
      .eq('club_id', clubId)
      .order('name', { ascending: true });

    if (error) return { props: { error: error.message } };

    return {
      props: {
        ...result.props,
        members: members || [],
      }
    };
  } catch (e) {
    return { props: { error: e.message || 'Unknown server error' } };
  }
};

export default function MembersPage({ members: ssrMembers = [], clubId, error }) {
  const [members, setMembers] = useState(ssrMembers);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);

  // Dynamic dues status based on renewal_date vs today
  const today = new Date();
  const processedMembers = members.map(member => {
    const renewalDate = member.renewal_date ? new Date(member.renewal_date) : null;
    const currentDuesPaid = renewalDate && renewalDate >= today;
    return { ...member, currentDuesPaid };
  });

  // Filter members if checkbox is checked
  const filteredMembers = showUnpaidOnly
    ? processedMembers.filter(m => !m.currentDuesPaid)
    : processedMembers;

  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    const res = await fetch(`/api/${clubId}/members/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: memberId }),
    });
    const data = await res.json();
    if (!data.success) return alert(data.error || 'Delete failed.');
    setMembers(members.filter(m => m.id !== memberId));
  };

  if (error) {
    return (
      <Layout>
        <div style={{
          maxWidth: 950,
          margin: "0 auto",
          marginTop: 24,
          marginBottom: 18
        }}>
          <Link href={`/${clubId}`} legacyBehavior>
            <button style={{ fontSize: 19, marginBottom: 16, border: "1px solid #ccc", borderRadius: 8, background: "#fff", padding: "8px 18px", cursor: "pointer" }}>
              🏠 Home
            </button>
          </Link>
        </div>
        <h1>Members</h1>
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

      <AdSpace location="members" clubId={clubId} />

      <h1>👥 Members</h1>
      <label style={{ marginBottom: 12, display: 'block' }}>
        <input
          type="checkbox"
          checked={showUnpaidOnly}
          onChange={() => setShowUnpaidOnly(!showUnpaidOnly)}
          style={{ marginRight: 6 }}
        />
        Show Only Members with Unpaid Dues
      </label>
      <Link href={`/${clubId}/members/new`} legacyBehavior>
        <button style={{ margin: '16px 0' }}>➕ Add Member</button>
      </Link>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Birthdate</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Renewal</th>
            <th>Dues Paid</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center' }}>No members found.</td>
            </tr>
          ) : (
            filteredMembers.map(member => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{formatPrettyDate(member.birthdate)}</td>
                <td>{formatPhone(member.phone)}</td>
                <td>{member.email || '-'}</td>
                <td>{formatPrettyDate(member.renewal_date)}</td>
                <td style={{ textAlign: 'center' }}>
                  {member.currentDuesPaid ? '✅' : '❌'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Link href={`/${clubId}/members/view/${member.id}`} legacyBehavior>
                      <button>👁️ View</button>
                    </Link>
                    <Link href={`/${clubId}/members/edit/${member.id}`} legacyBehavior>
                      <button>✏️ Edit</button>
                    </Link>
                    <button
                      onClick={() => handleDelete(member.id)}
                      style={{ color: 'white', background: 'red' }}
                    >🗑️ Delete</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Layout>
  );
}
