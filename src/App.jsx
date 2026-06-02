import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layout
import ChatterClubLayout from './pages/ChatterClubLayout'

// Public learner pages
import PlatformHome   from './pages/PlatformHome'
import ArticleList    from './pages/ArticleList'
import ArticleReader  from './pages/ArticleReader'
import WordBank       from './pages/WordBank'
import LevelTest      from './pages/LevelTest'

// Auth + onboarding
import Join         from './pages/Join'
import AuthCallback from './pages/AuthCallback'
import Onboarding   from './pages/Onboarding'

// ── Route guards ──────────────────────────────────────────────────────────────

// Studio guard — only Joe's user ID can access /studio
// Replace VITE_STUDIO_USER_ID in .env.local with your Supabase auth user ID
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function StudioGuard({ children }) {
  const [status, setStatus] = useState('loading') // loading | allowed | denied

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id
      const allowed = import.meta.env.VITE_STUDIO_USER_ID
      setStatus(uid && uid === allowed ? 'allowed' : 'denied')
    })
  }, [])

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (status === 'denied') return <Navigate to="/" replace />
  return children
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public learner surface (Chatter Club layout) ───────────────── */}
        <Route element={<ChatterClubLayout />}>
          <Route path="/"              element={<PlatformHome />} />
          <Route path="/home"          element={<PlatformHome />} />
          <Route path="/articles"      element={<ArticleList />} />
          <Route path="/articles/:slug" element={<ArticleReader />} />
          <Route path="/word-bank"     element={<WordBank />} />
          <Route path="/level-test"    element={<LevelTest />} />
        </Route>

        {/* ── Auth + onboarding (no layout chrome) ──────────────────────── */}
        <Route path="/join"          element={<Join />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding"    element={<Onboarding />} />

        {/* ── Studio — content creation centre (Joe only) ───────────────── */}
        {/* Pages will be added here as /studio is built */}
        <Route path="/studio/*" element={
          <StudioGuard>
            <div className="flex items-center justify-center min-h-screen text-gray-400">
              Studio coming soon
            </div>
          </StudioGuard>
        } />

        {/* ── Teacher layer (TeachKit) — routes added here as built ─────── */}
        {/* <Route path="/teach/*" element={<TeachLayout />}> ... </Route> */}

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
