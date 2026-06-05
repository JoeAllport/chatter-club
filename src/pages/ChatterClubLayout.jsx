import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ChatterClubLayout() {
  const [userId,     setUserId]     = useState(null)
  const [checking,   setChecking]   = useState(true)
  const location  = useLocation()
  const navigate  = useNavigate()

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => setUserId(data?.user?.id || null))
      .catch(() => setUserId(null))
      .finally(() => setChecking(false))

    // Listen for auth changes (e.g. sign-out from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUserId(null)
    navigate('/articles')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-100 sticky top-0 z-30 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">

          {/* Logo — goes to home if logged in, articles if not */}
          <Link
            to={userId ? '/home' : '/articles'}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <span className="text-lg font-bold text-gray-950 tracking-tight">Chatter Club</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6">
            {userId && (
              <NavLink to="/home" active={location.pathname === '/home'}>
                Home
              </NavLink>
            )}
            <NavLink to="/challenge" active={location.pathname === '/challenge'}>
              Daily challenge
            </NavLink>
            <NavLink to="/puzzles" active={location.pathname.startsWith('/puzzles')}>
              Puzzles
            </NavLink>
            <NavLink to="/podcasts" active={location.pathname.startsWith('/podcasts')}>
              Podcast
            </NavLink>
            <NavLink to="/courses" active={location.pathname.startsWith('/courses')}>
              Courses
            </NavLink>
            <NavLink to="/articles" active={location.pathname === '/articles'}>
              Articles
            </NavLink>
            {userId && (
              <NavLink to="/word-bank" active={location.pathname === '/word-bank'}>
                Word bank
              </NavLink>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {!checking && (
              userId ? (
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link
                    to="/level-test"
                    className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Level test
                  </Link>
                  <Link
                    to="/join"
                    className="text-sm px-3.5 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Join free
                  </Link>
                </>
              )
            )}
          </div>
        </div>

        {/* ── Mobile bottom nav ──────────────────────────────────────────── */}
        {userId && (
          <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 flex">
            <MobileNavLink to="/home"      active={location.pathname === '/home'}                    icon="🏠" label="Home" />
            <MobileNavLink to="/challenge" active={location.pathname === '/challenge'}               icon="🔥" label="Challenge" />
            <MobileNavLink to="/puzzles"   active={location.pathname.startsWith('/puzzles')}         icon="🟩" label="Puzzles" />
            <MobileNavLink to="/articles"  active={location.pathname === '/articles'}                icon="📖" label="Articles" />
            <MobileNavLink to="/word-bank" active={location.pathname === '/word-bank'}               icon="📚" label="Words" />
          </div>
        )}
      </header>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main className={`flex-1 ${userId ? 'pb-16 sm:pb-0' : ''}`}>
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Chatter Club</span>
          <div className="flex items-center gap-4">
            {userId && <Link to="/home"     className="hover:text-gray-700 transition-colors">Home</Link>}
            <Link to="/articles"            className="hover:text-gray-700 transition-colors">Articles</Link>
            <Link to="/courses"            className="hover:text-gray-700 transition-colors">Courses</Link>
            {userId && <Link to="/word-bank" className="hover:text-gray-700 transition-colors">Word bank</Link>}
            <Link to="/join"               className="hover:text-gray-700 transition-colors">Join</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ to, active, icon, label }) {
  return (
    <Link
      to={to}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
        active ? 'text-gray-900' : 'text-gray-400'
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      {label}
    </Link>
  )
}
