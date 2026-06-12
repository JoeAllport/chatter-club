/**
 * WordFormScreen — single word formation line.
 * Shows the sentence with a gap, root word in capitals, student types the form.
 */
import { useState, useRef, useEffect } from 'react'

export default function WordFormScreen({ data, onNext }) {
  const { text, root, answer, lineIndex, totalLines } = data
  const [value, setValue] = useState('')
  const [revealed, setRevealed] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const isCorrect = value.trim().toLowerCase() === answer.toLowerCase()
  const [before, after] = (text || '').split('___')

  function handleSubmit() {
    if (!value.trim() || revealed) return
    setRevealed(true)
    setTimeout(() => onNext(isCorrect), isCorrect ? 1500 : 2800)
  }

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">
          Word formation — {lineIndex + 1} of {totalLines}
        </p>

        {/* Root word prompt */}
        <div className="flex justify-center mb-6">
          <span className="text-3xl font-black text-gray-900 tracking-widest bg-gray-100 px-6 py-3 rounded-2xl">
            {root}
          </span>
        </div>

        {/* Sentence */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-lg leading-relaxed text-gray-800 text-center">
          {before}
          <span className={`inline-block min-w-24 border-b-2 text-center font-semibold mx-1 px-2 ${
            revealed
              ? isCorrect ? 'border-green-400 text-green-700' : 'border-red-400 text-red-700'
              : 'border-indigo-400 text-indigo-600'
          }`}>
            {revealed ? (isCorrect ? value : answer) : (value || '        ')}
          </span>
          {after}
        </div>

        {/* Input */}
        {!revealed && (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={`Form of ${root}…`}
            className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-base font-medium text-gray-900 outline-none focus:border-indigo-400 transition-colors text-center"
          />
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
