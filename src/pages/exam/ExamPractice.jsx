// ExamPractice.jsx — Practice Papers (/exam/practice)
// Cambridge B2 First part-by-part practice
// STATUS: Shell — renderer coming post-launch

import { Link } from 'react-router-dom'
import PageMeta from '../../components/PageMeta'

const PARTS = [
  { part: 'Part 1', name: 'Multiple Choice Cloze',   status: 'coming-soon', desc: '8 gaps — choose A, B, C or D' },
  { part: 'Part 2', name: 'Open Cloze',              status: 'coming-soon', desc: '8 gaps — write one word per gap' },
  { part: 'Part 3', name: 'Word Formation',          status: 'coming-soon', desc: '8 gaps — change the word form' },
  { part: 'Part 4', name: 'Key Word Transformation', status: 'coming-soon', desc: '6 sentences — rewrite using the key word' },
  { part: 'Part 5', name: 'Multiple Choice Reading', status: 'coming-soon', desc: 'Long text — 6 multiple choice questions' },
  { part: 'Part 6', name: 'Gapped Text',             status: 'coming-soon', desc: 'Text with 6 removed sentences to place' },
  { part: 'Part 7', name: 'Multiple Matching',       status: 'coming-soon', desc: '10 questions across 4–5 short texts' },
]

export default function ExamPractice() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <PageMeta
        title="Practice Papers — Cambridge B2 First"
        description="Part-by-part practice papers in Cambridge B2 First format. Timed mode with question navigator."
        canonical="/exam/practice"
      />

      <div className="mb-10">
        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Cambridge format</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-3">Practice Papers</h1>
        <p className="text-gray-500 leading-relaxed">
          Cambridge B2 First practice, part by part. Same format and difficulty as the real exam.
          Timed mode with a question navigator and flag-for-review.
        </p>
      </div>

      <div className="space-y-3 mb-12">
        {PARTS.map(({ part, name, desc }) => (
          <div key={part} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex-shrink-0 w-14 text-xs font-bold text-gray-400">{part}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Coming soon</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-gray-50 border border-gray-100 px-6 py-7">
        <h3 className="font-bold text-gray-900 mb-1">Practice with Grammar Reference now</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Full practice papers are coming soon. In the meantime, the Grammar Reference has live exercises
          for Parts 1–4.
        </p>
        <Link
          to="/exam/grammar"
          className="inline-block px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
        >
          Go to Grammar Reference →
        </Link>
      </div>
    </div>
  )
}
