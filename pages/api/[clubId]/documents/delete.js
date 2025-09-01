import { getServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req, res) {
  const { clubId } = req.query;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id, filepath } = req.body;
  if (!id || !filepath) {
    return res.status(400).json({ error: 'Missing document id or filepath.' });
  }

  const supabase = getServerSupabase({ req, res });

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([filepath]);

  if (storageError) {
    return res.status(500).json({ error: 'Failed to delete file from storage.' });
  }

  // Delete from DB
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId);

  if (dbError) {
    return res.status(500).json({ error: 'Failed to delete file from database.' });
  }

  return res.status(200).json({ success: true });
}
