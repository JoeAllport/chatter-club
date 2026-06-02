// ── Step 4: Wild card ─────────────────────────────────────────────────────────
// Renders a different activity depending on wild_card_type.
// All wild card data comes from wild_card_set_id (content_items rows)
// OR from challenge.wild_card JSON directly (AI-generated, not yet saved to content_items).

import { useState } from 'react'
import QuestionCard from './QuestionCard'

export default function StepWildCard({ challenge, items, onDone }) {
  const type = challenge?.wild_card_type

  // If we have content_items from wild_card_set_id, use those.
  // Otherwise fall back to challenge.wild_card JSON (raw AI output stored in daily_challenges).
  if (items && items.length > 0) {
    return <WildCardFromItems type={type} items={items} onDone={onDone} />
  }

  // Wild card data embedded in the challenge row (legacy / pre-content_set path)
  const rawData = challenge?.wild_card
  if (!rawData && !type) {
    return <WildCardEmpty onDone={onDone} />
  }

  return <WildCardRaw type={type} data={rawData} onDone={onDone} />
}

// ── From content_items ────────────────────────────────────────────────────────

function WildCardFromItems({ type, items, onDone }) {
  const [idx,     setIdx]     = useState(0)
  const [correct, setCorrect] = useState(0)

  function handleAnswer(wasCorrect) {
    const nc = correct + (wasCorrect ? 1 : 0)
    setCorrect(nc)
    if (idx + 1 >= items.length) {
      onDone(nc, items.length)
    } else {
      setIdx(i => i + 1)
    }
  }

  const q = items[idx]
  const normalised = {
    type:        q.task_type,
    prompt:      q.question_text || q.prompt,
    answer:      q.correct_answer || q.answer,
    distractors: q.options ? JSON.parse(q.options).filter(o => o !== (q.correct_answer || q.answer)) : [],
    explanation: q.explanation || '',
  }

  return (
    <div className="flex-1 flex flex-col pt-4">
      <WildCardHeader type={type} />
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

// ── From raw AI data ──────────────────────────────────────────────────────────

function WildCardRaw({ type, data, onDone }) {
  switch (type) {
    case 'word_formation': return <WordFormation data={data} onDone={onDone} />
    case 'odd_one_out':    return <OddOneOut     data={data} onDone={onDone} />
    case 'fill_gap':       return <FillGap       data={data} onDone={onDone} />
    case 'speed_burst':    return <SpeedBurst    data={data} onDone={onDone} />
    case 'translation':    return <Translation   data={data} onDone={onDone} />
    default:               return <WildCardEmpty onDone={onDone} />
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

const WILD_CARD_META = {
  word_formation: { icon: '🔨', label: 'Word formation', sub: 'Build the correct form' },
  odd_one_out:    { icon: '🔍', label: 'Odd one out',    sub: 'Which word doesn\'t fit?' },
  fill_gap:       { icon: '✏️', label: 'Fill the gap',   sub: 'Complete the sentence' },
  speed_burst:    { icon: '⚡', label: 'Speed burst',    sub: 'Quick fire review' },
  translation:    { icon: '🌐', label: 'Translation',    sub: 'Find the English word' },
}

function WildCardHeader({ type }) {
  const meta = WILD_CARD_META[type] || { icon: '⭐', label: 'Wild card', sub: '' }
  return (
    <div className="text-center mb-6">
      <span className="text-3xl">{meta.icon}</span>
      <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">{meta.label}</p>
      {meta.sub && <p className="text-gray-400 text-sm mt-0.5">{meta.sub}</p>}
    </div>
  )
}

// ── Word formation (Monday) ───────────────────────────────────────────────────

function WordFormation({ data, onDone }) {
  const [selected,  setSelected]  = useState(null)
  const [revealed,  setRevealed]  = useState(false)

  if (!data) return <WildCardEmpty onDone={onDone} />

  const { prompt, root_word, target_pos, answer, distractors = [] } = data
  const options = shuffle([answer, ...distractors])

  function handleSelect(opt) {
    if (revealed) return
    setSelected(opt)
  }

  function handleCheck() {
    if (!selected || revealed) return
    setRevealed(true)
    setTimeout(() => onDone(selected === answer ? 1 : 0, 1), 1200)
  }

  return (
    <div className="flex-1 flex flex-col pt-4">
      <WildCardHeader type="word_formation" />

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <p className="text-gray-300 text-sm leading-relaxed mb-3">{prompt}</p>
        <p className="text-white text-sm">
          Root word: <span className="text-indigo-300 font-bold">{root_word}</span>
          {target_pos && <span className="text-gray-500 ml-2">→ {target_pos}</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {options.map(opt => (
          <button key={opt}
            onClick={() => handleSelect(opt)}
            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
              revealed && opt === answer
                ? 'border-green-500 bg-green-900/30 text-green-200'
                : revealed && opt === selected && opt !== answer
                ? 'border-red-500 bg-red-900/30 text-red-300'
                : selected === opt
                ? 'border-indigo-500 bg-indigo-900/40 text-white'
                : 'border-gray-700 bg-gray-800/50 text-gray-200 hover:border-gray-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {!revealed && (
        <button onClick={handleCheck} disabled={!selected}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:bg-gray-700 text-white font-bold text-base active:scale-95 transition-all">
          Check
        </button>
      )}
    </div>
  )
}

// ── Odd one out (Tuesday) ─────────────────────────────────────────────────────

function OddOneOut({ data, onDone }) {
  const [selected, setSelected]  = useState(null)
  const [revealed, setRevealed]  = useState(false)

  if (!data) return <WildCardEmpty onDone={onDone} />

  const { words = [], odd_one, explanation } = data

  function handleSelect(w) {
    if (revealed) return
    setSelected(w)
    setRevealed(true)
    setTimeout(() => onDone(w === odd_one ? 1 : 0, 1), 1400)
  }

  return (
    <div className="flex-1 flex flex-col pt-4">
      <WildCardHeader type="odd_one_out" />

      <p className="text-gray-300 text-sm text-center mb-6">
        Which word <span className="text-white font-medium">doesn't fit</span> with the others?
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {words.map(w => (
          <button key={w}
            onClick={() => handleSelect(w)}
            className={`py-4 rounded-xl border text-base font-semibold transition-all ${
              revealed && w === odd_one
                ? 'border-green-500 bg-green-900/30 text-green-200'
                : revealed && w === selected && w !== odd_one
                ? 'border-red-500 bg-red-900/30 text-red-300'
                : revealed
                ? 'border-gray-800 bg-gray-900/30 text-gray-600'
                : 'border-gray-700 bg-gray-800/60 text-white hover:border-gray-500 hover:bg-gray-800 active:scale-95'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {revealed && explanation && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
          <p className="text-gray-300 text-sm">{explanation}</p>
        </div>
      )}
    </div>
  )
}

// ── Fill the gap (Wednesday) ──────────────────────────────────────────────────

function FillGap({ data, onDone }) {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  if (!data) return <WildCardEmpty onDone={onDone} />

  const { sentence_with_blank, answer, distractors = [] } = data
  const options = shuffle([answer, ...distractors])

  // Render sentence with blank highlighted
  const parts = (sentence_with_blank || '').split('___')

  function handleSelect(opt) {
    if (revealed) return
    setSelected(opt)
  }

  function handleCheck() {
    if (!selected || revealed) return
    setRevealed(true)
    setTimeout(() => onDone(selected === answer ? 1 : 0, 1), 1200)
  }

  return (
    <div className="flex-1 flex flex-col pt-4">
      <WildCardHeader type="fill_gap" />

      {/* Sentence */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 text-center">
        <p className="text-gray-100 text-lg leading-relaxed">
          {parts[0]}
          <span className={`inline-block min-w-[6rem] border-b-2 mx-1 font-bold text-lg transition-all ${
            revealed
              ? selected === answer ? 'border-green-500 text-green-300' : 'border-red-500 text-red-300'
              : selected ? 'border-indigo-400 text-indigo-200' : 'border-gray-500 text-gray-500'
          }`}>
            {selected || '________'}
          </span>
          {parts[1]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {options.map(opt => (
          <button key={opt}
            onClick={() => handleSelect(opt)}
            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
              revealed && opt === answer
                ? 'border-green-500 bg-green-900/30 text-green-200'
                : revealed && opt === selected && opt !== answer
                ? 'border-red-500 bg-red-900/30 text-red-300'
                : selected === opt
                ? 'border-indigo-500 bg-indigo-900/40 text-white'
                : 'border-gray-700 bg-gray-800/50 text-gray-200 hover:border-gray-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {!revealed && (
        <button onClick={handleCheck} disabled={!selected}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:bg-gray-700 text-white font-bold text-base active:scale-95 transition-all">
          Check
        </button>
      )}
    </div>
  )
}

// ── Speed burst (Thursday) ────────────────────────────────────────────────────
// 5 rapid MCQ questions, no timer for now (timer can be added later)

function SpeedBurst({ data, onDone }) {
  const [idx,     setIdx]     = useState(0)
  const [correct, setCorrect] = useState(0)

  const questions = data?.questions || []

  if (questions.length === 0) return <WildCardEmpty onDone={onDone} />

  function handleAnswer(wasCorrect) {
    const nc = correct + (wasCorrect ? 1 : 0)
    setCorrect(nc)
    if (idx + 1 >= questions.length) {
      onDone(nc, questions.length)
    } else {
      setIdx(i => i + 1)
    }
  }

  const q = questions[idx]
  const normalised = {
    type:        'mcq',
    prompt:      q.prompt || q.question,
    answer:      q.answer || q.correct_answer,
    distractors: q.distractors || [],
    explanation: q.explanation || '',
  }

  return (
    <div className="flex-1 flex flex-col pt-4">
      <WildCardHeader type="speed_burst" />
      <QuestionCard
        key={idx}
        question={normalised}
        onAnswer={handleAnswer}
        questionNumber={idx + 1}
        totalQuestions={questions.length}
      />
    </div>
  )
}

// ── Translation (Friday) ──────────────────────────────────────────────────────

function Translation({ data, onDone }) {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  if (!data) return <WildCardEmpty onDone={onDone} />

  const { word, native_hint, answer } = data
  // Generate plausible distractors from words nearby — for now just reveal/hide
  // A proper set will come from wild_card_set_id content_items

  function handleSelect(opt) {
    if (revealed) return
    setSelected(opt)
    setRevealed(true)
    setTimeout(() => onDone(opt === answer ? 1 : 0, 1), 1200)
  }

  return (
    <div className="flex-1 flex flex-col pt-4">
      <WildCardHeader type="translation" />

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 text-center">
        <p className="text-gray-400 text-sm mb-3">What is the English word for…</p>
        <p className="text-white text-lg leading-relaxed font-medium">{native_hint}</p>
      </div>

      {/* For translation without distractors — just reveal the answer */}
      {!revealed ? (
        <button onClick={() => handleSelect(answer)}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base active:scale-95 transition-all">
          Reveal the word
        </button>
      ) : (
        <div className="text-center">
          <div className="bg-green-900/30 border border-green-700 rounded-2xl p-6 mb-4">
            <p className="text-green-300 text-3xl font-bold">{answer}</p>
          </div>
          <button onClick={() => onDone(1, 1)}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-base active:scale-95 transition-all">
            Got it! →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Empty fallback ────────────────────────────────────────────────────────────

function WildCardEmpty({ onDone }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
      <p className="text-5xl">⭐</p>
      <p className="text-gray-400 font-medium">Wild card coming soon</p>
      <p className="text-gray-500 text-sm">No content generated for this day yet.</p>
      <button onClick={() => onDone(0, 0)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium">
        Continue →
      </button>
    </div>
  )
}

// ── Util ──────────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
