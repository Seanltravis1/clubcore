// File: /pages/api/[clubId]/finance/list.js

import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clubId = req.query.clubId;

  // Authenticate and check permissions
  const authResult = await withClubAuth({ req, res, params: { clubId } });
  if ('redirect' in authResult) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { clubUser, permissions } = authResult.props;

  if (!permissions?.finance?.view?.includes(clubUser.role)) {
    return res.status(403).json({ error: 'No permission to view finance data' });
  }

  const supabase = getServerSupabase({ req, res });

  const { data, error } = await supabase
    .from('finance')
    .select('*')
    .eq('club_id', clubId)
    .order('date', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ entries: data });
}
