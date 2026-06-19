// HomePage.jsx — Marketing home page (logged-out default view at /)
// Spec: docs/site-architecture.md — Home page section
//
// Sections:
//   1. Top nav (TopNav component — no second nav here)
//   2. Hero — animated conversation (EN + ES, browser language detection) + headline + CTAs
//   3. Three destination cards (Hub / Exam Centre / Courses)
//   4. Level test CTA
//   5. Why Chatter Club (4 reasons)
//   6. Footer

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import TopNav from '../components/TopNav'
import PageMeta from '../components/PageMeta'

// ── Conversation scripts ──────────────────────────────────────────────────────

const CONVERSATIONS = {
  en: [
    { side: 'left',  text: "I really need to practise my English but I don't know where to start." },
    { side: 'right', text: "I know, right — everything online feels like a classroom." },
    { side: 'left',  text: "Wait — you haven't heard of Chatter Club?" },
  ],
  es: [
    { side: 'left',  text: "Necesito practicar mi inglés pero no sé por dónde empezar." },
    { side: 'right', text: "Ya, a mí también me pasa — todo online parece una clase aburrida." },
    { side: 'left',  text: "Espera, ¿no conoces Chatter Club?" },
  ],
}

function detectLang() {
  const lang = (navigator.language || 'en').toLowerCase().split('-')[0]
  return CONVERSATIONS[lang] ? lang : 'en'
}

// ── Animated conversation component ──────────────────────────────────────────

const CHAR_DELAY = 35   // ms per character
const MSG_PAUSE  = 800  // pause between messages
const LOOP_PAUSE = 3000 // pause at end before restart

function AnimatedConversation() {
  const [visibleMessages, setVisibleMessages] = useState([])
  const [typingIndex, setTypingIndex]         = useState(0)   // which message is being typed
  const [typedText, setTypedText]             = useState('')
  const [done, setDone]                       = useState(false)

  const script = CONVERSATIONS[detectLang()]
  const timerRef = useRef(null)

  useEffect(() => {
    function typeMessage(msgIndex, charIndex) {
      const msg  = script[msgIndex]
      const full = msg.text

      if (charIndex < full.length) {
        setTypedText(full.slice(0, charIndex + 1))
        timerRef.current = setTimeout(() => typeMessage(msgIndex, charIndex + 1), CHAR_DELAY)
      } else {
        // Message complete — push to visible list
        setVisibleMessages(prev => [...prev, msg])
        setTypedText('')
        setTypingIndex(msgIndex + 1)

        if (msgIndex + 1 < script.length) {
          timerRef.current = setTimeout(() => typeMessage(msgIndex + 1, 0), MSG_PAUSE)
        } else {
          // Loop
          timerRef.current = setTimeout(restart, LOOP_PAUSE)
        }
      }
    }

    function restart() {
      setVisibleMessages([])
      setTypedText('')
      setTypingIndex(0)
      setDone(false)
      timerRef.current = setTimeout(() => typeMessage(0, 0), MSG_PAUSE)
    }

    timerRef.current = setTimeout(() => typeMessage(0, 0), 600)

    return () => clearTimeout(timerRef.current)
  }, []) // intentional: runs once on mount, loops internally

  // Current message being typed (before it's committed to visibleMessages)
  const currentMsg = typingIndex < script.length ? script[typingIndex] : null

  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0 space-y-3">
      {visibleMessages.map((msg, i) => (
        <Bubble key={i} side={msg.side} text={msg.text} />
      ))}
      {currentMsg && typedText && (
        <Bubble side={currentMsg.side} text={typedText} typing />
      )}
    </div>
  )
}

