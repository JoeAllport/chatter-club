// CoursePlayer.jsx — Self-paced course player
// TIER: member (free chapters open, pro chapters gated post-launch)
// Route: /courses/:slug
//
// Layout: two-column on desktop (sidebar left, content right)
//         stacked on mobile (chapter nav above, content below)
//
// Unlock logic:
//   - First chapter of every unit is always unlocked
//   - is_free_preview chapters are always unlocked
//   - Chapter N unlocks when chapter N-1 (in same unit) is completed
//   - Pro-gated chapters: is_free=false on the course AND user is not pro → locked

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageMeta from '../components/PageMeta'

// ── Activity renderers (subset re-implemented for public platform) ─────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Flashcard
function Flashcard({ item, onDone }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="space-y-4">
      <div
        onClick={() => !flipped && setFlipped(true)}
        className={`min-h-44 rounded-2xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-colors select-none ${
          flipped ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 shadow-sm hover:border-indigo-200'
        }`}
      >
        {flipped ? (
          <>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Answer</p>
            <p className="text-xl font-semibold text-indigo-900 text-center">{item.answer}</p>
          </>
        ) : (
          <>
            <p className="text-xl font-semibold text-gray-900 text-center">{item.prompt}</p>
            <p className="text-xs text-gray-400 mt-4">Tap to reveal</p>
          </>
        )}
      </div>
      {flipped && (
        <div className="flex gap-3">
          <button
            onClick={() => { setFlipped(false); onDone(false) }}
            className="flex-1 py-3 rounded-xl bg-red-50 text-red-700 font-semibold text-sm border border-red-100 hover:bg-red-100 transition-colors"
          >
            ✗ Again
          </button>
          <button
            onClick={() => onDone(true)}
            className="flex-1 py-3 rounded-xl bg-green-50 text-green-700 font-semibold text-sm border border-green-100 hover:bg-green-100 transition-colors"
          >
            ✓ Got it
          </button>
        </div>
      )}
    </div>
  )
}

// MCQ
function MCQ({ item, onDone }) {
  const [selected, setSelected]     = useState(null)
  const [revealed, setRevealed]     = useState(false)
  const [options]                   = useState(() => shuffle([item.answer, ...(item.distractors || [])].slice(0, 4)))

  function pick(opt) {
    if (revealed) return
    setSelected(opt)
    setRevealed(true)
  }

  const correct = selected === item.answer

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-base font-semibold text-gray-900">{item.prompt}</p>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => {
          let cls = 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
          if (revealed) {
            if (opt === item.answer)  cls = 'border-green-400 bg-green-50'
            else if (opt === selected) cls = 'border-red-300 bg-red-50'
            else                       cls = 'border-gray-100 bg-gray-50 opacity-60'
          }
          return (
            <button
              key={i}
              onClick={() => pick(opt)}
              className={`w-full text-left p-4 rounded-xl border-2 text-sm font-medium transition-colors ${cls}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {revealed && (
        <button
          onClick={() => onDone(correct)}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          {correct ? '✓ Correct — Next →' : '✗ Wrong — Next →'}
        </button>
      )}
    </div>
  )
}

// Cloze (fill the gap)
function Cloze({ item, onDone }) {
  const [value, setValue]   = useState('')
  const [checked, setChecked] = useState(false)
  const correct = value.trim().toLowerCase() === item.answer.trim().toLowerCase()

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-base text-gray-700 leading-relaxed">{item.prompt}</p>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={checked}
        placeholder="Type your answer..."
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-400 disabled:bg-gray-50"
        onKeyDown={e => e.key === 'Enter' && !checked && value.trim() && setChecked(true)}
      />
      {checked ? (
        <div className={`p-3 rounded-xl text-sm font-medium ${correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {correct ? `✓ Correct! "${item.answer}"` : `✗ The answer was "${item.answer}"`}
        </div>
      ) : (
        <button
          disabled={!value.trim()}
          onClick={() => setChecked(true)}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Check
        </button>
      )}
      {checked && (
        <button
          onClick={() => onDone(correct)}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          Next →
        </button>
      )}
    </div>
  )
}

