// App.jsx — Route configuration for Chatter Club
// Architecture: one app, path-based routing, no subdomains at launch
// Spec: docs/site-architecture.md

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

// ── Layouts ────────────────────────────────────────────────────────────────────
import ChatterClubLayout from './pages/ChatterClubLayout'   // Hub section
import StudioLayout      from './pages/studio/StudioLayout'
import ExamLayout        from './pages/exam/ExamLayout'     // Exam Centre section
import CoursesLayout     from './pages/courses/CoursesLayout' // Courses section

// ── Marketing / standalone pages ──────────────────────────────────────────────
import HomePage   from './pages/HomePage'   // / — marketing home
import Privacy    from './pages/Privacy'    // /privacy
import Terms      from './pages/Terms'      // /terms
import NotFound   from './pages/NotFound'   // 404

// ── Hub pages (inside ChatterClubLayout) ──────────────────────────────────────
import PlatformHome    from './pages/PlatformHome'
import ArticleList     from './pages/ArticleList'
import ArticleReader   from './pages/ArticleReader'
import WordBank        from './pages/WordBank'
import LevelTest       from './pages/LevelTest'
import DailyChallenge  from './pages/DailyChallenge'
import PodcastList     from './pages/PodcastList'
import PodcastPlayer   from './pages/PodcastPlayer'

// ── Puzzle games (inside ChatterClubLayout) ───────────────────────────────────
import PuzzleHub         from './pages/puzzles/PuzzleHub'
import PuzzleWordle      from './pages/puzzles/PuzzleWordle'
import PuzzleConnections from './pages/puzzles/PuzzleConnections'
import PuzzleLadder      from './pages/puzzles/PuzzleLadder'
import PuzzleHive        from './pages/puzzles/PuzzleHive'
import PuzzleCrossword   from './pages/puzzles/PuzzleCrossword'
import PuzzleCalendarPage from './pages/puzzles/PuzzleCalendarPage'

// ── Exam Centre pages (inside ExamLayout) ────────────────────────────────────
import ExamHome          from './pages/exam/ExamHome'
import ExamChallenge     from './pages/exam/ExamChallenge'
import ExamGrammarIndex  from './pages/exam/ExamGrammarIndex'
import ExamGrammarPage   from './pages/exam/ExamGrammarPage'
import ExamPractice      from './pages/exam/ExamPractice'
import ExamWriting       from './pages/exam/ExamWriting'

// ── Courses pages (inside CoursesLayout) ─────────────────────────────────────
import CoursesHome    from './pages/courses/CoursesHome'
import CoursePlayer   from './pages/CoursePlayer'
import UnitPage       from './pages/courses/UnitPage'

// ── Lesson session — full screen, no layout chrome ───────────────────────────
import LessonSession from './pages/session/LessonSession'

// ── Auth + onboarding ────────────────────────────────────────────────────────
import Subscribe    from './pages/Subscribe'
import Join         from './pages/Join'
import AuthCallback from './pages/AuthCallback'
import Onboarding   from './pages/Onboarding'

// ── Studio pages ─────────────────────────────────────────────────────────────
import StudioArticles from './pages/studio/StudioArticles'
import StudioCourses  from './pages/studio/StudioCourses'
import StudioSyllabus from './pages/studio/StudioSyllabus'
import StudioSeasons  from './pages/studio/StudioSeasons'
import StudioCorpus   from './pages/studio/StudioCorpus'

