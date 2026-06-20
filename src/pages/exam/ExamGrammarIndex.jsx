// ExamGrammarIndex.jsx — Grammar Reference index (/exam/grammar)
// SEO surface: free, no sign-up required
// Pulls distinct grammar_points from grammar_items table and groups by category
// Spec: docs/site-architecture.md — Grammar Reference section

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Grammar point metadata ────────────────────────────────────────────────────
// Maps grammar_point slugs → display name + category + which exam parts it appears in
// B2 First exam parts: Part 1 (MCQ cloze), Part 2 (Open cloze), Part 3 (Word formation),
// Part 4 (Key word transformations), Part 5-7 (Reading), Writing (emails/essays/articles/reviews)

const GRAMMAR_META = {
  // ── Core grammar
  conditionals:               { name: 'Conditionals',                     cat: 'Core Grammar',          parts: [2, 4] },
  passive_voice:              { name: 'Passive Voice',                    cat: 'Core Grammar',          parts: [2, 4] },
  reported_speech:            { name: 'Reported Speech',                  cat: 'Core Grammar',          parts: [4] },
  modal_verbs:                { name: 'Modal Verbs',                      cat: 'Core Grammar',          parts: [2, 4] },
  relative_clauses:           { name: 'Relative Clauses',                 cat: 'Core Grammar',          parts: [2, 4] },
  gerunds_infinitives:        { name: 'Gerunds and Infinitives',          cat: 'Core Grammar',          parts: [1, 2, 4] },
  present_perfect_past_simple:{ name: 'Present Perfect vs Past Simple',   cat: 'Core Grammar',          parts: [2, 4] },
  comparatives_superlatives:  { name: 'Comparatives and Superlatives',    cat: 'Core Grammar',          parts: [2, 4] },
  unreal_past:                { name: 'Unreal Past (wish / if only)',      cat: 'Core Grammar',          parts: [4] },
  causative_structures:       { name: 'Causative Structures (have/get)',   cat: 'Core Grammar',          parts: [4] },
  participle_clauses:         { name: 'Participle Clauses',               cat: 'Core Grammar',          parts: [2, 4] },

  // ── Vocabulary and usage
  articles:                   { name: 'Articles (a / an / the)',           cat: 'Vocabulary and Usage',  parts: [2] },
  quantifiers:                { name: 'Quantifiers',                      cat: 'Vocabulary and Usage',  parts: [2] },
  prepositions:               { name: 'Prepositions',                     cat: 'Vocabulary and Usage',  parts: [1, 2, 4] },
  linking_words:              { name: 'Linking Words',                    cat: 'Vocabulary and Usage',  parts: [2, 'W'] },
  vocabulary_confusables:     { name: 'Confusable Words',                 cat: 'Vocabulary and Usage',  parts: [1] },
  make_do_take_have:          { name: 'Make / Do / Take / Have',           cat: 'Vocabulary and Usage',  parts: [1, 4] },
  phrasal_verbs_exam:         { name: 'Phrasal Verbs',                    cat: 'Vocabulary and Usage',  parts: [1, 4] },
  word_formation:             { name: 'Word Formation',                   cat: 'Vocabulary and Usage',  parts: [3] },

  // ── Advanced structures
  emphasis_inversion:         { name: 'Emphasis and Inversion',           cat: 'Advanced Structures',   parts: [2, 4, 'W'] },
  spelling:                   { name: 'Spelling',                         cat: 'Advanced Structures',   parts: [3, 'W'] },
}

// ── Category display order
const CAT_ORDER = ['Core Grammar', 'Vocabulary and Usage', 'Advanced Structures']

// ── Which exam parts each grammar point appears in — for the "by part" view
const PART_META = {
  1:   { label: 'Part 1', description: 'Multiple-choice cloze', colour: 'bg-blue-50 text-blue-700 border-blue-200' },
  2:   { label: 'Part 2', description: 'Open cloze',            colour: 'bg-violet-50 text-violet-700 border-violet-200' },
  3:   { label: 'Part 3', description: 'Word formation',        colour: 'bg-orange-50 text-orange-700 border-orange-200' },
  4:   { label: 'Part 4', description: 'Key word transformation', colour: 'bg-rose-50 text-rose-700 border-rose-200' },
  W:   { label: 'Writing', description: 'Email, essay, article, review', colour: 'bg-teal-50 text-teal-700 border-teal-200' },
}

// ── Pretty slug → URL segment
function toSlug(grammarPoint) {
  return grammarPoint.replace(/_/g, '-')
}

