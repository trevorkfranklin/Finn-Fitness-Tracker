import { useState, useEffect } from 'react';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import WorkoutPage from './pages/WorkoutPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import AchievementsPage from './pages/AchievementsPage.jsx';
import { getProfile, createProfile } from './utils/db.js';
import { isConfigured } from './lib/supabase.js';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [appState, setAppState] = useState('loading'); // 'loading' | 'setup' | 'ready' | 'error'
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    if (!isConfigured) {
      setAppState('error');
      setInitError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
      return;
    }
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const p = await getProfile();
      if (p) {
        setProfile(p);
        setAppState('ready');
      } else {
        setAppState('setup');
      }
    } catch (err) {
      setInitError(err.message);
      setAppState('error');
    }
  }

  const handleSetupComplete = async (name) => {
    try {
      const p = await createProfile(name);
      setProfile(p);
      setAppState('ready');
    } catch (err) {
      setInitError(err.message);
      setAppState('error');
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  if (appState === 'loading') return <AppLoadingScreen />;
  if (appState === 'error') return <ConfigError message={initError} />;
  if (appState === 'setup') return <SetupScreen onComplete={handleSetupComplete} />;

  return (
    <div className="min-h-screen bg-slate-950 font-body">
      <div className="max-w-lg mx-auto">
        {page === 'dashboard' && <Dashboard profile={profile} onNavigate={setPage} />}
        {page === 'workout' && (
          <WorkoutPage profile={profile} onProfileUpdate={handleProfileUpdate} onNavigate={setPage} />
        )}
        {page === 'history' && <HistoryPage profile={profile} />}
        {page === 'achievements' && <AchievementsPage profile={profile} />}
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

function SetupScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const steps = [
    {
      heading: 'WELCOME TO',
      subheading: "FINN'S FITNESS TRACKER",
      body: 'Your personal football training app. Built for the linemen who do the dirty work and make every play possible.',
      cta: "LET'S GO!",
    },
    {
      heading: 'YOUR SUMMER',
      subheading: 'STARTS NOW',
      body: 'A 9-week program of strength, conditioning, and footwork drills — designed for your first season of tackle football. Every workout earns XP. Every rep makes you better.',
      cta: 'SOUNDS GOOD!',
    },
    {
      heading: 'ENTER YOUR',
      subheading: 'PLAYER NAME',
      body: null,
      cta: 'START TRAINING',
    },
  ];

  const current = steps[step];
  const isLastStep = step === steps.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      if (!name.trim()) return;
      setSaving(true);
      await onComplete(name.trim());
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6 animate-slide-up">
        <div className="text-center">
          <div className="inline-block bg-emerald-500 rounded-2xl p-4 mb-4">
            <svg className="w-12 h-12 text-white fill-white" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z" />
            </svg>
          </div>
          <h1 className="font-display text-5xl text-white leading-none tracking-wide">{current.heading}</h1>
          <h1 className="font-display text-5xl text-emerald-400 leading-none tracking-wide">{current.subheading}</h1>
        </div>

        {current.body && (
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <p className="text-slate-300 text-base leading-relaxed text-center">{current.body}</p>
          </div>
        )}

        {isLastStep && (
          <div className="space-y-3">
            <input
              type="text"
              className="w-full bg-slate-800 border-2 border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-4 text-white text-xl font-bold text-center focus:outline-none transition-colors"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              maxLength={20}
              autoFocus
            />
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={(isLastStep && !name.trim()) || saving}
          className="btn-gold w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : current.cta}
        </button>

        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-6 bg-emerald-500' : i < step ? 'w-2 bg-emerald-700' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
