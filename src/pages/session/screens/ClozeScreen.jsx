/**
 * ClozeScreen — single gap from an open_cloze or gap_fill block.
 * Shows context sentence with a blank, student types or picks from bank.
 */
import { useState, useRef, useEffect } from 'react'

export default function ClozeScreen({ data, onNext }) {
  const { contextBefore, contextAfter, answer, gapIndex, totalGaps, bank, useBank } = data
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!useBank && inputRef.current) inputRef.current.focus()
  }, [useBank])

  const userAnswer = useBank ? selected : value
  const isCorrect = userAnswer?.trim().toLowerCase() === answer.toLowerCase()

  function handleSubmit() {
    if (!userAnswer?.trim() || revealed) return
    setRevealed(true)
    setTimeout(() => onNext(isCorrect), isCorrect ? 1500 : 2800)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">
          Complete the sentence — {gapIndex + 1} of {totalGaps}
        </p>

        {/* Sentence with gap */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-lg leading-relaxed text-gray-800">
          <span>{contextBefore} </span>
          <span className={`inline-block min-w-24 border-b-2 text-center font-semibold mx-1 px-2 ${
            revealed
              ? isCorrect
                ? 'border-green-400 text-green-700'
                : 'border-red-400 text-red-700'
              : 'border-indigo-400 text-indigo-600'
          }`}>
            {revealed ? (isCorrect ? userAnswer : answer) : (userAnswer || '      ')}
          </span>
          <span> {contextAfter}</span>
        </div>

        {/* Input — typed or word bank */}
        {!revealed && (
          useBank ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {(bank || []).map(word => (
                <button
                  key={word}
                  onClick={() => setSelected(selected === word ? null : word)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                    selected === word
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer…"
              className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-base font-medium text-gray-900 outline-none focus:border-indigo-400 transition-colors text-center"
            />
          )
        )}
      </div>

      {/* Feedback */}
      {revealed && (
        <div className={`mb-4 rounded-2xl px-5 py-4 ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`font-bold text-base ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '✓ Correct!' : `✗ The answer is "${answer}"`}
          </p>
          {!isCorrect && userAnswer && (
            <p className="text-sm text-red-500 mt-1">You answered: "{userAnswer}"</p>
          )}
        </div>
      )}

      {/* Check button */}
      {!revealed && (
        <div className="flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!userAnswer?.trim()}
            className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base disabled:opacity-40 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Check
          </button>
        </div>
      )}
    </div>
  )
}
