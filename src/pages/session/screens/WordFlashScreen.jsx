/**
 * WordFlashScreen — vocabulary introduction as an active recall game.
 *
 * Flow:
 *   1. Word appears alone — student tries to recall the meaning
 *   2. Tap "Show definition" → definition + example reveals
 *   3. Student taps "Got it" or "Not sure" — both advance,
 *      but "Not sure" flags the item for review later
 *
 * This is active recall: seeing the word first forces retrieval,
 * then the definition confirms or corrects. More effective than
 * reading definition → word.
 */
import { useState } from 'react'

export default function WordFlashScreen({ data, onNext }) {
  const { word, pos, definition, example, collocations, wordFamily } = data
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider text-center mb-8">
          Do you know this word?
        </p>

        {/* Word card */}
        <div className={`rounded-3xl border-2 p-8 text-center transition-all duration-300 ${
          revealed
            ? 'border-indigo-200 bg-indigo-50'
            : 'border-gray-200 bg-white shadow-sm'
        }`}>
          <p className="text-4xl font-black text-gray-900 mb-1">{word}</p>
          {pos && (
            <p className="text-sm text-gray-400 italic mb-4">{pos}</p>
          )}

          {!revealed && (
            <p className="text-xs text-gray-300 mt-6">Tap to reveal definition</p>
          )}

          {revealed && (
            <div className="mt-4 space-y-3 text-left">
              <p className="text-base text-gray-800 leading-relaxed">{definition}</p>

              {example && (
                <p className="text-sm text-indigo-600 italic border-l-2 border-indigo-200 pl-3">
                  "{example}"
                </p>
              )}

              {collocations && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Key phrases
                  </p>
                  <p className="text-xs text-gray-600">{collocations}</p>
                </div>
              )}

              {wordFamily && (
                <div className="pt-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Word family
                  </p>
                  <p className="text-xs text-gray-600">{wordFamily}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 w-full py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl text-base hover:border-indigo-300 hover:text-indigo-700 active:scale-95 transition-all"
          >
            Show definition
          </button>
        )}
      </div>

      {/* Response buttons — only after reveal */}
      {revealed && (
        <div className="flex gap-3 flex-shrink-0 pt-4">
          <button
            onClick={() => onNext(false, 'unsure')}
            className="flex-1 py-4 border-2 border-red-200 text-red-600 font-semibold rounded-2xl text-sm hover:bg-red-50 active:scale-95 transition-all"
          >
            Not sure
          </button>
          <button
            onClick={() => onNext(true, 'known')}
            className="flex-1 py-4 bg-green-500 text-white font-semibold rounded-2xl text-sm hover:bg-green-600 active:scale-95 transition-all"
          >
            Got it ✓
          </button>
        </div>
      )}
    </div>
  )
}