function PartBadge({ part, small = false }) {
  const m = PART_META[part]
  if (!m) return null
  return (
    <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded border ${m.colour} ${small ? 'text-[10px]' : ''}`}>
      {m.label}
    </span>
  )
}

// ── Grammar card ──────────────────────────────────────────────────────────────

function GrammarCard({ point, name, count, parts = [] }) {
  return (
    <Link
      to={`/exam/grammar/${toSlug(point)}`}
      className="group flex flex-col justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 leading-snug">
          {name}
        </p>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 flex-wrap">
          {parts.map(p => <PartBadge key={p} part={p} small />)}
        </div>
        {count > 0 && (
          <p className="text-xs text-gray-400 flex-shrink-0">
            {count} exercise{count !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExamGrammarIndex() {
  const [counts,  setCounts]  = useState({})  // grammar_point → item count
  const [loading, setLoading] = useState(true)
  const [view,    setView]    = useState('category')  // 'category' | 'part' | 'az'

  useEffect(() => {
    async function loadCounts() {
      const { data, error } = await supabase
        .from('grammar_items')
        .select('grammar_point')

      if (error || !data) { setLoading(false); return }

      const tally = {}
      data.forEach(({ grammar_point }) => {
        tally[grammar_point] = (tally[grammar_point] || 0) + 1
      })
      setCounts(tally)
      setLoading(false)
    }

    loadCounts()
  }, [])

  // All entries enriched with counts
  const allPoints = Object.entries(GRAMMAR_META).map(([point, meta]) => ({
    point,
    ...meta,
    count: counts[point] || 0,
  }))

  // ── By category view
  const grouped = {}
  CAT_ORDER.forEach(cat => { grouped[cat] = [] })
  allPoints.forEach(entry => {
    if (grouped[entry.cat]) grouped[entry.cat].push(entry)
  })

  // ── By exam part view
  const byPart = {}
  Object.keys(PART_META).forEach(p => { byPart[p] = [] })
  allPoints.forEach(entry => {
    ;(entry.parts || []).forEach(p => {
      if (byPart[String(p)]) byPart[String(p)].push(entry)
    })
  })

  // ── A–Z view
  const azPoints = [...allPoints].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <PageMeta
        title="Grammar Reference — Cambridge B2 First"
        description="Free grammar explanations and exercises for every B2 First grammar point. Conditionals, passive voice, reported speech, modal verbs and more."
        canonical="/exam/grammar"
      />

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Free — no sign-up required</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 leading-tight mb-3">
          Grammar Reference
        </h1>
        <p className="text-gray-500 max-w-xl leading-relaxed">
          Clear explanations and practice exercises for every grammar point tested in Cambridge B2 First.
          Each page includes examples at B1–B2 level plus free exercises from our question bank.
        </p>
      </div>

      {/* Exam part legend */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Object.entries(PART_META).map(([key, m]) => (
          <div key={key} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${m.colour}`}>
            <span className="font-bold">{m.label}</span>
            <span className="opacity-70">·</span>
            <span>{m.description}</span>
          </div>
        ))}
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 mb-8 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { key: 'category', label: 'By topic' },
          { key: 'part',     label: 'By exam part' },
          { key: 'az',       label: 'A–Z' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grammar sections */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* By category */}
          {view === 'category' && (
            <div className="space-y-10">
              {CAT_ORDER.map(cat => (
                <section key={cat}>
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                    {cat}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {grouped[cat].map(entry => (
                      <GrammarCard key={entry.point} {...entry} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* By exam part */}
          {view === 'part' && (
            <div className="space-y-10">
              {Object.entries(PART_META).map(([key, m]) => (
                <section key={key}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-sm font-bold text-gray-900">{m.label}</h2>
                    <span className="text-xs text-gray-400">{m.description}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {byPart[key].map(entry => (
                      <GrammarCard key={entry.point} {...entry} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* A–Z */}
          {view === 'az' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {azPoints.map(entry => (
                <GrammarCard key={entry.point} {...entry} />
              ))}
            </div>
          )}
        </>
      )}

      {/* CTA — daily challenge */}
      <div className="mt-14 rounded-2xl bg-amber-50 border border-amber-100 px-6 py-7 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Practice with the Daily Exam Challenge</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Five Cambridge-format questions every day — one from each exam part.
            Takes 10 minutes. Builds a streak.
          </p>
        </div>
        <Link
          to="/exam/challenge"
          className="flex-shrink-0 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
        >
          Start today's challenge →
        </Link>
      </div>
    </div>
  )
}
