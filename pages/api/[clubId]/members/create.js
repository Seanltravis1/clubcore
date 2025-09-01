import { getServerSupabase } from '@/lib/supabaseServer';

// Helper to convert empty string dates to null
function toNullIfEmpty(value) {
  return value === '' ? null : value;
}

export default async function handler(req, res) {
  const { clubId } = req.query;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
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
    title,           // <--- ADD THIS LINE
  } = req.body;

  if (!name || !clubId || clubId === 'undefined') {
    return res.status(400).json({ error: 'Name and valid clubId are required.' });
  }

  const supabase = getServerSupabase({ req, res });
  const { error } = await supabase
    .from('club_members')
    .insert([{
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
      dues_paid: dues_paid || false,
      club_id: clubId,
      title,        // <--- ADD THIS LINE TOO!
    }]);

  if (error) {
    console.error('Supabase Insert Error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