// Generic text answer (transformation, word formation, spell)
function TextAnswer({ item, onDone }) {
  return <Cloze item={item} onDone={onDone} />
}

// ── Activity set runner ────────────────────────────────────────────────────────

function ActivityRunner({ items, onComplete }) {
  const [idx, setIdx]         = useState(0)
  const [results, setResults] = useState([])

  if (!items?.length) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p>No activities in this chapter yet.</p>
        <button onClick={() => onComplete(100)} className="mt-4 text-indigo-600 text-sm hover:underline">
          Mark complete →
        </button>
      </div>
    )
  }

  if (idx >= items.length) {
    const correct = results.filter(Boolean).length
    const pct = Math.round((correct / items.length) * 100)
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-5xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📖'}</div>
        <h3 className="text-xl font-bold text-gray-900">
          {pct >= 80 ? 'Great work!' : pct >= 50 ? 'Good effort!' : 'Keep practising!'}
        </h3>
        <p className="text-gray-500 text-sm">
          {correct} / {items.length} correct — {pct}%
        </p>
        <button
          onClick={() => onComplete(pct)}
          className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
        >
          Complete chapter →
        </button>
      </div>
    )
  }

  const item = items[idx]

  function handleAnswer(isCorrect) {
    setResults(prev => [...prev, isCorrect])
    setIdx(prev => prev + 1)
  }

  const ItemComp = {
    flashcard:       Flashcard,
    mcq:             MCQ,
    cloze:           Cloze,
    transformation:  TextAnswer,
    word_formation:  TextAnswer,
    spell:           TextAnswer,
  }[item.task_type] ?? MCQ

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${(idx / items.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">{idx + 1} / {items.length}</span>
      </div>

      {/* Activity type label */}
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
        {item.task_type?.replace(/_/g, ' ')}
      </p>

      <ItemComp item={item} onDone={handleAnswer} key={idx} />
    </div>
  )
}

// ── Lock screen ───────────────────────────────────────────────────────────────

function LockedChapter({ reason }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center px-6">
      <div className="text-5xl">🔒</div>
      <h3 className="text-xl font-bold text-gray-900">Chapter locked</h3>
      <p className="text-gray-500 text-sm max-w-xs">
        {reason === 'pro'
          ? 'This chapter is part of the Pro plan. Upgrade to access all chapters.'
          : 'Complete the previous chapter to unlock this one.'}
      </p>
      {reason === 'pro' && (
        <button className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors">
          Upgrade to Pro →
        </button>
      )}
    </div>
  )
}

// ── Main CoursePlayer ─────────────────────────────────────────────────────────

