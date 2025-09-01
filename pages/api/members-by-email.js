// File: /pages/api/members-by-email.js
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Use Service Role key for server-side RLS access!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // Query for matching club memberships
  const { data, error } = await supabase
    .from('club_members')
    .select('club_id, club:club_id(name)')
    .eq('email', normalizedEmail);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Format for frontend: [{ club_id, club_name }]
  const result = (data || []).map(row => ({
    club_id: row.club_id,
    club_name: row.club?.name || '',
  }));

  return res.status(200).json({ data: result });
}
