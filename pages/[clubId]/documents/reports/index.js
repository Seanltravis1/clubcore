import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import HomeButton from '@/components/HomeButton';
import Button from '@/components/Button';
import * as XLSX from 'xlsx';

// Helper to build report section options
function buildSubs(baseKey, label) {
  return [
    { key: `${baseKey}_last_month`, label: `${label}: Last Month`, period: 'last_month', custom: false },
    { key: `${baseKey}_current_month`, label: `${label}: Current Month`, period: 'current_month', custom: false },
    { key: `${baseKey}_next_month`, label: `${label}: Next Month`, period: 'next_month', custom: false },
    { key: `${baseKey}_custom`, label: `${label}: Custom Range`, period: 'custom', custom: true },
  ];
}

const REPORT_SECTIONS = [
  { name: 'Events', subs: buildSubs('events', 'List Events') },
  { name: 'Rentals', subs: buildSubs('rentals', 'List Rentals') },
  { 
    name: 'Membership', 
    subs: [
      ...buildSubs('members', 'New Members'),
      { key: 'members_dues', label: 'Members With Overdue Dues' }
    ] 
  },
  { name: 'Maintenance', subs: buildSubs('maintenance', 'Submissions') },
  { name: 'Finance', subs: [{ key: 'finance_snapshot', label: 'Club Snapshot' }] },
  { name: 'Vendors', subs: [{ key: 'vendors_price_increases', label: 'List Price Increases' }] },
  { name: 'Reminders', subs: buildSubs('reminders', 'Upcoming Reminders') },
];

