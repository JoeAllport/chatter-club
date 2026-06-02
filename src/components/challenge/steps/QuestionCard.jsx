// ── Shared question card ──────────────────────────────────────────────────────
// Used by passage comprehension, vocab drill, wild card, weekend quiz.
// MCQ: select then Check. True/False: instant reveal.

import { useState } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuestionCard({ question, onAnswer, questionNumber, totalQuestions }) {
  // question shape (from content_items):
  //   task_type: 'mcq' | 'true_false'
  //   prompt / question_text
  //   correct_answer
  //   distractors: string[]
  //   explanation
  // OR direct shape from AI-generated data:
  //   type: 'mcq' | 'true_false'
  //   prompt, answer, distractors, explanation

  const isTF      = (question.task_type || question.type) === 'true_false'
  const promptText = question.prompt || question.question_text
  const correctAns = question.correct_answer || question.answer
  const explanation = question.explanation || ''

  // Build option list once on mount
  const [options] = useState(() => {
    if (isTF) return ['True', 'False']
    const distractors = question.distractors || []
    return shuffle([correctAns, ...distractors])
  })

  const [selected,  setSelected]  = useState(null)   // the option text chosen
  const [revealed,  setRevealed]  = useState(false)

  function handleSelect(opt) {
    if (revealed) return
    if (isTF) {
      // Instant reveal for T/F
      setSelected(opt)
      setRevealed(true)
      setTimeout(() => onAnswer(opt === correctAns), 900)
    } else {
      setSelected(opt)
    }
  }

  function handleCheck() {
    if (!selected || revealed) return
    setRevealed(true)
    setTimeout(() => onAnswer(selected === correctAns), 1200)
  }

  function optionStyle(opt) {
    const base = 'w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all '
    if (!revealed) {
      return base + (
        selected === opt
          ? 'border-indigo-500 bg-indigo-900/40 text-white'
          : 'border-gray-700 bg-gray-800/60 text-gray-200 hover:border-gray-600 hover:bg-gray-800'
      )
    }
    // Revealed
    if (opt === correctAns) {
      return base + 'border-green-500 bg-green-900/30 text-green-200'
    }
    if (opt === selected && opt !== correctAns) {
      return base + 'border-red-500 bg-red-900/30 text-red-200'
    }
    return base + 'border-gray-800 bg-gray-900/40 text-gray-500'
  }

  return (
    <div className="flex-1 flex flex-col pt-6">
      {/* Counter */}
      {totalQuestions > 1 && (
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 text-center">
          Question {questionNumber} of {totalQuestions}
        </p>
      )}

      {/* Prompt */}
      <div className="mb-6">
        <p className="text-white text-lg font-medium leading-relaxed">{promptText}</p>
      </div>

      {/* Options */}
      <div className={`space-y-2.5 ${isTF ? 'grid grid-cols-2 gap-3 space-y-0' : ''}`}>
        {options.map(opt => (
          <button key={opt} onClick={() => handleSelect(opt)} className={optionStyle(opt)}>
            <div className="flex items-center gap-3">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                revealed && opt === correctAns ? 'border-green-500 bg-green-500 text-white' :
                revealed && opt === selected && opt !== correctAns ? 'border-red-500 bg-red-500 text-white' :
                selected === opt && !revealed ? 'border-indigo-500 bg-indigo-500 text-white' :
                'border-gray-600'
              }`}>
                {revealed && opt === correctAns ? '✓' :
                 revealed && opt === selected && opt !== correctAns ? '✗' :
                 selected === opt && !revealed ? '●' : ''}
              </span>
              <span>{opt}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Explanation after reveal */}
      {revealed && explanation && (
        <div className="mt-4 bg-gray-800/60 border border-gray-700 rounded-xl p-3">
          <p className="text-gray-300 text-sm">{explanation}</p>
        </div>
      )}

      {/* Check button (MCQ only, not T/F) */}
      {!isTF && !revealed && (
        <button
          onClick={handleCheck}
          disabled={!selected}
          className="mt-6 w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700"
        >
          Check answer
        </button>
      )}
    </div>
  )
}
