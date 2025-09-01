import { supabaseServer } from '@/lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.body;
  const { error } = await supabaseServer({ req, res })
    .from('members')
    .delete()
    .eq('id', id);
  if (error) return res.json({ error: error.message });
  return res.json({ success: true });
}
