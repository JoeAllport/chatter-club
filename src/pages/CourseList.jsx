// CourseList.jsx — Browse self-paced courses
// TIER: member (free courses open, paid gated post-launch)
// Route: /courses

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageMeta from '../components/PageMeta'

const LEVEL_COLOURS = {
  A1: 'bg-green-100 text-green-700',
  A2: 'bg-teal-100 text-teal-700',
  B1: 'bg-blue-100 text-blue-700',
  B2: 'bg-indigo-100 text-indigo-700',
  C1: 'bg-purple-100 text-purple-700',
  C2: 'bg-red-100 text-red-700',
  Mixed: 'bg-gray-100 text-gray-600',
}

function ProgressBar({ pct = 0 }) {
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function CourseCard({ course, progress }) {
  const navigate = useNavigate()
  const pct = progress?.pct ?? 0
  const started = pct > 0
  const done = pct === 100

  return (
    <button
      onClick={() => navigate(`/courses/${course.slug || course.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left hover:shadow-md transition-shadow group"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-indigo-50 overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">
            📚
          </div>
        )}

        {/* Level badge */}
        {course.level && (
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLOURS[course.level] ?? 'bg-gray-100 text-gray-600'}`}>
            {course.level}
          </span>
        )}

        {/* Free / Pro tag */}
        {course.is_free ? (
          <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            Free
          </span>
        ) : (
          <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Pro
          </span>
        )}

        {/* Completed overlay */}
        {done && (
          <div className="absolute inset-0 bg-indigo-600/10 flex items-end p-3">
            <span className="text-xs font-semibold text-indigo-700 bg-white/90 px-2 py-0.5 rounded-full">
              ✓ Completed
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
          {course.unit_count > 0 && (
            <span>{course.unit_count} unit{course.unit_count !== 1 ? 's' : ''}</span>
          )}
          {course.chapter_count > 0 && (
            <span>{course.chapter_count} chapters</span>
          )}
          {course.topic_tags?.length > 0 && (
            <span className="truncate">{course.topic_tags.slice(0, 2).join(', ')}</span>
          )}
        </div>

        {/* Progress bar (only if started) */}
        {started && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{done ? 'Completed' : 'In progress'}</span>
              <span>{pct}%</span>
            </div>
            <ProgressBar pct={pct} />
          </div>
        )}

        {/* CTA */}
        <div className="pt-1">
          <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
            {done ? 'Review course →' : started ? 'Continue →' : 'Start course →'}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function CourseList() {
  const [courses, setCourses]     = useState([])
  const [progress, setProgress]   = useState({})  // course_id → { pct }
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')  // all | free | in-progress

  useEffect(() => {
    async function load() {
      setLoading(true)

      // Fetch published courses
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, description, slug, level, topic_tags, thumbnail_url, is_free, unit_count, published_at')
        .eq('status', 'published')
        .is('school_id', null)
        .order('published_at', { ascending: false })

      if (!courseData?.length) { setLoading(false); return }
      setCourses(courseData)

      // Fetch user's progress
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // For each course, get chapter completion %
      const courseIds = courseData.map(c => c.id)

      // Total chapters per course
      const { data: chapterCounts } = await supabase
        .from('course_chapters')
        .select('id, course_id')
        .in('course_id', courseIds)

      // Completed chapters per course for this user
      const { data: completedRows } = await supabase
        .from('user_course_progress')
        .select('course_id, chapter_id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .in('course_id', courseIds)

      // Build progress map
      const chaptersByCoure = {}
      chapterCounts?.forEach(ch => {
        chaptersByCoure[ch.course_id] = (chaptersByCoure[ch.course_id] || 0) + 1
      })
      const completedByCoure = {}
      completedRows?.forEach(row => {
        completedByCoure[row.course_id] = (completedByCoure[row.course_id] || 0) + 1
      })

      const progressMap = {}
      courseData.forEach(c => {
        const total = chaptersByCoure[c.id] || 0
        const done  = completedByCoure[c.id] || 0
        progressMap[c.id] = { pct: total > 0 ? Math.round((done / total) * 100) : 0 }
      })
      setProgress(progressMap)
      setLoading(false)
    }
    load()
  }, [])

  const displayed = courses.filter(c => {
    if (filter === 'free')        return c.is_free
    if (filter === 'in-progress') return (progress[c.id]?.pct ?? 0) > 0 && progress[c.id]?.pct < 100
    return true
  })

  return (
    <>
      <PageMeta
        title="Courses — Learn English"
        description="Self-paced English courses built around real language. Pick your level, start today."
        canonical="/courses"
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-500 text-sm">
            Work through a structured course at your own pace.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'free', 'in-progress'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All courses' : f === 'free' ? 'Free' : 'In progress'}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="text-4xl">📚</div>
            <h2 className="text-lg font-semibold text-gray-700">
              {filter === 'in-progress'
                ? 'No courses in progress yet'
                : 'Courses coming soon'}
            </h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {filter === 'in-progress'
                ? 'Start a course below to track your progress here.'
                : 'The first structured courses are being built now. Check back soon.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-indigo-600 hover:underline"
              >
                View all courses
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                progress={progress[course.id]}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