export default function CoursePlayer() {
  const { slug }              = useParams()
  const navigate              = useNavigate()

  const [course, setCourse]           = useState(null)
  const [units, setUnits]             = useState([])        // [{id, title, chapters:[...]}]
  const [activeChapterId, setActiveChapterId] = useState(null)
  const [chapterItems, setChapterItems]       = useState([])   // content_items for active chapter
  const [progress, setProgress]               = useState({})   // chapter_id → {completed, score_pct}
  const [user, setUser]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [chapterLoading, setChapterLoading]   = useState(false)
  const [sidebarOpen, setSidebarOpen]         = useState(false)

  // ── Load course structure ──────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true)

      // User
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      // Course by slug or id
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, description, slug, level, topic_tags, is_free, status')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .eq('status', 'published')
        .single()

      if (!courseData) { navigate('/courses'); return }
      setCourse(courseData)

      // Units + chapters
      const { data: unitData } = await supabase
        .from('course_units')
        .select('id, title, description, position')
        .eq('course_id', courseData.id)
        .order('position')

      if (!unitData?.length) { setUnits([]); setLoading(false); return }

      const unitIds = unitData.map(u => u.id)
      const { data: chapterData } = await supabase
        .from('course_chapters')
        .select('id, unit_id, course_id, title, description, position, is_free_preview, estimated_mins')
        .in('unit_id', unitIds)
        .order('position')

      // Nest chapters under units
      const unitMap = {}
      unitData.forEach(u => { unitMap[u.id] = { ...u, chapters: [] } })
      chapterData?.forEach(ch => { unitMap[ch.unit_id]?.chapters.push(ch) })
      const nestedUnits = unitData.map(u => unitMap[u.id])
      setUnits(nestedUnits)

      // Progress
      if (u) {
        const { data: progData } = await supabase
          .from('user_course_progress')
          .select('chapter_id, completed, score_pct')
          .eq('user_id', u.id)
          .eq('course_id', courseData.id)

        const progMap = {}
        progData?.forEach(p => { progMap[p.chapter_id] = p })
        setProgress(progMap)
      }

      // Default to first chapter
      const firstChapter = chapterData?.[0]
      if (firstChapter) setActiveChapterId(firstChapter.id)

      setLoading(false)
    }
    load()
  }, [slug])

  // ── Load chapter content items when active chapter changes ─────────────────

  useEffect(() => {
    if (!activeChapterId) return
    async function loadChapter() {
      setChapterLoading(true)

      // Get content_sets linked to this chapter (via course_chapter_items)
      const { data: chItems } = await supabase
        .from('course_chapter_items')
        .select('id, content_set_id, position, item_type')
        .eq('chapter_id', activeChapterId)
        .order('position')

      if (!chItems?.length) { setChapterItems([]); setChapterLoading(false); return }

      // Get content items from those sets
      const setIds = [...new Set(chItems.map(i => i.content_set_id))]
      const { data: items } = await supabase
        .from('content_items')
        .select('id, task_type, prompt, answer, distractors, image_url, audio_url, level')
        .in('id', await getItemIdsForSets(setIds))

      setChapterItems(items ?? [])
      setChapterLoading(false)
    }
    loadChapter()
  }, [activeChapterId])

  // Helper: get content_item ids from content_set_items join
  async function getItemIdsForSets(setIds) {
    const { data } = await supabase
      .from('content_set_items')
      .select('content_item_id, position')
      .in('content_set_id', setIds)
      .order('position')
    return data?.map(r => r.content_item_id) ?? []
  }

  // ── Unlock logic ──────────────────────────────────────────────────────────

  function isUnlocked(chapter, unit) {
    // First chapter of every unit is always unlocked
    if (unit.chapters[0]?.id === chapter.id) return true
    // Free preview chapters always unlocked
    if (chapter.is_free_preview) return true
    // Find previous chapter in same unit
    const idx = unit.chapters.findIndex(ch => ch.id === chapter.id)
    if (idx <= 0) return true
    const prevChapter = unit.chapters[idx - 1]
    return progress[prevChapter.id]?.completed === true
  }

  function isProGated(chapter) {
    // If course is free, nothing gated. If course is Pro: first chapter of first unit is free preview.
    if (!course || course.is_free) return false
    if (chapter.is_free_preview) return false
    return true  // post-launch: check user.pro tier
  }

  function lockReason(chapter, unit) {
    if (isProGated(chapter)) return 'pro'
    if (!isUnlocked(chapter, unit)) return 'sequence'
    return null
  }

  // ── Complete a chapter ────────────────────────────────────────────────────

  const handleChapterComplete = useCallback(async (scorePct) => {
    if (!user || !activeChapterId || !course) return

    await supabase
      .from('user_course_progress')
      .upsert({
        user_id:    user.id,
        course_id:  course.id,
        chapter_id: activeChapterId,
        completed:  true,
        completed_at: new Date().toISOString(),
        score_pct:  scorePct,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,chapter_id' })

    setProgress(prev => ({
      ...prev,
      [activeChapterId]: { completed: true, score_pct: scorePct }
    }))

    // Auto-advance to next chapter
    const allChapters = units.flatMap(u => u.chapters)
    const curIdx = allChapters.findIndex(ch => ch.id === activeChapterId)
    if (curIdx >= 0 && curIdx < allChapters.length - 1) {
      setActiveChapterId(allChapters[curIdx + 1].id)
    }
  }, [user, activeChapterId, course, units])

  // ── Compute overall progress % ────────────────────────────────────────────

  const allChapters = units.flatMap(u => u.chapters)
  const completedCount = allChapters.filter(ch => progress[ch.id]?.completed).length
  const overallPct = allChapters.length > 0 ? Math.round((completedCount / allChapters.length) * 100) : 0

  // ── Active chapter + unit ─────────────────────────────────────────────────

  let activeChapter = null
  let activeUnit    = null
  for (const unit of units) {
    const ch = unit.chapters.find(c => c.id === activeChapterId)
    if (ch) { activeChapter = ch; activeUnit = unit; break }
  }
  const locked = activeChapter && activeUnit ? lockReason(activeChapter, activeUnit) : null

  // ── Sidebar ───────────────────────────────────────────────────────────────

  function Sidebar() {
    return (
      <nav className="space-y-4">
        {/* Overall progress */}
        {allChapters.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Overall progress</span>
              <span>{overallPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Units + chapters */}
        {units.map((unit, ui) => (
          <div key={unit.id} className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 pt-2">
              Unit {ui + 1}: {unit.title}
            </p>
            {unit.chapters.map((ch, ci) => {
              const chLocked  = lockReason(ch, unit)
              const done      = progress[ch.id]?.completed
              const active    = ch.id === activeChapterId

              return (
                <button
                  key={ch.id}
                  onClick={() => { setActiveChapterId(ch.id); setSidebarOpen(false) }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : chLocked
                      ? 'text-gray-300 cursor-default'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="shrink-0 text-base">
                    {chLocked === 'pro' ? '🔒' : done ? '✓' : `${ui + 1}.${ci + 1}`}
                  </span>
                  <span className="truncate leading-tight">{ch.title}</span>
                  {ch.estimated_mins && !active && (
                    <span className={`ml-auto shrink-0 text-xs ${active ? 'text-indigo-200' : 'text-gray-300'}`}>
                      {ch.estimated_mins}m
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading course…</p>
        </div>
      </div>
    )
  }

  if (!course) return null

  return (
    <>
      <PageMeta
        title={`${course.title} — Courses`}
        description={course.description ?? `Learn with this ${course.level ?? ''} English course.`}
        canonical={`/courses/${course.slug || course.id}`}
      />

      {/* Mobile: top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle chapter list"
        >
          ☰
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{course.title}</p>
          {activeChapter && (
            <p className="text-sm font-semibold text-gray-900 truncate">{activeChapter.title}</p>
          )}
        </div>
        <span className="text-xs text-gray-400">{overallPct}%</span>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="bg-white w-72 h-full overflow-y-auto p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 truncate">{course.title}</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{course.title}</h1>
                {course.level && (
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {course.level}
                  </span>
                )}
              </div>
              <Sidebar />
            </div>
          </aside>

          {/* Content area */}
          <main className="min-h-[60vh]">
            {!activeChapter ? (
              <div className="py-20 text-center text-gray-400">
                <p>No chapters yet — check back soon.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Chapter header */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {activeUnit?.title}
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">{activeChapter.title}</h2>
                  {activeChapter.description && (
                    <p className="text-gray-500 text-sm leading-relaxed">{activeChapter.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                    {activeChapter.estimated_mins && (
                      <span>⏱ ~{activeChapter.estimated_mins} min</span>
                    )}
                    {progress[activeChapterId]?.completed && (
                      <span className="text-green-600 font-medium">✓ Completed</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Content */}
                {locked ? (
                  <LockedChapter reason={locked} />
                ) : chapterLoading ? (
                  <div className="py-16 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <ActivityRunner
                    items={chapterItems}
                    onComplete={handleChapterComplete}
                    key={activeChapterId}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

// (LockedChapter defined above at line ~253)