function Bubble({ side, text, typing }) {
  const isLeft = side === 'left'
  return (
    <div className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isLeft
            ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
            : 'bg-gray-900 text-white rounded-tr-sm'
        }`}
      >
        {text}
        {typing && (
          <span className="inline-block w-1 h-3.5 bg-current opacity-60 ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </div>
  )
}

// ── Destination cards ─────────────────────────────────────────────────────────

const CARDS = [
  {
    name: 'Chatter Club',
    description: 'Your daily English practice habit.',
    features: ['Daily challenges and puzzles', 'Levelled articles and podcasts', 'Word bank and vocabulary tools'],
    cta: 'Start practising',
    to: '/home',
    colour: 'bg-pink-light border-pink/30',
    accent: 'text-pink-dark',
    ctaColour: 'text-pink-dark hover:text-gray-900',
  },
  {
    name: 'Exam Centre',
    description: 'Cambridge B2 First preparation.',
    features: ['Daily 10-minute exam challenge', 'Grammar reference with exercises', 'Practice papers, Cambridge format'],
    cta: 'Prepare for your exam',
    to: '/exam',
    colour: 'bg-blue-dark-bg border-blue-dark/20',
    accent: 'text-blue-dark',
    ctaColour: 'text-blue-dark hover:text-gray-900',
  },
  {
    name: 'Courses',
    description: 'Self-paced courses for every goal.',
    features: ['B2 First complete preparation', 'Life English for real situations', 'Sequential unlock, go at your pace'],
    cta: 'Browse courses',
    to: '/courses',
    colour: 'bg-green-light border-green/30',
    accent: 'text-green-dark',
    ctaColour: 'text-green-dark hover:text-gray-900',
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function HomePage() {
  const { userId, isPro, checking } = useAuth()

  // If logged in, redirect to hub — or just show the full page anyway
  // (user can always visit / and see the marketing page — that's intentional)

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <PageMeta
        title={null} // uses site default: "Chatter Club — Learn English Every Day"
        description="The complete place to practise English — daily challenges, levelled articles, Cambridge exam prep, podcasts, puzzles and courses. Free to join."
        canonical="/"
      />

      {/* Top nav — no second nav on home page */}
      <TopNav userId={userId} isPro={isPro} checking={checking} />

      {/* ── 1. HERO ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

        {/* Conversation graphic */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-lg p-6 sm:p-8">
            <AnimatedConversation />
          </div>
        </div>

        {/* Headline + CTAs */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-950 leading-tight tracking-tight">
            The complete place to learn English
          </h1>
          <p className="mt-4 text-lg text-gray-500 leading-relaxed">
            Articles, challenges, exam prep and courses — all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              to="/join"
              className="px-6 py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-dark transition-colors"
            >
              Start for free
            </Link>
            <a
              href="#how-it-works"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:border-gray-500 hover:bg-white transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">No credit card needed.</p>
        </div>
      </section>

      {/* ── 2. THREE DESTINATION CARDS ─────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 text-center mb-3">
            Everything you need in one place
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Three sections, one account. Practice every day, prepare for your exam, or work through a course.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {CARDS.map(card => (
              <div
                key={card.name}
                className={`rounded-2xl border p-6 flex flex-col ${card.colour}`}
              >
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${card.accent}`}>
                  {card.name}
                </div>
                <p className="text-gray-900 font-semibold text-base mb-4">
                  {card.description}
                </p>
                <ul className="space-y-2 flex-1 mb-6">
                  {card.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={card.to}
                  className={`text-sm font-semibold transition-colors ${card.ctaColour}`}
                >
                  {card.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. LEVEL TEST CTA ──────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-canvas">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-block bg-green text-white rounded-3xl px-8 sm:px-14 py-10 sm:py-14 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Not sure where to start?
            </h2>
            <p className="text-gray-300 mb-8 text-sm sm:text-base leading-relaxed">
              Find your English level in 10 minutes. We will recommend the right articles, challenges and courses for you.
            </p>
            <Link
              to="/level-test"
              className="inline-block px-8 py-3 bg-white text-green-dark rounded-xl font-bold text-sm hover:bg-green-light transition-colors"
            >
              Take the free level test
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. WHY CHATTER CLUB ────────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 text-center mb-12">
            Why Chatter Club
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                headline: 'Real English, not textbook English',
                body: 'Every article, challenge and podcast uses natural language — the kind real people actually use.',
              },
              {
                headline: '10 minutes a day is enough',
                body: 'A daily challenge, a puzzle, a short article. Small habits compound. You will notice the difference.',
              },
              {
                headline: 'From A2 to exam-ready',
                body: 'CEFR-levelled content from beginner to Cambridge B2 First and beyond — all in one place.',
              },
              {
                headline: 'Built by teachers',
                body: 'Every exercise, every explanation, every article — written and reviewed by qualified English teachers.',
              },
            ].map(({ headline, body }) => (
              <div key={headline}>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{headline}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} Chatter Club</span>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/articles"   className="hover:text-gray-700 transition-colors">Articles</Link>
            <Link to="/podcasts"   className="hover:text-gray-700 transition-colors">Podcasts</Link>
            <Link to="/puzzles"    className="hover:text-gray-700 transition-colors">Puzzles</Link>
            <Link to="/challenge"  className="hover:text-gray-700 transition-colors">Challenge</Link>
            <Link to="/level-test" className="hover:text-gray-700 transition-colors">Level Test</Link>
            <Link to="/exam"       className="hover:text-gray-700 transition-colors">Exam Prep</Link>
            <Link to="/courses"    className="hover:text-gray-700 transition-colors">Courses</Link>
            <Link to="/privacy"    className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link to="/terms"      className="hover:text-gray-700 transition-colors">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
