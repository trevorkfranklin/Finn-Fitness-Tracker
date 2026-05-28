import { useState, useEffect } from 'react';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import WorkoutPage from './pages/WorkoutPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import AchievementsPage from './pages/AchievementsPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { getProfile, getPlayerId, clearPlayerId } from './utils/db.js';
import { isConfigured } from './lib/supabase.js';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [appState, setAppState] = useState('loading'); // 'loading' | 'auth' | 'ready' | 'error'
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    if (!isConfigured) {
      setAppState('error');
      setInitError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
      return;
    }
    if (getPlayerId()) {
      loadProfile();
    } else {
      setAppState('auth');
    }
  }, []);

  async function loadProfile() {
    try {
      const p = await getProfile();
      if (p) {
        setProfile(p);
        setAppState('ready');
      } else {
        // Stored ID no longer exists in DB — clear and re-auth
        clearPlayerId();
        setAppState('auth');
      }
    } catch (err) {
      setInitError(err.message);
      setAppState('error');
    }
  }

  const handleAuth = (p) => {
    setProfile(p);
    setAppState('ready');
  };

  const handleProfileUpdate = (updatedProfile) => setProfile(updatedProfile);

  const handleSignOut = () => {
    clearPlayerId();
    setProfile(null);
    setPage('dashboard');
    setAppState('auth');
  };

  if (appState === 'loading') return <AppLoadingScreen />;
  if (appState === 'error') return <ConfigError message={initError} />;
  if (appState === 'auth') return <AuthPage onAuth={handleAuth} />;

  return (
    <div className="min-h-screen bg-slate-950 font-body">
      <div className="max-w-lg mx-auto">
        {page === 'dashboard' && (
          <Dashboard profile={profile} onNavigate={setPage} onSignOut={handleSignOut} />
        )}
        {page === 'workout' && (
          <WorkoutPage profile={profile} onProfileUpdate={handleProfileUpdate} onNavigate={setPage} />
        )}
        {page === 'history' && <HistoryPage profile={profile} />}
        {page === 'achievements' && <AchievementsPage profile={profile} />}
        {page === 'leaderboard' && <LeaderboardPage profile={profile} />}
      </div>
      <NavBar currentPage={page} onNavigate={setPage} />
    </div>
  );
}

function AppLoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin mx-auto mb-4" />
        <h2 className="font-display text-3xl text-white">FINN'S FITNESS TRACKER</h2>
        <p className="text-slate-400 mt-2">Loading your training data...</p>
      </div>
    </div>
  );
}

function ConfigError({ message }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full card border-red-500/40">
        <h2 className="font-display text-2xl text-red-400 mb-2">Setup Required</h2>
        <p className="text-slate-300 text-sm mb-4">{message}</p>
        <div className="bg-slate-900 rounded-xl p-3 text-xs font-mono text-slate-400 space-y-1">
          <p>VITE_SUPABASE_URL=https://xxx.supabase.co</p>
          <p>VITE_SUPABASE_ANON_KEY=eyJ...</p>
        </div>
        <p className="text-slate-500 text-xs mt-3">Add these to your <code className="text-slate-300">.env</code> file and restart the dev server.</p>
      </div>
    </div>
  );
}

