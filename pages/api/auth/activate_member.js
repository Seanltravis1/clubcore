// File: /pages/api/auth/activate_member.js

import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, user_id } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const supabase = createPagesServerClient({ req, res });

  // 1. Look up club_members by email
  const { data: members, error } = await supabase
    .from('club_members')
    .select('club_id, club:club_id(name)')
    .eq('email', email);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // 2. Format list of clubs found
  const clubs = (members || []).map(row => ({
    club_id: row.club_id,
    club_name: row.club?.name || '',
  }));

  // 3. (Optional) You could do extra work with user_id here, but we're just looking up clubs
  return res.status(200).json({ clubs });
}
