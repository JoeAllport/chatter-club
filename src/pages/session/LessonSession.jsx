/**
 * LessonSession.jsx
 * -----------------
 * Full-screen session shell. Replaces the CoursePlayer chapter content.
 * Route: /courses/:slug/chapters/:chapterId
 *
 * Manages:
 *  - Loading blocks from Supabase
 *  - Building the screen queue via buildQueue()
 *  - Progress bar (top)
 *  - Screen-by-screen rendering with slide transitions
 *  - Correct/wrong tracking + DB saves
 *  - Reference popover
 *  - X to exit → back to course
 *  - Completion screen + chapter mark-complete
 */

import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { buildQueue } from './buildQueue'
import ReferencePopover from './ReferencePopover'
import IntroScreen      from './screens/IntroScreen'
import MCQScreen        from './screens/MCQScreen'
import ClozeScreen      from './screens/ClozeScreen'
import WordFormScreen   from './screens/WordFormScreen'
import TransformScreen  from './screens/TransformScreen'
import MatchScreen      from './screens/MatchScreen'
import CompletionScreen from './screens/CompletionScreen'
import WordFlashScreen   from './screens/WordFlashScreen'
import SpeedRoundScreen  from './screens/SpeedRoundScreen'
import MemoryPairsScreen from './screens/MemoryPairsScreen'
import PassageScreen     from './screens/PassageScreen'
import PrepSprintScreen       from './screens/PrepSprintScreen'
import CollocationSnapScreen  from './screens/CollocationSnapScreen'
import WordFamilyScreen          from './screens/WordFamilyScreen'
import TransformAnalyserScreen  from './screens/TransformAnalyserScreen'
import PronounTrackerScreen     from './screens/PronounTrackerScreen'
import TrueMatchScreen          from './screens/TrueMatchScreen'
import DistractorSpotterScreen  from './screens/DistractorSpotterScreen'
import CohesionDetectorScreen   from './screens/CohesionDetectorScreen'
import SentenceSorterScreen     from './screens/SentenceSorterScreen'
import SynonymSnapScreen        from './screens/SynonymSnapScreen'
import ReadingPassageScreen     from './screens/ReadingPassageScreen'

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total, colour = '#6366f1' }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: colour }}
      />
    </div>
  )
}

// ─── Streak indicator ─────────────────────────────────────────────────────────

function StreakFlash({ streak }) {
  if (streak < 3) return null
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 animate-bounce">
      <div className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
        🔥 {streak} in a row!
      </div>
    </div>
  )
}

// ─── Screen dispatcher ────────────────────────────────────────────────────────

function ScreenRenderer({ screen, onNext }) {
  switch (screen.type) {
    case 'intro':
      return <IntroScreen data={screen.data} onNext={() => onNext(null)} />
    case 'mcq':
      return <MCQScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'cloze_item':
      return <ClozeScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'word_form':
      return <WordFormScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'transform':
      return <TransformScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'match_pair':
      return <MatchScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'passage':
      return <PassageScreen data={screen.data} onNext={() => onNext(null)} />
    case 'prep_sprint':
      return <PrepSprintScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'collocation_snap':
      return <CollocationSnapScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'word_family':
      return <WordFamilyScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'transform_analyser':
      return <TransformAnalyserScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'pronoun_tracker':
      return <PronounTrackerScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'true_match':
      return <TrueMatchScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'distractor_spotter':
    case 'highlight_task':
      return <DistractorSpotterScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'cohesion_detector':
      return <CohesionDetectorScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'sentence_sorter':
      return <SentenceSorterScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'synonym_snap':
      return <SynonymSnapScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'reading_passage':
      return <ReadingPassageScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'word_flash':
      return <WordFlashScreen data={screen.data} onNext={(correct, flag) => onNext(correct)} />
    case 'speed_round':
      return <SpeedRoundScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'memory_pairs':
      return <MemoryPairsScreen data={screen.data} onNext={(correct) => onNext(correct)} />
    case 'writing':
      // Writing tasks break out of the step flow — shown as a full screen
      return <WritingScreen data={screen.data} onNext={() => onNext(null)} />
    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          Unknown screen type: {screen.type}
        </div>
      )
  }
}

