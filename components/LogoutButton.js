// components/LogoutButton.js
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Button from './Button';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/landing');
  };

  return (
    <Button type="secondary" onClick={handleLogout}>
      🚪 Log Out
    </Button>
  );
}
