// UnitPage.jsx — Individual unit/land page
// Route: /courses/:slug/units/:unitId
// Layout: full-width header in land colour + horizontal-scroll chapter cards
// Fullscreen — no CoursesLayout chrome, own back nav to course home

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Land colours — same palette as the hub tiles ────────────────────────────
// 10 lands cycle through the design system colours
const LAND_COLOURS = [
  { colour: '#4b7fc1', bg: '#eef3fb', dark: '#2f5a96' },   // 1  dark-blue
  { colour: '#72c09e', bg: '#edf8f3', dark: '#4ea07c' },   // 2  green
  { colour: '#f4bb59', bg: '#fffbee', dark: '#d9a030' },   // 3  yellow
  { colour: '#f76639', bg: '#fff1ed', dark: '#d94e24' },   // 4  red
  { colour: '#c2bdf5', bg: '#f4f3ff', dark: '#8f88d9' },   // 5  purple
  { colour: '#63c7ec', bg: '#edf8fd', dark: '#3aa8cf' },   // 6  light-blue
  { colour: '#ffb1c1', bg: '#fff0f3', dark: '#e8869a' },   // 7  pink
  { colour: '#72c09e', bg: '#edf8f3', dark: '#4ea07c' },   // 8  green
  { colour: '#f4bb59', bg: '#fffbee', dark: '#d9a030' },   // 9  yellow
  { colour: '#4b7fc1', bg: '#eef3fb', dark: '#2f5a96' },   // 10 dark-blue
]

// ── Chapter type pills ────────────────────────────────────────────────────────
const CHAPTER_TYPE = {
  lesson:        { label: 'Lesson',       bg: '#eef3fb', text: '#4b7fc1' },
  exam_practice: { label: 'Exam Practice', bg: '#fffbee', text: '#d9a030' },
  review:        { label: 'Review',       bg: '#f4f3ff', text: '#8f88d9' },
  vocabulary:    { label: 'Vocabulary',   bg: '#edf8f3', text: '#4ea07c' },
  grammar:       { label: 'Grammar',      bg: '#fff1ed', text: '#d94e24' },
  reading:       { label: 'Reading',      bg: '#edf8fd', text: '#3aa8cf' },
  writing:       { label: 'Writing',      bg: '#fffbee', text: '#d9a030' },
  listening:     { label: 'Listening',    bg: '#fff0f3', text: '#e8869a' },
  speaking:      { label: 'Speaking',     bg: '#edf8f3', text: '#4ea07c' },
}
const DEFAULT_TYPE = { label: 'Lesson', bg: '#f3f4f6', text: '#6b7280' }

// ── Chapter card ─────────────────────────────────────────────────────────────

