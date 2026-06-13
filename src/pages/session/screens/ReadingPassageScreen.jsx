/**
 * ReadingPassageScreen — Exam UI for Reading Parts 5, 6, and 7.
 *
 * Three view modes (toggled by the student):
 *   'focus'   — one paragraph at a time, questions below, arrow navigation
 *   'panel'   — full text scrolls left, questions fixed right (or bottom on mobile)
 *   'compare' — student selects 2–3 sections to stack side by side (Part 7 only)
 *               In prep exercises, compare pairs are pre-selected by the teacher.
 *
 * Free highlighting:
 *   Four colour swatches available at all times in exam mode.
 *   Tap a colour to activate it, then tap+drag to select text.
 *   Highlights persist across view mode changes.
 *   Tap an existing highlight to remove it.
 *
 * Part-specific interaction:
 *   Part 5 — MCQ: tap A/B/C/D for each question
 *   Part 6 — Sentence insertion: tap a sentence chip from the bank to fill each gap
 *   Part 7 — Matching: tap a section label to answer each question
 *
 * data = {
 *   part:         5 | 6 | 7,
 *   title:        "Reading Part 5",
 *   instruction:  "Read the text and answer questions 31–36.",
 *   sections: [                        // Part 5/6: usually one section; Part 7: multiple
 *     {
 *       label:     "Section A",        // Part 7 label; Part 5/6 can omit
 *       heading:   "The High Street",  // optional
 *       text:      "...",              // paragraph text
 *     }
 *   ],
 *   questions: [
 *     // Part 5 MCQ:
 *     { id: "q1", text: "What does the writer suggest about...", type: "inference",
 *       options: [
 *         { label: "A", text: "...", correct: true  },
 *         { label: "B", text: "...", correct: false },
 *         { label: "C", text: "...", correct: false },
 *         { label: "D", text: "...", correct: false },
 *       ],
 *       section_index: 0,              // which section this question refers to
 *       answer_location: "..."         // text snippet showing where answer is
 *     },
 *     // Part 6 sentence insertion:
 *     { id: "g1", gap_index: 0, section_index: 0 },  // gap in the text
 *     // Part 7 matching:
 *     { id: "m1", text: "Which section mentions a change caused by technology?",
 *       correct_section: "B" }
 *   ],
 *   // Part 6 only:
 *   sentence_bank: [
 *     { id: "s1", text: "This had a significant impact on local businesses.", correct_gap: 0 },
 *     { id: "s2", text: "However, some retailers adapted quickly.",             correct_gap: 1 },
 *     { id: "s3", text: "The results were mixed at best.",                      correct_gap: null }, // decoy
 *   ],
 *   // Part 7 compare mode (prep-selected pairs):
 *   compare_preset: ["A", "B"],        // labels of sections to compare
 * }
 *
 * onNext(correct) — correct if ≥ 60% of questions answered correctly
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

const HIGHLIGHT_COLOURS = [
  { id: 'yellow', swatch: 'bg-yellow-300', mark: 'bg-yellow-200 text-yellow-900' },
  { id: 'blue',   swatch: 'bg-blue-300',   mark: 'bg-blue-200 text-blue-900'     },
  { id: 'green',  swatch: 'bg-green-300',  mark: 'bg-green-200 text-green-900'   },
  { id: 'pink',   swatch: 'bg-pink-300',   mark: 'bg-pink-200 text-pink-900'     },
]

const VIEW_MODES = [
  { id: 'focus', icon: '▣',  label: 'Focus'   },
  { id: 'panel', icon: '⊟',  label: 'Panel'   },
  { id: 'compare', icon: '⊞', label: 'Compare' },
]

const QUESTION_TYPE_COLOURS = {
  detail:     'text-blue-600',
  inference:  'text-purple-600',
  attitude:   'text-amber-600',
  vocabulary: 'text-teal-600',
}

// ── Highlight engine ──────────────────────────────────────────────────────────
// Stores highlights as { id, sectionIdx, text, colour }
// Applied as inline <mark> wraps — simple text-match approach

function applyHighlights(rawText, highlights, sectionIdx) {
  if (!highlights.length) return rawText

  const relevant = highlights.filter(h => h.sectionIdx === sectionIdx)
  if (!relevant.length) return rawText

  // Build segments by scanning for highlight matches
  let result = [rawText]
  relevant.forEach(h => {
    const next = []
    result.forEach(segment => {
      if (typeof segment !== 'string') { next.push(segment); return }
      const parts = segment.split(h.text)
      parts.forEach((part, i) => {
        if (part) next.push(part)
        if (i < parts.length - 1) {
          const colour = HIGHLIGHT_COLOURS.find(c => c.id === h.colour)
          next.push(
            <mark
              key={h.id}
              className={`${colour?.mark} rounded px-0.5 cursor-pointer not-italic`}
              onClick={() => {}}  // handled by parent removeHighlight
              title="Tap to remove highlight"
            >
              {h.text}
            </mark>
          )
        }
      })
    })
    result = next
  })
  return result
}

// ── Part 6 gap renderer ───────────────────────────────────────────────────────
// Replaces [GAP_N] markers in text with interactive gap slots

function renderPart6Text(text, answers, onGapClick, submitted) {
  const parts = text.split(/\[GAP_(\d+)\]/)
  return parts.map((part, i) => {
    if (i % 2 === 0) return <span key={i}>{part}</span>
    const gapIndex = parseInt(part)
    const placed   = answers[gapIndex]
    return (
      <button
        key={i}
        onClick={() => !submitted && onGapClick(gapIndex)}
        className={`inline-flex items-center mx-1 px-2 py-0.5 rounded border-b-2 text-sm font-semibold transition-all ${
          submitted
            ? placed?.correct_gap === gapIndex
              ? 'border-green-400 bg-green-50 text-green-700'
              : placed
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-gray-300 bg-gray-50 text-gray-400'
            : placed
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : 'border-dashed border-gray-300 bg-transparent text-gray-300 min-w-[80px]'
        }`}
      >
        {placed ? placed.text : `Gap ${gapIndex + 1}`}
        {submitted && placed && placed.correct_gap !== gapIndex && (
          <span className="ml-1 text-red-400">✗</span>
        )}
      </button>
    )
  })
}

// ── Section text component ────────────────────────────────────────────────────

function SectionText({ section, sectionIdx, part, answers, highlights, activeHighlight,
                       onGapClick, onTextSelect, submitted }) {
  const ref = useRef(null)

  function handleMouseUp() {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !activeHighlight) return
    const text = sel.toString().trim()
    if (text.length < 2) return
    onTextSelect(sectionIdx, text)
    sel.removeAllRanges()
  }

  const content = part === 6
    ? renderPart6Text(section.text, answers, onGapClick, submitted)
    : applyHighlights(section.text, highlights, sectionIdx)

  return (
    <div
      ref={ref}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      className="text-sm text-gray-700 leading-[1.85] select-text cursor-text"
    >
      {section.heading && (
        <p className="font-bold text-gray-900 text-base mb-2">{section.heading}</p>
      )}
      {content}
    </div>
  )
}

// ── Question panel — Part 5 MCQ ───────────────────────────────────────────────

function Part5Questions({ questions, answers, onAnswer, submitted, filterSection }) {
  const filtered = filterSection !== undefined
    ? questions.filter(q => q.section_index === filterSection || q.section_index === undefined)
    : questions

  if (!filtered.length) return (
    <p className="text-xs text-gray-400 italic">No questions for this section.</p>
  )

  return (
    <div className="flex flex-col gap-5">
      {filtered.map((q, qi) => {
        const answered = answers[q.id]
        const typeColour = QUESTION_TYPE_COLOURS[q.type] || 'text-gray-500'

        return (
          <div key={q.id} className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              {q.type && (
                <span className={`text-xs font-bold uppercase tracking-wide flex-shrink-0 mt-0.5 ${typeColour}`}>
                  {q.type}
                </span>
              )}
              <p className="text-sm font-semibold text-gray-800 leading-snug">{q.text}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {q.options?.map(opt => {
                const isSelected = answered?.label === opt.label
                const isCorrect  = opt.correct

                let cls = 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                if (submitted) {
                  if (isCorrect)        cls = 'border-green-400 bg-green-50 text-green-800'
                  else if (isSelected)  cls = 'border-red-300 bg-red-50 text-red-700'
                  else                  cls = 'border-gray-100 bg-gray-50 text-gray-400'
                } else if (isSelected) {
                  cls = 'border-indigo-400 bg-indigo-50 text-indigo-800'
                }

                return (
                  <button
                    key={opt.label}
                    onClick={() => !submitted && onAnswer(q.id, opt)}
                    className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm text-left transition-all active:scale-[0.99] ${cls}`}
                  >
                    <span className="font-black flex-shrink-0 w-4">{opt.label}</span>
                    <span className="leading-snug">{opt.text}</span>
                    {submitted && isCorrect  && <span className="ml-auto text-green-500 flex-shrink-0">✓</span>}
                    {submitted && isSelected && !isCorrect && <span className="ml-auto text-red-400 flex-shrink-0">✗</span>}
                  </button>
                )
              })}
            </div>
            {submitted && answered && !answered.correct && q.answer_location && (
              <p className="text-xs text-gray-400 italic px-1">
                📍 Answer: "{q.answer_location}"
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Question panel — Part 7 matching ─────────────────────────────────────────

function Part7Questions({ questions, sections, answers, onAnswer, submitted }) {
  return (
    <div className="flex flex-col gap-3">
      {questions.map(q => {
        const answered = answers[q.id]
        const isCorrect = submitted && answered === q.correct_section

        return (
          <div key={q.id} className={`rounded-xl border-2 p-3 transition-all ${
            submitted
              ? isCorrect ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'
              : answered  ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'
          }`}>
            <p className="text-xs font-semibold text-gray-700 leading-snug mb-2">{q.text}</p>
            <div className="flex flex-wrap gap-1.5">
              {sections.map(s => {
                const label = s.label
                const isSelected = answered === label
                const isCorrSec  = label === q.correct_section

                let cls = 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                if (submitted) {
                  if (isCorrSec)        cls = 'border-green-400 bg-green-100 text-green-800 font-bold'
                  else if (isSelected)  cls = 'border-red-300 bg-red-100 text-red-700'
                  else                  cls = 'border-gray-100 bg-gray-50 text-gray-300'
                } else if (isSelected) {
                  cls = 'border-indigo-400 bg-indigo-50 text-indigo-700 font-bold'
                }

                return (
                  <button
                    key={label}
                    onClick={() => !submitted && onAnswer(q.id, label)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all active:scale-95 ${cls}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {submitted && answered && answered !== q.correct_section && (
              <p className="text-xs text-green-600 font-semibold mt-1.5">✓ {q.correct_section}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Sentence bank — Part 6 ────────────────────────────────────────────────────

function SentenceBank({ bank, usedIds, activeGap, onSelect, submitted }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sentence bank</p>
      {bank.map(s => {
        const isUsed = usedIds.has(s.id)
        return (
          <button
            key={s.id}
            onClick={() => !submitted && !isUsed && onSelect(s)}
            disabled={submitted || isUsed}
            className={`px-3 py-2.5 rounded-xl border-2 text-sm text-left transition-all ${
              isUsed
                ? 'border-gray-100 bg-gray-50 text-gray-300 line-through'
                : activeGap !== null
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-800 hover:border-indigo-500 active:scale-[0.99]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
            }`}
          >
            {s.text}
          </button>
        )
      })}
    </div>
  )
}

// ── Highlight toolbar ─────────────────────────────────────────────────────────

function HighlightToolbar({ active, onChange, highlights, onClear }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-xs text-gray-400">Highlight:</span>
      {HIGHLIGHT_COLOURS.map(c => (
        <button
          key={c.id}
          onClick={() => onChange(active === c.id ? null : c.id)}
          className={`w-5 h-5 rounded-full ${c.swatch} transition-all ${
            active === c.id ? 'ring-2 ring-offset-1 ring-gray-600 scale-110' : 'opacity-60 hover:opacity-100'
          }`}
          title={c.id}
        />
      ))}
      {highlights.length > 0 && (
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-400 ml-1 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReadingPassageScreen({ data, onNext }) {
  const {
    part        = 5,
    title       = `Reading Part ${part}`,
    instruction = '',
    sections    = [],
    questions   = [],
    sentence_bank = [],
    compare_preset = null,
  } = data

  // View mode — default to focus for mobile, panel if only 1 section
  const defaultMode = sections.length <= 1 ? 'panel' : 'focus'
  const [viewMode, setViewMode]         = useState(defaultMode)
  const [focusIdx, setFocusIdx]         = useState(0)       // which section in focus view
  const [compareSelections, setCompareSelections] = useState(compare_preset || [])

  // Answers
  const [answers, setAnswers]           = useState({})      // Part 5: {qId: option} / Part 7: {qId: sectionLabel}
  const [gapAnswers, setGapAnswers]     = useState({})      // Part 6: {gapIndex: sentence}
  const [activeGap, setActiveGap]       = useState(null)    // Part 6: which gap is active

  // Highlighting
  const [activeHighlight, setActiveHighlight] = useState(null)
  const [highlights, setHighlights]     = useState([])

  // Submission
  const [submitted, setSubmitted]       = useState(false)

  const allQuestionsAnswered = part === 6
    ? questions.every(q => gapAnswers[q.gap_index] !== undefined)
    : questions.every(q => answers[q.id] !== undefined)

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleAnswer(qId, value) {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  function handleGapClick(gapIndex) {
    setActiveGap(prev => prev === gapIndex ? null : gapIndex)
  }

  function handleSentenceSelect(sentence) {
    if (activeGap === null) return
    // Place in gap, remove from any other gap it was in
    setGapAnswers(prev => {
      const next = { ...prev }
      // Remove sentence from wherever it was placed
      Object.keys(next).forEach(k => {
        if (next[k]?.id === sentence.id) delete next[k]
      })
      next[activeGap] = sentence
      return next
    })
    setActiveGap(null)
  }

  function handleTextSelect(sectionIdx, text) {
    if (!activeHighlight) return
    setHighlights(prev => [
      ...prev,
      { id: `${Date.now()}`, sectionIdx, text, colour: activeHighlight }
    ])
  }

  function handleRemoveHighlight(id) {
    setHighlights(prev => prev.filter(h => h.id !== id))
  }

  function handleSubmit() {
    setSubmitted(true)
  }

  function handleContinue() {
    // Score
    let correct = 0, total = 0
    if (part === 5 || part === 1) {
      questions.forEach(q => {
        total++
        if (answers[q.id]?.correct) correct++
      })
    } else if (part === 6) {
      questions.forEach(q => {
        total++
        if (gapAnswers[q.gap_index]?.correct_gap === q.gap_index) correct++
      })
    } else if (part === 7) {
      questions.forEach(q => {
        total++
        if (answers[q.id] === q.correct_section) correct++
      })
    }
    const pct = total > 0 ? Math.round((correct / total) * 100) : 100
    onNext(pct >= 60)
  }

  // ── Compare mode helpers ───────────────────────────────────────────────────

  function toggleCompare(label) {
    setCompareSelections(prev => {
      if (prev.includes(label)) return prev.filter(l => l !== label)
      if (prev.length >= 3) return [...prev.slice(1), label]
      return [...prev, label]
    })
  }

  const compareSections = compareSelections.length
    ? sections.filter(s => compareSelections.includes(s.label))
    : sections.slice(0, 2)

  const usedSentenceIds = new Set(Object.values(gapAnswers).map(s => s?.id).filter(Boolean))

  // ── View mode: only show Compare for Part 7 with 2+ sections ──────────────
  const availableModes = sections.length > 1
    ? VIEW_MODES
    : VIEW_MODES.filter(m => m.id !== 'compare')

  // Also hide compare if not Part 7
  const filteredModes = part === 7 ? availableModes : availableModes.filter(m => m.id !== 'compare')

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 flex-shrink-0 gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider truncate">{title}</p>
          {instruction && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{instruction}</p>
          )}
        </div>

        {/* View mode switcher */}
        <div className="flex gap-1 flex-shrink-0">
          {filteredModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              title={mode.label}
              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                viewMode === mode.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {mode.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Highlight toolbar */}
      <div className="px-4 py-2 border-b border-gray-50 flex-shrink-0">
        <HighlightToolbar
          active={activeHighlight}
          onChange={setActiveHighlight}
          highlights={highlights}
          onClear={() => setHighlights([])}
        />
      </div>

      {/* ── FOCUS MODE ──────────────────────────────────────────────────────── */}
      {viewMode === 'focus' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section navigator */}
          {sections.length > 1 && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setFocusIdx(i => Math.max(0, i - 1))}
                disabled={focusIdx === 0}
                className="text-indigo-500 disabled:opacity-30 font-bold px-2"
              >
                ←
              </button>
              <span className="text-xs font-semibold text-gray-500">
                {sections[focusIdx]?.label
                  ? `Section ${sections[focusIdx].label}`
                  : `Paragraph ${focusIdx + 1} of ${sections.length}`}
              </span>
              <button
                onClick={() => setFocusIdx(i => Math.min(sections.length - 1, i + 1))}
                disabled={focusIdx === sections.length - 1}
                className="text-indigo-500 disabled:opacity-30 font-bold px-2"
              >
                →
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {/* Text */}
            <div className="px-5 py-4 border-b border-gray-100">
              <SectionText
                section={sections[focusIdx]}
                sectionIdx={focusIdx}
                part={part}
                answers={gapAnswers}
                highlights={highlights}
                activeHighlight={activeHighlight}
                onGapClick={handleGapClick}
                onTextSelect={handleTextSelect}
                submitted={submitted}
              />
            </div>

            {/* Questions for this section */}
            <div className="px-5 py-4">
              {part === 5 || part === 1 ? (
                <Part5Questions
                  questions={questions}
                  answers={answers}
                  onAnswer={handleAnswer}
                  submitted={submitted}
                  filterSection={focusIdx}
                />
              ) : part === 7 ? (
                <Part7Questions
                  questions={questions}
                  sections={sections}
                  answers={answers}
                  onAnswer={handleAnswer}
                  submitted={submitted}
                />
              ) : part === 6 ? (
                <>
                  {activeGap !== null && (
                    <div className="mb-3 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-semibold">
                      Filling Gap {activeGap + 1} — tap a sentence below
                    </div>
                  )}
                  <SentenceBank
                    bank={sentence_bank}
                    usedIds={usedSentenceIds}
                    activeGap={activeGap}
                    onSelect={handleSentenceSelect}
                    submitted={submitted}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── PANEL MODE ──────────────────────────────────────────────────────── */}
      {viewMode === 'panel' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden gap-0">
          {/* Text side — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 border-b md:border-b-0 md:border-r border-gray-100 min-h-0">
            {sections.map((section, i) => (
              <div key={i} className={i > 0 ? 'mt-5 pt-5 border-t border-gray-100' : ''}>
                {section.label && (
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    {section.label}
                  </p>
                )}
                <SectionText
                  section={section}
                  sectionIdx={i}
                  part={part}
                  answers={gapAnswers}
                  highlights={highlights}
                  activeHighlight={activeHighlight}
                  onGapClick={handleGapClick}
                  onTextSelect={handleTextSelect}
                  submitted={submitted}
                />
              </div>
            ))}
          </div>

          {/* Questions / bank side — fixed height, scrollable */}
          <div className="md:w-80 overflow-y-auto px-4 py-4 flex-shrink-0">
            {part === 5 || part === 1 ? (
              <Part5Questions
                questions={questions}
                answers={answers}
                onAnswer={handleAnswer}
                submitted={submitted}
              />
            ) : part === 7 ? (
              <Part7Questions
                questions={questions}
                sections={sections}
                answers={answers}
                onAnswer={handleAnswer}
                submitted={submitted}
              />
            ) : part === 6 ? (
              <>
                {activeGap !== null && (
                  <div className="mb-3 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-semibold">
                    Filling Gap {activeGap + 1} — tap a sentence
                  </div>
                )}
                <SentenceBank
                  bank={sentence_bank}
                  usedIds={usedSentenceIds}
                  activeGap={activeGap}
                  onSelect={handleSentenceSelect}
                  submitted={submitted}
                />
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ── COMPARE MODE (Part 7) ────────────────────────────────────────────── */}
      {viewMode === 'compare' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section selector chips */}
          {!compare_preset && (
            <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Compare:</span>
              {sections.map(s => (
                <button
                  key={s.label}
                  onClick={() => toggleCompare(s.label)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                    compareSelections.includes(s.label)
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-orange-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <span className="text-xs text-gray-300">Select 2 or 3</span>
            </div>
          )}

          {/* Side by side sections */}
          <div className="flex-1 flex gap-0 overflow-hidden divide-x divide-gray-100">
            {compareSections.map((section, i) => (
              <div key={i} className="flex-1 overflow-y-auto px-4 py-4 min-w-0">
                {section.label && (
                  <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2">
                    Section {section.label}
                  </p>
                )}
                <SectionText
                  section={section}
                  sectionIdx={sections.indexOf(section)}
                  part={part}
                  answers={gapAnswers}
                  highlights={highlights}
                  activeHighlight={activeHighlight}
                  onGapClick={() => {}}
                  onTextSelect={handleTextSelect}
                  submitted={submitted}
                />
              </div>
            ))}
          </div>

          {/* Questions below in compare mode */}
          <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0 max-h-48 overflow-y-auto">
            <Part7Questions
              questions={questions}
              sections={sections}
              answers={answers}
              onAnswer={handleAnswer}
              submitted={submitted}
            />
          </div>
        </div>
      )}

      {/* ── Bottom bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 flex-shrink-0">
        {/* Progress indicator */}
        <div className="flex-1">
          {part === 6 ? (
            <p className="text-xs text-gray-400">
              {Object.keys(gapAnswers).length}/{questions.length} gaps filled
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              {Object.keys(answers).length}/{questions.length} answered
            </p>
          )}
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered}
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm disabled:opacity-40 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Check answers
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 active:scale-95 transition-all"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  )
}
