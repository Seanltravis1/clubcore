// pages/api/reports/members.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  const { clubId, startDate, endDate } = req.query;
  const supabase = createPagesServerClient({ req, res });

  let query = supabase
    .from('club_members')  // Use your actual table name: club_members, not just "members" if that's your schema
    .select('*')
    .eq('club_id', clubId);

  // Optional: only filter if dates supplied
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate + 'T23:59:59'); // Add time to include the whole end date

  const { data, error } = await query;
  if (error) return res.status(500).json([]);
  return res.status(200).json(data);
}
