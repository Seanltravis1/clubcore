import { getServerSupabase } from '@/lib/supabaseServer';

function toNullIfEmpty(value) {
  return value === '' ? null : value;
}

export default async function handler(req, res) {
  const { clubId } = req.query;
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    id,
    name,
    birthdate,
    phone,
    email,
    renewal_date,
    profession,
    anniversary,
    wife_name,
    wife_birthday,
    children,
    dues_paid,
    title // <--- NEW
  } = req.body;

  if (!id || !clubId) {
    return res.status(400).json({ error: 'Missing member id or clubId.' });
  }

  const updates = {
    name,
    full_name: name,
    birthdate: toNullIfEmpty(birthdate),
    phone,
    email,
    renewal_date: toNullIfEmpty(renewal_date),
    profession,
    anniversary: toNullIfEmpty(anniversary),
    wife_name,
    wife_birthday: toNullIfEmpty(wife_birthday),
    children,
    dues_paid,
    title,        // <--- NEW
    club_id: clubId
  };

  // Remove undefined fields
  Object.keys(updates).forEach(
    (key) => updates[key] === undefined && delete updates[key]
  );

  const supabase = getServerSupabase({ req, res });
  const { error } = await supabase
    .from('club_members')
    .update(updates)
    .eq('id', id)
    .eq('club_id', clubId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
