import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_LIVES = 4

// Difficulty levels — index 0 = easiest, 3 = hardest
const LEVELS = [
  { label: 'Yellow',  bg: 'bg-yellow-300',  text: 'text-gray-900', ring: 'ring-yellow-400'  },
  { label: 'Green',   bg: 'bg-green-400',   text: 'text-white',    ring: 'ring-green-500'   },
  { label: 'Blue',    bg: 'bg-blue-500',    text: 'text-white',    ring: 'ring-blue-600'    },
  { label: 'Purple',  bg: 'bg-purple-600',  text: 'text-white',    ring: 'ring-purple-700'  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── PuzzleConnections ─────────────────────────────────────────────────────────

export default function PuzzleConnections() {
  const today = todayStr()

  const [puzzle,     setPuzzle]     = useState(null)   // { groups: [{category, words, level}] }
  const [userId,     setUserId]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // Game state
  const [tiles,      setTiles]      = useState([])     // [{word, groupIndex, solved}]
  const [selected,   setSelected]   = useState([])     // indices into tiles[]
  const [solved,     setSolved]     = useState([])     // array of solved group indices (in solve order)
  const [lives,      setLives]      = useState(MAX_LIVES)
  const [gameState,  setGameState]  = useState('playing')  // playing | won | lost
  const [message,    setMessage]    = useState('')
  const [shake,      setShake]      = useState(false)
  const [mistakes,   setMistakes]   = useState(0)
  const [oneAway,    setOneAway]    = useState(false)  // "one away!" hint

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data: puzzleData, error: puzzleErr } = await supabase
        .from('puzzle_content')
        .select('id, content')
        .eq('puzzle_type', 'connections')
        .eq('puzzle_date', today)
        .eq('status', 'published')
        .single()

      if (puzzleErr || !puzzleData) {
        setError('No Clusters puzzle today — check back tomorrow!')
        setLoading(false)
        return
      }

      const content = puzzleData.content
      // content = { groups: [ { category, words: [str,str,str,str], level: 0|1|2|3 }, ... ] }

      if (!content?.groups || content.groups.length !== 4) {
        setError('Puzzle data is invalid.')
        setLoading(false)
        return
      }

      setPuzzle({ id: puzzleData.id, ...content })

      // Build flat tile list, shuffled
      const allTiles = []
      content.groups.forEach((group, gi) => {
        group.words.forEach(word => {
          allTiles.push({ word, groupIndex: gi, solved: false })
        })
      })
      setTiles(shuffle(allTiles))

      // Restore previous session
      if (user?.id) {
        const { data: comp } = await supabase
          .from('user_puzzle_completions')
          .select('score, completed, result')
          .eq('user_id', user.id)
          .eq('puzzle_type', 'connections')
          .eq('puzzle_date', today)
          .single()

        if (comp?.result?.solved_groups != null) {
          setSolved(comp.result.solved_groups)
          setMistakes(comp.result.mistakes || 0)
          setLives(MAX_LIVES - (comp.result.mistakes || 0))
          if (comp.completed) {
            setGameState(comp.score === MAX_LIVES + 1 ? 'lost' : 'won')
          }
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  // ── Tile select ────────────────────────────────────────────────────────────
  const toggleTile = useCallback((idx) => {
    if (gameState !== 'playing') return
    // Don't select tiles from already-solved groups
    if (tiles[idx]?.solved) return

    setSelected(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx)
      if (prev.length >= 4)   return prev  // max 4
      return [...prev, idx]
    })
  }, [gameState, tiles])

  // ── Submit guess ───────────────────────────────────────────────────────────
  const submitGuess = useCallback(() => {
    if (selected.length !== 4 || gameState !== 'playing') return

    const selectedTiles = selected.map(i => tiles[i])
    const groupCounts   = {}
    selectedTiles.forEach(t => {
      groupCounts[t.groupIndex] = (groupCounts[t.groupIndex] || 0) + 1
    })

    const counts    = Object.values(groupCounts)
    const isCorrect = counts.length === 1  // all 4 from same group

    if (isCorrect) {
      const groupIdx = selectedTiles[0].groupIndex
      const newSolved = [...solved, groupIdx]

      // Mark tiles as solved
      setTiles(prev => prev.map(t =>
        t.groupIndex === groupIdx ? { ...t, solved: true } : t
      ))
      setSolved(newSolved)
      setSelected([])
      setOneAway(false)

      const won = newSolved.length === 4
      if (won) {
        setGameState('won')
        setMessage('🎉 Brilliant! All four groups found!')
        saveResult(newSolved, mistakes, true, userId, puzzle.id, today)
      }
    } else {
      // Check for "one away" — 3 from one group
      const isOneAway = counts.some(c => c === 3)
      setOneAway(isOneAway)

      const newMistakes = mistakes + 1
      const newLives    = lives - 1
      setMistakes(newMistakes)
      setLives(newLives)

      // Shake animation
      setShake(true)
      setTimeout(() => setShake(false), 600)

      if (newLives <= 0) {
        setGameState('lost')
        setMessage('Better luck tomorrow!')
        setSelected([])
        saveResult(solved, newMistakes, false, userId, puzzle.id, today)
      } else {
        setMessage(isOneAway ? 'One away!' : 'Not quite — try again')
        setTimeout(() => setMessage(''), 1800)
        setSelected([])
      }
    }
  }, [selected, tiles, solved, gameState, lives, mistakes, userId, puzzle])

  // ── Shuffle remaining tiles ────────────────────────────────────────────────
  const shuffleTiles = useCallback(() => {
    setTiles(prev => {
      const unsolved = prev.filter(t => !t.solved)
      const solved_  = prev.filter(t => t.solved)
      return [...solved_, ...shuffle(unsolved)]
    })
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">🔵</p>
      <p className="text-gray-600 mb-6">{error}</p>
      <Link to="/puzzles" className="text-sm text-indigo-600 hover:text-indigo-800">← Back to puzzles</Link>
    </div>
  )

  const gameOver    = gameState === 'won' || gameState === 'lost'
  const unsolvedTiles = tiles.filter(t => !t.solved)

  // Sort solved groups by level for display
  const solvedGroups = solved
    .map(gi => puzzle.groups[gi])
    .sort((a, b) => a.level - b.level)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
      <PageMeta
        title="Clusters — Daily Connections Puzzle"
        description="Find four groups of four words. A new puzzle every day."
        canonical="/puzzles/connections"
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <Link to="/puzzles" className="text-sm text-gray-400 hover:text-gray-700">
          ← Puzzles
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Clusters</h1>
        <div className="w-16" />
      </div>

      <p className="text-sm text-gray-500 mb-5 text-center">
        Find four groups of four words
      </p>

      {/* Solved groups (appear at top as they're found) */}
      <div className="w-full flex flex-col gap-2 mb-2">
        {solvedGroups.map((group, i) => {
          const lvl = LEVELS[group.level]
          return (
            <div
              key={i}
              className={`${lvl.bg} ${lvl.text} rounded-xl p-3 text-center`}
            >
              <p className="font-bold text-sm uppercase tracking-wide mb-0.5">
                {group.category}
              </p>
              <p className="text-sm opacity-90">
                {group.words.join(' · ')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Tile grid */}
      {!gameOver && (
        <div className={`w-full grid grid-cols-4 gap-2 mb-4 ${shake ? 'animate-shake' : ''}`}>
          {unsolvedTiles.map((tile, i) => {
            const tileIdx   = tiles.indexOf(tile)
            const isSelected = selected.includes(tileIdx)

            return (
              <button
                key={tile.word}
                onClick={() => toggleTile(tileIdx)}
                className={`
                  h-16 sm:h-20 rounded-xl font-bold text-sm uppercase text-center
                  flex items-center justify-center px-1
                  transition-all duration-100 select-none
                  ${isSelected
                    ? 'bg-gray-700 text-white scale-95 ring-2 ring-gray-500'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:scale-95'
                  }
                `}
              >
                {tile.word}
              </button>
            )
          })}
        </div>
      )}

      {/* Game-over: reveal all groups */}
      {gameState === 'lost' && (
        <div className="w-full flex flex-col gap-2 mb-4">
          {puzzle.groups
            .filter(g => !solved.includes(puzzle.groups.indexOf(g)))
            .sort((a, b) => a.level - b.level)
            .map((group, i) => {
              const lvl = LEVELS[group.level]
              return (
                <div key={i} className={`${lvl.bg} ${lvl.text} rounded-xl p-3 text-center opacity-70`}>
                  <p className="font-bold text-sm uppercase tracking-wide mb-0.5">
                    {group.category}
                  </p>
                  <p className="text-sm opacity-90">
                    {group.words.join(' · ')}
                  </p>
                </div>
              )
            })
          }
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`text-sm font-semibold mb-3 px-4 py-2 rounded-lg
          ${gameState === 'won'  ? 'bg-green-50 text-green-700' :
            gameState === 'lost' ? 'bg-red-50 text-red-700' :
            oneAway              ? 'bg-yellow-50 text-yellow-700' :
                                   'bg-gray-100 text-gray-700'}
        `}>
          {message}
        </div>
      )}

      {/* Lives */}
      {!gameOver && (
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-xs text-gray-400 mr-1">Lives:</span>
          {Array(MAX_LIVES).fill(0).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < lives ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      {!gameOver && (
        <div className="flex gap-3">
          <button
            onClick={shuffleTiles}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Shuffle
          </button>
          <button
            onClick={() => setSelected([])}
            disabled={selected.length === 0}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-default"
          >
            Deselect
          </button>
          <button
            onClick={submitGuess}
            disabled={selected.length !== 4}
            className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-default"
          >
            Submit
          </button>
        </div>
      )}

      {/* Game over panel */}
      {gameOver && (
        <div className="w-full bg-gray-50 rounded-2xl p-5 text-center mt-2">
          <p className="font-bold text-gray-900 text-lg mb-1">
            {gameState === 'won' ? '🎉 Solved!' : '😔 Better luck tomorrow'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {mistakes === 0
              ? 'Perfect — no mistakes!'
              : `${mistakes} mistake${mistakes !== 1 ? 's' : ''}`
            }
          </p>
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
    </div>
  )
}

// ── Save result ───────────────────────────────────────────────────────────────

async function saveResult(solvedGroups, mistakes, won, userId, puzzleId, date) {
  if (!userId) return
  await supabase
    .from('user_puzzle_completions')
    .upsert({
      user_id:      userId,
      puzzle_type:  'connections',
      puzzle_date:  date,
      score:        mistakes,   // 0 = perfect, MAX_LIVES+1 = failed
      completed:    true,
      result: {
        solved_groups: solvedGroups,
        mistakes,
        won,
      },
    }, { onConflict: 'user_id,puzzle_type,puzzle_date' })
}
