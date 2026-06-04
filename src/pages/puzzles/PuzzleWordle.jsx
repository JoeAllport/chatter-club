import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_GUESSES = 6

// Tile states
const EMPTY    = 'empty'
const ACTIVE   = 'active'
const CORRECT  = 'correct'   // right letter, right place  → green
const PRESENT  = 'present'   // right letter, wrong place  → yellow
const ABSENT   = 'absent'    // letter not in word         → grey

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// Score a guess against the target word
// Returns array of { letter, state } for each position
function scoreGuess(guess, target) {
  const result = Array(target.length).fill(null).map((_, i) => ({
    letter: guess[i],
    state:  ABSENT,
  }))

  // Track unmatched letters in target for PRESENT detection
  const targetLetters = target.split('')

  // First pass: mark CORRECT
  result.forEach((r, i) => {
    if (r.letter === targetLetters[i]) {
      r.state = CORRECT
      targetLetters[i] = null  // consumed
    }
  })

  // Second pass: mark PRESENT
  result.forEach((r, i) => {
    if (r.state === CORRECT) return
    const idx = targetLetters.indexOf(r.letter)
    if (idx !== -1) {
      r.state = PRESENT
      targetLetters[idx] = null
    }
  })

  return result
}

// ── Tile component ────────────────────────────────────────────────────────────

