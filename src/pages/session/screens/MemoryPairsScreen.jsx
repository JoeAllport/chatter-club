/**
 * MemoryPairsScreen — flip-card matching game.
 *
 * A grid of face-down cards. Half show words, half show definitions.
 * Student taps two cards — if they match, they stay face up.
 * Complete all pairs to finish.
 *
 * data.pairs = [{ word, definition }]  (up to 6 pairs recommended)
 * data.title = optional heading
 *
 * Scoring: correct = finished; onNext(true) always (it's a game, not a test)
 */
import { useState, useEffect, useCallback } from 'react'

// Shuffle helper
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build the card grid: each pair produces a WORD card and a DEFINITION card
function buildCards(pairs) {
  const cards = []
  pairs.forEach((pair, i) => {
    cards.push({ id: `w-${i}`, pairId: i, type: 'word',       text: pair.word })
    cards.push({ id: `d-${i}`, pairId: i, type: 'definition', text: pair.definition })
  })
  return shuffle(cards)
}

export default function MemoryPairsScreen({ data, onNext }) {
  const pairs = data?.pairs || []
  const title = data?.title || 'Memory Pairs'

  const [cards, setCards]       = useState(() => buildCards(pairs))
  const [flipped, setFlipped]   = useState([])   // up to 2 card ids in flight
  const [matched, setMatched]   = useState(new Set())
  const [wrong, setWrong]       = useState([])   // ids of a wrong pair (briefly)
  const [moves, setMoves]       = useState(0)
  const [done, setDone]         = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  const totalPairs = pairs.length

  // When two cards are flipped, check for match
  useEffect(() => {
    if (flipped.length !== 2) return

    const [aId, bId] = flipped
    const a = cards.find(c => c.id === aId)
    const b = cards.find(c => c.id === bId)

    setMoves(m => m + 1)

    if (a.pairId === b.pairId && a.type !== b.type) {
      // Match!
      const newMatched = new Set(matched)
      newMatched.add(aId)
      newMatched.add(bId)
      setMatched(newMatched)
      setFlipped([])

      if (newMatched.size === cards.length) {
        // All matched
        setTimeout(() => {
          setCelebrating(true)
          setTimeout(() => setDone(true), 900)
        }, 300)
      }
    } else {
      // No match — show red briefly, then flip back
      setWrong([aId, bId])
      setTimeout(() => {
        setFlipped([])
        setWrong([])
      }, 900)
    }
  }, [flipped])

  const handleCardTap = useCallback((id) => {
    if (matched.has(id)) return
    if (wrong.length > 0) return
    if (flipped.length === 2) return
    if (flipped.includes(id)) return

    setFlipped(prev => [...prev, id])
  }, [matched, wrong, flipped])

  // ── Done / celebration ────────────────────────────────────────────────────
  if (done) {
    const perfect = moves === totalPairs
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 px-6">
        <div className="text-6xl animate-bounce">{perfect ? '🏆' : '🎉'}</div>
        <p className="text-2xl font-black text-gray-900">All matched!</p>
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-3xl font-black text-indigo-600">{totalPairs}</p>
            <p className="text-xs text-gray-500 mt-1">Pairs</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-black ${perfect ? 'text-green-600' : 'text-amber-500'}`}>{moves}</p>
            <p className="text-xs text-gray-500 mt-1">Moves</p>
          </div>
        </div>
        {perfect && (
          <p className="text-sm text-green-600 font-semibold">Perfect — first try! 🌟</p>
        )}
        <button
          onClick={() => onNext(true)}
          className="w-full max-w-xs py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Continue →
        </button>
      </div>
    )
  }

  // ── Grid ──────────────────────────────────────────────────────────────────
  const matchedCount = matched.size / 2

  // Responsive: 4 pairs → 2×4 grid, 6 pairs → 3×4 grid (word col + def col)
  // Actually we shuffle everything into a single flat grid
  const cols = cards.length <= 8 ? 2 : 3

  return (
    <div className="flex flex-col h-full px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0 px-2">
        <div>
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Memory Pairs</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">{title}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{matchedCount}/{totalPairs} matched</p>
          <p className="text-xs text-gray-300 mt-0.5">{moves} moves</p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center mb-5 flex-shrink-0">
        {Array.from({ length: totalPairs }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < matchedCount ? 'bg-green-500 scale-110' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Card grid */}
      <div
        className="flex-1 grid gap-2.5 content-start"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map(card => {
          const isFlipped  = flipped.includes(card.id) || matched.has(card.id)
          const isMatched  = matched.has(card.id)
          const isWrong    = wrong.includes(card.id)
          const isWord     = card.type === 'word'

          return (
            <button
              key={card.id}
              onClick={() => handleCardTap(card.id)}
              disabled={isMatched || (flipped.length === 2 && !flipped.includes(card.id))}
              className={`
                relative rounded-2xl border-2 p-3 text-center
                transition-all duration-200 active:scale-95
                min-h-[72px] flex items-center justify-center
                ${isMatched
                  ? 'border-green-300 bg-green-50 cursor-default'
                  : isWrong
                    ? 'border-red-300 bg-red-50'
                    : isFlipped
                      ? isWord
                        ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                        : 'border-purple-300 bg-purple-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50 shadow-sm cursor-pointer'
                }
              `}
            >
              {isFlipped ? (
                <span className={`text-xs font-semibold leading-snug ${
                  isMatched
                    ? 'text-green-700'
                    : isWrong
                      ? 'text-red-600'
                      : isWord
                        ? 'text-indigo-800'
                        : 'text-purple-800'
                }`}>
                  {card.text}
                </span>
              ) : (
                <span className="text-xl">
                  {isWord ? '💬' : '📖'}
                </span>
              )}

              {isMatched && (
                <span className="absolute top-1 right-1.5 text-xs text-green-500">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Hint */}
      <p className="text-xs text-center text-gray-300 mt-4 flex-shrink-0">
        Tap two cards to match a word with its meaning
      </p>
    </div>
  )
}
