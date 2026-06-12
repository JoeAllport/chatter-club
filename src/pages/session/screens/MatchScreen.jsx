/**
 * MatchScreen — tap a term, then tap its definition.
 * Pairs disappear when correctly matched. Wrong taps flash red.
 */
import { useState } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MatchScreen({ data, onNext }) {
  const { pairs, distractors = [] } = data
  const [terms] = useState(() => shuffle(pairs.map(p => p.term)))
  const [defs]  = useState(() => shuffle([
    ...pairs.map(p => p.definition),
    ...distractors.map(d => d.definition),
  ]))

  const [activeTerm, setActiveTerm] = useState(null)
  const [matched, setMatched]       = useState({}) // term → def
  const [wrong, setWrong]           = useState(null) // { term, def }
  const [done, setDone]             = useState(false)

  const matchedTerms = new Set(Object.keys(matched))
  const matchedDefs  = new Set(Object.values(matched))

  function handleTerm(term) {
    if (matchedTerms.has(term)) return
    setActiveTerm(activeTerm === term ? null : term)
    setWrong(null)
  }

  function handleDef(def) {
    if (!activeTerm || matchedDefs.has(def)) return
    const correctPair = pairs.find(p => p.term === activeTerm)

    if (correctPair?.definition === def) {
      // Correct match
      const next = { ...matched, [activeTerm]: def }
      setMatched(next)
      setActiveTerm(null)
      setWrong(null)
      // Check if all pairs (not distractors) are matched
      if (Object.keys(next).length === pairs.length) {
        setDone(true)
        const score = 100 // all matched
        setTimeout(() => onNext(true, score), 1200)
      }
    } else {
      // Wrong
      setWrong({ term: activeTerm, def })
      setActiveTerm(null)
      setTimeout(() => setWrong(null), 800)
    }
  }

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex-1 flex flex-col">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-6">
          Match each term to its definition
        </p>

        {done && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-2xl font-bold text-gray-900">All matched!</p>
          </div>
        )}

        {!done && (
          <div className="grid grid-cols-2 gap-3 flex-1">
            {/* Terms column */}
            <div className="space-y-2">
              {terms.map(term => {
                const isMatched = matchedTerms.has(term)
                const isActive  = activeTerm === term
                const isWrong   = wrong?.term === term
                return (
                  <button
                    key={term}
                    onClick={() => handleTerm(term)}
                    disabled={isMatched}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      isMatched
                        ? 'border-green-200 bg-green-50 text-green-700 opacity-50'
                        : isWrong
                          ? 'border-red-400 bg-red-50 text-red-700 animate-pulse'
                          : isActive
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-md'
                            : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300'
                    }`}
                  >
                    {isMatched ? '✓ ' : ''}{term}
                  </button>
                )
              })}
            </div>

            {/* Definitions column */}
            <div className="space-y-2">
              {defs.map(def => {
                const isMatched  = matchedDefs.has(def)
                const isWrong    = wrong?.def === def
                const isDistract = !pairs.some(p => p.definition === def)
                return (
                  <button
                    key={def}
                    onClick={() => handleDef(def)}
                    disabled={isMatched || !activeTerm}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-xs font-medium transition-all leading-snug ${
                      isMatched
                        ? 'border-green-200 bg-green-50 text-green-700 opacity-50'
                        : isWrong
                          ? 'border-red-400 bg-red-50 text-red-700 animate-pulse'
                          : activeTerm
                            ? 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300 cursor-pointer'
                            : 'border-gray-100 bg-gray-50 text-gray-500 cursor-default'
                    }`}
                  >
                    {def}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      {!done && activeTerm && (
        <p className="text-xs text-indigo-500 text-center mt-4 flex-shrink-0">
          Now tap the definition for <strong>{activeTerm}</strong>
        </p>
      )}
      {!done && !activeTerm && (
        <p className="text-xs text-gray-400 text-center mt-4 flex-shrink-0">
          Tap a term to start matching
        </p>
      )}
    </div>
  )
}
