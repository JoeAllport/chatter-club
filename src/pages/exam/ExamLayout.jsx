// ExamLayout.jsx — Exam Centre shell (/exam/*)
// Spec: docs/site-architecture.md — Exam Centre section
//
// Top nav (shared) + exam second nav + footer

import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import TopNav from '../../components/TopNav'

const EXAM_LINKS = [
  { to: '/exam',            label: 'Home',             match: p => p === '/exam' },
  { to: '/exam/challenge',  label: 'Daily Challenge',  match: p => p.startsWith('/exam/challenge') },
  { to: '/exam/grammar',    label: 'Grammar',          match: p => p.startsWith('/exam/grammar') },
  { to: '/exam/practice',   label: 'Practice',         match: p => p.startsWith('/exam/practice') },
  { to: '/exam/writing',    label: 'Writing Grader',   match: p => p.startsWith('/exam/writing') },
]

export default function ExamLayout() {
  const { userId, isPro, checking } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-canvas flex flex-col" data-section="exam">

      {/* ── Top nav (shared) ─────────────────────────────────────────────── */}
      <TopNav userId={userId} isPro={isPro} checking={checking} />

      {/* ── Exam second nav ───────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-canvas">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-blue-dark/50 uppercase tracking-widest hidden sm:block flex-shrink-0 py-3">
              Exam
            </span>
            <nav className="flex gap-6 overflow-x-auto no-scrollbar">
              {EXAM_LINKS.map(({ to, label, match }) => (
                <Link
                  key={to}
                  to={to}
                  className={`whitespace-nowrap py-3 text-sm font-semibold border-b-2 transition-colors ${
                    match(location.pathname)
                      ? 'border-blue-dark text-blue-dark'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet context={{ userId, isPro }} />
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 mt-16 bg-canvas">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Chatter Club</span>
          <div className="flex items-center gap-4">
            <Link to="/exam/grammar" className="hover:text-gray-700 transition-colors">Grammar Reference</Link>
            <Link to="/exam/challenge" className="hover:text-gray-700 transition-colors">Daily Challenge</Link>
            <Link to="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
