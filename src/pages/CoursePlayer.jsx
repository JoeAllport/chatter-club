// CoursePlayer.jsx — Self-paced course player
// TIER: member (free chapters open, pro chapters gated post-launch)
// Route: /courses/:slug
//
// Layout: two-column on desktop (sidebar left, content right)
//         stacked on mobile (chapter nav above, content below)
//
// Content model: chapter_blocks (ordered JSONB blocks per chapter)
// Block types: text | instructions | mcq | open_cloze | word_formation |
//              transformation | gap_fill | matching | writing_task | answer_key

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageMeta from '../components/PageMeta'

// ─── Utilities ────────────────────────────────────────────────────────────────

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function TextBlock({ content }) {
  const html = (content.body || '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
  return (
    <div
      className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function InstructionsBlock({ content }) {
  return (
    <p className="font-semibold text-gray-900 text-sm">{content.text}</p>
  )
}

function MCQBlock({ block, response, onSubmit, submitted }) {
  const { question, options, answer, explanation } = block.content
  const [selected, setSelected] = useState(response?.selected || null)
  const [revealed, setRevealed] = useState(submitted)

  function handleSubmit() {
    if (!selected) return
    onSubmit({ selected }, selected === answer ? 100 : 0)
    setRevealed(true)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-800">{question}</p>
      <ul className="space-y-2">
        {Object.entries(options || {}).map(([key, text]) => {
          let cls = 'border-gray-200 bg-white text-gray-700'
          if (revealed) {
            if (key === answer) cls = 'border-green-400 bg-green-50 text-green-800'
            else if (key === selected) cls = 'border-red-300 bg-red-50 text-red-700'
            else cls = 'border-gray-100 bg-gray-50 opacity-60'
          } else if (key === selected) {
            cls = 'border-indigo-400 bg-indigo-50 text-indigo-800'
          }
          return (
            <li key={key}>
              <button
                disabled={revealed}
                onClick={() => setSelected(key)}
                className={cn(
                  'w-full text-left text-sm px-4 py-3 rounded-xl border-2 transition-colors',
                  cls,
                  !revealed && key !== selected && 'hover:border-indigo-300 hover:bg-indigo-50'
                )}
              >
                <span className="font-semibold mr-2">{key}.</span>{text}
              </button>
            </li>
          )
        })}
      </ul>
      {!revealed && (
        <button
          disabled={!selected}
          onClick={handleSubmit}
          className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition-colors"
        >
          Check
        </button>
      )}
      {revealed && explanation && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-100">
          {explanation}
        </div>
      )}
    </div>
  )
}

function OpenClozeBlock({ block, response, onSubmit, submitted }) {
  const { passage, answers } = block.content
  const parts = (passage || '').split(/\(\d+\)\s*___+/)
  const [userAnswers, setUserAnswers] = useState(
    response?.answers || Array(answers?.length || 0).fill('')
  )
  const [revealed, setRevealed] = useState(submitted)

  function handleSubmit() {
    const correct = userAnswers.filter((ua, i) =>
      ua.trim().toLowerCase() === (answers[i] || '').toLowerCase()
    ).length
    const pct = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0
    onSubmit({ answers: userAnswers }, pct)
    setRevealed(true)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700 leading-relaxed">
        {parts.map((part, i) => (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br />') }} />
            {i < parts.length - 1 && (
              <span className="inline-flex items-center gap-1 mx-1">
                <span className="text-xs text-gray-400 font-medium">({i + 1})</span>
                <input
                  type="text"
                  disabled={revealed}
                  value={userAnswers[i] || ''}
                  onChange={e => {
                    const next = [...userAnswers]; next[i] = e.target.value; setUserAnswers(next)
                  }}
                  className={cn(
                    'border-b w-24 text-sm text-center outline-none px-1 pb-0.5',
                    revealed
                      ? userAnswers[i]?.trim().toLowerCase() === answers[i]?.toLowerCase()
                        ? 'border-green-400 text-green-700'
                        : 'border-red-400 text-red-700'
                      : 'border-gray-400 focus:border-indigo-500'
                  )}
                />
              </span>
            )}
          </span>
        ))}
      </p>
      {revealed && (
        <div className="text-xs text-gray-500 space-x-3">
          {answers.map((ans, i) => (
            <span key={i} className={
              userAnswers[i]?.trim().toLowerCase() === ans.toLowerCase() ? 'text-green-600' : 'text-red-600'
            }>
              ({i + 1}) {ans}
            </span>
          ))}
        </div>
      )}
      {!revealed && (
        <button onClick={handleSubmit} className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
          Check answers
        </button>
      )}
    </div>
  )
}

function WordFormationBlock({ block, response, onSubmit, submitted }) {
  const { passage_before, lines } = block.content
  const [userAnswers, setUserAnswers] = useState(
    response?.answers || Array(lines?.length || 0).fill('')
  )
  const [revealed, setRevealed] = useState(submitted)

  function handleSubmit() {
    const correct = userAnswers.filter((ua, i) =>
      ua.trim().toLowerCase() === (lines[i]?.answer || '').toLowerCase()
    ).length
    const pct = lines.length > 0 ? Math.round((correct / lines.length) * 100) : 0
    onSubmit({ answers: userAnswers }, pct)
    setRevealed(true)
  }

  return (
    <div className="space-y-3">
      {passage_before && <p className="text-sm text-gray-700">{passage_before}</p>}
      <div className="space-y-3">
        {(lines || []).map((line, i) => {
          const isCorrect = userAnswers[i]?.trim().toLowerCase() === line.answer?.toLowerCase()
          const [before, after] = line.text.split('___')
          return (
            <div key={i} className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</span>
              <span className="text-gray-700">{before}</span>
              <input
                type="text"
                disabled={revealed}
                value={userAnswers[i] || ''}
                onChange={e => {
                  const next = [...userAnswers]; next[i] = e.target.value; setUserAnswers(next)
                }}
                className={cn(
                  'border-b w-28 text-sm text-center outline-none px-1 pb-0.5',
                  revealed
                    ? isCorrect ? 'border-green-400 text-green-700' : 'border-red-400 text-red-700'
                    : 'border-gray-400 focus:border-indigo-500'
                )}
              />
              {after && <span className="text-gray-700">{after}</span>}
              <span className="ml-auto text-xs font-mono text-gray-400 uppercase tracking-wide">{line.root}</span>
              {revealed && !isCorrect && (
                <span className="text-xs text-green-600 font-medium">{line.answer}</span>
              )}
            </div>
          )
        })}
      </div>
      {!revealed && (
        <button onClick={handleSubmit} className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
          Check answers
        </button>
      )}
    </div>
  )
}

function TransformationBlock({ block, response, onSubmit, submitted }) {
  const { items } = block.content
  const [userAnswers, setUserAnswers] = useState(
    response?.answers || Array(items?.length || 0).fill('')
  )
  const [revealed, setRevealed] = useState(submitted)

  function handleSubmit() {
    const correct = userAnswers.filter((ua, i) =>
      ua.toLowerCase().trim() === (items[i]?.answer || '').toLowerCase().trim()
    ).length
    const pct = items.length > 0 ? Math.round((correct / items.length) * 100) : 0
    onSubmit({ answers: userAnswers }, pct)
    setRevealed(true)
  }

  return (
    <div className="space-y-5">
      {(items || []).map((item, i) => {
        const isCorrect = userAnswers[i]?.toLowerCase().trim() === item.answer?.toLowerCase().trim()
        return (
          <div key={i} className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-400 font-medium w-5 flex-shrink-0 pt-0.5">{i + 1}</span>
              <p className="text-sm text-gray-700">{item.original}</p>
            </div>
            {item.note && (
              <p className="text-xs text-gray-400 ml-7 italic">{item.note}</p>
            )}
            <div className="flex items-center gap-2 ml-7">
              <span className="text-xs font-mono font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {item.key}
              </span>
              <input
                type="text"
                placeholder="2–5 words…"
                disabled={revealed}
                value={userAnswers[i] || ''}
                onChange={e => {
                  const next = [...userAnswers]; next[i] = e.target.value; setUserAnswers(next)
                }}
                className={cn(
                  'flex-1 border-2 rounded-xl px-3 py-1.5 text-sm outline-none transition-colors',
                  revealed
                    ? isCorrect
                      ? 'border-green-400 bg-green-50 text-green-800'
                      : 'border-red-300 bg-red-50 text-red-800'
                    : 'border-gray-200 focus:border-indigo-400'
                )}
              />
            </div>
            {revealed && !isCorrect && (
              <p className="text-xs text-green-700 ml-7 font-medium">✓ {item.answer}</p>
            )}
          </div>
        )
      })}
      {!revealed && (
        <button onClick={handleSubmit} className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
          Check answers
        </button>
      )}
    </div>
  )
}

function GapFillBlock({ block, response, onSubmit, submitted }) {
  const { passage, answers, bank } = block.content
  const parts = (passage || '').split('___')
  const [userAnswers, setUserAnswers] = useState(
    response?.answers || Array(answers?.length || 0).fill('')
  )
  const [revealed, setRevealed] = useState(submitted)
  const [shuffledBank] = useState(() => [...(bank || [])].sort(() => Math.random() - 0.5))

  function fillGap(idx, word) {
    if (revealed) return
    const next = [...userAnswers]
    const existingIdx = next.indexOf(word)
    if (existingIdx !== -1 && existingIdx !== idx) next[existingIdx] = ''
    next[idx] = next[idx] === word ? '' : word
    setUserAnswers(next)
  }

  function handleSubmit() {
    const correct = userAnswers.filter((ua, i) =>
      ua.trim().toLowerCase() === (answers[i] || '').toLowerCase()
    ).length
    const pct = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0
    onSubmit({ answers: userAnswers }, pct)
    setRevealed(true)
  }

  return (
    <div className="space-y-4">
      {!revealed && (
        <div className="flex flex-wrap gap-2">
          {shuffledBank.map(word => {
            const used = userAnswers.includes(word)
            return (
              <button
                key={word}
                disabled={used}
                onClick={() => {
                  const emptyIdx = userAnswers.indexOf('')
                  if (emptyIdx !== -1) fillGap(emptyIdx, word)
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-sm border transition-colors',
                  used
                    ? 'border-gray-200 text-gray-300 bg-gray-50'
                    : 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                )}
              >
                {word}
              </button>
            )
          })}
        </div>
      )}
      <p className="text-sm text-gray-700 leading-relaxed">
        {parts.map((part, i) => (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br />') }} />
            {i < parts.length - 1 && (
              <button
                disabled={revealed}
                onClick={() => fillGap(i, '')}
                className={cn(
                  'inline-block mx-1 min-w-20 text-center text-sm px-2 py-0.5 rounded border',
                  revealed
                    ? userAnswers[i]?.toLowerCase() === answers[i]?.toLowerCase()
                      ? 'border-green-400 bg-green-50 text-green-800'
                      : 'border-red-300 bg-red-50 text-red-700'
                    : userAnswers[i]
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                      : 'border-dashed border-gray-300 text-gray-300'
                )}
              >
                {userAnswers[i] || `(${i + 1})`}
              </button>
            )}
          </span>
        ))}
      </p>
      {revealed && (
        <div className="text-xs text-gray-500 space-x-3">
          {answers.map((ans, i) => (
            <span key={i} className={
              userAnswers[i]?.toLowerCase() === ans.toLowerCase() ? 'text-green-600' : 'text-red-600'
            }>
              ({i + 1}) {ans}
            </span>
          ))}
        </div>
      )}
      {!revealed && (
        <button onClick={handleSubmit} className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
          Check answers
        </button>
      )}
    </div>
  )
}

function MatchingBlock({ block, response, onSubmit, submitted }) {
  const { pairs, distractors } = block.content
  const [shuffledDefs] = useState(() =>
    [...(pairs || []).map(p => p.definition), ...((distractors || []).map(d => d.definition))]
      .sort(() => Math.random() - 0.5)
  )
  const [matches, setMatches] = useState(
    response?.pairs ? Object.fromEntries(response.pairs) : {}
  )
  const [revealed, setRevealed] = useState(submitted)
  const [activeTerm, setActiveTerm] = useState(null)

  function handleTermClick(term) {
    if (revealed) return
    setActiveTerm(activeTerm === term ? null : term)
  }

  function handleDefClick(def) {
    if (revealed || !activeTerm) return
    setMatches(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { if (next[k] === def) delete next[k] })
      if (next[activeTerm] === def) delete next[activeTerm]
      else next[activeTerm] = def
      return next
    })
    setActiveTerm(null)
  }

  function handleSubmit() {
    const correct = (pairs || []).filter(p => matches[p.term] === p.definition).length
    const pct = pairs.length > 0 ? Math.round((correct / pairs.length) * 100) : 0
    onSubmit({ pairs: Object.entries(matches) }, pct)
    setRevealed(true)
  }

  const usedDefs = new Set(Object.values(matches))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Terms</p>
          {(pairs || []).map(p => {
            const matched = matches[p.term]
            let cls = 'border-gray-200 bg-white text-gray-700'
            if (revealed) {
              cls = matched === p.definition
                ? 'border-green-400 bg-green-50 text-green-800'
                : 'border-red-300 bg-red-50 text-red-700'
            } else if (activeTerm === p.term) {
              cls = 'border-indigo-500 bg-indigo-50 text-indigo-800'
            } else if (matched) {
              cls = 'border-indigo-200 bg-indigo-50/50 text-indigo-700'
            }
            return (
              <button
                key={p.term}
                disabled={revealed}
                onClick={() => handleTermClick(p.term)}
                className={cn('w-full text-left text-xs px-3 py-2 rounded-xl border-2 transition-colors', cls)}
              >
                {p.term}
              </button>
            )
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Definitions</p>
          {shuffledDefs.map(def => {
            const isDistractor = !(pairs || []).some(p => p.definition === def)
            const isUsed = usedDefs.has(def)
            let cls = 'border-gray-200 bg-white text-gray-700'
            if (revealed) {
              if (isDistractor) cls = 'border-gray-100 bg-gray-50 text-gray-400'
              else {
                const matchedTerm = Object.entries(matches).find(([, d]) => d === def)?.[0]
                const correctPair = (pairs || []).find(p => p.definition === def)
                cls = matchedTerm === correctPair?.term
                  ? 'border-green-400 bg-green-50 text-green-800'
                  : 'border-red-300 bg-red-50 text-red-700'
              }
            } else if (isUsed) {
              cls = 'border-indigo-200 bg-indigo-50/50 text-indigo-700'
            } else if (activeTerm) {
              cls = 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 cursor-pointer'
            }
            return (
              <button
                key={def}
                disabled={revealed || !activeTerm}
                onClick={() => handleDefClick(def)}
                className={cn('w-full text-left text-xs px-3 py-2 rounded-xl border-2 transition-colors', cls)}
              >
                {def}
              </button>
            )
          })}
        </div>
      </div>
      {activeTerm && !revealed && (
        <p className="text-xs text-indigo-600">Now tap a definition to match with <strong>{activeTerm}</strong></p>
      )}
      {!revealed && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length < (pairs || []).length}
          className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition-colors"
        >
          Check matches
        </button>
      )}
    </div>
  )
}