// ─── Inline writing screen ────────────────────────────────────────────────────

function WritingScreen({ data, onNext }) {
  const [text, setText] = useState('')
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const pct = data.target_words ? Math.min(100, Math.round((wordCount / data.target_words) * 100)) : null

  return (
    <div className="flex flex-col h-full px-6 py-6">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex-shrink-0">
        <p className="font-semibold text-amber-900 text-sm mb-1">
          {data.task_type ? data.task_type.charAt(0).toUpperCase() + data.task_type.slice(1) : 'Writing task'}
        </p>
        <p className="text-amber-800 text-sm leading-relaxed">{data.prompt}</p>
        {data.target_words && (
          <p className="text-xs text-amber-600 mt-1">Target: {data.target_words} words</p>
        )}
      </div>

      {data.scaffold && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 flex-shrink-0 text-xs text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">Scaffold</p>
          <p className="whitespace-pre-line">{data.scaffold}</p>
        </div>
      )}

      <textarea
        rows={8}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your answer here…"
        className="flex-1 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-indigo-400 resize-none"
      />

      <div className="flex items-center justify-between mt-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{wordCount} words</span>
          {pct !== null && (
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-indigo-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
        <button
          onClick={onNext}
          disabled={!text.trim()}
          className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm disabled:opacity-40 hover:bg-indigo-700 transition-colors"
        >
          Submit →
        </button>
      </div>
    </div>
  )
}

// ─── Main LessonSession ───────────────────────────────────────────────────────

export default function LessonSession() {
  const { slug, chapterId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading]         = useState(true)
  const [queue, setQueue]             = useState([])
  const [chapter, setChapter]         = useState(null)
  const [course, setCourse]           = useState(null)
  const [reference, setReference]     = useState(null)
  const [user, setUser]               = useState(null)

  const [screenIdx, setScreenIdx]     = useState(0)
  const [results, setResults]         = useState([]) // { screenId, correct }
  const [streak, setStreak]           = useState(0)
  const [showStreak, setShowStreak]   = useState(false)
  const [showRef, setShowRef]         = useState(false)
  const [done, setDone]               = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const startTime = useRef(Date.now())
  const blockResponsesRef = useRef({}) // blockId → accumulated answers

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      // Resolve course by slug or id
      let { data: courseData } = await supabase
        .from('courses')
        .select('id, title, slug, is_free')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (!courseData) {
        const { data: byId } = await supabase
          .from('courses')
          .select('id, title, slug, is_free')
          .eq('id', slug)
          .eq('status', 'published')
          .maybeSingle()
        courseData = byId
      }

      if (!courseData) { navigate('/courses'); return }
      setCourse(courseData)

      // Chapter
      const { data: chapterData } = await supabase
        .from('course_chapters')
        .select('id, title, chapter_type, estimated_mins')
        .eq('id', chapterId)
        .maybeSingle()

      if (!chapterData) { navigate(`/courses/${slug}`); return }
      setChapter(chapterData)

      // Blocks (exclude teacher_only)
      const { data: blockData } = await supabase
        .from('chapter_blocks')
        .select('id, block_type, content, is_scored, position')
        .eq('chapter_id', chapterId)
        .eq('teacher_only', false)
        .order('position')

      const q = buildQueue(blockData || [])
      setQueue(q)

      // Build reference from vocabulary + matching blocks
      const refVocab = []
      const refGrammar = []
      ;(blockData || []).forEach(b => {
        if (b.block_type === 'vocabulary' && b.content?.items) {
          b.content.items.forEach(item => {
            refVocab.push({
              word: item.word,
              pos: item.pos || null,
              definition: item.definition,
              example: item.example || null,
              collocations: item.collocations || null,
            })
          })
        }
        if (b.block_type === 'matching' && b.content?.pairs) {
          b.content.pairs.forEach(p => {
            refVocab.push({ word: p.term, definition: p.definition })
          })
        }
      })
      setReference({
        title: chapterData.title,
        vocab: refVocab,
        grammar: refGrammar,
      })

      setLoading(false)
    }
    load()
  }, [slug, chapterId])

  // ── Advance screen ──────────────────────────────────────────────────────────

  async function handleNext(correct) {
    const screen = queue[screenIdx]

    // Track result
    if (correct !== null && screen.isScored) {
      setResults(prev => [...prev, { screenId: screen.id, correct }])

      // Streak
      if (correct) {
        const newStreak = streak + 1
        setStreak(newStreak)
        if (newStreak >= 3 && newStreak % 3 === 0) {
          setShowStreak(true)
          setTimeout(() => setShowStreak(false), 1800)
        }
      } else {
        setStreak(0)
      }

      // Save block response to DB
      if (user && screen.blockId) {
        saveBlockResponse(screen, correct)
      }
    }

    // Transition to next screen
    const isLast = screenIdx >= queue.length - 1
    if (isLast) {
      // Mark chapter complete + show completion screen
      if (user && course) {
        await supabase
          .from('user_course_progress')
          .upsert({
            user_id: user.id,
            course_id: course.id,
            chapter_id: chapterId,
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,chapter_id' })
      }
      setDone(true)
    } else {
      setTransitioning(true)
      setTimeout(() => {
        setScreenIdx(i => i + 1)
        setTransitioning(false)
      }, 150)
    }
  }

  async function saveBlockResponse(screen, correct) {
    try {
      await supabase
        .from('chapter_block_responses')
        .upsert({
          user_id: user.id,
          chapter_id: chapterId,
          block_id: screen.blockId,
          response: { screenId: screen.id, correct },
          score_pct: correct ? 100 : 0,
          submitted_at: new Date().toISOString(),
        }, { onConflict: 'user_id,block_id' })
    } catch (e) {
      console.warn('Failed to save block response', e)
    }
  }

  function handleExit() {
    navigate(`/courses/${slug}`)
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const scoredResults   = results.filter(r => {
    const screen = queue.find(s => s.id === r.screenId)
    return screen?.isScored
  })
  const correctCount    = scoredResults.filter(r => r.correct).length
  const timeSeconds     = Math.round((Date.now() - startTime.current) / 1000)

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-500 text-sm text-center">No content in this chapter yet.</p>
        <button onClick={handleExit} className="text-indigo-600 text-sm font-medium">
          ← Back to course
        </button>
      </div>
    )
  }

  // ── Completion screen ───────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col">
        <CompletionScreen
          score={correctCount}
          totalScreens={queue.length}
          scoredScreens={scoredResults.length}
          timeSeconds={timeSeconds}
          chapterTitle={chapter?.title}
          onContinue={handleExit}
          onExit={handleExit}
        />
      </div>
    )
  }

  // ── Session ─────────────────────────────────────────────────────────────────

  const currentScreen = queue[screenIdx]

  return (
    <div className="fixed inset-0 bg-white flex flex-col">

      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-3 flex-shrink-0 border-b border-gray-100">
        <button
          onClick={handleExit}
          className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 p-1"
          aria-label="Exit session"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <ProgressBar current={screenIdx} total={queue.length} />

        <span className="text-xs text-gray-400 flex-shrink-0 font-medium">
          {screenIdx + 1}/{queue.length}
        </span>
      </div>

      {/* Streak flash */}
      {showStreak && <StreakFlash streak={streak} />}

      {/* Screen content */}
      <div
        className={`flex-1 overflow-hidden transition-opacity duration-150 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <ScreenRenderer
            key={currentScreen.id}
            screen={currentScreen}
            onNext={handleNext}
          />
        </div>
      </div>

      {/* Reference button — always visible */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100">
        <button
          onClick={() => setShowRef(true)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <span className="text-base">💡</span>
          <span>Reference</span>
        </button>
      </div>

      {/* Reference popover */}
      {showRef && (
        <ReferencePopover
          reference={reference}
          onClose={() => setShowRef(false)}
        />
      )}
    </div>
  )
}
