// /pages/api/[clubId]/rentals/delete.js

import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { id } = req.body;
  const { clubId } = req.query;

  // You should check permissions here as well!

  const supabase = getServerSupabase({ req, res });
  const { error } = await supabase
    .from('rentals')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  res.status(200).json({ success: true });
}
