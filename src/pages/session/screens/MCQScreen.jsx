/**
 * MCQScreen — single A/B/C/D question, full screen.
 * Shows feedback then calls onNext(isCorrect).
 */
import { useState } from 'react'

export default function MCQScreen({ data, onNext }) {
  const { question, options, answer, explanation } = data
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  function handleSelect(key) {
    if (revealed) return
    setSelected(key)
    setRevealed(true)
    // Auto-advance after feedback delay
    const isCorrect = key === answer
    setTimeout(() => onNext(isCorrect), isCorrect ? 1500 : 2800)
  }

  const isCorrect = selected === answer

  return (
    <div className="flex flex-col h-full px-6 py-8">
      {/* Question */}
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">
          Choose the correct answer
        </p>
        <p className="text-xl font-semibold text-gray-900 leading-snug mb-8">
          {question}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {Object.entries(options || {}).map(([key, text]) => {
            let cls = 'border-gray-200 bg-white text-gray-800'
            if (revealed) {
              if (key === answer)       cls = 'border-green-400 bg-green-50 text-green-900'
              else if (key === selected) cls = 'border-red-300 bg-red-50 text-red-800'
              else                       cls = 'border-gray-100 bg-gray-50 text-gray-400'
            }
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={revealed}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium text-base transition-all active:scale-98 ${cls} ${
                  !revealed ? 'hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer' : 'cursor-default'
                }`}
              >
                <span className="font-bold mr-3 text-sm">{key}</span>{text}
              </button>
            )
          })}
        </div>
      </div>

      {/* Feedback banner */}
      {revealed && (
        <div className={`mt-6 rounded-2xl px-5 py-4 flex-shrink-0 ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`font-bold text-base mb-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '✓ Correct!' : `✗ The answer is ${answer}`}
          </p>
          {explanation && (
            <p className={`text-sm leading-relaxed ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