function WritingTaskBlock({ block, response, onSubmit, submitted }) {
  const { prompt, task_type, target_words, scaffold } = block.content
  const [text, setText] = useState(response?.body || '')
  const [wordCount, setWordCount] = useState(0)
  const [saved, setSaved] = useState(submitted)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
  }, [text])

  async function handleSubmit() {
    if (!text.trim()) return
    setSaving(true)
    await onSubmit({ body: text, word_count: wordCount }, null)
    setSaved(true)
    setSaving(false)
  }

  const pct = target_words ? Math.min(100, Math.round((wordCount / target_words) * 100)) : null
  const taskLabel = task_type ? task_type.charAt(0).toUpperCase() + task_type.slice(1) : 'Writing task'

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">{taskLabel}</p>
        <p className="leading-relaxed">{prompt}</p>
        {target_words && <p className="text-xs mt-2 text-amber-700">Target: {target_words} words</p>}
      </div>
      {scaffold && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">Scaffold</p>
          <p className="whitespace-pre-line">{scaffold}</p>
        </div>
      )}
      <textarea
        rows={10}
        disabled={saved}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your answer here…"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-indigo-400 resize-none disabled:bg-gray-50"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{wordCount} words</span>
          {pct !== null && (
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', pct >= 100 ? 'bg-green-500' : 'bg-indigo-400')}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
        {!saved ? (
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || saving}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            {saving ? 'Saving…' : 'Submit'}
          </button>
        ) : (
          <span className="text-xs text-green-600 font-medium">✓ Submitted</span>
        )}
      </div>
      {saved && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-100">
          Your writing has been saved. AI feedback will appear here when available.
        </div>
      )}
    </div>
  )
}

