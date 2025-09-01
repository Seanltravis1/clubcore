// pages/api/reports/events.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  const { clubId, startDate, endDate } = req.query;
  const supabase = createPagesServerClient({ req, res });

  let query = supabase
    .from('events')
    .select('*')
    .eq('club_id', clubId);

  // Only filter if dates are supplied (so "custom" works too)
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  if (error) return res.status(500).json([]);
  return res.status(200).json(data);
}
