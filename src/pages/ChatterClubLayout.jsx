// ChatterClubLayout.jsx — Hub shell (/home, /articles, /podcasts, /puzzles, /challenge, /words)
// Includes: TopNav (all sections) + hub second nav + persistent banner + hub footer

import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import TopNav from '../components/TopNav'

const HUB_LINKS = [
  { to: '/home',      label: 'Home',      match: p => p === '/home' },
  { to: '/articles',  label: 'Articles',  match: p => p === '/articles' || p.startsWith('/articles/') },
  { to: '/podcasts',  label: 'Podcasts',  match: p => p === '/podcasts' || p.startsWith('/podcasts/') },
  { to: '/puzzles',   label: 'Puzzles',   match: p => p === '/puzzles'  || p.startsWith('/puzzles/') },
  { to: '/challenge', label: 'Challenge', match: p => p === '/challenge' },
  { to: '/words',     label: 'Word Bank', match: p => p === '/words' },
]

export default function ChatterClubLayout() {
  const { userId, isPro, checking } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-canvas flex flex-col" data-section="hub">

      {/* ── Top nav (shared across all sections) ─────────────────────────── */}
      <TopNav userId={userId} isPro={isPro} checking={checking} />

      {/* ── Persistent banner (logged-out / free users only) ──────────────── */}
      {!checking && (
        userId
          ? !isPro && <ProBanner />
          : <SignUpBanner />
      )}

      {/* ── Hub second nav ────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-canvas">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-6 overflow-x-auto no-scrollbar">
            {HUB_LINKS.map(({ to, label, match }) => (
              <Link
                key={to}
                to={to}
                className={`whitespace-nowrap py-3 text-sm font-semibold border-b-2 transition-colors ${
                  match(location.pathname)
                    ? 'border-pink text-gray-900'
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
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <HubFooter />
    </div>
  )
}

// ── Persistent banners ────────────────────────────────────────────────────────

function SignUpBanner() {
  return (
    <div className="bg-green text-white py-2.5 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <span className="text-gray-300">
          Sign up free to save your progress, translate words and build your word bank.
        </span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/join"
            className="font-medium text-white underline underline-offset-2 hover:no-underline transition-all"
          >
            Sign up
          </Link>
          <Link
            to="/join?mode=signin"
            className="text-white/70 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

function ProBanner() {
  return (
    <div className="bg-yellow-light border-b border-yellow/40 py-2.5 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <span className="text-gray-700">
          Upgrade to Pro to unlock the full article archive, all podcasts and more.
        </span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/subscribe"
            className="font-semibold text-gray-800 underline underline-offset-2 hover:no-underline transition-all"
          >
            See what's included
          </Link>
          <Link
            to="/subscribe"
            className="text-xs px-3 py-1 bg-yellow text-gray-900 rounded-lg hover:bg-yellow-dark transition-colors font-semibold"
          >
            Subscribe
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function HubFooter() {
  return (
    <footer className="border-t border-gray-200 mt-16 bg-canvas">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm text-gray-500">

        <div>
          <p className="font-semibold text-gray-900 mb-3">Chatter Club</p>
          <div className="space-y-2">
            <FooterLink to="/articles">Articles</FooterLink>
            <FooterLink to="/podcasts">Podcasts</FooterLink>
            <FooterLink to="/puzzles">Puzzles</FooterLink>
            <FooterLink to="/challenge">Daily Challenge</FooterLink>
            <FooterLink to="/words">Word Bank</FooterLink>
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-900 mb-3">Exam Prep</p>
          <div className="space-y-2">
            <FooterLink to="/exam">Exam Centre</FooterLink>
            <FooterLink to="/exam/challenge">Daily Exam Challenge</FooterLink>
            <FooterLink to="/exam/grammar">Grammar Reference</FooterLink>
            <FooterLink to="/exam/practice">Practice Papers</FooterLink>
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-900 mb-3">Courses</p>
          <div className="space-y-2">
            <FooterLink to="/courses">All Courses</FooterLink>
            <FooterLink to="/courses?cat=exam-prep">Exam Prep</FooterLink>
            <FooterLink to="/courses?cat=life-english">Life English</FooterLink>
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-900 mb-3">Info</p>
          <div className="space-y-2">
            <FooterLink to="/level-test">Level Test</FooterLink>
            <FooterLink to="/subscribe">Subscribe</FooterLink>
            <FooterLink to="/privacy">Privacy</FooterLink>
            <FooterLink to="/terms">Terms</FooterLink>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 pb-8 text-xs text-gray-400">
        © {new Date().getFullYear()} Chatter Club
      </div>
    </footer>
  )
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="block hover:text-gray-900 transition-colors">
      {children}
    </Link>
  )
}
