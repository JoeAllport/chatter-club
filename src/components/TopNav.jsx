// TopNav.jsx — shared top navigation across all sections
// Present on every page: Home / Exam / Courses / Subscribe / Sign in

import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Props:
 *   userId   — string | null   (null = logged out)
 *   isPro    — bool            (true = subscribed)
 *   checking — bool            (auth state still loading)
 */
export default function TopNav({ userId, isPro, checking }) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="border-b border-gray-200 sticky top-0 z-30 bg-canvas/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">

        {/* Logo — always → / */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0"
        >
          <span className="text-lg font-bold text-gray-950" style={{ letterSpacing: '-0.02em' }}>
            Chatter Club
          </span>
        </Link>

        {/* Centre nav — Exam + Courses (equal weight) */}
        <nav className="hidden sm:flex items-center gap-8">
          <Link
            to="/exam"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Exam
          </Link>
          <Link
            to="/courses"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Courses
          </Link>
        </nav>

        {/* Right side — Subscribe + Sign in / avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!checking && (
            <>
              {/* Subscribe (hidden when already Pro) */}
              {!isPro && (
                <Link
                  to="/subscribe"
                  className="hidden sm:inline-block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Subscribe
                </Link>
              )}

              {userId ? (
                /* Signed in — avatar / sign out */
                <div className="flex items-center gap-3">
                  {isPro && (
                    <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand">
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
                /* Signed out */
                <Link
                  to="/join"
                  className="text-sm px-3.5 py-1.5 bg-green text-white rounded-lg hover:bg-green-dark transition-colors font-medium"
                >
                  Sign in
                </Link>
              )}
            </>
          )}

          {/* Mobile hamburger placeholder — TODO expand when needed */}
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
