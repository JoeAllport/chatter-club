// ── Step 3: Vocab drill (also reused for weekend quiz) ────────────────────────
// 5 questions from season words introduced so far.

import { useState } from 'react'
import QuestionCard from './QuestionCard'

export default function StepVocabDrill({ items, loading, title = 'Vocab drill', onDone }) {
  const [idx,     setIdx]     = useState(0)
  const [correct, setCorrect] = useState(0)

  function handleAnswer(wasCorrect) {
    const newCorrect = correct + (wasCorrect ? 1 : 0)
    setCorrect(newCorrect)

    if (idx + 1 >= items.length) {
      onDone(newCorrect, items.length)
    } else {
      setIdx(i => i + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <p className="text-5xl">🃏</p>
        <p className="text-gray-400 font-medium">No drill questions yet</p>
        <p className="text-gray-500 text-sm">These build up as the season progresses.</p>
        <button onClick={() => onDone(0, 0)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium">
          Continue →
        </button>
      </div>
    )
  }

  const q = items[idx]
  // Normalise content_items field names to what QuestionCard expects
  const normalised = {
    type:         q.task_type,
    prompt:       q.question_text || q.prompt,
    answer:       q.correct_answer || q.answer,
    distractors:  q.options ? JSON.parse(q.options).filter(o => o !== (q.correct_answer || q.answer)) : (q.distractors || []),
    explanation:  q.explanation || '',
  }

  return (
    <div className="flex-1 flex flex-col pt-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-4">{title}</p>
      <QuestionCard
        key={idx}
        question={normalised}
        onAnswer={handleAnswer}
        questionNumber={idx + 1}
        totalQuestions={items.length}
      />
    </div>
  )
}