// ─── Block dispatcher ─────────────────────────────────────────────────────────

function BlockRenderer({ block, response, onSubmit, submitted }) {
  const props = { block, response, onSubmit, submitted }
  switch (block.block_type) {
    case 'text':           return <TextBlock content={block.content} />
    case 'instructions':   return <InstructionsBlock content={block.content} />
    case 'mcq':            return <MCQBlock {...props} />
    case 'open_cloze':     return <OpenClozeBlock {...props} />
    case 'word_formation': return <WordFormationBlock {...props} />
    case 'transformation': return <TransformationBlock {...props} />
    case 'gap_fill':       return <GapFillBlock {...props} />
    case 'matching':       return <MatchingBlock {...props} />
    case 'writing_task':   return <WritingTaskBlock {...props} />
    case 'answer_key':     return null  // hidden from students
    default:               return (
      <p className="text-xs text-gray-400 italic">Unknown block type: {block.block_type}</p>
    )
  }
}

// ─── Lock screen ──────────────────────────────────────────────────────────────

function LockedChapter({ reason }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center px-6">
      <div className="text-5xl">🔒</div>
      <h3 className="text-xl font-bold text-gray-900">Chapter locked</h3>
      <p className="text-gray-500 text-sm max-w-xs">
        {reason === 'pro'
          ? 'This chapter is part of the Pro plan. Upgrade to access all chapters.'
          : 'Complete the previous chapter to unlock this one.'}
      </p>
      {reason === 'pro' && (
        <button className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors">
          Upgrade to Pro →
        </button>
      )}
    </div>
  )
}

