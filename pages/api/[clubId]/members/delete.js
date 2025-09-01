import { getServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id, club_id } = req.body;

  if (!id || !club_id) {
    return res.status(400).json({ error: 'Missing member id or club_id.' });
  }

  const supabase = getServerSupabase({ req, res });
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('id', id)
    .eq('club_id', club_id);   // <- extra safety!

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
