import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import Button from '@/components/Button'
import AdSpace from '@/components/AdSpace'
import { supabase } from '@/lib/supabase'
import hasAccess from '@/utils/hasAccess'
import { withTrialGuard } from '@/lib/withTrialGuard'
import { withClubAuth } from '@/utils/withClubAuth'

export default function RemindersPage({ clubId, clubUser, permissions }) {
    // Block members from this section
  if (clubUser?.role?.toLowerCase() === "member") {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ color: "#d32f2f" }}>🚫 Access Denied</h1>
        <p>You do not have permission to view the Reminder Dashboard.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href={`/${clubId}`}>
            <Button type="outline">🏠 Home</Button>
          </Link>
          <Button type="outline" onClick={() => window.history.back()}>
            ⬅️ Back
          </Button>
        </div>
      </div>
    );
  }
const router = useRouter()
  const defaultCategories = ['Upcoming', 'Financial', 'Compliance', 'Members', 'Vendors']
  const [reminders, setReminders] = useState([])
  const [newReminder, setNewReminder] = useState({
    message: '',
    category: 'Upcoming',
    remind_at: new Date().toISOString().slice(0, 16),
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (clubId) fetchReminders()
    // eslint-disable-next-line
  }, [clubId])

  const fetchReminders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('club_id', clubId)
      .order('remind_at', { ascending: true })
    setReminders(data || [])
    setLoading(false)
    setError(error?.message || null)
  }

  const handleAddOrEdit = async () => {
    if (!newReminder.message || !newReminder.remind_at) return
    setError(null)
    if (editingId) {
      // Update existing
      const { error } = await supabase
        .from('reminders')
        .update({
          message: newReminder.message,
          category: newReminder.category,
          remind_at: newReminder.remind_at,
        })
        .eq('id', editingId)
      if (error) setError(error.message)
    } else {
      // Add new
      const { error } = await supabase
        .from('reminders')
        .insert([{
          message: newReminder.message,
          category: newReminder.category,
          club_id: clubId,
          remind_at: newReminder.remind_at,
        }])
      if (error) setError(error.message)
    }
    setNewReminder({
      message: '',
      category: 'Upcoming',
      remind_at: new Date().toISOString().slice(0, 16)
    })
    setEditingId(null)
    fetchReminders()
  }

  const handleEdit = (reminder) => {
    setEditingId(reminder.id)
    setNewReminder({
      message: reminder.message,
      category: reminder.category,
      remind_at: reminder.remind_at
        ? reminder.remind_at.slice(0, 16)
        : new Date().toISOString().slice(0, 16)
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setNewReminder({
      message: '',
      category: 'Upcoming',
      remind_at: new Date().toISOString().slice(0, 16)
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return
    const { error } = await supabase.from('reminders').delete().eq('id', id)
    if (error) setError(error.message)
    fetchReminders()
  }

  if (!hasAccess(clubUser, permissions, 'reminders', 'view')) {
    return (
      <Layout>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to view Reminders.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Link href={`/${clubId}`} legacyBehavior>
            <a><button>🏠 Home</button></a>
          </Link>
          <button onClick={() => window.history.back()}>⬅️ Back</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link href={`/${clubId}`} legacyBehavior>
        <a>
          <Button type="primary">🏠 Home</Button>
        </a>
      </Link>

      <AdSpace location="reminders" clubId={clubId} />

      <h1>🔔 Reminders</h1>
      {editingId && (
        <div style={{ margin: '10px 0', padding: '8px', background: '#fffbea', color: '#b77e00', borderRadius: 8, fontWeight: 600 }}>
          Edit Mode: Updating reminder <span style={{ color: '#444' }}>{newReminder.message}</span>
        </div>
      )}
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

      {/* Add/Edit Reminder */}
      <textarea
        rows={3}
        placeholder="Reminder message..."
        value={newReminder.message}
        onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
        style={{ width: '100%', marginTop: '10px', padding: '8px' }}
      />

      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select
          value={newReminder.category}
          onChange={(e) => setNewReminder({ ...newReminder, category: e.target.value })}
          style={{ padding: '8px', width: '200px' }}
        >
          {defaultCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={newReminder.remind_at}
          onChange={e => setNewReminder({ ...newReminder, remind_at: e.target.value })}
          style={{ padding: '8px', width: '210px' }}
        />

        <Button type="success" onClick={handleAddOrEdit}>
          {editingId ? '✅ Update' : '➕ Add Reminder'}
        </Button>
        {editingId && (
          <Button type="outline" onClick={handleCancelEdit}>
            Cancel
          </Button>
        )}
      </div>

      {loading ? (
        <p>Loading reminders…</p>
      ) : (
        defaultCategories.map((category) => (
          <div key={category} style={{ marginTop: '30px' }}>
            <h2>{category} Reminders</h2>
            <ul>
              {reminders
                .filter((r) => r.category === category)
                .map((r) => (
                  <li key={r.id} style={{ marginBottom: '8px' }}>
                    <b>{r.message}</b>
                    <span style={{ color: '#555', marginLeft: 8 }}>
                      ({r.remind_at ? new Date(r.remind_at).toLocaleString() : ''})
                    </span>
                    <Button type="outline" onClick={() => handleEdit(r)} style={{ marginLeft: '10px', marginRight: '5px' }}>
                      ✏️
                    </Button>
                    <Button type="danger" onClick={() => handleDelete(r.id)}>
                      🗑️
                    </Button>
                  </li>
                ))}
            </ul>
          </div>
        ))
      )}
    </Layout>
  )
}

// --- SSR: Multi-tenant trial + auth ---
export const getServerSideProps = withTrialGuard(async (ctx) => {
  return await withClubAuth(ctx)
})
