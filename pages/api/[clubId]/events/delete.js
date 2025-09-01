import { getServerSupabase } from '@/lib/supabaseServer'
import { withClubAuth } from '@/utils/withClubAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { clubId } = req.query;
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: 'Missing event id' });

  // Require authentication and check role
  const authResult = await withClubAuth({ req, res, params: { clubId } });
  if ('redirect' in authResult) return res.status(403).json({ error: 'Access denied' });

  const { clubUser } = authResult.props;
  if (clubUser?.role?.toLowerCase() === "member") {
    return res.status(403).json({ error: 'Members are not allowed to delete events.' });
  }

  const supabase = getServerSupabase({ req, res });
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json({ success: true });
}
