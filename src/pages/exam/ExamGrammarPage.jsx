// ExamGrammarPage.jsx — Individual grammar point page (/exam/grammar/:point)
// SEO surface: free, no sign-up required
// Pulls explanation content + 3 free exercises from grammar_items
// Spec: docs/site-architecture.md — Grammar Reference → each grammar point page

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Slug ↔ grammar_point conversion ──────────────────────────────────────────

function slugToPoint(slug) {
  return slug.replace(/-/g, '_')
}

// ── Grammar point content (explanations) ─────────────────────────────────────
// Each entry: { title, level, intro, examples[], notes[] }
// These are the free explanations shown to all users before the exercises

const EXPLANATIONS = {
  conditionals: {
    title: 'Conditionals',
    level: 'B1–B2',
    intro: `Conditionals describe situations and their results. English has four main
conditional forms, each used for a different type of situation.`,
    structures: [
      { name: 'Zero conditional', form: 'If + present simple, present simple', example: 'If you heat water to 100°C, it boils.', use: 'Facts and general truths' },
      { name: 'First conditional', form: 'If + present simple, will + infinitive', example: 'If it rains tomorrow, we will stay inside.', use: 'Real future possibilities' },
      { name: 'Second conditional', form: 'If + past simple, would + infinitive', example: 'If I had more time, I would study harder.', use: 'Unreal or unlikely present/future' },
      { name: 'Third conditional', form: 'If + past perfect, would have + past participle', example: 'If she had studied, she would have passed.', use: 'Unreal past — imagining a different outcome' },
    ],
    notes: [
      'The if-clause can come first or second: "We would stay inside if it rained" is equally correct.',
      'Mixed conditionals combine second and third: "If I had studied harder, I would be a doctor now."',
      'In formal writing, you can use "were" instead of "was" in second conditionals: "If he were here, he would agree."',
    ],
  },
  passive_voice: {
    title: 'Passive Voice',
    level: 'B1–B2',
    intro: `The passive voice is used when the action is more important than who does it,
or when we do not know who does the action.`,
    structures: [
      { name: 'Present simple passive', form: 'am/is/are + past participle', example: 'The report is written every week.', use: 'Regular or ongoing actions' },
      { name: 'Past simple passive', form: 'was/were + past participle', example: 'The bridge was built in 1889.', use: 'Completed past actions' },
      { name: 'Present perfect passive', form: 'has/have been + past participle', example: 'The results have been announced.', use: 'Recent completed actions' },
      { name: 'Future passive', form: 'will be + past participle', example: 'The decision will be made tomorrow.', use: 'Future actions' },
    ],
    notes: [
      'Use "by" + agent only when the agent is important or surprising: "The cake was eaten by the dog."',
      'Verbs with two objects (give, send, tell) can form passives in two ways: "She was given the prize" or "The prize was given to her."',
      'Cambridge B2 Part 4 often tests passive transformations — practise switching active ↔ passive.',
    ],
  },
  reported_speech: {
    title: 'Reported Speech',
    level: 'B1–B2',
    intro: `Reported speech (also called indirect speech) is used to report what someone said
without quoting their exact words. Tenses usually shift back one step.`,
    structures: [
      { name: 'Direct → reported (tense shift)', form: 'Present simple → past simple', example: '"I work here." → She said she worked there.', use: 'Standard tense backshift' },
      { name: 'Will → would', form: 'will → would', example: '"I will call you." → He said he would call.', use: 'Future statements' },
      { name: 'Can → could', form: 'can → could', example: '"I can help." → She said she could help.', use: 'Ability / offers' },
      { name: 'Reporting questions', form: 'if/whether for yes/no; wh-word for wh-questions', example: '"Are you coming?" → He asked if I was coming.', use: 'Reported questions — note: no question mark, no inversion' },
    ],
    notes: [
      'Time expressions also shift: "today" → "that day", "yesterday" → "the day before", "tomorrow" → "the next day".',
      'If reporting something still true now, the tense shift is optional: "She said the Earth is round" (not: was).',
      'Reporting verbs other than "say/tell": told, asked, explained, warned, promised, suggested, admitted, denied.',
    ],
  },
  modal_verbs: {
    title: 'Modal Verbs',
    level: 'B1–B2',
    intro: `Modal verbs (can, could, may, might, must, should, will, would, shall, ought to)
add meaning about ability, possibility, obligation, permission or deduction.`,
    structures: [
      { name: 'Deduction (present)', form: 'must / can\'t / might / could + infinitive', example: 'She must be tired — she worked all night.', use: 'Logical conclusions about now' },
      { name: 'Deduction (past)', form: 'must / can\'t / might / could + have + past participle', example: 'He can\'t have forgotten — he wrote it down.', use: 'Logical conclusions about the past' },
      { name: 'Obligation', form: 'must / have to / should / ought to', example: 'You must submit the form by Friday.', use: 'Necessity and advice' },
      { name: 'Permission / possibility', form: 'can / could / may / might', example: 'You may leave early if you finish.', use: 'Formal permission; uncertain possibility' },
    ],
    notes: [
      '"Must" = internal obligation (I decide). "Have to" = external obligation (rules, laws).',
      '"Needn\'t have" = did something but it was unnecessary. "Didn\'t need to" = wasn\'t necessary (did or didn\'t).',
      'Cambridge B2 tests modals heavily in Part 4 (key word transformations) and Part 2 (open cloze).',
    ],
  },
  articles: {
    title: 'Articles (a / an / the)',
    level: 'B1–B2',
    intro: `English has two articles: the definite article "the" and the indefinite article "a/an".
Knowing when to use each — or no article at all — is essential at B2 level.`,
    structures: [
      { name: 'The — definite article', form: 'the + noun', example: 'The sun rises in the east.', use: 'Something already known; only one of its kind; superlatives' },
      { name: 'A/An — indefinite article', form: 'a/an + singular countable noun', example: 'She bought a book and an umbrella.', use: 'First mention; one of many; jobs and roles' },
      { name: 'No article (zero article)', form: '— + noun', example: 'I love music. He studies medicine.', use: 'Plural/uncountable nouns in general; proper nouns; meals, languages, sports' },
    ],
    notes: [
      '"The" with unique things: the moon, the Internet, the 1990s, the north of Spain.',
      'No article with most proper nouns: Spain, London, Mount Everest — but: the United Kingdom, the Nile.',
      'Cambridge B2 Part 2 (open cloze) frequently tests articles — they are function words and valid answers.',
    ],
  },
  linking_words: {
    title: 'Linking Words',
    level: 'B1–B2',
    intro: `Linking words connect ideas within and between sentences. They show contrast,
reason, result, addition, concession and more. Essential for writing tasks.`,
    structures: [
      { name: 'Addition', form: 'furthermore / moreover / in addition / besides', example: 'The hotel was expensive. Furthermore, the service was poor.', use: 'Adding a point, often reinforcing' },
      { name: 'Contrast', form: 'however / nevertheless / on the other hand / whereas', example: 'I like coffee. However, I try not to drink it too late.', use: 'Opposing ideas' },
      { name: 'Concession', form: 'although / even though / despite / in spite of', example: 'Although she was tired, she finished the report.', use: '"Despite the fact" — unexpected contrast' },
      { name: 'Result', form: 'therefore / consequently / as a result / so', example: 'He missed the bus; consequently, he arrived late.', use: 'Cause and effect' },
    ],
    notes: [
      '"Although/even though" + clause; "despite/in spite of" + noun or -ing: "Despite being tired..." / "In spite of the rain..."',
      'Don\'t confuse "however" (contrast) with "therefore" (result) — a common error in writing tasks.',
      'Cambridge B2 Writing: examiners reward a variety of linking devices used accurately. Avoid overusing "also" and "and".',
    ],
  },
}