// ── Studio guard ──────────────────────────────────────────────────────────────
function StudioGuard({ children }) {
  const [status, setStatus] = useState('loading') // loading | allowed | denied

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid     = data?.user?.id
      const allowed = import.meta.env.VITE_STUDIO_USER_ID
      setStatus(uid && uid === allowed ? 'allowed' : 'denied')
    })
  }, [])

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
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

        {/* ── Marketing home page — standalone (own nav, own footer) ────────── */}
        <Route path="/" element={<HomePage />} />

        {/* ── Legal pages — standalone ──────────────────────────────────────── */}
        <Route path="/privacy"  element={<Privacy />} />
        <Route path="/terms"    element={<Terms />} />

        {/* ── Hub — Chatter Club learner section ────────────────────────────── */}
        <Route element={<ChatterClubLayout />}>
          <Route path="/home"              element={<PlatformHome />} />
          <Route path="/challenge"          element={<DailyChallenge />} />
          <Route path="/articles"           element={<ArticleList />} />
          <Route path="/articles/:slug"     element={<ArticleReader />} />
          <Route path="/words"              element={<WordBank />} />
          <Route path="/word-bank"          element={<Navigate to="/words" replace />} />
          <Route path="/level-test"         element={<LevelTest />} />
          <Route path="/podcasts"           element={<PodcastList />} />
          <Route path="/podcasts/:id"       element={<PodcastPlayer />} />
          {/* Puzzle hub */}
          <Route path="/puzzles"                       element={<PuzzleHub />} />
          {/* Puzzle landing pages (calendar) */}
          <Route path="/puzzles/wordle"                element={<PuzzleCalendarPage puzzleType="wordle" />} />
          <Route path="/puzzles/connections"           element={<PuzzleCalendarPage puzzleType="connections" />} />
          <Route path="/puzzles/ladder"                element={<PuzzleCalendarPage puzzleType="ladder" />} />
          <Route path="/puzzles/hive"                  element={<PuzzleCalendarPage puzzleType="hive" />} />
          <Route path="/puzzles/crossword"             element={<PuzzleCalendarPage puzzleType="crossword" />} />
          {/* Puzzle game routes (by date) */}
          <Route path="/puzzles/wordle/:date"          element={<PuzzleWordle />} />
          <Route path="/puzzles/connections/:date"     element={<PuzzleConnections />} />
          <Route path="/puzzles/ladder/:date"          element={<PuzzleLadder />} />
          <Route path="/puzzles/hive/:date"            element={<PuzzleHive />} />
          <Route path="/puzzles/crossword/:date"       element={<PuzzleCrossword />} />
        </Route>

        {/* ── Exam Centre ───────────────────────────────────────────────────── */}
        <Route path="/exam" element={<ExamLayout />}>
          <Route index               element={<ExamHome />} />
          <Route path="challenge"    element={<ExamChallenge />} />
          <Route path="grammar"      element={<ExamGrammarIndex />} />
          <Route path="grammar/:point" element={<ExamGrammarPage />} />
          <Route path="practice"     element={<ExamPractice />} />
          <Route path="writing"      element={<ExamWriting />} />
        </Route>

        {/* ── Courses ───────────────────────────────────────────────────────── */}
        <Route path="/courses" element={<CoursesLayout />}>
          <Route index              element={<CoursesHome />} />
          {/* Course player rendered inside the courses layout shell */}
          <Route path=":slug"       element={<CoursePlayer />} />
        </Route>

        {/* ── Unit page — full screen, no layout chrome ─────────────────────── */}
        <Route
          path="/courses/:slug/units/:unitId"
          element={<UnitPage />}
        />

        {/* ── Lesson session — full screen, no layout chrome ────────────────── */}
        <Route
          path="/courses/:slug/chapters/:chapterId"
          element={<LessonSession />}
        />

        {/* ── Subscribe page ────────────────────────────────────────────────── */}
        <Route path="/subscribe" element={<Subscribe />} />

        {/* ── Auth + onboarding ─────────────────────────────────────────────── */}
        <Route path="/join"          element={<Join />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding"    element={<Onboarding />} />

        {/* ── Studio — content creation centre (Joe only) ───────────────────── */}
        <Route path="/studio" element={
          <StudioGuard>
            <StudioLayout />
          </StudioGuard>
        }>
          <Route index           element={<StudioArticles />} />
          <Route path="articles" element={<StudioArticles />} />
          <Route path="courses"  element={<StudioCourses />} />
          <Route path="syllabus" element={<StudioSyllabus />} />
          <Route path="seasons"  element={<StudioSeasons />} />
          <Route path="corpus"   element={<StudioCorpus />} />
        </Route>

        {/* ── 404 ───────────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  )
}
