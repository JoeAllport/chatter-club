// ExamGrammarIndex.jsx — Grammar Reference index (/exam/grammar)
// SEO surface: free, no sign-up required
// Pulls distinct grammar_points from grammar_items table and groups by category
// Spec: docs/site-architecture.md — Grammar Reference section

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Grammar point metadata ────────────────────────────────────────────────────
// Maps grammar_point slugs → display name + category
// Add here as new grammar points are added to the bank

const GRAMMAR_META = {
  // ── Core grammar
  conditionals:               { name: 'Conditionals',                     cat: 'Core Grammar' },
  passive_voice:              { name: 'Passive Voice',                    cat: 'Core Grammar' },
  reported_speech:            { name: 'Reported Speech',                  cat: 'Core Grammar' },
  modal_verbs:                { name: 'Modal Verbs',                      cat: 'Core Grammar' },
  relative_clauses:           { name: 'Relative Clauses',                 cat: 'Core Grammar' },
  gerunds_infinitives:        { name: 'Gerunds and Infinitives',          cat: 'Core Grammar' },
  present_perfect_past_simple:{ name: 'Present Perfect vs Past Simple',   cat: 'Core Grammar' },
  comparatives_superlatives:  { name: 'Comparatives and Superlatives',    cat: 'Core Grammar' },
  unreal_past:                { name: 'Unreal Past (wish / if only)',      cat: 'Core Grammar' },
  causative_structures:       { name: 'Causative Structures (have/get)',   cat: 'Core Grammar' },
  participle_clauses:         { name: 'Participle Clauses',               cat: 'Core Grammar' },

  // ── Vocabulary and usage
  articles:                   { name: 'Articles (a / an / the)',           cat: 'Vocabulary and Usage' },
  quantifiers:                { name: 'Quantifiers',                      cat: 'Vocabulary and Usage' },
  prepositions:               { name: 'Prepositions',                     cat: 'Vocabulary and Usage' },
  linking_words:              { name: 'Linking Words',                    cat: 'Vocabulary and Usage' },
  vocabulary_confusables:     { name: 'Confusable Words',                 cat: 'Vocabulary and Usage' },
  make_do_take_have:          { name: 'Make / Do / Take / Have',           cat: 'Vocabulary and Usage' },
  phrasal_verbs_exam:         { name: 'Phrasal Verbs',                    cat: 'Vocabulary and Usage' },
  word_formation:             { name: 'Word Formation',                   cat: 'Vocabulary and Usage' },

  // ── Advanced structures
  emphasis_inversion:         { name: 'Emphasis and Inversion',           cat: 'Advanced Structures' },
  spelling:                   { name: 'Spelling',                         cat: 'Advanced Structures' },
}

// ── Category display order
const CAT_ORDER = ['Core Grammar', 'Vocabulary and Usage', 'Advanced Structures']

// ── Pretty slug → URL segment
function toSlug(grammarPoint) {
  return grammarPoint.replace(/_/g, '-')
}

export default function ExamGrammarIndex() {
  const [counts, setCounts] = useState({})  // grammar_point → item count
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCounts() {
      // Fetch distinct grammar_points with counts
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

  // Group known grammar points by category
  const grouped = {}
  CAT_ORDER.forEach(cat => { grouped[cat] = [] })

  Object.entries(GRAMMAR_META).forEach(([point, { name, cat }]) => {
    if (grouped[cat]) {
      grouped[cat].push({ point, name, count: counts[point] || 0 })
    }
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <PageMeta
        title="Grammar Reference — Cambridge B2 First"
        description="Free grammar explanations and exercises for every B2 First grammar point. Conditionals, passive voice, reported speech, modal verbs and more."
        canonical="/exam/grammar"
      />

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Free — no sign-up required</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 leading-tight mb-3">
          Grammar Reference
        </h1>
        <p className="text-gray-500 max-w-xl leading-relaxed">
          Clear explanations and practice exercises for every grammar point tested in Cambridge B2 First.
          Each page includes examples at B1 and B2 level plus free exercises from our question bank.
        </p>
      </div>

      {/* Grammar sections */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-12">
          {CAT_ORDER.map(cat => (
            <section key={cat}>
              <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                {cat}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[cat].map(({ point, name, count }) => (
                  <Link
                    key={point}
                    to={`/exam/grammar/${toSlug(point)}`}
                    className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                        {name}
                      </p>
                      {count > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {count} exercise{count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
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
