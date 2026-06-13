/**
 * DistractorSpotterScreen — Part 5 distractor identification game.
 *
 * Shows a short paragraph + one MCQ question with 4 options.
 * Student taps the DISTRACTOR — the option that is "true but wrong"
 * (appears in or near the text but doesn't actually answer the question).
 *
 * A separate mode: HighlightTask — student uses colour highlighting to
 * mark where in the paragraph each question's answer is located.
 * This is the guided version; in exam mode, highlighting is a free tool.
 *
 * TWO MODES controlled by data.mode:
 *   'distractor' — tap the distractor option (default)
 *   'highlight'  — highlight text spans in up to 4 colours, one per question
 *
 * ── Distractor mode data.items ──
 * {
 *   paragraph: "The company's profits rose sharply in 2023...",
 *   question:  "What does the writer suggest about the company's future?",
 *   question_type: "inference",   // detail | inference | attitude | vocabulary
 *   options: [
 *     { text: "It will expand overseas.",      correct: true,  is_distractor: false },
 *     { text: "Its profits rose in 2023.",     correct: false, is_distractor: true,
 *       distractor_reason: "True in the text but answers 'what happened', not 'what does the writer suggest about the future'" },
 *     { text: "It will close several branches.", correct: false, is_distractor: false },
 *     { text: "Its CEO is optimistic.",          correct: false, is_distractor: false },
 *   ],
 *   answer_location: "...analysts predict significant international growth..." // the exact phrase that answers it
 * }
 *
 * ── Highlight mode data ──
 * {
 *   paragraph: "...",
 *   questions: [
 *     { text: "Where does the writer mention price?",  colour: "yellow" },
 *     { text: "Where is the writer's attitude shown?", colour: "blue"   },
 *     { text: "Which phrase shows contrast?",          colour: "green"  },
 *     { text: "Where is the main argument stated?",    colour: "pink"   },
 *   ],
 *   // No auto-marking in highlight mode — it's a guided annotation task
 *   // onNext is called after student confirms they've highlighted all four
 * }
 *
 * onNext(correct) — distractor mode: ≥ 60% | highlight mode: always true
 */

import { useState, useRef, useCallback } from 'react'

// ── Colour palette for highlight mode ────────────────────────────────────────

const HIGHLIGHT_COLOURS = [
  { id: 'yellow', label: 'Q1', bg: 'bg-yellow-200',  text: 'text-yellow-900',  border: 'border-yellow-400',  mark: '#fef08a' },
  { id: 'blue',   label: 'Q2', bg: 'bg-blue-200',    text: 'text-blue-900',    border: 'border-blue-400',    mark: '#bfdbfe' },
  { id: 'green',  label: 'Q3', bg: 'bg-green-200',   text: 'text-green-900',   border: 'border-green-400',   mark: '#bbf7d0' },
  { id: 'pink',   label: 'Q4', bg: 'bg-pink-200',    text: 'text-pink-900',    border: 'border-pink-400',    mark: '#fbcfe8' },
]

const QUESTION_TYPE_COLOURS = {
  detail:     'bg-blue-50 text-blue-700 border-blue-200',
  inference:  'bg-purple-50 text-purple-700 border-purple-200',
  attitude:   'bg-amber-50 text-amber-700 border-amber-200',
  vocabulary: 'bg-teal-50 text-teal-700 border-teal-200',
}

// ── Highlight task sub-component ──────────────────────────────────────────────

