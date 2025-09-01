// File: pages/api/[clubId]/rentals/create.js

import { getServerSupabase } from '@/lib/supabaseServer'
import { withClubAuth } from '@/utils/withClubAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Debug: Log incoming request body
  console.log('[RENTAL API POST BODY]', req.body);

  // Club authentication & permissions
  const authResult = await withClubAuth({ req, res, params: { clubId: req.query.clubId } });
  if ('redirect' in authResult) {
    console.error('[RENTAL API] Access denied');
    return res.status(403).json({ error: 'Access denied' });
  }
  const { clubId } = authResult.props;
  console.log('[RENTAL API] clubId:', clubId);

  // Extract fields from body
  const {
    renter_name,         // string
    event_type,          // string
    start_date,          // date (YYYY-MM-DD)
    start_time,          // string (HH:mm)
    end_date,            // date (YYYY-MM-DD)
    end_time,            // string (HH:mm)
    location,            // string
    contact_number,      // string
    catering,            // string
    bar,                 // boolean
    amount_due,          // number
    amount_paid,         // number
    security_deposit,    // number
    notes,               // string
  } = req.body;

  // Required validation
  if (!renter_name || !start_date || !end_date || !event_type) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Insert into rentals
  const supabase = getServerSupabase({ req, res });

  const { data, error } = await supabase
    .from('rentals')
    .insert([{
      club_id: clubId,
      item_name: renter_name,   // 'item_name' is the column name in your DB for renter name!
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
      notes,
    }])
    .select()
    .single();

  // Error handling
  if (error) {
    console.error('[RENTAL API ERROR]', error); // logs full error to your server console
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ rental: data, success: true });
}
