// TopNav.jsx — shared top navigation across all sections
// Present on every page across Hub / Exam / Courses
//
// Centre nav: Practice | Exam | Courses  (always visible — good marketing for logged-out users)
// Logo always → /  (which auto-redirects logged-in users to /home)
// Right side: Subscribe | Sign in  →  [Pro badge] | Sign out  when logged in

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Props:
 *   userId   — string | null   (null = logged out)
 *   isPro    — bool            (true = subscribed)
 *   checking — bool            (auth state still loading)
 */
export default function TopNav({ userId, isPro, checking }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const path      = location.pathname

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Active state helpers
  const practiceActive = path === '/home' || path === '/challenge' || path === '/articles' ||
                         path.startsWith('/articles/') || path === '/podcasts' ||
                         path.startsWith('/podcasts/') || path === '/puzzles' ||
                         path.startsWith('/puzzles/') || path === '/words'
  const examActive     = path.startsWith('/exam')
  const coursesActive  = path.startsWith('/courses')

  return (
    <header className="border-b border-gray-200 sticky top-0 z-30 bg-canvas/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">

        {/* Logo — always → / (auto-redirects logged-in users to /home via HomePage) */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0"
        >
          <span className="text-lg font-bold text-gray-950" style={{ letterSpacing: '-0.02em' }}>
            Chatter Club
          </span>
        </Link>

        {/* Centre nav — Practice | Exam | Courses */}
        <nav className="hidden sm:flex items-center gap-8">
          <NavLink to="/home" active={practiceActive}>Practice</NavLink>
          <NavLink to="/exam" active={examActive}>Exam</NavLink>
          <NavLink to="/courses" active={coursesActive}>Courses</NavLink>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!checking && (
            <>
              {/* Subscribe — hidden when Pro */}
              {!isPro && (
                <Link
                  to="/subscribe"
                  className="hidden sm:inline-block text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
                >
                  Subscribe
                </Link>
              )}

              {userId ? (
                <div className="flex items-center gap-3">
                  {isPro && (
                    <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-green-light text-green-dark">
                      Pro
                    </span>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  to="/join"
                  className="text-sm px-3.5 py-1.5 bg-green text-white rounded-lg hover:bg-green-dark transition-colors font-semibold"
                >
                  Sign in
                </Link>
              )}
            </>
          )}

          {/* Mobile menu placeholder */}
          <button className="sm:hidden p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`text-sm font-semibold transition-colors ${
        active ? 'text-gray-950' : 'text-gray-400 hover:text-gray-700'
      }`}
    >
      {children}
    </Link>
  )
}
