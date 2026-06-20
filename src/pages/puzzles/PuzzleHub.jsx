import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Puzzle definitions ────────────────────────────────────────────────────────

const PUZZLES = [
  {
    type:        'wordle',
    name:        'WordUp',
    route:       '/puzzles/wordle',
    icon:        '🟩',
    description: 'Guess the word in 6 tries',
    colour:      'bg-green-50 border-green-200',
    activeColour:'bg-green-500',
  },
  {
    type:        'connections',
    name:        'Clusters',
    route:       '/puzzles/connections',
    icon:        '🔵',
    description: 'Find four groups of four',
    colour:      'bg-blue-50 border-blue-200',
    activeColour:'bg-blue-500',
  },
  {
    type:        'hive',
    name:        'Letter Hive',
    route:       '/puzzles/hive',
    icon:        '🍯',
    description: 'Match definitions to honeycomb letters',
    colour:      'bg-yellow-50 border-yellow-200',
    activeColour:'bg-yellow-500',
  },
  {
    type:        'ladder',
    name:        'Word Ladder',
    route:       '/puzzles/ladder',
    icon:        '🪜',
    description: 'Change one letter at a time',
    colour:      'bg-purple-50 border-purple-200',
    activeColour:'bg-purple-500',
  },
  {
    type:        'crossword',
    name:        'Crossword',
    route:       '/puzzles/crossword',
    icon:        '✏️',
    description: 'Weekly themed vocabulary crossword',
    colour:      'bg-orange-50 border-orange-200',
    activeColour:'bg-orange-500',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// ── PuzzleHub ─────────────────────────────────────────────────────────────────

export default function PuzzleHub() {
  const [userId,      setUserId]      = useState(null)
  const [completions, setCompletions] = useState({})  // type → completion row
  const [available,   setAvailable]   = useState({})  // type → bool (puzzle exists for today)
  const [loading,     setLoading]     = useState(true)

  const today = todayStr()

  useEffect(() => {
    async function load() {
      // Get auth user
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      // Check which puzzles exist for today
      const { data: puzzles } = await supabase
        .from('puzzle_content')
        .select('puzzle_type')
        .eq('puzzle_date', today)
        .eq('status', 'published')

      const avail = {}
      ;(puzzles || []).forEach(p => { avail[p.puzzle_type] = true })
      setAvailable(avail)

      // Load user completions for today
      if (user?.id) {
        const { data: comps } = await supabase
          .from('user_puzzle_completions')
          .select('puzzle_type, score, completed, time_seconds')
          .eq('user_id', user.id)
          .eq('puzzle_date', today)

        const compMap = {}
        ;(comps || []).forEach(c => { compMap[c.puzzle_type] = c })
        setCompletions(compMap)
      }

      setLoading(false)
    }
    load()
  }, [])

  // Count completed puzzles
  const doneCount = Object.values(completions).filter(c => c.completed).length
  const totalAvailable = Object.values(available).filter(Boolean).length

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <PageMeta
        title="Daily Puzzles"
        description="Five daily English word puzzles — WordUp, Clusters, Letter Hive, Word Ladder, and Crossword. Free to play every day."
        canonical="/puzzles"
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-950 tracking-tight mb-2">
          Daily Puzzles
        </h1>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {/* Progress bar */}
        {!loading && totalAvailable > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span className="text-sm font-medium text-gray-700">
                {doneCount} / {totalAvailable} done
              </span>
              {doneCount === totalAvailable && totalAvailable > 0 && (
                <span className="text-sm">🎉</span>
              )}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${totalAvailable > 0 ? (doneCount / totalAvailable) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Puzzle cards ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {PUZZLES.map(puzzle => {
            const isAvailable  = available[puzzle.type]
            const completion   = completions[puzzle.type]
            const isDone       = completion?.completed

            return (
              <PuzzleCard
                key={puzzle.type}
                puzzle={puzzle}
                isAvailable={isAvailable}
                isDone={isDone}
                completion={completion}
                userId={userId}
                today={today}
              />
            )
          })}
        </div>
      )}

      {/* ── Footer note ─────────────────────────────────────────────────────── */}
      <p className="text-center text-xs text-gray-400 mt-8">
        New puzzles every day at midnight.
      </p>
    </div>
  )
}

// ── PuzzleCard ────────────────────────────────────────────────────────────────

function PuzzleCard({ puzzle, isAvailable, isDone, completion, userId, today }) {
  const scoreLabel = getScoreLabel(puzzle.type, completion)

  return (
    <Link
      to={isAvailable ? `${puzzle.route}/${today}` : puzzle.route}
      className={`block rounded-2xl border-2 p-4 transition-all
        ${isAvailable
          ? `${puzzle.colour} hover:shadow-md hover:scale-[1.01] active:scale-[0.99]`
          : 'bg-gray-50 border-gray-100 opacity-60 cursor-default'
        }
      `}
      onClick={e => !isAvailable && e.preventDefault()}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="text-3xl w-12 h-12 flex items-center justify-center flex-shrink-0">
          {puzzle.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-gray-900 text-base">{puzzle.name}</span>
            {isDone && (
              <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                Done ✓
              </span>
            )}
            {!isAvailable && (
              <span className="text-xs text-gray-400">Coming soon</span>
            )}
          </div>
          <p className="text-sm text-gray-500">{puzzle.description}</p>
          {scoreLabel && (
            <p className="text-xs text-gray-400 mt-0.5">{scoreLabel}</p>
          )}
        </div>

        {/* Arrow or check */}
        <div className="flex-shrink-0 text-gray-300">
          {isDone ? (
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-sm">✓</span>
            </div>
          ) : isAvailable ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

// ── Score label helper ────────────────────────────────────────────────────────

function getScoreLabel(type, completion) {
  if (!completion?.completed) return null
  const { score, time_seconds } = completion
  const time = time_seconds ? ` · ${Math.floor(time_seconds / 60)}:${String(time_seconds % 60).padStart(2, '0')}` : ''

  switch (type) {
    case 'wordle':
      return score === 7 ? `Failed${time}` : `Solved in ${score} ${score === 1 ? 'guess' : 'guesses'}${time}`
    case 'connections':
      return score === 0 ? `Perfect — no mistakes${time}` : `${score} mistake${score !== 1 ? 's' : ''}${time}`
    case 'ladder':
      return `${score} steps${time}`
    case 'hive':
      return `${score} words found${time}`
    case 'crossword':
      return `${score}% correct${time}`
    default:
      return null
  }
}
