// ExamWriting.jsx — Writing Grader (/exam/writing)
// Cambridge rubric AI feedback (Claude API)
// STATUS: Shell — implementation post-launch

import { Link } from 'react-router-dom'
import PageMeta from '../../components/PageMeta'

const CRITERIA = [
  { name: 'Content',                    desc: 'Does the writing cover all the points required by the task?' },
  { name: 'Communicative Achievement',  desc: 'Is the register appropriate? Does it achieve its purpose?' },
  { name: 'Organisation',              desc: 'Is the writing well-structured with clear cohesion and coherence?' },
  { name: 'Language',                  desc: 'Is the grammar and vocabulary accurate, varied and appropriate?' },
]

export default function ExamWriting() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <PageMeta
        title="Writing Grader — Cambridge B2 First"
        description="Submit your B2 First essay or letter and get a score on all four Cambridge criteria with detailed feedback."
        canonical="/exam/writing"
      />

      <div className="mb-8">
        <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">AI-powered · Cambridge rubric</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-3">Writing Grader</h1>
        <p className="text-gray-500 leading-relaxed">
          Submit an essay, letter, article or review. Get a score for each Cambridge criterion
          with detailed feedback and suggestions.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-10">
        <h2 className="text-base font-bold text-gray-900 mb-4">How it works</h2>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Write your answer to a Cambridge-style task prompt' },
            { step: '2', text: 'Submit it here — the AI analyses it against Cambridge criteria' },
            { step: '3', text: 'Get a score out of 5 for each criterion, with line-by-line feedback' },
            { step: '4', text: 'See a model answer and compare yours' },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                {step}
              </div>
              <p className="text-sm text-gray-700 pt-1 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cambridge criteria */}
      <div className="mb-10">
        <h2 className="text-base font-bold text-gray-900 mb-4">Cambridge marking criteria</h2>
        <div className="space-y-3">
          {CRITERIA.map(({ name, desc }) => (
            <div key={name} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-400 mt-2" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{name}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Each criterion is scored 0–5. Maximum total: 20 marks.</p>
      </div>

      {/* Coming soon */}
      <div className="rounded-2xl bg-purple-50 border border-purple-100 px-6 py-8 text-center">
        <div className="text-3xl mb-3">✍️</div>
        <h2 className="font-bold text-gray-900 mb-2">Coming soon</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The Writing Grader is being finalised. Once live, free users get 2 submissions per week.
          Pro users get unlimited submissions.
        </p>
        <Link
          to="/exam/grammar"
          className="inline-block px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
        >
          Practise grammar instead →
        </Link>
      </div>
    </div>
  )
}