function HighlightTask({ data, onNext }) {
  const { paragraph, questions = [] } = data
  const [activeColour, setActiveColour] = useState(HIGHLIGHT_COLOURS[0].id)
  const [highlights, setHighlights]     = useState([]) // { start, end, colour }
  const textRef = useRef(null)

  // Simple word-level highlighting via mouseup / touchend selection
  const handleSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const range = selection.getRangeAt(0)
    const text   = range.toString().trim()
    if (!text) return

    setHighlights(prev => [...prev, { text, colour: activeColour }])
    selection.removeAllRanges()
  }, [activeColour])

  // Render paragraph with highlights applied (simple mark overlay)
  function renderParagraph() {
    if (!highlights.length) return paragraph

    // Build a rendered version with <mark> spans
    // This is a simplified renderer — works word by word
    let result = paragraph
    const applied = []

    highlights.forEach(h => {
      const colour = HIGHLIGHT_COLOURS.find(c => c.id === h.colour)
      if (!colour) return
      applied.push({ text: h.text, mark: colour.mark })
    })

    return result
  }

  const allHighlighted = highlights.length >= questions.length

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-4">

      {/* Header */}
      <div className="flex-shrink-0">
        <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Highlight Task</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Select a colour, then select text in the paragraph to highlight it
        </p>
      </div>

      {/* Colour + question selectors */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {questions.map((q, i) => {
          const colour = HIGHLIGHT_COLOURS[i]
          const isActive = activeColour === colour?.id
          const hasHighlight = highlights.some(h => h.colour === colour?.id)
          return (
            <button
              key={i}
              onClick={() => colour && setActiveColour(colour.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                isActive
                  ? `${colour.border} ${colour.bg}`
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-black ${colour?.bg} ${colour?.text}`}>
                {i + 1}
              </span>
              <span className="text-xs text-gray-700 flex-1">{q.text}</span>
              {hasHighlight && <span className="text-green-500 text-xs">✓</span>}
            </button>
          )
        })}
      </div>

      {/* Paragraph — selectable */}
      <div
        ref={textRef}
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
        className="flex-1 rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 text-sm text-gray-800 leading-relaxed overflow-y-auto cursor-text select-text"
      >
        {paragraph}
      </div>

      {/* Highlighted selections list */}
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5 flex-shrink-0">
          {highlights.map((h, i) => {
            const colour = HIGHLIGHT_COLOURS.find(c => c.id === h.colour)
            return (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-lg font-medium ${colour?.bg} ${colour?.text} flex items-center gap-1`}
              >
                {h.text.length > 20 ? h.text.slice(0, 20) + '…' : h.text}
                <button
                  onClick={() => setHighlights(prev => prev.filter((_, j) => j !== i))}
                  className="opacity-50 hover:opacity-100 ml-0.5"
                >✕</button>
              </span>
            )
          })}
        </div>
      )}

      <button
        onClick={() => onNext(true)}
        disabled={!allHighlighted}
        className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl text-base disabled:opacity-40 hover:bg-rose-600 active:scale-95 transition-all flex-shrink-0"
      >
        {allHighlighted ? 'Done →' : `Highlight all ${questions.length} questions first`}
      </button>
    </div>
  )
}

// ── Distractor spotter sub-component ─────────────────────────────────────────

