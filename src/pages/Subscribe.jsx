// Subscribe.jsx — Pro subscription page (/subscribe)
// Pre-Stripe: shows what Pro includes + "coming soon" sign-up interest form
// Post-Stripe: replace the CTA with Stripe Checkout link

import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'

const FREE_FEATURES = [
  "Today's Daily Challenge",
  "Today's puzzle",
  "This week's article (one tier)",
  "This week's podcast episode",
  "Level test",
  "Grammar reference + free exercises",
  "50-word word bank",
]

const PRO_FEATURES = [
  { label: "Full article archive",        desc: "Every article, all three tiers — Easy, Medium, Advanced" },
  { label: "Full podcast library",        desc: "Every episode with interactive transcripts" },
  { label: "Unlimited word bank",         desc: "Save every word you look up, export anytime" },
  { label: "All puzzles, every day",      desc: "Access past puzzles — Wordle, Connections, Hive, Ladder, Crossword" },
  { label: "All Daily Challenges",        desc: "Full challenge history, not just today's" },
  { label: "Courses",                     desc: "Self-paced English courses at your level" },
  { label: "Exam Prep courses",           desc: "Cambridge B2 First and more — full course access" },
  { label: "Priority new content",        desc: "New articles and episodes as soon as they go live" },
]

export default function Subscribe() {
  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleNotify(e) {
    e.preventDefault()
    if (!email.trim()) return
    // TODO: wire to Supabase waiting list table when Stripe is ready
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <PageMeta
        title="Subscribe to Pro — Chatter Club"
        description="Unlock the full Chatter Club experience — every article, every podcast, unlimited word bank, all puzzles and courses. Coming soon."
        canonical="/subscribe"
      />

      {/* Nav back link */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Back to Chatter Club
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-yellow/30 border border-yellow/60 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-4">
            Pro
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-950 tracking-tight mb-4">
            Everything. Every day.
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
            Unlock the full Chatter Club library — every article, every podcast, every puzzle, every course.
          </p>
        </div>

        {/* Pricing placeholder */}
        <div className="max-w-sm mx-auto mb-12">
          <div className="rounded-2xl border-2 border-yellow/60 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-gray-500 mb-1">Pro membership</p>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-5xl font-bold text-gray-950">£6</span>
              <span className="text-gray-400 text-sm mb-2">/month</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">or £48/year — save 33%</p>

            {/* Coming soon notice */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-5">
              <p className="text-sm font-semibold text-amber-800 mb-1">Launching soon</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Pro subscriptions are coming soon. Leave your email and we'll let you know the moment it opens — plus an early-bird discount.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4">
                <p className="text-sm font-semibold text-green-800">✓ You're on the list</p>
                <p className="text-xs text-green-700 mt-1">We'll email you when Pro launches.</p>
              </div>
            ) : (
              <form onSubmit={handleNotify} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-gray-50"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Notify me when Pro launches
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Two-column comparison */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">

          {/* Free */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Free</h2>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="text-gray-400 flex-shrink-0 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-yellow/60 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-yellow-700 uppercase tracking-widest mb-4">Pro — everything above plus</h2>
            <ul className="space-y-3">
              {PRO_FEATURES.map(({ label, desc }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <span className="text-yellow-500 flex-shrink-0 mt-0.5">★</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400 leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-xl mx-auto">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5 text-center">Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is it really free to start?',
                a: "Yes. You never need a credit card to use the free tier. Today's challenge, today's puzzle, this week's article and podcast are always free.",
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Monthly subscriptions cancel at any time. Annual subscriptions are non-refundable after 14 days.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We\'ll accept all major credit and debit cards, Apple Pay, and Google Pay through Stripe.',
              },
              {
                q: 'Is this for exam prep too?',
                a: 'Pro includes all courses — including Cambridge B2 First exam prep. The Grammar Reference is free for everyone.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 pb-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">{q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-12">
          <Link to="/articles" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Keep reading for free
          </Link>
        </div>

      </div>
    </div>
  )
}
