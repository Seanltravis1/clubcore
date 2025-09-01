import { getServerSupabase } from '@/lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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
    dues_paid,    // Add dues_paid here
    club_id,
    title,        // <-- ADD THIS LINE!
  } = req.body;

  if (!name || !club_id || club_id === 'undefined') {
    return res.status(400).json({ error: 'Name and valid club_id are required.' });
  }

  const supabase = getServerSupabase({ req, res });
  const { error } = await supabase
    .from('club_members')
    .insert([{
      name,
      full_name: name,
      birthdate: birthdate === '' ? null : birthdate,
      phone,
      email,
      renewal_date: renewal_date === '' ? null : renewal_date,
      profession,
      anniversary: anniversary === '' ? null : anniversary,
      wife_name,
      wife_birthday: wife_birthday === '' ? null : wife_birthday,
      children,
      dues_paid: !!dues_paid,  // Ensure boolean
      club_id,
      title,                   // <-- AND THIS LINE!
    }]);

  if (error) {
    console.error('Supabase Insert Error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
