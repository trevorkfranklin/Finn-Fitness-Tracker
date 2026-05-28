import { useState } from 'react';
import { findOrCreateProfileByName } from '../utils/db.js';

export default function AuthPage({ onAuth }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = firstName.trim() && lastName.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await findOrCreateProfileByName(firstName, lastName);
      onAuth(profile);
    } catch (err) {
      setError(err.message);
      setLoading(false);
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
          <h1 className="font-display text-5xl text-white leading-none tracking-wide">FINN'S FITNESS</h1>
          <h1 className="font-display text-5xl text-emerald-400 leading-none tracking-wide">TRACKER</h1>
          <p className="text-slate-400 text-sm mt-3">Enter your name to get started</p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            className="w-full bg-slate-800 border-2 border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-4 text-white text-xl font-bold text-center focus:outline-none transition-colors"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoCapitalize="words"
            autoComplete="given-name"
            maxLength={20}
          />
          <input
            type="text"
            className="w-full bg-slate-800 border-2 border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-4 text-white text-xl font-bold text-center focus:outline-none transition-colors"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoCapitalize="words"
            autoComplete="family-name"
            maxLength={20}
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="btn-gold w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : "LET'S GO!"}
        </button>

        <p className="text-slate-600 text-xs text-center">
          Your progress is saved to your name — use the same name on any device to sync.
        </p>
      </div>
    </div>
  );
}
