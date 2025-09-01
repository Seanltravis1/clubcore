// File: /pages/api/[clubId]/finance/create.js

import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clubId = req.query.clubId;

  // Authenticate and check permissions
  const authResult = await withClubAuth({ req, res, params: { clubId } });
  if ('redirect' in authResult) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { clubUser, permissions, user } = authResult.props;

  if (!permissions?.finance?.add?.includes(clubUser.role)) {
    return res.status(403).json({ error: 'No permission to add' });
  }

  const { date, category, description, amount, type } = req.body;
  if (!date || !category || !description || !amount || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Use correct function here!
  const supabase = getServerSupabase({ req, res });

  const { data, error } = await supabase
    .from('finance')
    .insert([{
      club_id: clubId,
      user_id: user.id,
      date,
      category,
      description,
      amount,
      type,
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ success: true, entry: data });
}
