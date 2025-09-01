import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const clubId = req.query.clubId;

  const authResult = await withClubAuth({ req, res, params: { clubId } });
  if ('redirect' in authResult) return res.status(403).json({ error: 'Access denied' });
  const { clubUser, permissions } = authResult.props;

  if (!permissions?.finance?.edit?.includes(clubUser.role)) {
    return res.status(403).json({ error: 'No permission to delete' });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const supabase = getServerSupabase({ req, res });
  const { error } = await supabase
    .from('finance')
    .delete()
    .eq('id', id)
    .eq('club_id', clubId);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
