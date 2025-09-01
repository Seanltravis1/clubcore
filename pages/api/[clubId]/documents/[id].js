import { getServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { clubId, id } = req.query;

  if (!clubId || clubId === 'undefined' || !id) {
    return res.status(400).json({ error: 'Invalid club ID or document ID.' });
  }

  const supabase = getServerSupabase({ req, res });
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('club_id', clubId)
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  return res.status(200).json({ document: data });
}
