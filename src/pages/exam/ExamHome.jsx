// ExamHome.jsx — Exam Centre home (/exam)
// Cambridge B2 First prep hub
// Spec: docs/site-architecture.md — Exam Centre home section

import { Link } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import PageMeta from '../../components/PageMeta'

const EXAM_CARDS = [
  {
    label: 'Daily Challenge',
    to: '/exam/challenge',
    description: '10 minutes a day. Five Cambridge-format questions — one from each exam part.',
    colour: 'bg-amber-50 border-amber-200',
    badge: 'Free',
    badgeColour: 'bg-amber-100 text-amber-700',
  },
  {
    label: 'Grammar Reference',
    to: '/exam/grammar',
    description: 'Clear explanations and free exercises for every B2 grammar point.',
    colour: 'bg-slate-50 border-slate-200',
    badge: 'Free',
    badgeColour: 'bg-slate-100 text-slate-600',
  },
  {
    label: 'Practice Papers',
    to: '/exam/practice',
    description: 'Cambridge-format practice for all seven parts of the Reading and Use of English paper.',
    colour: 'bg-blue-50 border-blue-200',
    badge: 'Coming soon',
    badgeColour: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'Writing Grader',
    to: '/exam/writing',
    description: 'Submit your essay or letter. Get a score on all four Cambridge criteria with detailed feedback.',
    colour: 'bg-purple-50 border-purple-200',
    badge: 'Coming soon',
    badgeColour: 'bg-purple-100 text-purple-600',
  },
]

const EXAM_PARTS = [
  { part: 'Part 1', name: 'Multiple Choice Cloze',    desc: 'Vocabulary in context' },
  { part: 'Part 2', name: 'Open Cloze',               desc: 'Grammar and structure' },
  { part: 'Part 3', name: 'Word Formation',           desc: 'Prefixes, suffixes, roots' },
  { part: 'Part 4', name: 'Key Word Transformation',  desc: 'Sentence rewriting' },
  { part: 'Part 5', name: 'Multiple Choice Reading',  desc: 'Detail and inference' },
  { part: 'Part 6', name: 'Gapped Text',              desc: 'Cohesion and coherence' },
  { part: 'Part 7', name: 'Multiple Matching',        desc: 'Skimming and scanning' },
]

export default function ExamHome() {
  const { userId, isPro } = useOutletContext?.() || {}

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <PageMeta
        title="Exam Centre — Cambridge B2 First Preparation"
        description="Daily practice, grammar reference and writing feedback for Cambridge B2 First. Free to start."
        canonical="/exam"
      />

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cambridge B2 First</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 leading-tight mb-3">
          Exam Centre
        </h1>
        <p className="text-gray-500 max-w-xl leading-relaxed">
          Everything you need to pass Cambridge B2 First. Daily practice, grammar
          explanations, writing feedback — all in one place. Free to start.
        </p>
      </div>

      {/* Four feature cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-14">
        {EXAM_CARDS.map(card => (
          <Link
            key={card.label}
            to={card.to}
            className={`group flex flex-col border rounded-2xl p-6 hover:shadow-md transition-all ${card.colour}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-base">{card.label}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.badgeColour}`}>
                {card.badge}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed flex-1">{card.description}</p>
            <p className="mt-4 text-sm font-semibold text-gray-900 group-hover:underline">
              Go to {card.label} →
            </p>
          </Link>
        ))}
      </div>

      {/* Exam parts overview */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-5">About Cambridge B2 First</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-2xl leading-relaxed">
          The Reading and Use of English paper has seven parts. The daily challenge covers one question
          from each of Parts 1–4 and one reading extract. Here is what each part tests:
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXAM_PARTS.map(({ part, name, desc }) => (
            <div
              key={part}
              className="flex gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100"
            >
              <div className="flex-shrink-0 w-16 text-xs font-bold text-slate-500 pt-0.5">{part}</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Courses promo */}
      <div className="mt-14 rounded-2xl bg-slate-50 border border-slate-100 px-6 py-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Want a full preparation course?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            The B2 First Complete Preparation course takes you through every part of the exam,
            step by step. Available in Courses.
          </p>
        </div>
        <Link
          to="/courses"
          className="flex-shrink-0 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
        >
          Browse courses →
        </Link>
      </div>
    </div>
  )
}
