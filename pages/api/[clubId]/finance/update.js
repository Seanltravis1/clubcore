// File: /pages/api/[clubId]/finance/update.js

import { getServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { clubId } = req.query;
  const { id, date, category, description, amount, type } = req.body;

  if (!id || !clubId) {
    return res.status(400).json({ error: 'Missing id or clubId' });
  }

  const supabase = getServerSupabase({ req, res });
  const { data, error } = await supabase
    .from('finance')
    .update({
      date,
      category,
      description,
      amount,
      type,
    })
    .eq('id', id)
    .eq('club_id', clubId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, entry: data });
}