function Tile({ letter, state, reveal, delay = 0 }) {
  const base = 'flex items-center justify-center font-bold text-xl uppercase border-2 rounded select-none transition-all duration-150'

  const stateClass = {
    [EMPTY]:   'border-gray-200 text-gray-900 bg-white',
    [ACTIVE]:  'border-gray-400 text-gray-900 bg-white scale-105',
    [CORRECT]: reveal ? 'border-green-500 bg-green-500 text-white' : 'border-gray-400 text-gray-900 bg-white',
    [PRESENT]: reveal ? 'border-yellow-400 bg-yellow-400 text-white' : 'border-gray-400 text-gray-900 bg-white',
    [ABSENT]:  reveal ? 'border-gray-300 bg-gray-300 text-white'  : 'border-gray-400 text-gray-900 bg-white',
  }[state] || 'border-gray-200 bg-white'

  return (
    <div
      className={`${base} ${stateClass} w-14 h-14 sm:w-16 sm:h-16`}
      style={reveal ? { transitionDelay: `${delay}ms`, transitionProperty: 'background-color, border-color, color' } : {}}
    >
      {letter}
    </div>
  )
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

function Keyboard({ letterStates, onKey, disabled }) {
  return (
    <div className="flex flex-col items-center gap-1.5 mt-4">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map(key => {
            const state = letterStates[key.toLowerCase()] || EMPTY
            const isWide = key === 'ENTER' || key === '⌫'

            const colourClass = {
              [CORRECT]:  'bg-green-500 text-white border-green-500',
              [PRESENT]:  'bg-yellow-400 text-white border-yellow-400',
              [ABSENT]:   'bg-gray-300 text-gray-600 border-gray-300',
              [EMPTY]:    'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200',
            }[state] || 'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200'

            return (
              <button
                key={key}
                onClick={() => !disabled && onKey(key)}
                disabled={disabled}
                className={`
                  ${isWide ? 'px-3 text-xs font-bold' : 'w-9'}
                  h-14 rounded border font-semibold text-sm uppercase transition-colors
                  ${colourClass}
                  disabled:opacity-50 disabled:cursor-default
                `}
              >
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── PuzzleWordle ──────────────────────────────────────────────────────────────

export default function PuzzleWordle() {
  const navigate = useNavigate()
  const today    = todayStr()

  // ── State ─────────────────────────────────────────────────────────────────
  const [puzzle,      setPuzzle]      = useState(null)    // { word, definition }
  const [userId,      setUserId]      = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  const [guesses,     setGuesses]     = useState([])      // array of scored guess rows
  const [currentGuess,setCurrentGuess]= useState('')      // letters being typed
  const [gameState,   setGameState]   = useState('playing')  // playing | won | lost
  const [shake,       setShake]       = useState(false)   // invalid guess shake
  const [reveal,      setReveal]      = useState([])      // which rows are revealed
  const [message,     setMessage]     = useState('')

  // Build keyboard letter state map from guesses
  const letterStates = {}
  guesses.forEach(row => {
    row.forEach(({ letter, state }) => {
      const cur = letterStates[letter]
      // Priority: correct > present > absent
      if (cur === CORRECT) return
      if (state === CORRECT || !cur) { letterStates[letter] = state; return }
      if (state === PRESENT && cur !== CORRECT) letterStates[letter] = state
    })
  })

  // ── Load puzzle ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      // Load today's wordle puzzle
      const { data: puzzleData, error: puzzleErr } = await supabase
        .from('puzzle_content')
        .select('id, content')
        .eq('puzzle_type', 'wordle')
        .eq('puzzle_date', today)
        .eq('status', 'published')
        .single()

      if (puzzleErr || !puzzleData) {
        setError('No WordUp puzzle today — check back tomorrow!')
        setLoading(false)
        return
      }

      setPuzzle({ id: puzzleData.id, ...puzzleData.content })

      // Load existing completion if user is signed in
      if (user?.id) {
        const { data: comp } = await supabase
          .from('user_puzzle_completions')
          .select('score, completed, result')
          .eq('user_id', user.id)
          .eq('puzzle_type', 'wordle')
          .eq('puzzle_date', today)
          .single()

        if (comp?.result?.guesses) {
          // Restore previous session
          const target = puzzleData.content.word.toLowerCase()
          const restored = comp.result.guesses.map(g => scoreGuess(g, target))
          setGuesses(restored)
          setReveal(restored.map((_, i) => i))
          setGameState(comp.completed
            ? (comp.score === 7 ? 'lost' : 'won')
            : 'playing'
          )
          setCurrentGuess('')
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  // ── Key handler ────────────────────────────────────────────────────────────
  const handleKey = useCallback((key) => {
    if (gameState !== 'playing' || !puzzle) return
    const target = puzzle.word.toLowerCase()
    const wordLen = target.length

    if (key === '⌫' || key === 'BACKSPACE') {
      setCurrentGuess(g => g.slice(0, -1))
      return
    }

    if (key === 'ENTER') {
      if (currentGuess.length < wordLen) {
        setShake(true)
        setMessage(`Word must be ${wordLen} letters`)
        setTimeout(() => { setShake(false); setMessage('') }, 600)
        return
      }

      const scored = scoreGuess(currentGuess, target)
      const newGuesses = [...guesses, scored]
      const newRevealIdx = newGuesses.length - 1

      setGuesses(newGuesses)
      setCurrentGuess('')

      // Reveal animation
      setTimeout(() => {
        setReveal(r => [...r, newRevealIdx])
      }, 50)

      const won  = scored.every(s => s.state === CORRECT)
      const lost = !won && newGuesses.length >= MAX_GUESSES

      const newState = won ? 'won' : lost ? 'lost' : 'playing'

      if (won || lost) {
        setTimeout(() => {
          setGameState(newState)
          setMessage(won ? '🎉 Brilliant!' : `The word was "${target.toUpperCase()}"`)
          saveResult(newGuesses, won, newGuesses.length, userId, puzzle.id, today)
        }, wordLen * 300 + 200)
      }

      return
    }

    // Letter key
    if (/^[A-Za-z]$/.test(key) && currentGuess.length < wordLen) {
      setCurrentGuess(g => g + key.toLowerCase())
    }
  }, [gameState, puzzle, currentGuess, guesses, userId])

  // Physical keyboard
  useEffect(() => {
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Backspace') { handleKey('BACKSPACE'); return }
      if (e.key === 'Enter')     { handleKey('ENTER');     return }
      if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">🟩</p>
      <p className="text-gray-600 mb-6">{error}</p>
      <Link to="/puzzles" className="text-sm text-indigo-600 hover:text-indigo-800">← Back to puzzles</Link>
    </div>
  )

  const wordLen = puzzle?.word?.length || 5
  const target  = puzzle?.word?.toLowerCase() || ''

  // Build the grid rows
  const rows = []
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      rows.push({ scored: guesses[i], revealed: reveal.includes(i) })
    } else if (i === guesses.length && gameState === 'playing') {
      // Current input row
      const letters = currentGuess.padEnd(wordLen, '').split('')
      rows.push({ current: letters })
    } else {
      rows.push({ empty: true, len: wordLen })
    }
  }

  const gameOver = gameState === 'won' || gameState === 'lost'

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
      <PageMeta
        title="WordUp — Daily Word Puzzle"
        description="Guess today's English word in 6 tries. A new word every day."
        canonical="/puzzles/wordle"
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <Link to="/puzzles" className="text-sm text-gray-400 hover:text-gray-700">
          ← Puzzles
        </Link>
        <h1 className="text-xl font-bold text-gray-900">WordUp</h1>
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Definition hint */}
      {puzzle?.definition && (
        <div className="w-full bg-gray-50 rounded-xl px-4 py-3 mb-6 text-sm text-gray-600 text-center">
          <span className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Definition</span>
          {puzzle.definition}
        </div>
      )}

      {/* Grid */}
      <div className={`flex flex-col gap-1.5 mb-4 ${shake ? 'animate-shake' : ''}`}>
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.scored ? (
              row.scored.map((cell, ci) => (
                <Tile
                  key={ci}
                  letter={cell.letter.toUpperCase()}
                  state={cell.state}
                  reveal={row.revealed}
                  delay={ci * 250}
                />
              ))
            ) : row.current ? (
              row.current.map((letter, ci) => (
                <Tile
                  key={ci}
                  letter={letter.toUpperCase()}
                  state={letter ? ACTIVE : EMPTY}
                  reveal={false}
                />
              ))
            ) : (
              Array(row.len || wordLen).fill('').map((_, ci) => (
                <Tile key={ci} letter="" state={EMPTY} reveal={false} />
              ))
            )}
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`text-sm font-medium mb-3 px-4 py-2 rounded-lg
          ${gameState === 'won' ? 'bg-green-50 text-green-700' :
            gameState === 'lost' ? 'bg-red-50 text-red-700' :
            'bg-gray-100 text-gray-700'}
        `}>
          {message}
        </div>
      )}

      {/* Game over panel */}
      {gameOver && (
        <div className="w-full bg-gray-50 rounded-2xl p-5 mb-4 text-center">
          <p className="font-bold text-gray-900 text-lg mb-1">
            {gameState === 'won'
              ? `${target.toUpperCase()} ✓`
              : `The word was ${target.toUpperCase()}`
            }
          </p>
          {puzzle?.definition && (
            <p className="text-sm text-gray-500 mb-4">{puzzle.definition}</p>
          )}
          <div className="flex gap-3 justify-center">
            <Link
              to="/puzzles"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              More puzzles
            </Link>
          </div>
          {!userId && (
            <p className="text-xs text-gray-400 mt-3">
              <Link to="/join" className="text-indigo-600 hover:underline">Sign up</Link> to save your streak
            </p>
          )}
        </div>
      )}

      {/* Keyboard */}
      <Keyboard
        letterStates={letterStates}
        onKey={handleKey}
        disabled={gameOver}
      />
    </div>
  )
}

// ── Save result ───────────────────────────────────────────────────────────────

async function saveResult(guesses, won, attempts, userId, puzzleId, date) {
  if (!userId) return
  await supabase
    .from('user_puzzle_completions')
    .upsert({
      user_id:     userId,
      puzzle_type: 'wordle',
      puzzle_date: date,
      score:       won ? attempts : 7,  // 7 = failed
      completed:   true,
      result: {
        guesses:  guesses.map(row => row.map(c => c.letter).join('')),
        won,
        attempts,
      },
    }, { onConflict: 'user_id,puzzle_type,puzzle_date' })
}
