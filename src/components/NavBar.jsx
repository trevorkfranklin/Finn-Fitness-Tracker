export default function NavBar({ currentPage, onNavigate }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: HomeIcon },
    { id: 'workout', label: 'Workout', icon: BoltIcon },
    { id: 'history', label: 'Progress', icon: ChartIcon },
    { id: 'achievements', label: 'Awards', icon: TrophyIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon active={active} />
              <span className={`text-xs font-semibold tracking-wide ${active ? 'text-emerald-400' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'fill-emerald-400' : 'fill-slate-500'}`} viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function BoltIcon({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'fill-emerald-400' : 'fill-slate-500'}`} viewBox="0 0 24 24">
      <path d="M7 2v11h3v9l7-12h-4l4-8z" />
    </svg>
  );
}

function ChartIcon({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'fill-emerald-400' : 'fill-slate-500'}`} viewBox="0 0 24 24">
      <path d="M3 13h2v8H3zm4-4h2v12H7zm4-6h2v18h-2zm4 3h2v15h-2zm4-2h2v17h-2z" />
    </svg>
  );
}

function TrophyIcon({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'fill-emerald-400' : 'fill-slate-500'}`} viewBox="0 0 24 24">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}
