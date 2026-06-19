// ExamChallenge.jsx — Daily Exam Challenge (/exam/challenge)
// 5-step daily session: Word Formation / Reading MCQ / Key Word / Vocab MCQ / Open Cloze
// Spec: docs/site-architecture.md — Daily Exam Challenge section
// STATUS: Shell — full implementation coming in content sprint

import { Link } from 'react-router-dom'
import PageMeta from '../../components/PageMeta'

const STEPS = [
  { part: 'Part 3', name: 'Word Formation',          icon: '📝', desc: 'Change the word in CAPITALS to the correct form.' },
  { part: 'Part 5', name: 'Reading — Multiple Choice', icon: '📖', desc: 'Read the paragraph and choose the best answer.' },
  { part: 'Part 4', name: 'Key Word Transformation', icon: '🔑', desc: 'Rewrite the sentence using the key word.' },
  { part: 'Part 1', name: 'Vocabulary MCQ',          icon: '💬', desc: 'Choose the word that best fits the gap.' },
  { part: 'Part 2', name: 'Open Cloze',              icon: '✏️', desc: 'Write the missing word in each gap.' },
]

export default function ExamChallenge() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <PageMeta
        title="Daily Exam Challenge — Cambridge B2 First"
        description="10 minutes of Cambridge-format practice every day. Five questions, one from each exam part. Free to start."
        canonical="/exam/challenge"
      />

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Free · 10 minutes</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-3">Daily Exam Challenge</h1>
        <p className="text-gray-500 leading-relaxed">
          Five Cambridge-format questions — one from each part of the Reading and Use of English paper.
          A new challenge every day.
        </p>
      </div>

      {/* Today's steps */}
      <div className="mb-10">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Today's challenge</h2>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl flex-shrink-0">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-gray-400">{step.part}</span>
                  <span className="text-sm font-semibold text-gray-800">{step.name}</span>
                </div>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
              <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon notice */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-8 text-center mb-10">
        <div className="text-3xl mb-3">🚧</div>
        <h2 className="font-bold text-gray-900 mb-2">Coming soon</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The first season of daily exam challenges is being prepared.
          In the meantime, practise with the grammar reference — all exercises are live now.
        </p>
        <Link
          to="/exam/grammar"
          className="inline-block px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
        >
          Go to Grammar Reference →
        </Link>
      </div>

      {/* What makes a good daily habit */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4">Why 10 minutes a day works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { headline: 'Cambridge format, every day', body: 'Every question matches the exact format and difficulty of the real exam.' },
            { headline: 'Streak and progress tracking', body: 'Build a streak. See which parts you are weakest in. Improve over time.' },
            { headline: 'Exam day confidence', body: 'Familiarity with question types is one of the biggest factors in exam success.' },
          ].map(({ headline, body }) => (
            <div key={headline} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm font-semibold text-gray-800 mb-1">{headline}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