// Calculate start/end date ranges for reports
function getDateRange(period, custom = {}) {
  const now = new Date();
  let start, end;

  if (period === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (period === 'current_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === 'next_month') {
    start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  } else if (period === 'custom') {
    start = custom.start ? new Date(custom.start) : null;
    end = custom.end ? new Date(custom.end) : null;
  }

  return {
    start: start ? start.toISOString().slice(0, 10) : null,
    end: end ? end.toISOString().slice(0, 10) : null,
  };
}

export default function ReportsIndexPage() {
  const router = useRouter();
  const { clubId } = router.query;
  const [selected, setSelected] = useState({});
  const [customRanges, setCustomRanges] = useState({});
  const [loading, setLoading] = useState(false);

  // ===== GUARD: Wait for clubId to exist before rendering or running any code =====
  if (!clubId) {
    return (
      <Layout>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Loading club reports...</h2>
        </div>
      </Layout>
    );
  }

  // Checkbox toggle logic
  const handleToggle = (key) => {
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Custom date range
  const handleCustomRangeChange = (subKey, type, value) => {
    setCustomRanges(prev => ({
      ...prev,
      [subKey]: { ...prev[subKey], [type]: value },
    }));
  };

  // MAIN REPORT LOGIC
  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let rows = [];

      for (const section of REPORT_SECTIONS) {
        for (const sub of section.subs) {
          if (!selected[sub.key]) continue;

          // ---- EVENTS ----
          if (sub.key.startsWith('events')) {
            const { start, end } = getDateRange(sub.period, customRanges[sub.key]);
            const params = new URLSearchParams({ clubId });
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);
            const res = await fetch(`/api/reports/events?${params.toString()}`);
            const events = await res.json();
            events.forEach(ev =>
              rows.push({
                Section: section.name,
                Report: sub.label,
                Title: ev.title,
                Date: ev.date,
                Location: ev.location,
                Description: ev.description,
                StartTime: ev.start_time,
                EndTime: ev.end_time
              })
            );
          }

          // ---- RENTALS ----
          else if (sub.key.startsWith('rentals')) {
            const { start, end } = getDateRange(sub.period, customRanges[sub.key]);
            const params = new URLSearchParams({ clubId });
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);
            const res = await fetch(`/api/reports/rentals?${params.toString()}`);
            const rentals = await res.json();
            rentals.forEach(r =>
              rows.push({
                Section: section.name,
                Report: sub.label,
                Item: r.item_name,
                Start: r.start_date,
                End: r.end_date,
                Notes: r.notes,
                Location: r.location
              })
            );
          }

          // ---- MEMBERSHIP - NEW MEMBERS ----
          else if (sub.key.startsWith('members_') && sub.key !== 'members_dues') {
            const { start, end } = getDateRange(sub.period, customRanges[sub.key]);
            const params = new URLSearchParams({ clubId });
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);
            const res = await fetch(`/api/reports/members?${params.toString()}`);
            const members = await res.json();
            members.forEach(m =>
              rows.push({
                Section: section.name,
                Report: sub.label,
                Name: m.name,
                Email: m.email,
                Phone: m.phone,
                Renewal: m.renewal_date,
                Status: m.status,
                Joined: m.created_at,
              })
            );
          }

          // ---- MEMBERSHIP - OVERDUE DUES ----
          else if (sub.key === 'members_dues') {
            const params = new URLSearchParams({ clubId, duesOnly: "true" });
            const res = await fetch(`/api/reports/members?${params.toString()}`);
            const members = await res.json();
            members.forEach(m =>
              rows.push({
                Section: section.name,
                Report: sub.label,
                Name: m.name,
                Email: m.email,
                Phone: m.phone,
                Renewal: m.renewal_date,
                Status: m.status,
                DuesPaid: m.dues_paid,
                DuesPaidDate: m.dues_paid_date
              })
            );
          }

          // ---- MAINTENANCE ----
          else if (sub.key.startsWith('maintenance')) {
            const { start, end } = getDateRange(sub.period, customRanges[sub.key]);
            const params = new URLSearchParams({ clubId });
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);
            const res = await fetch(`/api/reports/maintenance?${params.toString()}`);
            const maints = await res.json();
            maints.forEach(m =>
              rows.push({
                Section: section.name,
                Report: sub.label,
                Location: m.category?.type,
                Item: m.category?.name,
                Description: m.description,
                Notes: m.notes,
                Company: m.company,
                Phone: m.phone,
                Date: m.maintenance_date,
                File: m.file_url
              })
            );
          }

          // ---- FINANCE ----
          else if (sub.key === 'finance_snapshot') {
            const params = new URLSearchParams({ clubId });
            const res = await fetch(`/api/reports/finance?${params.toString()}`);
            const finances = await res.json();
            finances.forEach(fin =>
              rows.push({
                Section: section.name,
                Report: sub.label,
                Type: fin.type,
                Amount: fin.amount,
                Category: fin.category,
                Description: fin.description,
                Date: fin.date
              })
            );
          }

          // ---- VENDORS ----
          else if (sub.key === 'vendors_price_increases') {
            const params = new URLSearchParams({ clubId });
            const res = await fetch(`/api/reports/vendors?${params.toString()}`);
            const vendors = await res.json();
            vendors.forEach(v =>
              rows.push({
                Section: section.name,
                Report: sub.label,
                Vendor: v.name,
                CreatedAt: v.created_at
              })
            );
          }

          // ---- REMINDERS ----
          else if (sub.key.startsWith('reminders')) {
            const { start, end } = getDateRange(sub.period, customRanges[sub.key]);
            const params = new URLSearchParams({ clubId });
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);
            const res = await fetch(`/api/reports/reminders?${params.toString()}`);
            const reminders = await res.json();
            reminders.forEach(rem =>
              rows.push({
                Section: section.name,
                Report: sub.label,
                Message: rem.message,
                DueDate: rem.due_date,
                Category: rem.category,
                CreatedAt: rem.created_at
              })
            );
          }
        }
      }

      if (rows.length === 0) {
        alert("No records found for the selected reports.");
        setLoading(false);
        return;
      }

      // Excel Export
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reports");
      XLSX.writeFile(wb, `clubcore_reports_${clubId || 'all'}_${Date.now()}.xlsx`);
    } catch (e) {
      alert("Report failed: " + e.message);
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <HomeButton />
          <Button type="outline" onClick={() => router.back()}>⬅️ Back</Button>
          <Button
            type="primary"
            onClick={handleGenerateReport}
            disabled={loading}
            style={{ marginLeft: 'auto' }}
          >
            {loading ? "Generating..." : "📊 Generate Report"}
          </Button>
        </div>
        <AdSpace location="reports" clubId={clubId} />

        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '2rem 0 1.5rem 0' }}>
          📊 Club Reports
        </h1>

        {REPORT_SECTIONS.map(section => (
          <div key={section.name} style={{
            marginBottom: 32,
            background: '#f9f9f9',
            borderRadius: 10,
            boxShadow: '0 1px 8px #eee',
            padding: '1.2rem 1.2rem 0.5rem 1.2rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 10 }}>
              {section.name}
            </h2>
            <div>
              {section.subs.map(sub => (
                <div key={sub.key} style={{ marginBottom: 8 }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={!!selected[sub.key]}
                      onChange={() => handleToggle(sub.key)}
                    />
                    {sub.label}
                  </label>
                  {sub.custom && selected[sub.key] && (
                    <div style={{ display: 'flex', gap: 8, marginLeft: 28, marginTop: 4, alignItems: 'center' }}>
                      <label>
                        Start:&nbsp;
                        <input
                          type="date"
                          value={customRanges[sub.key]?.start || ''}
                          onChange={e => handleCustomRangeChange(sub.key, 'start', e.target.value)}
                          style={{ padding: '4px', borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      </label>
                      <label>
                        End:&nbsp;
                        <input
                          type="date"
                          value={customRanges[sub.key]?.end || ''}
                          onChange={e => handleCustomRangeChange(sub.key, 'end', e.target.value)}
                          style={{ padding: '4px', borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
