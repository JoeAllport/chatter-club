// CoursesLayout.jsx — Courses shell (/courses/*)
// Top nav (shared) + courses second nav + footer
// Spec: docs/site-architecture.md — Courses section

import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import TopNav from '../../components/TopNav'

const COURSES_LINKS = [
  { to: '/courses',              label: 'All Courses',    match: p => p === '/courses' },
  { to: '/courses?cat=exam-prep',  label: 'Exam Prep',   match: p => p.includes('exam-prep') },
  { to: '/courses?cat=life-english', label: 'Life English', match: p => p.includes('life-english') },
  { to: '/courses/my',           label: 'My Courses',    match: p => p === '/courses/my' },
]

export default function CoursesLayout() {
  const { userId, isPro, checking } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-canvas flex flex-col" data-section="courses">

      {/* ── Top nav (shared) ─────────────────────────────────────────────── */}
      <TopNav userId={userId} isPro={isPro} checking={checking} />

      {/* ── Courses second nav ────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-canvas">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-6 overflow-x-auto no-scrollbar">
            {COURSES_LINKS.map(({ to, label, match }) => (
              <Link
                key={label}
                to={to}
                className={`whitespace-nowrap py-3 text-sm font-semibold border-b-2 transition-colors ${
                  match(location.pathname + location.search)
                    ? 'border-green text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
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
            <Link to="/courses" className="hover:text-gray-700 transition-colors">All Courses</Link>
            <Link to="/exam" className="hover:text-gray-700 transition-colors">Exam Centre</Link>
            <Link to="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
