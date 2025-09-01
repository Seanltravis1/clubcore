// File: /pages/[clubId]/members/view/[memberId].js

import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';
import HomeButton from '@/components/HomeButton';
import Link from 'next/link';

// --------- Helpers ---------
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
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// -------- SSR: Fetch member data --------
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
      .select('id, name, title, birthdate, phone, email, renewal_date, profession, anniversary, wife_name, wife_birthday, children')
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
        member,
      }
    };
  } catch (e) {
    return { props: { error: e.message || 'Unknown server error' } };
  }
}

export default function ViewMemberPage({ clubId, memberId, member, error }) {
  if (error) {
    return (
      <Layout>
        <HomeButton />
        <h1>Member Details</h1>
        <div style={{ color: 'red', margin: 24 }}>Error: {error}</div>
      </Layout>
    );
  }

  if (!clubId || !member) {
    return (
      <Layout>
        <HomeButton />
        <h1>Member Details</h1>
        <div style={{ color: 'red', margin: 24 }}>Invalid club or member.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdSpace location="members-top" />
      <div style={{
        maxWidth: 520,
        margin: '36px auto',
        background: '#fff',
        padding: 32,
        borderRadius: 16,
        boxShadow: '0 4px 16px #0001'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <HomeButton />
          <Link href={`/${clubId}/members`} legacyBehavior>
            <button
              type="button"
              style={{
                marginLeft: 12,
                marginRight: 18,
                background: '#eee',
                border: 'none',
                borderRadius: 6,
                padding: '8px 20px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ← Back to Members
            </button>
          </Link>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Member Details</h1>
        </div>
        <div style={{
          lineHeight: 2,
          fontSize: 18,
          borderTop: '1px solid #ddd',
          paddingTop: 18
        }}>
          <strong>Name:</strong> {member.name}<br />
          <strong>Title:</strong> {member.title || '-'}<br />
          <strong>Birthdate:</strong> {formatPrettyDate(member.birthdate)}<br />
          <strong>Phone:</strong> {formatPhone(member.phone)}<br />
          <strong>Email:</strong> {member.email || '-'}<br />
          <strong>Renewal Date:</strong> {formatPrettyDate(member.renewal_date)}<br />
          <strong>Profession:</strong> {member.profession || '-'}<br />
          <strong>Anniversary:</strong> {formatPrettyDate(member.anniversary)}<br />
          <strong>Wife's Name:</strong> {member.wife_name || '-'}<br />
          <strong>Wife's Birthday:</strong> {formatPrettyDate(member.wife_birthday)}<br />
          <strong>Children:</strong> {member.children || '-'}
        </div>
        <div style={{ marginTop: 30, display: 'flex', gap: 18 }}>
          <Link href={`/${clubId}/members/edit/${member.id}`} legacyBehavior>
            <button style={{
              background: '#1976d2', color: '#fff', fontWeight: 600,
              border: 'none', borderRadius: 6, padding: '11px 28px', fontSize: 17, cursor: 'pointer'
            }}>✏️ Edit</button>
          </Link>
          <Link href={`/${clubId}/members`} legacyBehavior>
            <button style={{
              background: '#888', color: '#fff', fontWeight: 600,
              border: 'none', borderRadius: 6, padding: '11px 28px', fontSize: 17, cursor: 'pointer'
            }}>← Back</button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
