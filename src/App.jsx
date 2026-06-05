import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import ChatterClubLayout from './pages/ChatterClubLayout'
import StudioLayout      from './pages/studio/StudioLayout'

// Studio pages
import StudioArticles from './pages/studio/StudioArticles'
import StudioCourses  from './pages/studio/StudioCourses'
import StudioSyllabus from './pages/studio/StudioSyllabus'
import StudioSeasons  from './pages/studio/StudioSeasons'
import StudioCorpus   from './pages/studio/StudioCorpus'

// Public learner pages
import PlatformHome    from './pages/PlatformHome'
import ArticleList     from './pages/ArticleList'
import ArticleReader   from './pages/ArticleReader'
import WordBank        from './pages/WordBank'
import LevelTest       from './pages/LevelTest'
import DailyChallenge  from './pages/DailyChallenge'
import PodcastList     from './pages/PodcastList'
import PodcastPlayer   from './pages/PodcastPlayer'
import CourseList      from './pages/CourseList'
import CoursePlayer    from './pages/CoursePlayer'

// Puzzle games
import PuzzleHub         from './pages/puzzles/PuzzleHub'
import PuzzleWordle      from './pages/puzzles/PuzzleWordle'
import PuzzleConnections from './pages/puzzles/PuzzleConnections'
import PuzzleLadder      from './pages/puzzles/PuzzleLadder'
import PuzzleHive        from './pages/puzzles/PuzzleHive'
import PuzzleCrossword   from './pages/puzzles/PuzzleCrossword'

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
          <Route path="/challenge"      element={<DailyChallenge />} />
          <Route path="/articles"       element={<ArticleList />} />
          <Route path="/articles/:slug" element={<ArticleReader />} />
          <Route path="/word-bank"      element={<WordBank />} />
          <Route path="/level-test"     element={<LevelTest />} />
          <Route path="/podcasts"       element={<PodcastList />} />
          <Route path="/podcasts/:id"   element={<PodcastPlayer />} />
          {/* Courses */}
          <Route path="/courses"        element={<CourseList />} />
          <Route path="/courses/:slug"  element={<CoursePlayer />} />
          {/* Puzzle games */}
          <Route path="/puzzles"              element={<PuzzleHub />} />
          <Route path="/puzzles/wordle"       element={<PuzzleWordle />} />
          <Route path="/puzzles/connections"  element={<PuzzleConnections />} />
          <Route path="/puzzles/ladder"       element={<PuzzleLadder />} />
          <Route path="/puzzles/hive"         element={<PuzzleHive />} />
          <Route path="/puzzles/crossword"    element={<PuzzleCrossword />} />
        </Route>

        {/* ── Auth + onboarding (no layout chrome) ──────────────────────── */}
        <Route path="/join"          element={<Join />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding"    element={<Onboarding />} />

        {/* ── Studio — content creation centre (Joe only) ───────────────── */}
        <Route path="/studio" element={
          <StudioGuard>
            <StudioLayout />
          </StudioGuard>
        }>
          <Route index element={<StudioArticles />} />
          <Route path="articles" element={<StudioArticles />} />
          <Route path="courses"  element={<StudioCourses />} />
          <Route path="syllabus" element={<StudioSyllabus />} />
          <Route path="seasons"  element={<StudioSeasons />} />
          <Route path="corpus"   element={<StudioCorpus />} />
        </Route>

        {/* ── Teacher layer (TeachKit) — routes added here as built ─────── */}
        {/* <Route path="/teach/*" element={<TeachLayout />}> ... </Route> */}

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