// ── Exercise components ───────────────────────────────────────────────────────

function MCQExercise({ item, index, answered, onAnswer }) {
  const selected = answered[item.id]

  return (
    <div className={`rounded-xl p-5 border transition-all ${
      selected
        ? selected === item.answer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        : 'bg-white border-gray-200'
    }`}>
      <p className="text-sm font-medium text-gray-800 mb-3">
        {index + 1}. {item.content}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(item.options || []).map((opt, i) => {
          const letter = ['A', 'B', 'C', 'D'][i]
          const isCorrect = opt === item.answer
          const isSelected = selected === opt
          return (
            <button
              key={i}
              onClick={() => !selected && onAnswer(item.id, opt)}
              disabled={!!selected}
              className={`text-left text-sm px-3 py-2 rounded-lg border transition-all ${
                selected
                  ? isCorrect
                    ? 'bg-green-100 border-green-400 text-green-800 font-medium'
                    : isSelected
                      ? 'bg-red-100 border-red-400 text-red-800'
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <span className="font-semibold mr-1">{letter}.</span> {opt}
            </button>
          )
        })}
      </div>
      {selected && item.explanation && (
        <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
          {item.explanation}
        </p>
      )}
    </div>
  )
}

function OpenClozeExercise({ item, index, answered, onAnswer }) {
  const [input, setInput]   = useState('')
  const submitted = answered[item.id]

  function check() {
    if (!input.trim()) return
    onAnswer(item.id, input.trim().toLowerCase())
  }

  const isCorrect = submitted && submitted === item.answer?.toLowerCase()

  return (
    <div className={`rounded-xl p-5 border transition-all ${
      submitted
        ? isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        : 'bg-white border-gray-200'
    }`}>
      <p className="text-sm font-medium text-gray-800 mb-3">
        {index + 1}. {item.content}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !submitted && check()}
          disabled={!!submitted}
          placeholder="Type your answer…"
          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
        />
        {!submitted && (
          <button
            onClick={check}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Check
          </button>
        )}
      </div>
      {submitted && (
        <div className="mt-2 text-sm">
          {isCorrect
            ? <span className="text-green-700 font-medium">Correct!</span>
            : <span className="text-red-700">Correct answer: <strong>{item.answer}</strong></span>
          }
          {item.explanation && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">{item.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExamGrammarPage() {
  const { point: slug } = useParams()
  const grammarPoint    = slugToPoint(slug || '')
  const explanation     = EXPLANATIONS[grammarPoint]

  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [answered, setAnswered] = useState({})

  useEffect(() => {
    async function load() {
      // Pick 3 exercises: prefer MCQ first, then OC, then others
      // Free sample — always 3 items, no auth needed
      const { data } = await supabase
        .from('grammar_items')
        .select('id, content, answer, options, explanation, skill_type, difficulty')
        .eq('grammar_point', grammarPoint)
        .in('skill_type', ['mcq', 'open_cloze', 'fill_in'])
        .eq('difficulty', 'B2')
        .limit(6)

      if (data && data.length > 0) {
        // Take up to 2 MCQ + 1 OC (or whatever is available)
        const mcqs = data.filter(i => i.skill_type === 'mcq').slice(0, 2)
        const oc   = data.filter(i => ['open_cloze', 'fill_in'].includes(i.skill_type)).slice(0, 1)
        setItems([...mcqs, ...oc].slice(0, 3))
      }
      setLoading(false)
    }

    if (grammarPoint) load()
  }, [grammarPoint])

  function handleAnswer(id, value) {
    setAnswered(prev => ({ ...prev, [id]: value }))
  }

  const title    = explanation?.title || slug?.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || 'Grammar'
  const pageTitle = `${title} — B2 Grammar Reference`

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <PageMeta
        title={pageTitle}
        description={`Free explanation and exercises for ${title} at B2 level. Cambridge B2 First grammar reference.`}
        canonical={`/exam/grammar/${slug}`}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/exam" className="hover:text-gray-700 transition-colors">Exam Centre</Link>
        <span>›</span>
        <Link to="/exam/grammar" className="hover:text-gray-700 transition-colors">Grammar</Link>
        <span>›</span>
        <span className="text-gray-600">{title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          {explanation?.level || 'B1–B2'} · Free exercises
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-4">{title}</h1>
        {explanation?.intro && (
          <p className="text-gray-600 leading-relaxed text-base">
            {explanation.intro}
          </p>
        )}
      </div>

      {/* Structures table */}
      {explanation?.structures && (
        <div className="mb-10">
          <h2 className="text-base font-bold text-gray-900 mb-4">Forms and uses</h2>
          <div className="space-y-3">
            {explanation.structures.map(({ name, form, example, use }) => (
              <div key={name} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-2">
                  <span className="text-sm font-bold text-gray-800">{name}</span>
                  <code className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{form}</code>
                </div>
                <p className="text-sm text-gray-700 italic mb-1">"{example}"</p>
                <p className="text-xs text-gray-500">{use}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {explanation?.notes && (
        <div className="mb-10">
          <h2 className="text-base font-bold text-gray-900 mb-3">Things to remember</h2>
          <ul className="space-y-2">
            {explanation.notes.map((note, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                <span className="text-gray-300 flex-shrink-0 mt-0.5">—</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No explanation yet */}
      {!explanation && (
        <div className="mb-10 p-6 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-sm text-gray-500">
            The full explanation for this grammar point is being written. The exercises below are available now.
          </p>
        </div>
      )}

      {/* ── Exercises ──────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-base font-bold text-gray-900 mb-1">Free exercises</h2>
        <p className="text-sm text-gray-400 mb-5">3 questions from our B2 question bank</p>

        {loading ? (
          <div className="py-10 text-center">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Exercises for this topic are being added soon.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => (
              item.skill_type === 'mcq'
                ? <MCQExercise key={item.id} item={item} index={i} answered={answered} onAnswer={handleAnswer} />
                : <OpenClozeExercise key={item.id} item={item} index={i} answered={answered} onAnswer={handleAnswer} />
            ))}
          </div>
        )}
      </div>

      {/* CTA — daily challenge */}
      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-6 py-7 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">More practice — Daily Exam Challenge</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Five Cambridge-format questions every day. Free to start, no sign-up required.
          </p>
        </div>
        <Link
          to="/exam/challenge"
          className="flex-shrink-0 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
        >
          Start today's challenge →
        </Link>
      </div>

      {/* Back link */}
      <div className="mt-10">
        <Link to="/exam/grammar" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Back to Grammar Reference
        </Link>
      </div>
    </div>
  )
}
