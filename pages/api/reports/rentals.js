// pages/api/reports/rentals.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  const { clubId, startDate, endDate } = req.query;
  const supabase = createPagesServerClient({ req, res });

  let query = supabase
    .from('rentals')
    .select('*')
    .eq('club_id', clubId);

  // Add date range filtering if provided
  if (startDate) query = query.gte('start_date', startDate);
  if (endDate) query = query.lte('end_date', endDate);

  const { data, error } = await query;
  if (error) return res.status(500).json([]);
  return res.status(200).json(data);
}
