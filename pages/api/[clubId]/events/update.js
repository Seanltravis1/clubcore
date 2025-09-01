import { supabaseServer } from '@/lib/supabaseServer'
import { withClubAuth } from '@/utils/withClubAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const clubId = req.query.clubId;
  const {
    id,
    name,
    date,
    start_time,
    end_time,
    location,
    is_public,
    description,
    notes,
    flyer_url,
    recipes_url,
    menu_url,
    sponsors,
  } = req.body;

  if (!id || !name || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Auth check for this club
  const authResult = await withClubAuth({ req, res, params: { clubId } });
  if ('redirect' in authResult) return res.status(403).json({ error: 'Access denied' });

  const { clubUser, permissions } = authResult.props;

  // Block members from updating events
  if (clubUser?.role?.toLowerCase() === "member") {
    return res.status(403).json({ error: 'Members are not allowed to edit events.' });
  }

  // Only allow users with edit permission
  if (!permissions?.events?.edit?.includes(clubUser.role)) {
    return res.status(403).json({ error: 'No permission to edit' });
  }

  const { data, error } = await supabaseServer({ req, res })
    .from('events')
    .update({
      name,
      date,
      start_time,
      end_time,
      location,
      is_public,
      description,
      notes,
      flyer_url,
      recipes_url,
      menu_url,
      sponsors,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('club_id', clubId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, event: data });
}
