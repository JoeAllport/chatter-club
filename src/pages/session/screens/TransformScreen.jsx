/**
 * TransformScreen — single key word transformation.
 * Shows original sentence + key word, student types the missing part.
 */
import { useState, useRef, useEffect } from 'react'

export default function TransformScreen({ data, onNext }) {
  const { original, key, answer, note, itemIndex, totalItems } = data
  const [value, setValue] = useState('')
  const [revealed, setRevealed] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const isCorrect = value.trim().toLowerCase() === answer.toLowerCase()

  function handleSubmit() {
    if (!value.trim() || revealed) return
    setRevealed(true)
    setTimeout(() => onNext(isCorrect), isCorrect ? 1500 : 2800)
  }

  // Extract the note to show the sentence frame (e.g. "She ___ the coat.")
  const sentenceFrame = note || ''

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">
          Key word transformation — {itemIndex + 1} of {totalItems}
        </p>

        {/* Original sentence */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-4">
          <p className="text-base text-gray-700 leading-relaxed">{original}</p>
        </div>

        {/* Key word */}
        <div className="flex justify-center mb-6">
          <span className="text-2xl font-black text-indigo-700 tracking-widest bg-indigo-50 px-6 py-3 rounded-2xl border-2 border-indigo-200">
            {key}
          </span>
        </div>

        {/* Sentence frame (if available) */}
        {sentenceFrame && (
          <p className="text-sm text-gray-400 text-center mb-3 italic">{sentenceFrame}</p>
        )}

        {/* Rule reminder */}
        <p className="text-xs text-gray-400 text-center mb-4">
          Use 2–5 words including the key word. Do not change the key word.
        </p>

        {/* Input */}
        {!revealed && (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Type the missing words…"
            className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-base font-medium text-gray-900 outline-none focus:border-indigo-400 transition-colors text-center"
          />
        )}

        {/* Answer display when revealed */}
        {revealed && (
          <div className={`rounded-2xl px-5 py-4 text-center ${
            isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <p className="text-base font-semibold text-gray-900">
              ✓ <span className="text-indigo-700">{answer}</span>
            </p>
          </div>
        )}
      </div>

      {/* Feedback */}
      {revealed && (
        <div className={`mb-4 rounded-2xl px-5 py-4 ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`font-bold text-base ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '✓ Correct!' : `✗ Model answer: "${answer}"`}
          </p>
          {!isCorrect && value && (
            <p className="text-sm text-red-500 mt-1">You wrote: "{value}"</p>
          )}
        </div>
      )}

      {!revealed && (
        <div className="flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base disabled:opacity-40 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Check
          </button>
        </div>
      )}
    </div>
  )
}
