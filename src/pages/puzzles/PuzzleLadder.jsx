import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// Count how many letters differ between two same-length words
function letterDiff(a, b) {
  if (a.length !== b.length) return Infinity
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++
  }
  return diff
}

// ── StepRow ───────────────────────────────────────────────────────────────────
// Shows a completed or current step in the ladder

function StepRow({ word, target, isStart, isTarget, isCurrent, wordLen }) {
  const letters = (word || '').padEnd(wordLen, '').split('')

  return (
    <div className="flex gap-1.5 items-center">
      {letters.map((letter, i) => {
        let style = 'border-gray-200 bg-white text-gray-900'

        if (word && target && !isStart && !isCurrent) {
          // Colour matched letters green
          style = letter === target[i]
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-gray-300 bg-gray-100 text-gray-700'
        }

        if (isStart)   style = 'border-indigo-300 bg-indigo-50 text-indigo-900'
        if (isTarget)  style = 'border-emerald-400 bg-emerald-50 text-emerald-900'
        if (isCurrent) style = letter
          ? 'border-gray-400 bg-white text-gray-900'
          : 'border-gray-200 bg-white text-gray-300'

        return (
          <div
            key={i}
            className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center
              font-bold text-lg uppercase border-2 rounded-lg select-none
              transition-colors duration-150 ${style}`}
          >
            {letter}
          </div>
        )
      })}
    </div>
  )
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

function Keyboard({ onKey, disabled }) {
  return (
    <div className="flex flex-col items-center gap-1.5 mt-4">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map(key => {
            const isWide = key === 'ENTER' || key === '⌫'
            return (
              <button
                key={key}
                onClick={() => !disabled && onKey(key)}
                disabled={disabled}
                className={`
                  ${isWide ? 'px-3 text-xs font-bold' : 'w-9'}
                  h-14 rounded border font-semibold text-sm uppercase transition-colors
                  bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200
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

// ── PuzzleLadder ──────────────────────────────────────────────────────────────

export default function PuzzleLadder() {
  const { date } = useParams()
  const today = date || todayStr()

  const [puzzle,       setPuzzle]       = useState(null)   // { start, target, par }
  const [userId,       setUserId]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  const [steps,        setSteps]        = useState([])     // completed words (not including start)
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameState,    setGameState]    = useState('playing')
  const [message,      setMessage]      = useState('')
  const [shake,        setShake]        = useState(false)

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data: puzzleData, error: puzzleErr } = await supabase
        .from('puzzle_content')
        .select('id, content')
        .eq('puzzle_type', 'ladder')
        .eq('puzzle_date', today)
        .eq('status', 'published')
        .single()

      if (puzzleErr || !puzzleData) {
        setError('No Word Ladder today — check back tomorrow!')
        setLoading(false)
        return
      }

      const content = puzzleData.content
      // content = { start: "cold", target: "warm", par: 4 }

      if (!content?.start || !content?.target) {
        setError('Puzzle data is invalid.')
        setLoading(false)
        return
      }

      if (content.start.length !== content.target.length) {
        setError('Puzzle error: start and target must be the same length.')
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
          .eq('puzzle_type', 'ladder')
          .eq('puzzle_date', today)
          .single()

        if (comp?.result?.steps) {
          setSteps(comp.result.steps)
          if (comp.completed) setGameState('won')
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  // ── Key handler ────────────────────────────────────────────────────────────
  const handleKey = useCallback((key) => {
    if (gameState !== 'playing' || !puzzle) return
    const wordLen = puzzle.start.length

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

      const prev = steps.length > 0 ? steps[steps.length - 1] : puzzle.start
      const diff = letterDiff(currentGuess, prev)

      if (diff === 0) {
        setShake(true)
        setMessage('Same as the previous word!')
        setTimeout(() => { setShake(false); setMessage('') }, 600)
        return
      }

      if (diff > 1) {
        setShake(true)
        setMessage('Change exactly one letter')
        setTimeout(() => { setShake(false); setMessage('') }, 600)
        return
      }

      // Valid step
      const newSteps = [...steps, currentGuess]
      setSteps(newSteps)
      setCurrentGuess('')

      const won = currentGuess.toLowerCase() === puzzle.target.toLowerCase()
      if (won) {
        setGameState('won')
        setMessage(`🎉 Done in ${newSteps.length} step${newSteps.length !== 1 ? 's' : ''}!`)
        saveResult(newSteps, userId, puzzle.id, today)
      }

      return
    }

    // Letter key
    if (/^[A-Za-z]$/.test(key) && currentGuess.length < wordLen) {
      setCurrentGuess(g => g + key.toLowerCase())
    }
  }, [gameState, puzzle, currentGuess, steps, userId])

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
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">🪜</p>
      <p className="text-gray-600 mb-6">{error}</p>
      <Link to="/puzzles" className="text-sm text-indigo-600 hover:text-indigo-800">← Back to puzzles</Link>
    </div>
  )

  const wordLen  = puzzle.start.length
  const gameOver = gameState === 'won'
  const par      = puzzle.par || null

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
      <PageMeta
        title="Word Ladder — Daily Word Puzzle"
        description="Change one letter at a time to climb from the start word to the target. A new ladder every day."
        canonical="/puzzles/ladder"
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <Link to="/puzzles" className="text-sm text-gray-400 hover:text-gray-700">
          ← Puzzles
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Word Ladder</h1>
        <div className="w-16" />
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-500 mb-1 text-center">
        Change one letter at a time
      </p>
      {par && (
        <p className="text-xs text-gray-400 mb-5 text-center">
          Par: {par} steps
        </p>
      )}

      {/* Ladder */}
      <div className={`flex flex-col gap-2 mb-4 ${shake ? 'animate-shake' : ''}`}>

        {/* Start word */}
        <div className="flex flex-col items-center gap-1">
          <StepRow word={puzzle.start} target={puzzle.target} isStart wordLen={wordLen} />
          <span className="text-xs text-indigo-400 font-medium">START</span>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center text-gray-300 text-xl leading-none">↓</div>

        {/* Completed steps */}
        {steps.map((word, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <StepRow word={word} target={puzzle.target} wordLen={wordLen} />
            <div className="flex flex-col items-center text-gray-300 text-xl leading-none">↓</div>
          </div>
        ))}

        {/* Current input row */}
        {!gameOver && (
          <div className="flex flex-col items-center gap-1">
            <StepRow
              word={currentGuess}
              target={puzzle.target}
              isCurrent
              wordLen={wordLen}
            />
          </div>
        )}

        {/* Target word */}
        {gameOver && (
          <>
            <div className="flex flex-col items-center text-gray-300 text-xl leading-none">↓</div>
            <div className="flex flex-col items-center gap-1">
              <StepRow word={puzzle.target} isTarget wordLen={wordLen} />
              <span className="text-xs text-emerald-500 font-medium">TARGET ✓</span>
            </div>
          </>
        )}

        {!gameOver && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400 mb-1">TARGET</span>
            <StepRow word={puzzle.target} isTarget wordLen={wordLen} />
          </div>
        )}

      </div>

      {/* Message */}
      {message && (
        <div className={`text-sm font-medium mb-3 px-4 py-2 rounded-lg
          ${gameState === 'won'
            ? 'bg-green-50 text-green-700'
            : 'bg-gray-100 text-gray-700'}
        `}>
          {message}
        </div>
      )}

      {/* Step count */}
      {!gameOver && steps.length > 0 && (
        <p className="text-xs text-gray-400 mb-2">
          {steps.length} step{steps.length !== 1 ? 's' : ''} so far
          {par ? ` · par ${par}` : ''}
        </p>
      )}

      {/* Game over panel */}
      {gameOver && (
        <div className="w-full bg-gray-50 rounded-2xl p-5 mb-4 text-center">
          <p className="font-bold text-gray-900 text-lg mb-1">
            {puzzle.start.toUpperCase()} → {puzzle.target.toUpperCase()}
          </p>
          <p className="text-sm text-gray-500 mb-1">
            Solved in <span className="font-semibold">{steps.length}</span> step{steps.length !== 1 ? 's' : ''}
            {par ? ` (par ${par})` : ''}
          </p>
          {par && steps.length <= par && (
            <p className="text-sm text-green-600 font-medium mb-3">Under par! 🏌️</p>
          )}
          <div className="flex gap-3 justify-center mt-3">
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
      {!gameOver && (
        <Keyboard onKey={handleKey} disabled={gameOver} />
      )}
    </div>
  )
}

// ── Save result ───────────────────────────────────────────────────────────────

async function saveResult(steps, userId, puzzleId, date) {
  if (!userId) return
  await supabase
    .from('user_puzzle_completions')
    .upsert({
      user_id:     userId,
      puzzle_type: 'ladder',
      puzzle_date: date,
      score:       steps.length,
      completed:   true,
      result: { steps, won: true },
    }, { onConflict: 'user_id,puzzle_type,puzzle_date' })
}
