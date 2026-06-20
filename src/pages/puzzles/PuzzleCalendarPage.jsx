// PuzzleCalendarPage.jsx
// Shared landing page for all five puzzle types.
// Shows a calendar of every date that has (or will have) a puzzle.
// Usage: <PuzzleCalendarPage type="wordle" name="WordUp" colour="#72c09e" icon="🟩" />
//
// Date states:
//   available  — puzzle exists, date <= today  → clickable, navigates to /:date
//   today      — same as available but highlighted
//   future     — puzzle exists but date > today → shown greyed, not clickable
//   empty      — no puzzle row in DB for that date → diagonal-line cell
//
// All puzzles are open to everyone for now (no paywall logic here).

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Config per puzzle type ────────────────────────────────────────────────────

export const PUZZLE_META = {
  wordle: {
    name:        'WordUp',
    description: 'Guess the 6-letter word in 6 tries.',
    icon:        '🟩',
    accent:      '#72c09e',   // green
    accentBg:    '#edf8f3',
    accentDark:  '#4ea07c',
    path:        '/puzzles/wordle',
  },
  connections: {
    name:        'Clusters',
    description: 'Sort 16 words into four hidden groups.',
    icon:        '🔵',
    accent:      '#4b7fc1',   // dark-blue
    accentBg:    '#eef3fb',
    accentDark:  '#2f5a96',
    path:        '/puzzles/connections',
  },
  ladder: {
    name:        'Word Ladder',
    description: 'Change one letter at a time to reach the target.',
    icon:        '🪜',
    accent:      '#c2bdf5',   // purple
    accentBg:    '#f4f3ff',
    accentDark:  '#8f88d9',
    path:        '/puzzles/ladder',
  },
  hive: {
    name:        'Letter Hive',
    description: 'Spell words using the honeycomb letters.',
    icon:        '🍯',
    accent:      '#f4bb59',   // yellow
    accentBg:    '#fffbee',
    accentDark:  '#d9a030',
    path:        '/puzzles/hive',
  },
  crossword: {
    name:        'Mini Crossword',
    description: 'Solve the themed 7x7 vocabulary crossword.',
    icon:        '✏️',
    accent:      '#f76639',   // red/orange
    accentBg:    '#fff1ed',
    accentDark:  '#d94e24',
    path:        '/puzzles/crossword',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// Given a set of available dates, build a list of calendar weeks to display.
// Always shows from the Monday of the earliest week to the Sunday of this week
// (or the latest available date's week, whichever is later).
function buildCalendarWeeks(availableDates) {
  if (availableDates.length === 0) return []

  const today = new Date(todayStr())
  const dates = availableDates.map(d => new Date(d)).sort((a, b) => a - b)
  const earliest = dates[0]

  // Start from Monday of the earliest week
  const startMonday = new Date(earliest)
  const dow = startMonday.getDay() // 0=Sun
  const daysBack = dow === 0 ? 6 : dow - 1
  startMonday.setDate(startMonday.getDate() - daysBack)

  // End at Sunday of the current week (or latest available, whichever later)
  const latest = dates[dates.length - 1]
  const endDate = latest > today ? latest : today
  const endSunday = new Date(endDate)
  const dowEnd = endSunday.getDay()
  const daysForward = dowEnd === 0 ? 0 : 7 - dowEnd
  endSunday.setDate(endSunday.getDate() + daysForward)

  const weeks = []
  const cursor = new Date(startMonday)
  while (cursor <= endSunday) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push(cursor.toISOString().split('T')[0])
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatMonth(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PuzzleCalendarPage({ puzzleType }) {
  const meta     = PUZZLE_META[puzzleType]
  const navigate = useNavigate()
  const today    = todayStr()

  const [availableDates, setAvailableDates] = useState([])  // dates with puzzle data
  const [completions,    setCompletions]    = useState({})  // date → completion row
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    async function load() {
      // All published puzzle dates for this type
      const { data: puzzles } = await supabase
        .from('puzzle_content')
        .select('puzzle_date')
        .eq('puzzle_type', puzzleType)
        .eq('status', 'published')
        .order('puzzle_date')

      setAvailableDates((puzzles || []).map(p => p.puzzle_date))

      // User completions
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: comps } = await supabase
          .from('user_puzzle_completions')
          .select('puzzle_date, completed, score')
          .eq('user_id', user.id)
          .eq('puzzle_type', puzzleType)

        const compMap = {}
        ;(comps || []).forEach(c => { compMap[c.puzzle_date] = c })
        setCompletions(compMap)
      }

      setLoading(false)
    }
    load()
  }, [puzzleType])

  const availableSet = new Set(availableDates)
  const weeks = buildCalendarWeeks(availableDates)

  // Group weeks by month for section headers
  function getMonthLabel(week) {
    // Use the Wednesday of the week as the representative day
    return formatMonth(week[2])
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <PageMeta
        title={`${meta.name} — Daily Puzzle`}
        description={`${meta.description} Play every day and see your history.`}
        canonical={meta.path}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">{meta.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-950 leading-tight">{meta.name}</h1>
          <p className="text-sm text-gray-500">{meta.description}</p>
        </div>
      </div>

      {/* Today CTA */}
      {availableSet.has(today) && (
        <button
          onClick={() => navigate(`${meta.path}/${today}`)}
          className="mt-5 w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: meta.accent }}
        >
          Play today's puzzle →
        </button>
      )}

      {/* ── Calendar ───────────────────────────────────────────────────────── */}
      <div className="mt-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
          Previous puzzles
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : weeks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No puzzles yet — check back soon.</p>
        ) : (
          <div className="space-y-6">
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_LABELS.map(d => (
                <div key={d} className="text-center text-xs font-bold text-gray-400">{d}</div>
              ))}
            </div>

            {/* Weeks — grouped by month */}
            {(() => {
              let lastMonth = null
              return weeks.map((week, wi) => {
                const monthLabel = getMonthLabel(week)
                const showMonth  = monthLabel !== lastMonth
                lastMonth = monthLabel
                return (
                  <div key={wi}>
                    {showMonth && (
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 mt-4 first:mt-0">
                        {monthLabel}
                      </p>
                    )}
                    <div className="grid grid-cols-7 gap-1">
                      {week.map(dateStr => (
                        <CalendarCell
                          key={dateStr}
                          dateStr={dateStr}
                          today={today}
                          hasData={availableSet.has(dateStr)}
                          completion={completions[dateStr]}
                          meta={meta}
                          onPlay={() => navigate(`${meta.path}/${dateStr}`)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>

      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <div className="mt-10 text-center">
        <button
          onClick={() => navigate('/puzzles')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← All puzzles
        </button>
      </div>
    </div>
  )
}

// ── CalendarCell ──────────────────────────────────────────────────────────────

function CalendarCell({ dateStr, today, hasData, completion, meta, onPlay }) {
  const dayNum   = new Date(dateStr + 'T12:00:00').getDate()
  const isPast   = dateStr < today
  const isToday  = dateStr === today
  const isFuture = dateStr > today
  const isDone   = completion?.completed

  // Empty cell — no puzzle data
  if (!hasData) {
    return (
      <div className="aspect-square rounded-xl flex items-center justify-center relative overflow-hidden bg-gray-50">
        {/* Diagonal line */}
        <div
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(-45deg, transparent, transparent 3px, #e5e7eb 3px, #e5e7eb 4px)'
          }}
        />
        <span className="relative text-xs text-gray-300 font-medium z-10">{dayNum}</span>
      </div>
    )
  }

  // Future puzzle — exists but not playable yet
  if (isFuture) {
    return (
      <div className="aspect-square rounded-xl flex items-center justify-center bg-gray-50 border border-dashed border-gray-200">
        <span className="text-xs text-gray-300 font-medium">{dayNum}</span>
      </div>
    )
  }

  // Past or today — playable
  return (
    <button
      onClick={onPlay}
      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 border-2"
      style={{
        backgroundColor: isDone ? meta.accentBg : isToday ? '#ffffff' : '#f9fafb',
        borderColor:     isToday ? meta.accent : isDone ? `${meta.accent}60` : '#e5e7eb',
        boxShadow:       isToday ? `0 0 0 2px ${meta.accent}40` : 'none',
      }}
    >
      <span
        className="text-xs font-bold leading-none"
        style={{ color: isDone || isToday ? meta.accentDark : '#9ca3af' }}
      >
        {dayNum}
      </span>
      {isDone && (
        <span className="text-green-500 text-xs leading-none">✓</span>
      )}
      {isToday && !isDone && (
        <span className="text-xs leading-none" style={{ color: meta.accent }}>•</span>
      )}
    </button>
  )
}
