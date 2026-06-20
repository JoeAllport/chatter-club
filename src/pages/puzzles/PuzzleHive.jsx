import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function wordScore(word) {
  const len = word.length
  if (len <= 3) return 1
  if (len === 4) return 2
  if (len === 5) return 3
  return len  // 6+ letters = full length as points
}

// ── Honeycomb layout ──────────────────────────────────────────────────────────
// Centre + 6 surrounding cells in hex positions
// SVG-based honeycomb, cells at fixed positions

const HEX_RADIUS = 38   // outer radius of each hex
const HEX_GAP    = 4    // gap between hexes

// Flat-top hex: centre positions for 7 cells
// Centre cell + 6 surrounding at 60° intervals
function hexCentres(cx, cy, dist) {
  const angles = [270, 330, 30, 90, 150, 210]  // top, top-right, bottom-right, bottom, bottom-left, top-left
  return [
    { x: cx, y: cy },  // centre
    ...angles.map(deg => {
      const rad = (deg * Math.PI) / 180
      return { x: cx + dist * Math.cos(rad), y: cy + dist * Math.sin(rad) }
    }),
  ]
}

// Pointy-top hexagon path centred at (0,0)
function hexPath(r) {
  const points = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    points.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`)
  }
  return `M ${points.join(' L ')} Z`
}

const CELL_DIST  = HEX_RADIUS * 2 + HEX_GAP
const SVG_SIZE   = CELL_DIST * 2 + HEX_RADIUS * 2 + 16
const CENTRES    = hexCentres(SVG_SIZE / 2, SVG_SIZE / 2, CELL_DIST)
const HEX_D      = hexPath(HEX_RADIUS - 1)

function HoneycombBoard({ centre, letters, currentGuess, onLetterClick }) {
  const allLetters = [centre, ...letters]  // index 0 = centre

  return (
    <svg
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="mx-auto select-none"
    >
      {CENTRES.map((pos, i) => {
        const letter     = allLetters[i] || ''
        const isCentre   = i === 0
        const isInGuess  = currentGuess.includes(letter)

        const fill = isCentre
          ? (isInGuess ? '#f59e0b' : '#fbbf24')   // amber — centre
          : (isInGuess ? '#e5e7eb' : '#f3f4f6')   // gray — surrounding

        const textFill = isCentre ? '#1f2937' : '#374151'

        return (
          <g
            key={i}
            transform={`translate(${pos.x}, ${pos.y})`}
            onClick={() => onLetterClick(letter)}
            className="cursor-pointer"
          >
            <path
              d={HEX_D}
              fill={fill}
              stroke={isCentre ? '#d97706' : '#d1d5db'}
              strokeWidth={2}
              className="transition-colors duration-100"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={isCentre ? 20 : 18}
              fontWeight="700"
              fill={textFill}
              className="uppercase pointer-events-none"
              style={{ userSelect: 'none' }}
            >
              {letter.toUpperCase()}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── FoundWord ─────────────────────────────────────────────────────────────────

function FoundWord({ word, score }) {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-2 py-1 rounded-full">
      {word.toUpperCase()}
      <span className="text-amber-500">+{score}</span>
    </span>
  )
}

// ── PuzzleHive ────────────────────────────────────────────────────────────────

export default function PuzzleHive() {
  const { date } = useParams()
  const today = date || todayStr()

  const [puzzle,       setPuzzle]       = useState(null)
  const [userId,       setUserId]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  const [foundWords,   setFoundWords]   = useState([])    // array of found word strings
  const [currentGuess, setCurrentGuess] = useState('')
  const [defIndex,     setDefIndex]     = useState(0)     // which definition we're showing
  const [gameState,    setGameState]    = useState('playing')  // playing | won
  const [message,      setMessage]      = useState('')
  const [shake,        setShake]        = useState(false)
  const [pulse,        setPulse]        = useState(false) // correct answer flash

  const totalScore = foundWords.reduce((sum, w) => sum + wordScore(w), 0)

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data: puzzleData, error: puzzleErr } = await supabase
        .from('puzzle_content')
        .select('id, content')
        .eq('puzzle_type', 'hive')
        .eq('puzzle_date', today)
        .eq('status', 'published')
        .single()

      if (puzzleErr || !puzzleData) {
        setError('No Letter Hive today — check back tomorrow!')
        setLoading(false)
        return
      }

      const content = puzzleData.content
      if (!content?.centre || !content?.letters || !content?.words?.length) {
        setError('Puzzle data is invalid.')
        setLoading(false)
        return
      }

      setPuzzle({ id: puzzleData.id, ...content })

      // Restore session
      if (user?.id) {
        const { data: comp } = await supabase
          .from('user_puzzle_completions')
          .select('score, completed, result')
          .eq('user_id', user.id)
          .eq('puzzle_type', 'hive')
          .eq('puzzle_date', today)
          .single()

        if (comp?.result?.found_words) {
          setFoundWords(comp.result.found_words)
          // Resume at next unfound definition
          const nextIdx = content.words.findIndex(
            w => !comp.result.found_words.includes(w.word.toLowerCase())
          )
          setDefIndex(nextIdx === -1 ? 0 : nextIdx)
          if (comp.completed) setGameState('won')
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  // ── Current definition ─────────────────────────────────────────────────────
  const currentWord = puzzle?.words?.[defIndex]

  // ── Validate guess ─────────────────────────────────────────────────────────
  function validateGuess(guess) {
    if (!puzzle || !currentWord) return null
    const g = guess.toLowerCase()

    // Must include centre letter
    if (!g.includes(puzzle.centre.toLowerCase())) {
      return 'Must use the centre letter!'
    }

    // All letters must be in the hive
    const hiveLetters = [puzzle.centre, ...puzzle.letters].map(l => l.toLowerCase())
    for (const ch of g) {
      if (!hiveLetters.includes(ch)) {
        return `"${ch.toUpperCase()}" is not in the hive`
      }
    }

    // Must match the current answer
    if (g !== currentWord.word.toLowerCase()) {
      return 'Not the right word — try again'
    }

    return 'correct'
  }

  // ── Handle key ─────────────────────────────────────────────────────────────
  const handleKey = useCallback((key) => {
    if (gameState !== 'playing' || !puzzle) return

    if (key === '⌫' || key === 'BACKSPACE') {
      setCurrentGuess(g => g.slice(0, -1))
      return
    }

    if (key === 'ENTER') {
      if (!currentGuess) return

      const result = validateGuess(currentGuess)

      if (result === 'correct') {
        const word     = currentWord.word.toLowerCase()
        const score    = wordScore(word)
        const newFound = [...foundWords, word]

        setFoundWords(newFound)
        setCurrentGuess('')
        setPulse(true)
        setTimeout(() => setPulse(false), 600)

        const allFound = newFound.length === puzzle.words.length

        if (allFound) {
          setGameState('won')
          setMessage('👑 Queen Bee! All words found!')
          saveResult(newFound, totalScore + score, userId, puzzle.id, today)
        } else {
          // Advance to next unfound word
          const nextIdx = puzzle.words.findIndex(
            (w, i) => i !== defIndex && !newFound.includes(w.word.toLowerCase())
          )
          setDefIndex(nextIdx === -1 ? defIndex : nextIdx)
          setMessage(`+${score} point${score !== 1 ? 's' : ''}!`)
          setTimeout(() => setMessage(''), 1200)
        }
      } else {
        setShake(true)
        setMessage(result)
        setTimeout(() => { setShake(false); setMessage('') }, 800)
      }
      return
    }

    // Letter key — only allow hive letters
    if (/^[A-Za-z]$/.test(key)) {
      const hiveLetters = [puzzle.centre, ...puzzle.letters].map(l => l.toLowerCase())
      if (hiveLetters.includes(key.toLowerCase())) {
        setCurrentGuess(g => g + key.toLowerCase())
      }
    }
  }, [gameState, puzzle, currentGuess, currentWord, foundWords, defIndex, totalScore, userId])

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

  // Skip to next definition (give up on this word)
  function skipWord() {
    if (!puzzle) return
    const nextIdx = puzzle.words.findIndex(
      (w, i) => i !== defIndex && !foundWords.includes(w.word.toLowerCase())
    )
    if (nextIdx !== -1) {
      setDefIndex(nextIdx)
      setCurrentGuess('')
      setMessage('')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">🍯</p>
      <p className="text-gray-600 mb-6">{error}</p>
      <Link to="/puzzles" className="text-sm text-indigo-600 hover:text-indigo-800">← Back to puzzles</Link>
    </div>
  )

  const gameOver   = gameState === 'won'
  const remaining  = puzzle.words.filter(w => !foundWords.includes(w.word.toLowerCase()))
  const maxScore   = puzzle.words.reduce((sum, w) => sum + wordScore(w.word), 0)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
      <PageMeta
        title="Letter Hive — Daily Word Puzzle"
        description="Read the definition and find the word in the hive. A new hive every day."
        canonical="/puzzles/hive"
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <Link to="/puzzles" className="text-sm text-gray-400 hover:text-gray-700">
          ← Puzzles
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Letter Hive</h1>
        <div className="w-16" />
      </div>

      {/* Score + progress */}
      <div className="flex items-center gap-4 mb-5">
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-500">{totalScore}</p>
          <p className="text-xs text-gray-400">points</p>
        </div>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[160px]">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${maxScore > 0 ? (totalScore / maxScore) * 100 : 0}%` }}
          />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700">{foundWords.length}<span className="text-gray-300">/{puzzle.words.length}</span></p>
          <p className="text-xs text-gray-400">words</p>
        </div>
      </div>

      {/* Definition card */}
      {!gameOver && currentWord && (
        <div className={`w-full bg-gray-50 rounded-2xl px-5 py-4 mb-5 text-center transition-all duration-300 ${pulse ? 'bg-green-50' : ''}`}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            Word {foundWords.length + 1} of {puzzle.words.length}
            {currentWord.word.length ? ` · ${currentWord.word.length} letters` : ''}
          </p>
          <p className="text-gray-800 text-base leading-snug font-medium">
            {currentWord.definition}
          </p>
          {remaining.length > 1 && (
            <button
              onClick={skipWord}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip this one →
            </button>
          )}
        </div>
      )}

      {/* Current guess display */}
      {!gameOver && (
        <div className={`mb-3 min-h-[2.5rem] flex items-center justify-center ${shake ? 'animate-shake' : ''}`}>
          {currentGuess ? (
            <p className="text-2xl font-bold tracking-widest uppercase text-gray-900">
              {currentGuess.split('').map((ch, i) => (
                <span
                  key={i}
                  className={ch === puzzle.centre ? 'text-amber-500' : 'text-gray-900'}
                >
                  {ch}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-gray-300 text-lg">Type or tap a letter...</p>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`text-sm font-medium mb-3 px-4 py-2 rounded-lg
          ${gameState === 'won'       ? 'bg-amber-50 text-amber-700' :
            message.startsWith('+')  ? 'bg-green-50 text-green-700' :
                                       'bg-gray-100 text-gray-700'}
        `}>
          {message}
        </div>
      )}

      {/* Honeycomb */}
      {!gameOver && (
        <div className="mb-4">
          <HoneycombBoard
            centre={puzzle.centre}
            letters={puzzle.letters}
            currentGuess={currentGuess}
            onLetterClick={(letter) => handleKey(letter.toUpperCase())}
          />
        </div>
      )}

      {/* Action buttons */}
      {!gameOver && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setCurrentGuess(g => g.slice(0, -1))}
            disabled={!currentGuess}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-default"
          >
            ⌫ Delete
          </button>
          <button
            onClick={() => handleKey('ENTER')}
            disabled={!currentGuess}
            className="px-5 py-2 rounded-lg bg-amber-400 text-gray-900 text-sm font-semibold hover:bg-amber-500 transition-colors disabled:opacity-40 disabled:cursor-default"
          >
            Enter
          </button>
        </div>
      )}

      {/* Found words */}
      {foundWords.length > 0 && (
        <div className="w-full">
          <p className="text-xs text-gray-400 mb-2 text-center">Found</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {foundWords.map(w => (
              <FoundWord key={w} word={w} score={wordScore(w)} />
            ))}
          </div>
        </div>
      )}

      {/* Game over panel */}
      {gameOver && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center mt-4">
          <p className="text-4xl mb-2">👑</p>
          <p className="font-bold text-gray-900 text-lg mb-1">Queen Bee!</p>
          <p className="text-sm text-gray-500 mb-4">
            {totalScore} point{totalScore !== 1 ? 's' : ''} · {foundWords.length} words found
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center mb-5">
            {foundWords.map(w => (
              <FoundWord key={w} word={w} score={wordScore(w)} />
            ))}
          </div>
          <Link
            to="/puzzles"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            More puzzles
          </Link>
          {!userId && (
            <p className="text-xs text-gray-400 mt-3">
              <Link to="/join" className="text-indigo-600 hover:underline">Sign up</Link> to save your streak
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Save result ───────────────────────────────────────────────────────────────

async function saveResult(foundWords, score, userId, puzzleId, date) {
  if (!userId) return
  await supabase
    .from('user_puzzle_completions')
    .upsert({
      user_id:     userId,
      puzzle_type: 'hive',
      puzzle_date: date,
      score,
      completed:   true,
      result: { found_words: foundWords, won: true },
    }, { onConflict: 'user_id,puzzle_type,puzzle_date' })
}
