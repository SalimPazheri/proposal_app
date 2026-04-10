import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword';

export default function App() {
  const { user, loading } = useAuth();
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type === 'recovery') {
      setIsRecovery(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isRecovery) return <ResetPassword />;
  return user ? <Dashboard /> : <Auth />;
}