function ChapterCard({ chapter, index, progress, slugPath, isNext, landColour }) {
  const navigate  = useNavigate()
  const done      = progress[chapter.id]?.completed
  const typeConf  = CHAPTER_TYPE[chapter.chapter_type] || DEFAULT_TYPE

  function handleClick() {
    navigate(`/courses/${slugPath}/chapters/${chapter.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className="group flex-shrink-0 w-60 sm:w-64 flex flex-col rounded-2xl border-2 text-left overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        borderColor: done
          ? `${landColour.colour}50`
          : isNext
            ? landColour.colour
            : '#e5e7eb',
        backgroundColor: done
          ? landColour.bg
          : isNext
            ? '#ffffff'
            : '#ffffff',
      }}
    >
      {/* Top strip — number + status */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{
          backgroundColor: done
            ? `${landColour.colour}20`
            : isNext
              ? `${landColour.colour}15`
              : '#f9fafb',
        }}
      >
        <span
          className="text-xs font-bold"
          style={{ color: done || isNext ? landColour.colour : '#9ca3af' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        {done ? (
          <span className="text-xs font-bold" style={{ color: landColour.colour }}>✓ Done</span>
        ) : isNext ? (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: landColour.colour, color: '#ffffff' }}
          >
            Next
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="px-4 py-4 flex-1 flex flex-col gap-3">
        {/* Type pill */}
        <span
          className="self-start text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: typeConf.bg, color: typeConf.text }}
        >
          {typeConf.label}
        </span>

        {/* Title */}
        <p className="font-bold text-gray-900 leading-snug text-sm line-clamp-3">
          {chapter.title}
        </p>

        {/* Mins + arrow */}
        <div className="mt-auto flex items-center justify-between pt-1">
          {chapter.estimated_mins ? (
            <span className="text-xs text-gray-400">~{chapter.estimated_mins} min</span>
          ) : <span />}
          <span
            className="text-xs font-bold transition-transform group-hover:translate-x-0.5"
            style={{ color: isNext || done ? landColour.colour : '#d1d5db' }}
          >
            →
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UnitPage() {
  const { slug, unitId } = useParams()
  const navigate         = useNavigate()

  const [course,   setCourse]   = useState(null)
  const [unit,     setUnit]     = useState(null)
  const [chapters, setChapters] = useState([])
  const [progress, setProgress] = useState({})
  const [unitPos,  setUnitPos]  = useState(0)   // 0-based position (for colour)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()

      // Fetch course
      let { data: courseData } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (!courseData) {
        const { data: byId } = await supabase
          .from('courses')
          .select('id, title, slug')
          .eq('id', slug)
          .eq('status', 'published')
          .maybeSingle()
        courseData = byId
      }

      if (!courseData) { navigate('/courses'); return }
      setCourse(courseData)

      // Fetch this unit + its position in the course
      const { data: unitData } = await supabase
        .from('course_units')
        .select('id, title, position')
        .eq('id', unitId)
        .maybeSingle()

      if (!unitData) { navigate(`/courses/${slug}`); return }
      setUnit(unitData)
      setUnitPos((unitData.position || 1) - 1) // position is 1-based

      // Fetch chapters for this unit
      const { data: chapterData } = await supabase
        .from('course_chapters')
        .select('id, unit_id, title, position, chapter_type, is_free_preview, estimated_mins')
        .eq('unit_id', unitId)
        .order('position')

      setChapters(chapterData || [])

      // Fetch progress
      if (user && courseData) {
        const { data: progData } = await supabase
          .from('user_course_progress')
          .select('chapter_id, completed, score_pct')
          .eq('user_id', user.id)
          .eq('course_id', courseData.id)

        const progMap = {}
        progData?.forEach(p => { progMap[p.chapter_id] = p })
        setProgress(progMap)
      }

      setLoading(false)
    }

    load()
  }, [slug, unitId])

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!course || !unit) return null

  const landColour = LAND_COLOURS[unitPos % LAND_COLOURS.length]
  const completedCount = chapters.filter(ch => progress[ch.id]?.completed).length

  // Next chapter = first incomplete
  const nextChapter = chapters.find(ch => !progress[ch.id]?.completed)

  return (
    <div className="min-h-screen bg-canvas">
      <PageMeta
        title={`${unit.title} — ${course.title}`}
        description={`${unit.title} lessons for the ${course.title} course.`}
        canonical={`/courses/${slug}/units/${unitId}`}
      />

      {/* ── Full-width header ───────────────────────────────────────────────── */}
      <div style={{ backgroundColor: landColour.colour }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

          {/* Back link */}
          <Link
            to={`/courses/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold mb-5 transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            ← Back to course
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Unit {unitPos + 1}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {unit.title}
              </h1>
            </div>

            {/* Progress badge */}
            {chapters.length > 0 && (
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3 flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <div>
                  <p className="text-xs font-bold text-white/70">Progress</p>
                  <p className="text-lg font-black text-white leading-none">
                    {completedCount}/{chapters.length}
                  </p>
                </div>
                {/* Mini progress ring (SVG) */}
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - completedCount / chapters.length)}`}
                    transform="rotate(-90 20 20)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chapter cards — horizontal scroll ──────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {chapters.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">No chapters yet — check back soon.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-5">
              {completedCount === chapters.length && chapters.length > 0
                ? '🎉 All chapters complete!'
                : nextChapter
                  ? `Next up: ${nextChapter.title}`
                  : `${chapters.length} chapters`}
            </p>

            {/* Horizontal scroll container */}
            <div className="overflow-x-auto no-scrollbar pb-4">
              <div className="flex gap-4 w-max">
                {chapters.map((chapter, i) => (
                  <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    index={i}
                    progress={progress}
                    slugPath={slug}
                    isNext={chapter.id === nextChapter?.id}
                    landColour={landColour}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
