// File: /pages/api/rentals/[id].js
import { getServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const supabase = getServerSupabase({ req, res });
  const { data, error } = await supabase
    .from('rentals')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ success: false, error: 'Rental not found' });
  }

  return res.status(200).json({ success: true, rental: data });
}
