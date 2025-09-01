// pages/api/reports/maintenance.js

import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  const { clubId, startDate, endDate } = req.query;
  const supabase = createPagesServerClient({ req, res });

  let query = supabase
    .from('maintenance_items')
    .select('*, category:maintenance_categories!inner(club_id, type, name)')
    .eq('category.club_id', clubId);

  // Only filter by date if given (for range, current month, etc)
  if (startDate && endDate) {
    query = query.gte('maintenance_date', startDate).lte('maintenance_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Maintenance report fetch error:', error);
    return res.status(500).json([]);
  }
  return res.status(200).json(data || []);
}