function DistractorSpotter({ items, title, onNext }) {
  const [idx, setIdx]           = useState(0)
  const [selected, setSelected] = useState(null)
  const [results, setResults]   = useState([])
  const [done, setDone]         = useState(false)

  const current = items[idx]

  function handleTap(option) {
    if (selected) return
    setSelected(option)

    setTimeout(() => {
      const correct = option.is_distractor
      const newResults = [...results, { correct, item: current }]
      setResults(newResults)
      if (idx >= items.length - 1) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
        setSelected(null)
      }
    }, option.is_distractor ? 1000 : 2200)
  }

  // Results
  if (done) {
    const correct = results.filter(r => r.correct).length
    const pct = Math.round((correct / items.length) * 100)
    return (
      <div className="flex flex-col h-full px-6 py-8 items-center justify-center gap-6">
        <div className="text-5xl">{pct >= 90 ? '🎯' : pct >= 70 ? '💪' : '📚'}</div>
        <p className="text-2xl font-black text-gray-900">Distractor Spotter done!</p>
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-3xl font-black text-green-600">{correct}</p>
            <p className="text-xs text-gray-500 mt-1">Found</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-red-400">{items.length - correct}</p>
            <p className="text-xs text-gray-500 mt-1">Missed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-rose-600">{pct}%</p>
            <p className="text-xs text-gray-500 mt-1">Score</p>
          </div>
        </div>
        {results.some(r => !r.correct) && (
          <div className="w-full space-y-2 max-h-52 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review</p>
            {results.map((r, i) => !r.correct && (
              <div key={i} className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-xs">
                <p className="text-gray-500 italic mb-1">"{r.item.question}"</p>
                <p className="text-red-700 font-semibold">
                  Distractor: {r.item.options.find(o => o.is_distractor)?.text}
                </p>
                <p className="text-gray-400 mt-1">
                  {r.item.options.find(o => o.is_distractor)?.distractor_reason}
                </p>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => onNext(pct >= 60)}
          className="w-full py-4 bg-rose-500 text-white font-semibold rounded-2xl text-base hover:bg-rose-600 active:scale-95 transition-all"
        >
          Continue →
        </button>
      </div>
    )
  }

  if (!current) return null

  const qtColour = QUESTION_TYPE_COLOURS[current.question_type] || QUESTION_TYPE_COLOURS.detail

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{idx + 1} of {items.length}</p>
        </div>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${
              i < idx ? results[i]?.correct ? 'bg-green-400' : 'bg-red-300'
              : i === idx ? 'bg-rose-400' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Paragraph */}
      <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 px-5 py-4 flex-shrink-0 max-h-36 overflow-y-auto">
        <p className="text-sm text-gray-700 leading-relaxed">{current.paragraph}</p>
      </div>

      {/* Question */}
      <div className="flex-shrink-0">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold mb-2 ${qtColour}`}>
          {current.question_type && current.question_type.charAt(0).toUpperCase() + current.question_type.slice(1)}
        </div>
        <p className="text-sm font-bold text-gray-800 leading-snug">{current.question}</p>
        <p className="text-xs text-rose-400 mt-1 font-semibold">Tap the DISTRACTOR — true in the text but doesn't answer the question</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 flex-1">
        {current.options.map((option, i) => {
          const isSelected    = selected?.text === option.text
          const isDistractor  = option.is_distractor

          let cls = 'border-gray-200 bg-white text-gray-700 hover:border-rose-300'
          if (selected) {
            if (isDistractor)                cls = 'border-green-400 bg-green-50 text-green-800'
            else if (isSelected)             cls = 'border-red-300 bg-red-50 text-red-700'
            else if (option.correct)         cls = 'border-blue-200 bg-blue-50 text-blue-700'
            else                             cls = 'border-gray-100 bg-gray-50 text-gray-300'
          }

          return (
            <button
              key={i}
              onClick={() => handleTap(option)}
              disabled={!!selected}
              className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-medium text-left transition-all active:scale-[0.98] ${cls}`}
            >
              <span className="text-xs font-bold mr-2 opacity-40">{String.fromCharCode(65 + i)}</span>
              {option.text}
              {selected && isDistractor && (
                <span className="float-right text-green-500 font-bold text-xs">✓ Distractor</span>
              )}
              {selected && option.correct && (
                <span className="float-right text-blue-500 font-bold text-xs">← Correct answer</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {selected && (
        <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed flex-shrink-0 ${
          selected.is_distractor
            ? 'bg-green-50 border border-green-100 text-green-800'
            : 'bg-red-50 border border-red-100 text-red-700'
        }`}>
          {selected.is_distractor
            ? `✓ ${selected.distractor_reason || 'Correct — this option appears in the text but does not answer the question.'}`
            : `✗ That's the distractor — look for an option that's in the text but answers a different question.`
          }
          {selected.is_distractor && current.answer_location && (
            <p className="mt-1.5 text-gray-500">
              The correct answer is found here: <span className="italic">"{current.answer_location}"</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function DistractorSpotterScreen({ data, onNext }) {
  const mode = data.mode || 'distractor'

  if (mode === 'highlight') {
    return <HighlightTask data={data} onNext={onNext} />
  }

  return (
    <DistractorSpotter
      items={data.items || []}
      title={data.title || 'Distractor Spotter'}
      onNext={onNext}
    />
  )
}
