import { useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Link from 'next/link';
import AdSpace from '@/components/AdSpace';
import hasAccess from '@/utils/hasAccess';
import { withClubAuth } from '@/utils/withClubAuth';
import { supabaseServer } from '@/lib/supabaseServer';

// CSV Export Helper
function downloadCSV(data) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csvRows = [
    keys.join(','),
    ...data.map(row =>
      keys.map(k => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    )
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'member_report.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if ('redirect' in result) return result;

  const { clubId } = result.props;
  const { data: members } = await supabaseServer(ctx)
    .from('club_members')
    .select('id, name, status, phone, email, dues_paid_date')
    .eq('club_id', clubId);

  return {
    props: { ...result.props, members: members || [] },
  };
};

export default function MemberReportsPage({ clubId, clubUser, permissions, members }) {
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredMembers = members.filter((m) => {
    if (statusFilter === 'All') return true;
    return m.status === statusFilter;
  });

  if (!hasAccess(clubUser, permissions, 'members', 'view')) {
    return (
      <Layout>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to view Member Reports.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Link href={`/${clubId}`}>
            <Button>🏠 Home</Button>
          </Link>
          <Button onClick={() => window.history.back()}>⬅️ Back</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <Link href={`/${clubId}`}>
          <Button type="primary">🏠 Home</Button>
        </Link>
        <Button onClick={() => window.history.back()} type="default">⬅️ Back</Button>
      </div>
      <AdSpace location="members" />
      <h1>📊 Member Reports</h1>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <label>Status Filter:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            marginLeft: '10px',
            padding: '8px',
            borderRadius: '5px',
          }}
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Dues Due">Dues Due</option>
          <option value="Deceased">Deceased</option>
          <option value="Suspended">Suspended</option>
        </select>
        <Button
          type="primary"
          onClick={() => window.print()}
          style={{ marginLeft: '20px' }}
        >
          🖨️ Print Report
        </Button>
        <Button
          type="primary"
          onClick={() => downloadCSV(filteredMembers)}
          style={{ marginLeft: '20px' }}
        >
          ⬇️ Export CSV
        </Button>
      </div>

      {filteredMembers.length === 0 ? (
        <p>No members found.</p>
      ) : (
        <div>
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                background: '#f9f9f9',
              }}
            >
              <h3>{m.name}</h3>
              <p><strong>Status:</strong> {m.status}</p>
              <p><strong>Phone:</strong> {m.phone}</p>
              <p><strong>Email:</strong> {m.email}</p>
              <p><strong>Dues Paid:</strong> {m.dues_paid_date || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
