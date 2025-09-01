// pages/_app.js
import { useEffect } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabase/supabaseClient';

function seedDevPermissions() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem('clubcore-role')) {
    localStorage.setItem('clubcore-role', 'admin');
  }

  if (!localStorage.getItem('clubcore-permissions')) {
    localStorage.setItem(
      'clubcore-permissions',
      JSON.stringify({
        members: {
          view: ['admin'],
          edit: ['admin']
        },
        events: {
          view: ['admin'],
          edit: ['admin']
        },
        calendar: {
          view: ['admin']
        },
        rentals: {
          view: ['admin'],
          edit: ['admin']
        },
        finance: {
          view: ['admin'],
          edit: ['admin']
        },
        vendors: {
          view: ['admin'],
          edit: ['admin']
        },
        reminders: {
          view: ['admin'],
          edit: ['admin']
        },
        documents: {
          view: ['admin'],
          edit: ['admin']
        },
        ads: {
          view: ['admin'],
          edit: ['admin']
        }
      })
    );
  }
}

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    seedDevPermissions();
  }, []);

  return (
    <SessionContextProvider
      supabaseClient={supabase}
      initialSession={pageProps.initialSession}
    >
      <Component {...pageProps} />
    </SessionContextProvider>
  );
}

export default MyApp;
