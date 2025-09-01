import { getServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { clubId } = req.query;
  const { name, category, access, filepath } = req.body;

  if (!clubId || clubId === 'undefined') {
    return res.status(400).json({ error: 'Invalid club ID.' });
  }

  if (!name || !category || !access || !filepath) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const supabase = getServerSupabase({ req, res });

  const { error } = await supabase
    .from('documents')
    .insert([{ name, category, access, filepath, club_id: clubId }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