// ─── Course Home ─────────────────────────────────────────────────────────────

function CourseHome({
  course, units, progress, allChapters,
  completedCount, overallPct, lockReason,
  onStartChapter, onSelectChapter, slug, navigate,
}) {
  // Find the next chapter to do: first incomplete, unlocked chapter
  const nextChapter = (() => {
    for (const unit of units) {
      for (const ch of unit.chapters) {
        if (!progress[ch.id]?.completed && !lockReason(ch, unit)) return ch
      }
    }
    return null
  })()

  // Stats
  const totalChapters  = allChapters.length
  const totalMins      = allChapters.reduce((s, ch) => s + (ch.estimated_mins || 0), 0)
  const completedMins  = allChapters
    .filter(ch => progress[ch.id]?.completed)
    .reduce((s, ch) => s + (ch.estimated_mins || 0), 0)

  const CHAPTER_TYPE_COLOURS = {
    lesson:        'bg-indigo-50 text-indigo-600 border-indigo-100',
    exam_practice: 'bg-amber-50 text-amber-600 border-amber-100',
    review:        'bg-purple-50 text-purple-600 border-purple-100',
  }
  const CHAPTER_TYPE_LABELS = {
    lesson:        'Lesson',
    exam_practice: 'Exam',
    review:        'Review',
  }

  const started = completedCount > 0

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {course.level && (
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white mb-3">
                {course.level}
              </span>
            )}
            <h1 className="text-xl font-black leading-tight mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-sm text-indigo-200 leading-relaxed line-clamp-2">{course.description}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-indigo-200 mb-1.5">
            <span>{completedCount} of {totalChapters} chapters complete</span>
            <span>{overallPct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        {nextChapter && (
          <button
            onClick={() => onStartChapter(nextChapter.id)}
            className="mt-5 w-full py-3.5 bg-white text-indigo-700 font-bold rounded-2xl text-sm hover:bg-indigo-50 active:scale-95 transition-all"
          >
            {started ? `Continue → ${nextChapter.title}` : `Start course → ${nextChapter.title}`}
          </button>
        )}
        {!nextChapter && completedCount === totalChapters && totalChapters > 0 && (
          <div className="mt-5 w-full py-3.5 bg-white/20 text-white font-bold rounded-2xl text-sm text-center">
            🎉 Course complete!
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Chapters', value: totalChapters, icon: '📚' },
          { label: 'Done',     value: completedCount, icon: '✓', highlight: completedCount > 0 },
          { label: 'Minutes',  value: totalMins,      icon: '⏱' },
        ].map(({ label, value, icon, highlight }) => (
          <div key={label} className={cn(
            'rounded-2xl border p-3 text-center',
            highlight ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
          )}>
            <p className="text-base mb-0.5">{icon}</p>
            <p className={cn('text-xl font-black', highlight ? 'text-green-700' : 'text-gray-800')}>{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Unit + chapter list */}
      <div className="space-y-6">
        {units.map((unit, ui) => (
          <div key={unit.id}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
              {unit.title}
            </p>
            <div className="space-y-2">
              {unit.chapters.map((ch, ci) => {
                const done    = progress[ch.id]?.completed
                const locked  = lockReason(ch, unit)
                const isNext  = ch.id === nextChapter?.id
                const typeKey = ch.chapter_type || 'lesson'

                return (
                  <button
                    key={ch.id}
                    onClick={() => locked ? null : onSelectChapter(ch.id)}
                    disabled={!!locked}
                    className={cn(
                      'w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all',
                      locked
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-default'
                        : isNext
                          ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100'
                          : done
                            ? 'border-green-200 bg-green-50 hover:bg-green-100'
                            : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
                    )}
                  >
                    {/* Status icon */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                      locked
                        ? 'bg-gray-200 text-gray-400'
                        : done
                          ? 'bg-green-500 text-white'
                          : isNext
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                    )}>
                      {locked ? '🔒' : done ? '✓' : `${ui + 1}.${ci + 1}`}
                    </div>

                    {/* Chapter info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-semibold leading-tight truncate',
                        locked ? 'text-gray-400' : done ? 'text-green-800' : isNext ? 'text-indigo-900' : 'text-gray-800'
                      )}>
                        {ch.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-medium border',
                          CHAPTER_TYPE_COLOURS[typeKey] || 'bg-gray-100 text-gray-500 border-gray-100'
                        )}>
                          {CHAPTER_TYPE_LABELS[typeKey] || typeKey}
                        </span>
                        {ch.estimated_mins && (
                          <span className="text-xs text-gray-400">{ch.estimated_mins} min</span>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    {!locked && (
                      <span className={cn(
                        'text-xs font-semibold flex-shrink-0',
                        done ? 'text-green-600' : isNext ? 'text-indigo-600' : 'text-gray-300'
                      )}>
                        {done ? 'Review' : isNext ? 'Start →' : '→'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main CoursePlayer ────────────────────────────────────────────────────────

export default function CoursePlayer() {
  const { slug }    = useParams()
  const navigate    = useNavigate()

  const [course, setCourse]                   = useState(null)
  const [units, setUnits]                     = useState([])
  const [activeChapterId, setActiveChapterId] = useState(null)
  const [blocks, setBlocks]                   = useState([])
  const [responses, setResponses]             = useState({})   // blockId → {response, score_pct, submitted}
  const [progress, setProgress]               = useState({})   // chapterId → {completed, score_pct}
  const [user, setUser]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [chapterLoading, setChapterLoading]   = useState(false)
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [completing, setCompleting]           = useState(false)

  // ── Load course structure ────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      // Try slug first, then fall back to id (avoids malformed UUID in .or())
      let { data: courseData } = await supabase
        .from('courses')
        .select('id, title, description, slug, level, topic_tags, is_free, status')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (!courseData) {
        // slug didn't match — try treating it as a UUID
        const { data: byId } = await supabase
          .from('courses')
          .select('id, title, description, slug, level, topic_tags, is_free, status')
          .eq('id', slug)
          .eq('status', 'published')
          .maybeSingle()
        courseData = byId
      }

      if (!courseData) { navigate('/courses'); return }
      setCourse(courseData)

      const { data: unitData } = await supabase
        .from('course_units')
        .select('id, title, position')
        .eq('course_id', courseData.id)
        .order('position')

      if (!unitData?.length) { setUnits([]); setLoading(false); return }

      const unitIds = unitData.map(u => u.id)
      const { data: chapterData } = await supabase
        .from('course_chapters')
        .select('id, unit_id, course_id, title, position, chapter_type, is_free_preview, estimated_mins')
        .in('unit_id', unitIds)
        .order('position')

      const unitMap = {}
      unitData.forEach(u => { unitMap[u.id] = { ...u, chapters: [] } })
      chapterData?.forEach(ch => { unitMap[ch.unit_id]?.chapters.push(ch) })
      const nestedUnits = unitData.map(u => unitMap[u.id])
      setUnits(nestedUnits)

      if (u) {
        const { data: progData } = await supabase
          .from('user_course_progress')
          .select('chapter_id, completed, score_pct')
          .eq('user_id', u.id)
          .eq('course_id', courseData.id)
        const progMap = {}
        progData?.forEach(p => { progMap[p.chapter_id] = p })
        setProgress(progMap)
      }

      // Don't auto-select first chapter — show course home first
      setActiveChapterId(null)

      setLoading(false)
    }
    load()
  }, [slug])

  // ── Load blocks when active chapter changes ──────────────────────────────

  useEffect(() => {
    if (!activeChapterId) return
    async function loadChapter() {
      setChapterLoading(true)

      const { data: blockData } = await supabase
        .from('chapter_blocks')
        .select('id, block_type, content, is_scored, position')
        .eq('chapter_id', activeChapterId)
        .eq('teacher_only', false)
        .order('position')

      const { data: responseData } = await supabase
        .from('chapter_block_responses')
        .select('block_id, response, score_pct')
        .eq('chapter_id', activeChapterId)

      const respMap = {}
      ;(responseData || []).forEach(r => {
        respMap[r.block_id] = { response: r.response, score_pct: r.score_pct, submitted: true }
      })

      setBlocks(blockData || [])
      setResponses(respMap)
      setChapterLoading(false)
    }
    loadChapter()
  }, [activeChapterId])

  // ── Unlock logic ─────────────────────────────────────────────────────────

  function isUnlocked(chapter, unit) {
    if (unit.chapters[0]?.id === chapter.id) return true
    if (chapter.is_free_preview) return true
    const idx = unit.chapters.findIndex(ch => ch.id === chapter.id)
    if (idx <= 0) return true
    const prev = unit.chapters[idx - 1]
    return progress[prev.id]?.completed === true
  }

  function isProGated(chapter) {
    if (!course || course.is_free) return false
    if (chapter.is_free_preview) return false
    return true
  }

  function lockReason(chapter, unit) {
    if (isProGated(chapter)) return 'pro'
    if (!isUnlocked(chapter, unit)) return 'sequence'
    return null
  }

  // ── Submit a block response ──────────────────────────────────────────────

  async function handleBlockSubmit(blockId, isScored, responseData, scorePct) {
    if (!user) return
    await supabase
      .from('chapter_block_responses')
      .upsert({
        user_id: user.id,
        chapter_id: activeChapterId,
        block_id: blockId,
        response: responseData,
        score_pct: isScored ? scorePct : null,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'user_id,block_id' })

    setResponses(prev => ({
      ...prev,
      [blockId]: { response: responseData, score_pct: scorePct, submitted: true }
    }))
  }

  async function handleWritingSubmit(blockId, responseData) {
    if (!user) return
    await supabase.from('writing_submissions').insert({
      user_id: user.id,
      block_id: blockId,
      chapter_id: activeChapterId,
      body: responseData.body,
      word_count: responseData.word_count,
    })
    await supabase.from('chapter_block_responses').upsert({
      user_id: user.id,
      chapter_id: activeChapterId,
      block_id: blockId,
      response: responseData,
      score_pct: null,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'user_id,block_id' })

    setResponses(prev => ({
      ...prev,
      [blockId]: { response: responseData, score_pct: null, submitted: true }
    }))
  }

  // ── Mark chapter complete ────────────────────────────────────────────────

  const handleMarkComplete = useCallback(async () => {
    if (!user || !activeChapterId || !course) return
    setCompleting(true)

    await supabase
      .from('user_course_progress')
      .upsert({
        user_id: user.id,
        course_id: course.id,
        chapter_id: activeChapterId,
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,chapter_id' })

    setProgress(prev => ({
      ...prev,
      [activeChapterId]: { completed: true }
    }))

    // Auto-advance to next chapter
    const allChapters = units.flatMap(u => u.chapters)
    const curIdx = allChapters.findIndex(ch => ch.id === activeChapterId)
    if (curIdx >= 0 && curIdx < allChapters.length - 1) {
      setActiveChapterId(allChapters[curIdx + 1].id)
    }

    setCompleting(false)
  }, [user, activeChapterId, course, units])

  // ── Derived state ────────────────────────────────────────────────────────

  const allChapters    = units.flatMap(u => u.chapters)
  const completedCount = allChapters.filter(ch => progress[ch.id]?.completed).length
  const overallPct     = allChapters.length > 0 ? Math.round((completedCount / allChapters.length) * 100) : 0

  let activeChapter = null
  let activeUnit    = null
  for (const unit of units) {
    const ch = unit.chapters.find(c => c.id === activeChapterId)
    if (ch) { activeChapter = ch; activeUnit = unit; break }
  }
  const locked           = activeChapter && activeUnit ? lockReason(activeChapter, activeUnit) : null
  const alreadyComplete  = progress[activeChapterId]?.completed === true

  const CHAPTER_TYPE_COLOURS = {
    lesson:        'bg-indigo-50 text-indigo-600',
    exam_practice: 'bg-amber-50 text-amber-600',
    review:        'bg-purple-50 text-purple-600',
  }
  const CHAPTER_TYPE_LABELS = {
    lesson:        'Lesson',
    exam_practice: 'Exam Practice',
    review:        'Review',
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────

  function Sidebar() {
    return (
      <nav className="space-y-4">
        {allChapters.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Overall progress</span>
              <span>{overallPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        )}

        {units.map((unit, ui) => (
          <div key={unit.id} className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 pt-2">
              {unit.title}
            </p>
            {unit.chapters.map((ch, ci) => {
              const chLocked = lockReason(ch, unit)
              const done     = progress[ch.id]?.completed
              const active   = ch.id === activeChapterId
              const typeLabel = CHAPTER_TYPE_LABELS[ch.chapter_type] || ''

              return (
                <button
                  key={ch.id}
                  onClick={() => { if (!chLocked) { navigate(`/courses/${slug}/chapters/${ch.id}`) } }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors',
                    active
                      ? 'bg-indigo-600 text-white'
                      : chLocked
                        ? 'text-gray-300 cursor-default'
                        : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <span className="shrink-0 text-base">
                    {chLocked === 'pro' ? '🔒' : done ? '✓' : `${ui + 1}.${ci + 1}`}
                  </span>
                  <span className="truncate leading-tight flex-1">{ch.title}</span>
                  {ch.estimated_mins && (
                    <span className={cn('shrink-0 text-xs', active ? 'text-indigo-200' : 'text-gray-300')}>
                      {ch.estimated_mins}m
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading course…</p>
        </div>
      </div>
    )
  }

  if (!course) return null

  return (
    <>
      <PageMeta
        title={`${course.title} — Courses`}
        description={course.description ?? `Learn with this ${course.level ?? ''} English course.`}
        canonical={`/courses/${course.slug || course.id}`}
      />

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle chapter list"
        >
          ☰
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{course.title}</p>
          {activeChapter && (
            <p className="text-sm font-semibold text-gray-900 truncate">{activeChapter.title}</p>
          )}
        </div>
        <span className="text-xs text-gray-400">{overallPct}%</span>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="bg-white w-72 h-full overflow-y-auto p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 truncate">{course.title}</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{course.title}</h1>
                {course.level && (
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {course.level}
                  </span>
                )}
              </div>
              <Sidebar />
            </div>
          </aside>

          {/* Content area */}
          <main className="min-h-[60vh]">
            {!activeChapter ? (
              <CourseHome
                course={course}
                units={units}
                progress={progress}
                allChapters={allChapters}
                completedCount={completedCount}
                overallPct={overallPct}
                lockReason={lockReason}
                onStartChapter={(chId) => {
                  setActiveChapterId(chId)
                  navigate(`/courses/${slug}/chapters/${chId}`)
                }}
                onSelectChapter={(chId) => setActiveChapterId(chId)}
                slug={slug}
                navigate={navigate}
              />
            ) : (
              <div className="space-y-6">
                {/* Chapter header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveChapterId(null)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                    >
                      ← Overview
                    </button>
                    <span className="text-gray-200">·</span>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {activeUnit?.title}
                    </p>
                    {activeChapter.chapter_type && (
                      <span className={cn('text-xs px-2 py-0.5 rounded font-medium', CHAPTER_TYPE_COLOURS[activeChapter.chapter_type] || 'bg-gray-100 text-gray-500')}>
                        {CHAPTER_TYPE_LABELS[activeChapter.chapter_type] || activeChapter.chapter_type}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{activeChapter.title}</h2>
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                    {activeChapter.estimated_mins && (
                      <span>⏱ ~{activeChapter.estimated_mins} min</span>
                    )}
                    {alreadyComplete && (
                      <span className="text-green-600 font-medium">✓ Completed</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {locked ? (
                  <LockedChapter reason={locked} />
                ) : (
                  <div className="py-8 flex flex-col items-center gap-4">
                    <button
                      onClick={() => navigate(`/courses/${slug}/chapters/${activeChapterId}`)}
                      className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-base hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                    >
                      {alreadyComplete ? '↩ Review lesson' : 'Start lesson →'}
                    </button>
                    {alreadyComplete && (
                      <p className="text-xs text-gray-400">You've completed this chapter. Start again to review.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
