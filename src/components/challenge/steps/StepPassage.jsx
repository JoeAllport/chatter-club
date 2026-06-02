// ── Step 2: Mini passage + comprehension ──────────────────────────────────────
// Read the passage, then answer 2 questions.

import { useState } from 'react'
import QuestionCard from './QuestionCard'

const PHASES = ['read', 'questions']

export default function StepPassage({ challenge, questions, onDone }) {
  const [phase,        setPhase]        = useState('read')
  const [questionIdx,  setQuestionIdx]  = useState(0)
  const [correct,      setCorrect]      = useState(0)

  const passageText = challenge?.passage_text
  const qs = questions || []
  const total = qs.length || 2

  function handleStartQuestions() {
    setPhase('questions')
  }

  function handleAnswer(wasCorrect) {
    const newCorrect = correct + (wasCorrect ? 1 : 0)
    setCorrect(newCorrect)

    if (questionIdx + 1 >= qs.length || questionIdx + 1 >= 2) {
      // Done — each correct answer = 1 point
      onDone(newCorrect, Math.min(qs.length, 2))
    } else {
      setQuestionIdx(i => i + 1)
    }
  }

  // If no passage text and no questions, skip straight through
  if (!passageText && qs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <p className="text-gray-500 text-sm">No passage for today.</p>
        <button onClick={() => onDone(0, 0)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl">
          Continue →
        </button>
      </div>
    )
  }

  if (phase === 'read') {
    return (
      <div className="flex-1 flex flex-col pt-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-6">Mini passage</p>

        {/* Passage card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex-1 mb-6 overflow-y-auto">
          {challenge?.title && (
            <h2 className="text-white font-bold text-xl mb-4 leading-tight">{challenge.title}</h2>
          )}
          <p className="text-gray-200 leading-relaxed text-base">
            {passageText || 'Read the passage and then answer the comprehension questions.'}
          </p>
        </div>

        <button
          onClick={handleStartQuestions}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg active:scale-95 transition-all"
        >
          I've read it →
        </button>
      </div>
    )
  }

  // Phase: questions
  if (qs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <p className="text-gray-500 text-sm">No comprehension questions yet.</p>
        <button onClick={() => onDone(0, 0)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl">
          Continue →
        </button>
      </div>
    )
  }

  const currentQ = qs[questionIdx]

  return (
    <QuestionCard
      key={questionIdx}
      question={currentQ}
      onAnswer={handleAnswer}
      questionNumber={questionIdx + 1}
      totalQuestions={Math.min(qs.length, 2)}
    />
  )
}
