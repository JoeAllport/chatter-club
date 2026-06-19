// NotFound.jsx — 404 page
// Shown when no route matches

import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import TopNav from '../components/TopNav'
import PageMeta from '../components/PageMeta'

export default function NotFound() {
  const { userId, isPro, checking } = useAuth()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageMeta
        title="Page not found"
        description="This page doesn't exist."
        canonical="/404"
      />

      <TopNav userId={userId} isPro={isPro} checking={checking} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-24">
        <p className="text-7xl font-bold text-gray-100 mb-2 leading-none select-none">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            Go to home
          </Link>
          <Link
            to="/articles"
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:border-gray-400 transition-colors"
          >
            Browse articles
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
          <Link to="/challenge"  className="hover:text-gray-700 transition-colors">Daily Challenge</Link>
          <Link to="/puzzles"    className="hover:text-gray-700 transition-colors">Puzzles</Link>
          <Link to="/exam"       className="hover:text-gray-700 transition-colors">Exam Centre</Link>
          <Link to="/courses"    className="hover:text-gray-700 transition-colors">Courses</Link>
          <Link to="/level-test" className="hover:text-gray-700 transition-colors">Level Test</Link>
        </div>
      </main>
    </div>
  )
}
