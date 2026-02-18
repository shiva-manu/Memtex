import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Toaster } from 'sonner';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="dark">
      <Toaster
        theme="dark"
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'rgba(15, 15, 15, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            color: '#fff',
            fontFamily: 'Plus Jakarta Sans',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '10px'
          }
        }}
      />
      {!session ? <Login /> : <Dashboard />}
    </div>
  );
}

export default App;
