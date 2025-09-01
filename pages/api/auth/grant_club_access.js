// File: /pages/api/auth/grant_club_access.js

import { createClient } from '@supabase/supabase-js';

// Always use non-public env vars for server API routes!
const supabase = createClient(
  process.env.SUPABASE_URL,                // NOT NEXT_PUBLIC_!
  process.env.SUPABASE_SERVICE_ROLE_KEY    // NOT NEXT_PUBLIC_!
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { user_id, club_id } = req.body;
  if (!user_id || !club_id) {
    return res.status(400).json({ error: 'Missing user_id or club_id' });
  }

  // 1. Find the "member" role_id for this club
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('club_id', club_id)
    .eq('name', 'member')
    .single();

  if (roleError || !role) {
    return res.status(400).json({ error: 'No "member" role found for this club.' });
  }

  // 2. Insert user into club_users table with the correct role_id
  const { error } = await supabase
    .from('club_users')
    .insert([{ user_id, club_id, role_id: role.id }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
