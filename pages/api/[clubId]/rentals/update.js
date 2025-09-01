// File: /pages/api/[clubId]/rentals/update.js

import { getServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const {
    id,
    club_id,
    item_name,
    event_type,
    start_date,
    start_time,
    end_date,
    end_time,
    location,
    contact_number,
    catering,
    bar,
    amount_due,
    amount_paid,
    security_deposit,
    notes
  } = req.body;

  if (!id || !club_id) {
    return res.status(400).json({ success: false, error: 'Missing rental id or club_id.' });
  }

  // Prepare fields for update
  const updateFields = {
    item_name,
    event_type,
    start_date: start_date || null,
    start_time: start_time || null,
    end_date: end_date || null,
    end_time: end_time || null,
    location,
    contact_number,
    catering,
    bar: typeof bar === 'boolean' ? bar : bar === 'true', // Accepts boolean or string
    amount_due: amount_due === '' ? null : amount_due,
    amount_paid: amount_paid === '' ? null : amount_paid,
    security_deposit: security_deposit === '' ? null : security_deposit,
    notes
  };

  // Remove undefined fields
  Object.keys(updateFields).forEach(
    (k) => updateFields[k] === undefined && delete updateFields[k]
  );

  const supabase = getServerSupabase({ req, res });
  const { error } = await supabase
    .from('rentals')
    .update(updateFields)
    .eq('id', id)
    .eq('club_id', club_id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true });
}
