import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// Build a map of cell → { acrossId, downId, number }
// Also returns the auto-numbered word list
function buildCellMap(size, words) {
  // numberMap: "row,col" → cell number
  const startPositions = {}
  words.forEach(w => {
    const key = `${w.row},${w.col}`
    if (!startPositions[key]) startPositions[key] = []
    startPositions[key].push(w)
  })

  // Assign numbers in reading order (top→bottom, left→right)
  let counter = 1
  const numberMap = {}  // "row,col" → number
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`
      if (startPositions[key]) {
        numberMap[key] = counter++
      }
    }
  }

  // Build cell map
  const cellMap = {}  // "row,col" → { acrossId, downId, number }
  words.forEach(w => {
    for (let i = 0; i < w.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i
      const c = w.direction === 'across' ? w.col + i : w.col
      const key = `${r},${c}`
      if (!cellMap[key]) cellMap[key] = { acrossId: null, downId: null, number: null }
      if (w.direction === 'across') cellMap[key].acrossId = w.id
      if (w.direction === 'down')   cellMap[key].downId   = w.id
    }
  })

  // Set numbers
  Object.entries(numberMap).forEach(([key, num]) => {
    if (cellMap[key]) cellMap[key].number = num
  })

  // Attach number to each word
  const numberedWords = words.map(w => ({
    ...w,
    number: numberMap[`${w.row},${w.col}`] || 0,
  }))

  return { cellMap, numberedWords }
}

// Get all cells belonging to a word
function wordCells(word) {
  const cells = []
  for (let i = 0; i < word.length; i++) {
    cells.push({
      row: word.direction === 'across' ? word.row : word.row + i,
      col: word.direction === 'across' ? word.col + i : word.col,
    })
  }
  return cells
}

// ── PuzzleCrossword ───────────────────────────────────────────────────────────

export default function PuzzleCrossword() {
  const { date } = useParams()
  const today = date || todayStr()

  const [puzzle,      setPuzzle]      = useState(null)
  const [userId,      setUserId]      = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  // cellMap and numbered words derived from puzzle
  const [cellMap,     setCellMap]     = useState({})
  const [words,       setWords]       = useState([])

  // User's filled letters: "row,col" → letter (uppercase)
  const [filled,      setFilled]      = useState({})

  // Cursor state
  const [activeCell,  setActiveCell]  = useState(null)   // { row, col }
  const [direction,   setDirection]   = useState('across')
  const [activeWord,  setActiveWord]  = useState(null)   // word object

  // Game state
  const [gameState,   setGameState]   = useState('playing')  // playing | checking | complete
  const [checked,     setChecked]     = useState({})     // "row,col" → 'correct' | 'wrong'
  const [revealed,    setRevealed]    = useState(false)
  const [score,       setScore]       = useState(null)   // % correct

  const gridRef = useRef(null)

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data: puzzleData, error: puzzleErr } = await supabase
        .from('puzzle_content')
        .select('id, content')
        .eq('puzzle_type', 'crossword')
        .eq('puzzle_date', today)
        .eq('status', 'published')
        .single()

      if (puzzleErr || !puzzleData) {
        setError('No crossword today — check back tomorrow!')
        setLoading(false)
        return
      }

      const content = puzzleData.content
      if (!content?.size || !content?.words?.length) {
        setError('Puzzle data is invalid.')
        setLoading(false)
        return
      }

      const { cellMap: cm, numberedWords: nw } = buildCellMap(content.size, content.words)
      setCellMap(cm)
      setWords(nw)
      setPuzzle({ id: puzzleData.id, ...content })

      // Restore session
      if (user?.id) {
        const { data: comp } = await supabase
          .from('user_puzzle_completions')
          .select('score, completed, result')
          .eq('user_id', user.id)
          .eq('puzzle_type', 'crossword')
          .eq('puzzle_date', today)
          .single()

        if (comp?.result?.filled) {
          setFilled(comp.result.filled)
          if (comp.completed) {
            setGameState('complete')
            setScore(comp.score)
            setRevealed(comp.result.revealed || false)
          }
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  // ── Derive active word from active cell + direction ────────────────────────
  useEffect(() => {
    if (!activeCell || !cellMap) return
    const key  = `${activeCell.row},${activeCell.col}`
    const cell = cellMap[key]
    if (!cell) return

    const wordId = direction === 'across' ? cell.acrossId : cell.downId

    // If no word in this direction, try the other
    if (!wordId) {
      const other    = direction === 'across' ? 'down' : 'across'
      const otherId  = direction === 'across' ? cell.downId : cell.acrossId
      if (otherId) {
        setDirection(other)
        setActiveWord(words.find(w => w.id === otherId) || null)
      }
      return
    }

    setActiveWord(words.find(w => w.id === wordId) || null)
  }, [activeCell, direction, cellMap, words])

  // ── Cell click ─────────────────────────────────────────────────────────────
  const handleCellClick = useCallback((row, col) => {
    if (gameState !== 'playing') return
    const key  = `${row},${col}`
    const cell = cellMap[key]
    if (!cell) return

    if (activeCell?.row === row && activeCell?.col === col) {
      // Toggle direction on second tap
      const newDir  = direction === 'across' ? 'down' : 'across'
      const hasWord = newDir === 'across' ? cell.acrossId : cell.downId
      if (hasWord) setDirection(newDir)
    } else {
      setActiveCell({ row, col })
      // Prefer current direction if available, otherwise switch
      const hasCurrentDir = direction === 'across' ? cell.acrossId : cell.downId
      if (!hasCurrentDir) {
        setDirection(direction === 'across' ? 'down' : 'across')
      }
    }
  }, [activeCell, direction, cellMap, gameState])

  // ── Advance cursor to next empty cell in word ──────────────────────────────
  const advanceCursor = useCallback((fromRow, fromCol, word) => {
    if (!word) return
    const cells   = wordCells(word)
    const fromIdx = cells.findIndex(c => c.row === fromRow && c.col === fromCol)
    if (fromIdx === -1) return

    // Try to find next empty cell after current position
    for (let i = fromIdx + 1; i < cells.length; i++) {
      const k = `${cells[i].row},${cells[i].col}`
      if (!filled[k]) {
        setActiveCell(cells[i])
        return
      }
    }
    // If no empty found ahead, just move to next cell
    if (fromIdx + 1 < cells.length) {
      setActiveCell(cells[fromIdx + 1])
    }
  }, [filled])

  // ── Keyboard handler ───────────────────────────────────────────────────────
  const handleKey = useCallback((key) => {
    if (gameState !== 'playing' || !activeCell || !activeWord) return
    const { row, col } = activeCell

    if (key === 'BACKSPACE' || key === '⌫') {
      const k = `${row},${col}`
      if (filled[k]) {
        // Delete current cell
        setFilled(prev => { const n = { ...prev }; delete n[k]; return n })
      } else {
        // Move back and delete previous cell
        const cells   = wordCells(activeWord)
        const idx     = cells.findIndex(c => c.row === row && c.col === col)
        if (idx > 0) {
          const prev_cell = cells[idx - 1]
          const pk        = `${prev_cell.row},${prev_cell.col}`
          setFilled(prev => { const n = { ...prev }; delete n[pk]; return n })
          setActiveCell(prev_cell)
        }
      }
      return
    }

    if (key === 'ENTER') {
      // Move to next word
      const currentWordIdx = words.findIndex(w => w.id === activeWord.id)
      const nextWord       = words[(currentWordIdx + 1) % words.length]
      const firstCell      = wordCells(nextWord)[0]
      setDirection(nextWord.direction)
      setActiveCell(firstCell)
      return
    }

    if (key === 'ARROWLEFT')  { moveArrow(row, col, 0, -1); return }
    if (key === 'ARROWRIGHT') { moveArrow(row, col, 0,  1); return }
    if (key === 'ARROWUP')    { moveArrow(row, col, -1, 0); return }
    if (key === 'ARROWDOWN')  { moveArrow(row, col,  1, 0); return }

    if (/^[A-Za-z]$/.test(key)) {
      const k = `${row},${col}`
      setFilled(prev => ({ ...prev, [k]: key.toUpperCase() }))
      // Clear check state for this cell
      setChecked(prev => { const n = { ...prev }; delete n[k]; return n })
      advanceCursor(row, col, activeWord)
    }
  }, [gameState, activeCell, activeWord, filled, words, advanceCursor])

  function moveArrow(row, col, dr, dc) {
    const newRow = row + dr
    const newCol = col + dc
    const key    = `${newRow},${newCol}`
    if (cellMap[key]) {
      setActiveCell({ row: newRow, col: newCol })
      if (dc !== 0) setDirection('across')
      if (dr !== 0) setDirection('down')
    }
  }

  // Physical keyboard
  useEffect(() => {
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Backspace')   { e.preventDefault(); handleKey('BACKSPACE');    return }
      if (e.key === 'Enter')       { e.preventDefault(); handleKey('ENTER');        return }
      if (e.key === 'ArrowLeft')   { e.preventDefault(); handleKey('ARROWLEFT');    return }
      if (e.key === 'ArrowRight')  { e.preventDefault(); handleKey('ARROWRIGHT');   return }
      if (e.key === 'ArrowUp')     { e.preventDefault(); handleKey('ARROWUP');      return }
      if (e.key === 'ArrowDown')   { e.preventDefault(); handleKey('ARROWDOWN');    return }
      if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  // ── Check answers ──────────────────────────────────────────────────────────
  function checkAnswers() {
    if (!puzzle) return
    const result = {}
    let correct  = 0
    let total    = 0

    words.forEach(w => {
      const cells = wordCells(w)
      cells.forEach((cell, i) => {
        const k       = `${cell.row},${cell.col}`
        const letter  = filled[k] || ''
        const answer  = w.answer[i].toUpperCase()
        // Only check filled cells
        if (letter) {
          total++
          if (letter === answer) {
            result[k] = 'correct'
            correct++
          } else {
            result[k] = 'wrong'
          }
        }
      })
    })

    setChecked(result)
    setGameState('checking')
  }

  // ── Reveal all answers ─────────────────────────────────────────────────────
  function revealAll() {
    if (!puzzle) return
    const newFilled = { ...filled }
    words.forEach(w => {
      wordCells(w).forEach((cell, i) => {
        newFilled[`${cell.row},${cell.col}`] = w.answer[i].toUpperCase()
      })
    })
    setFilled(newFilled)
    setRevealed(true)
    submitScore(newFilled, true)
  }

  // ── Submit / finish ────────────────────────────────────────────────────────
  function submitScore(filledOverride, isReveal = false) {
    const f = filledOverride || filled
    let correct = 0
    let total   = 0

    words.forEach(w => {
      wordCells(w).forEach((cell, i) => {
        const k      = `${cell.row},${cell.col}`
        const letter = f[k] || ''
        const answer = w.answer[i].toUpperCase()
        total++
        if (letter === answer) correct++
      })
    })

    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    setScore(pct)
    setGameState('complete')
    saveResult(f, pct, isReveal, userId, puzzle.id, today)
  }

  // ── On-screen keyboard ─────────────────────────────────────────────────────
  const KB_ROWS = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','⌫'],
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">✏️</p>
      <p className="text-gray-600 mb-6">{error}</p>
      <Link to="/puzzles" className="text-sm text-indigo-600 hover:text-indigo-800">← Back to puzzles</Link>
    </div>
  )

  const size     = puzzle.size
  const gameOver = gameState === 'complete'

  // Clue list split into across/down
  const acrossWords = words.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number)
  const downWords   = words.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number)

  // Active word cells set for highlighting
  const activeWordCells = activeWord ? new Set(wordCells(activeWord).map(c => `${c.row},${c.col}`)) : new Set()

  // Cell size — fit grid in ~320px on mobile
  const cellSize = Math.min(44, Math.floor(300 / size))

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <PageMeta
        title="Mini Crossword — Daily Word Puzzle"
        description="A daily mini crossword with vocabulary clues. A new puzzle every day."
        canonical="/puzzles/crossword"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/puzzles" className="text-sm text-gray-400 hover:text-gray-700">
          ← Puzzles
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Mini Crossword</h1>
        <div className="w-16" />
      </div>

      {/* Active clue banner */}
      {activeWord && !gameOver && (
        <div className="bg-gray-900 text-white rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="font-bold text-gray-400 mr-2">
            {activeWord.number} {activeWord.direction === 'across' ? 'Across' : 'Down'}
          </span>
          {activeWord.clue}
        </div>
      )}

      {/* Grid */}
      <div className="flex justify-center mb-4" ref={gridRef}>
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
            gridTemplateRows:    `repeat(${size}, ${cellSize}px)`,
            gap:                 '2px',
            backgroundColor:     '#111827',
            padding:             '2px',
            borderRadius:        '8px',
          }}
        >
          {Array(size).fill(0).map((_, row) =>
            Array(size).fill(0).map((_, col) => {
              const key      = `${row},${col}`
              const cell     = cellMap[key]
              const isBlack  = !cell
              const isActive = activeCell?.row === row && activeCell?.col === col
              const inWord   = activeWordCells.has(key)
              const letter   = filled[key] || ''
              const checkSt  = checked[key]  // 'correct' | 'wrong' | undefined

              if (isBlack) {
                return (
                  <div
                    key={key}
                    style={{ width: cellSize, height: cellSize, backgroundColor: '#111827' }}
                  />
                )
              }

              let bg = 'bg-white'
              if (isActive)       bg = 'bg-blue-200'
              else if (inWord)    bg = 'bg-blue-50'
              if (checkSt === 'correct') bg = 'bg-green-100'
              if (checkSt === 'wrong')   bg = 'bg-red-100'

              return (
                <div
                  key={key}
                  onClick={() => handleCellClick(row, col)}
                  className={`relative flex items-center justify-center cursor-pointer ${bg} transition-colors`}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {/* Cell number */}
                  {cell.number && (
                    <span
                      className="absolute top-0 left-0.5 text-gray-600 font-medium leading-none"
                      style={{ fontSize: Math.max(7, cellSize * 0.22) }}
                    >
                      {cell.number}
                    </span>
                  )}
                  {/* Letter */}
                  <span
                    className={`font-bold uppercase leading-none select-none
                      ${checkSt === 'correct' ? 'text-green-700' :
                        checkSt === 'wrong'   ? 'text-red-600'   :
                        isActive              ? 'text-blue-900'  : 'text-gray-900'}
                    `}
                    style={{ fontSize: cellSize * 0.52 }}
                  >
                    {letter}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Controls */}
      {!gameOver && (
        <div className="flex gap-2 justify-center mb-5">
          {gameState === 'playing' && (
            <>
              <button
                onClick={checkAnswers}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Check
              </button>
              <button
                onClick={() => submitScore()}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                Finish
              </button>
              <button
                onClick={revealAll}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Reveal
              </button>
            </>
          )}
          {gameState === 'checking' && (
            <>
              <button
                onClick={() => setGameState('playing')}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={() => submitScore()}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                Submit
              </button>
            </>
          )}
        </div>
      )}

      {/* Game over panel */}
      {gameOver && (
        <div className="bg-gray-50 rounded-2xl p-5 text-center mb-5">
          <p className="font-bold text-gray-900 text-2xl mb-1">{score}%</p>
          <p className="text-sm text-gray-500 mb-1">
            {score === 100 ? '🎉 Perfect!' : score >= 80 ? 'Great effort!' : score >= 50 ? 'Good try!' : 'Keep practising!'}
          </p>
          {revealed && <p className="text-xs text-gray-400 mb-3">Answers revealed</p>}
          <Link
            to="/puzzles"
            className="inline-block mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
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

      {/* On-screen keyboard — only show when a cell is active */}
      {!gameOver && activeCell && (
        <div className="flex flex-col items-center gap-1.5 mb-6">
          {KB_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map(key => {
                const isWide = key === 'ENTER' || key === '⌫'
                return (
                  <button
                    key={key}
                    onMouseDown={e => { e.preventDefault(); handleKey(key) }}
                    className={`
                      ${isWide ? 'px-3 text-xs font-bold' : 'w-9'}
                      h-12 rounded border font-semibold text-sm uppercase transition-colors
                      bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200 active:bg-gray-300
                    `}
                  >
                    {key}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Clue lists */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-bold text-gray-900 mb-2">Across</h3>
          <ol className="space-y-1.5">
            {acrossWords.map(w => (
              <li
                key={w.id}
                onClick={() => {
                  if (gameOver) return
                  setDirection('across')
                  setActiveCell({ row: w.row, col: w.col })
                }}
                className={`cursor-pointer leading-snug rounded px-1 py-0.5 transition-colors
                  ${activeWord?.id === w.id
                    ? 'bg-blue-50 text-blue-900 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span className="font-semibold text-gray-900 mr-1">{w.number}.</span>
                {w.clue}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-2">Down</h3>
          <ol className="space-y-1.5">
            {downWords.map(w => (
              <li
                key={w.id}
                onClick={() => {
                  if (gameOver) return
                  setDirection('down')
                  setActiveCell({ row: w.row, col: w.col })
                }}
                className={`cursor-pointer leading-snug rounded px-1 py-0.5 transition-colors
                  ${activeWord?.id === w.id
                    ? 'bg-blue-50 text-blue-900 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span className="font-semibold text-gray-900 mr-1">{w.number}.</span>
                {w.clue}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

// ── Save result ───────────────────────────────────────────────────────────────

async function saveResult(filled, score, revealed, userId, puzzleId, date) {
  if (!userId) return
  await supabase
    .from('user_puzzle_completions')
    .upsert({
      user_id:     userId,
      puzzle_type: 'crossword',
      puzzle_date: date,
      score,
      completed:   true,
      result:      { filled, revealed },
    }, { onConflict: 'user_id,puzzle_type,puzzle_date' })
}
