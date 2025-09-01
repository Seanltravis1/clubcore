import { getServerSupabase } from '@/lib/supabaseServer';
// ...
const supabase = getServerSupabase({ req, res });
const { data, error } = await supabase
  .from('finance')
  .select('*')
  .eq('club_id', clubId);
