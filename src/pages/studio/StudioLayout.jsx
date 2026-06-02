import { NavLink, Outlet, useNavigate } from 'react-router-dom'

// TIER: admin (Joe only) — gated by StudioGuard in App.jsx

const NAV = [
  { to: '/studio/articles', icon: '📰', label: 'Articles' },
  { to: '/studio/syllabus', icon: '📚', label: 'Syllabus' },
  { to: '/studio/seasons',  icon: '🗓',  label: 'Seasons'  },
  { to: '/studio/corpus',   icon: '🔤',  label: 'Corpus'   },
]

export default function StudioLayout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎙</span>
            <span className="text-sm font-bold text-white tracking-tight">Studio</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Content creation</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={() => navigate('/home')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800/60 transition-colors"
          >
            <span>←</span>
            Back to site
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen overflow-auto bg-gray-950">
        <Outlet />
      </main>

    </div>
  )
}
