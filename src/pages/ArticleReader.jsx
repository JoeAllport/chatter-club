import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { tierToDisplay, DISPLAY_LEVEL_COLOURS } from '../lib/levels'

// ── Constants ─────────────────────────────────────────────────────────────────

const SUPPORTED_LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'pl', flag: '🇵🇱', label: 'Polish' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'it', flag: '🇮🇹', label: 'Italian' },
  { code: 'pt', flag: '🇧🇷', label: 'Portuguese' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'ja', flag: '🇯🇵', label: 'Japanese' },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic' },
]

const LEVEL_COLOURS = {
  A1:   'bg-pink-100 text-pink-800 border-pink-200',
  A2:   'bg-orange-100 text-orange-800 border-orange-200',
  'A2+':'bg-orange-100 text-orange-900 border-orange-300',
  B1:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  'B1+':'bg-yellow-100 text-yellow-900 border-yellow-300',
  B2:   'bg-green-100 text-green-800 border-green-200',
  'B2+':'bg-green-100 text-green-900 border-green-300',
  C1:   'bg-blue-100 text-blue-800 border-blue-200',
  C2:   'bg-purple-100 text-purple-800 border-purple-200',
}

// Tier display config — Easy/Medium/Advanced (no CEFR codes shown to users)
const TIER_CONFIG = {
  foundation: { label: 'Easy',     colour: DISPLAY_LEVEL_COLOURS.Easy },
  standard:   { label: 'Medium',   colour: DISPLAY_LEVEL_COLOURS.Medium },
  advanced:   { label: 'Advanced', colour: DISPLAY_LEVEL_COLOURS.Advanced },
}

const SAVE_DEBOUNCE_MS = 4000

// ── Helpers ───────────────────────────────────────────────────────────────────

function readTime(wordCount) {
  const mins = Math.max(1, Math.round((wordCount || 0) / 200))
  return `${mins} min read`
}

function stripPunctuation(word) {
  return word.replace(/^[^a-zA-ZÀ-ÿ0-9]+|[^a-zA-ZÀ-ÿ0-9]+$/g, '')
}

// ── Inline word tooltip ───────────────────────────────────────────────────────
// Appears near the tapped word, doesn't block the rest of the article

// ── TTS helper ────────────────────────────────────────────────────────────────

function speak(text, rate = 0.9) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-GB'
  utt.rate = rate
  window.speechSynthesis.speak(utt)
}

// ── Translation bottom sheet ──────────────────────────────────────────────────
// Slides up from the bottom — article stays fully visible and readable above it.
// No backdrop blur. Tap anywhere above the sheet to dismiss.

function TranslationSheet({ word, context, onClose, onSave, isSaved, saving, userId }) {
  if (!word) return null

  return (
    <>
      {/* Invisible tap-away area — no blur, article stays readable */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto">
        <div className="bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 px-6 pt-3 pb-8">

          {/* Pull handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

          {/* Word row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">{word}</span>
              {/* Pronounce button */}
              <button
                onClick={() => speak(word)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                title="Hear pronunciation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072M12 6a6 6 0 00-6 6v0a6 6 0 006 6m0-12v12" />
                </svg>
                Listen
              </button>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lemma + IPA + POS */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {context?.lemma && context.lemma.toLowerCase() !== word.toLowerCase() && (
              <p className="text-sm text-gray-400 italic">from <span className="font-medium text-gray-600">{context.lemma}</span></p>
            )}
            {context?.part_of_speech && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{context.part_of_speech}</span>
            )}
            {context?.pronunciation && (
              <span className="text-xs text-gray-400 font-mono">/{context.pronunciation}/</span>
            )}
          </div>

          {/* Translation */}
          {context?.translation ? (
            <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4">
              <p className="text-xl font-semibold text-blue-900">{context.translation}</p>
              {context.context_note && (
                <p className="text-sm text-blue-500 mt-1">{context.context_note}</p>
              )}
              <p className="text-xs text-blue-300 mt-1">In the context of this article</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-gray-400 italic">
                No translation yet — click "Build translations" in the article editor to add them.
              </p>
            </div>
          )}

          {/* Example sentence */}
          {context?.example_sentence && (
            <p className="text-sm text-gray-500 italic mb-4 leading-relaxed">
              <span className="text-gray-300 not-italic mr-1">e.g.</span>
              "{context.example_sentence}"
            </p>
          )}

          {/* Save button */}
          <button
            onClick={() => context?.translation ? onSave(word, context) : null}
            disabled={isSaved || saving || !context?.translation}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
              isSaved
                ? 'bg-green-50 text-green-700 border border-green-200'
                : saving
                ? 'bg-gray-100 text-gray-400'
                : !context?.translation
                ? 'bg-gray-50 text-gray-300 cursor-default'
                : userId
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isSaved ? '✓ Saved to word bank'
              : saving ? 'Saving…'
              : !context?.translation ? 'Translations not built yet'
              : userId ? '+ Save to word bank'
              : 'Sign in to save words →'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Tappable word renderer ────────────────────────────────────────────────────

function TappableBody({ text, wordContexts, onWordTap, savedLemmas }) {
  if (!text) return null
  const paragraphs = text.split(/\n+/).filter(p => p.trim())

  return (
    <div className="space-y-5">
      {paragraphs.map((para, pi) => {
        // Split into word tokens preserving whitespace
        const tokens = para.split(/(\s+)/)
        // Build a cleaned version of each token for phrase lookahead
        const cleaned = tokens.map(t => /^\s+$/.test(t) ? '' : stripPunctuation(t).toLowerCase())

        const rendered = []
        let skipUntil = -1  // index to skip tokens already consumed by a phrase

        tokens.forEach((token, ti) => {
          if (skipUntil > ti) return  // consumed by a preceding phrase match

          if (/^\s+$/.test(token)) {
            rendered.push(token)
            return
          }

          const clean = stripPunctuation(token)
          if (!clean) { rendered.push(<span key={ti}>{token}</span>); return }

          const cleanLower = clean.toLowerCase()
          const before = token.slice(0, token.indexOf(clean))
          const after  = token.slice(token.indexOf(clean) + clean.length)

          // ── Phrase lookahead (up to 4 words) ────────────────────────────
          // Build candidate phrases of decreasing length and check wordContexts
          let phraseCtx = null
          let phraseTokenCount = 0
          let phraseText = ''

          for (let len = 4; len >= 2; len--) {
            // Gather the next `len` word tokens (skipping whitespace tokens)
            const wordTokens = []
            let j = ti
            while (wordTokens.length < len && j < tokens.length) {
              if (!/^\s+$/.test(tokens[j])) wordTokens.push(cleaned[j] || '')
              j++
            }
            if (wordTokens.length < len) continue

            const candidate = wordTokens.join(' ')
            if (wordContexts[candidate]) {
              phraseCtx = wordContexts[candidate]
              phraseText = wordTokens.join(' ')
              // Count how many tokens (including spaces) we consumed
              let count = 0
              let found = 0
              let k = ti
              while (found < len && k < tokens.length) {
                count++
                if (!/^\s+$/.test(tokens[k])) found++
                k++
              }
              phraseTokenCount = count
              break
            }
          }

          if (phraseCtx) {
            // Render the whole phrase as a single tappable span
            const isSaved = savedLemmas.has(phraseCtx.lemma || phraseText)
            skipUntil = ti + phraseTokenCount
            rendered.push(
              <span key={ti}>
                {before}
                <span
                  onClick={e => { e.stopPropagation(); onWordTap(phraseText, phraseCtx) }}
                  className={`cursor-pointer rounded px-0.5 -mx-0.5 transition-colors select-none
                    bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200
                    ${isSaved ? 'underline decoration-dotted decoration-indigo-400 underline-offset-2' : ''}
                  `}
                  title="Phrasal verb / expression"
                >
                  {phraseText}
                </span>
                {after}
              </span>
            )
            return
          }

          // ── Single word fallback ─────────────────────────────────────────
          const ctx     = wordContexts[cleanLower]
          const isSaved = savedLemmas.has(ctx?.lemma || cleanLower)

          rendered.push(
            <span key={ti}>
              {before}
              <span
                onClick={e => { e.stopPropagation(); onWordTap(clean, ctx) }}
                className={`cursor-pointer rounded px-0.5 -mx-0.5 transition-colors select-none
                  ${ctx ? 'hover:bg-blue-100 active:bg-blue-200' : 'hover:bg-gray-100'}
                  ${isSaved ? 'underline decoration-dotted decoration-blue-400 underline-offset-2' : ''}
                `}
              >
                {clean}
              </span>
              {after}
            </span>
          )
        })

        return <p key={pi} className="leading-8">{rendered}</p>
      })}
    </div>
  )
}

// ── Subscriber gate ───────────────────────────────────────────────────────────

function SubscriberGate({ level }) {
  return (
    <div className="relative">
      <div className="h-40 overflow-hidden relative">
        <div className="text-gray-400 leading-8 select-none pointer-events-none blur-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
      </div>
      <div className="text-center py-8 px-6">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Subscriber article</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          This {level} article is available to subscribers.
          Join to access all articles with tap-to-translate, your word bank, and more.
        </p>
        <button className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
          Start free trial
        </button>
        <p className="text-xs text-gray-400 mt-3">Already a member? <a href="/login" className="text-blue-600">Sign in</a></p>
      </div>
    </div>
  )
}

// ── SEO head tags ─────────────────────────────────────────────────────────────

// ── Tier switcher ─────────────────────────────────────────────────────────────
// Shows Foundation / Standard / Advanced pills when article has tier siblings.
// Active tier is highlighted; others link to their article.

function TierSwitcher({ currentArticle, siblings }) {
  const navigate = useNavigate()
  if (!siblings?.length) return null

  // Build the full ordered list: current + siblings, sorted foundation→standard→advanced
  const TIER_ORDER = { foundation: 0, standard: 1, advanced: 2 }
  const all = [
    { ...currentArticle, isCurrent: true },
    ...siblings.map(s => ({ ...s, isCurrent: false })),
  ].sort((a, b) => (TIER_ORDER[a.article_tier] ?? 9) - (TIER_ORDER[b.article_tier] ?? 9))

  function handleSwitch(article) {
    if (article.isCurrent) return
    const href = article.slug ? `/articles/${article.slug}` : `/articles/${article.id}`
    navigate(href)
  }

  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      <span className="text-xs text-gray-400 font-medium mr-1">Level</span>
      {all.map(a => {
        const cfg = TIER_CONFIG[a.article_tier]
        if (!cfg) return null
        return (
          <button
            key={a.id}
            onClick={() => handleSwitch(a)}
            title={a.isCurrent ? `You are reading the ${cfg.label} version` : `Switch to ${cfg.label}`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              a.isCurrent
                ? cfg.colour + ' shadow-sm cursor-default'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700 cursor-pointer'
            }`}
          >
            {cfg.label}
          </button>
        )
      })}
      <span className="text-xs text-gray-300 ml-1">Same article, different difficulty</span>
    </div>
  )
}

function SEOHead({ article }) {
  useEffect(() => {
    if (!article) return
    // Subtitle is the ideal meta description — fall back to first 160 chars of body
    const desc = article.subtitle
      || (article.body_text || '').slice(0, 160).replace(/\n/g, ' ').trim()

    const displayLevel = article.article_tier ? TIER_CONFIG[article.article_tier]?.label : null
    document.title = `${article.title} | ${displayLevel ? displayLevel + ' English' : 'English'}`

    const setMeta = (name, content, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let el = document.querySelector(sel)
      if (!el) {
        el = document.createElement('meta')
        prop ? el.setAttribute('property', name) : el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', desc)
    setMeta('og:title', article.title, true)
    setMeta('og:description', desc, true)
    setMeta('og:type', 'article', true)
    if (article.cover_image_url) setMeta('og:image', article.cover_image_url, true)
    if (article.slug) setMeta('og:url', `${window.location.origin}/articles/${article.slug}`, true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', article.title)
    setMeta('twitter:description', desc)
    if (article.cover_image_url) setMeta('twitter:image', article.cover_image_url)

    return () => { document.title = 'Chatter Club — Learn English Every Day' }
  }, [article])

  return null
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ArticleReader() {
  const { slug }  = useParams()
  const navigate  = useNavigate()

  const [article,      setArticle]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [notFound,     setNotFound]     = useState(false)
  const [wordContexts, setWordContexts] = useState({})
  const [savedLemmas,  setSavedLemmas]  = useState(new Set())
  const [tierSiblings, setTierSiblings] = useState([])  // [{id,slug,article_tier,level}]

  // Translation sheet state
  const [tappedWord,  setTappedWord]  = useState(null)
  const [tappedCtx,   setTappedCtx]   = useState(null)
  const [savingWord,  setSavingWord]  = useState(false)

  const [userId,     setUserId]     = useState(null)
  const [nativeLang, setNativeLang] = useState('es')

  // TTS read-aloud
  const [ttsPlaying,  setTtsPlaying]  = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)

  // Article quiz
  const [quizItems,     setQuizItems]     = useState(null)  // null=not loaded, []=no quiz
  const [quizOpen,      setQuizOpen]      = useState(false)
  const [quizIdx,       setQuizIdx]       = useState(0)
  const [quizAnswers,   setQuizAnswers]   = useState([])    // [{item_id,correct,given,time_ms}]
  const [quizDone,      setQuizDone]      = useState(false)
  const [quizItemStart, setQuizItemStart] = useState(Date.now())

  const progressTimer = useRef(null)
  const startTimeRef  = useRef(Date.now())
  const articleRef    = useRef(null)

  // ── Auth + language preference ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser()
      .then(async ({ data }) => {
        const uid = data?.user?.id || null
        setUserId(uid)
        if (uid) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('native_lang')
            .eq('user_id', uid)
            .maybeSingle()
          if (profile?.native_lang) setNativeLang(profile.native_lang)
        }
      })
      .catch(() => setUserId(null))
  }, [])

  // ── TTS support + cleanup ───────────────────────────────────────────────────
  useEffect(() => {
    setTtsSupported('speechSynthesis' in window)
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  function handleTtsToggle() {
    if (!article?.body_text) return
    if (ttsPlaying) {
      window.speechSynthesis.cancel()
      setTtsPlaying(false)
    } else {
      const utt   = new SpeechSynthesisUtterance(article.body_text)
      utt.lang    = 'en-GB'
      utt.rate    = 0.9
      utt.onend   = () => setTtsPlaying(false)
      utt.onerror = () => setTtsPlaying(false)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utt)
      setTtsPlaying(true)
    }
  }

  // ── Load article ────────────────────────────────────────────────────────────
  useEffect(() => { if (slug) load() }, [slug])

  async function load() {
    setLoading(true)
    setTierSiblings([])

    let found = null

    // 1. By slug, published only
    const { data: bySlug } = await supabase
      .from('articles').select('*').eq('slug', slug).eq('is_published', true).maybeSingle()
    if (bySlug) found = bySlug

    // 2. By slug, any (admin draft preview)
    if (!found) {
      const { data: bySlugDraft } = await supabase
        .from('articles').select('*').eq('slug', slug).maybeSingle()
      if (bySlugDraft) found = bySlugDraft
    }

    // 3. By UUID id
    if (!found) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
      if (isUuid) {
        const { data: byId } = await supabase.from('articles').select('*').eq('id', slug).maybeSingle()
        if (byId) found = byId
      }
    }

    if (!found) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setArticle(found)
    await loadWordContexts(found.id)

    // Load tier siblings if this article belongs to a topic group
    if (found.topic_group_id) {
      const { data: siblings } = await supabase
        .from('articles')
        .select('id, slug, article_tier, level')
        .eq('topic_group_id', found.topic_group_id)
        .eq('is_published', true)
        .neq('id', found.id)  // exclude current article
      if (siblings?.length) {
        // Order: foundation → standard → advanced
        const TIER_ORDER = { foundation: 0, standard: 1, advanced: 2 }
        setTierSiblings(siblings.sort((a, b) => (TIER_ORDER[a.article_tier] ?? 9) - (TIER_ORDER[b.article_tier] ?? 9)))
      }
    }

    setLoading(false)
  }

  async function loadWordContexts(articleId, lang = nativeLang) {
    const { data } = await supabase
      .from('article_word_contexts')
      .select('surface_form, phrase_key, lemma, translation, context_note, part_of_speech, pronunciation, example_sentence')
      .eq('article_id', articleId)
      .eq('target_lang', lang)
    if (data) {
      const map = {}
      data.forEach(r => {
        // Index by surface_form for single-word lookup
        map[r.surface_form.toLowerCase()] = r
        // Also index by phrase_key (the full expression) for phrase lookup
        if (r.phrase_key) map[r.phrase_key.toLowerCase()] = r
      })
      setWordContexts(map)
    }
  }

  // Re-fetch word contexts when language changes (article already loaded)
  useEffect(() => {
    if (article?.id) loadWordContexts(article.id, nativeLang)
  }, [nativeLang])

  // Load quiz items when article has a quiz_set_id (via join table)
  useEffect(() => {
    if (!article?.quiz_set_id) { setQuizItems([]); return }
    supabase
      .from('content_set_items')
      .select('position, item:content_items(id, task_type, prompt, answer, distractors, level)')
      .eq('set_id', article.quiz_set_id)
      .order('position')
      .then(({ data }) => setQuizItems((data || []).map(r => r.item).filter(Boolean)))
  }, [article?.quiz_set_id])

  // Quiz answer handler
  function handleQuizAnswer(correct, given) {
    const timeTaken = Date.now() - quizItemStart
    const item = quizItems[quizIdx]
    const newAnswers = [...quizAnswers, {
      item_id: item.id,
      correct,
      given,
      time_ms: timeTaken,
    }]
    setQuizAnswers(newAnswers)

    if (quizIdx + 1 >= quizItems.length) {
      // Done — save attempt
      const scorePct = Math.round((newAnswers.filter(a => a.correct).length / newAnswers.length) * 100)
      supabase.from('article_quiz_attempts').insert({
        article_id:  article.id,
        user_id:     userId || null,
        score_pct:   scorePct,
        answers:     newAnswers,
      }).then(() => {})
      setQuizDone(true)
    } else {
      setQuizIdx(quizIdx + 1)
      setQuizItemStart(Date.now())
    }
  }

  function openQuiz() {
    setQuizIdx(0)
    setQuizAnswers([])
    setQuizDone(false)
    setQuizItemStart(Date.now())
    setQuizOpen(true)
  }

  // ── Saved words ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !article) return
    supabase.from('saved_words').select('lemma').eq('user_id', userId).eq('article_id', article.id)
      .then(({ data }) => { if (data) setSavedLemmas(new Set(data.map(r => r.lemma))) })
  }, [userId, article])

  // ── Progress tracking ───────────────────────────────────────────────────────
  const saveProgress = useCallback(async () => {
    if (!userId || !article) return
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const pct       = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0
    const timeSecs  = Math.round((Date.now() - startTimeRef.current) / 1000)
    await supabase.from('article_read_progress').upsert({
      user_id: userId, article_id: article.id,
      position_percent: pct, completed: pct >= 80,
      last_read_at: new Date().toISOString(), time_spent_secs: timeSecs,
    }, { onConflict: 'user_id,article_id' })
  }, [userId, article])

  useEffect(() => {
    const handler = () => {
      clearTimeout(progressTimer.current)
      progressTimer.current = setTimeout(saveProgress, SAVE_DEBOUNCE_MS)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => { window.removeEventListener('scroll', handler); clearTimeout(progressTimer.current) }
  }, [saveProgress])

  useEffect(() => () => { saveProgress() }, [saveProgress])

  // ── Language preference ─────────────────────────────────────────────────────
  async function handleLangChange(lang) {
    setNativeLang(lang)
    setTappedWord(null)
    if (userId) {
      await supabase.from('user_profiles').upsert({
        user_id: userId,
        native_lang: lang,
      }, { onConflict: 'user_id' })
    }
  }

  // ── Word tap ────────────────────────────────────────────────────────────────
  function handleWordTap(word, ctx) {
    if (tappedWord === word) { setTappedWord(null); return }
    setTappedWord(word)
    setTappedCtx(ctx || null)
  }

  function closeSheet() {
    setTappedWord(null)
    setTappedCtx(null)
  }

  // ── Save word ───────────────────────────────────────────────────────────────
  async function handleSaveWord(word, ctx) {
    if (!userId) { navigate('/login'); return }
    if (!ctx) return
    setSavingWord(true)
    const contextSentence = (article?.body_text || '').split(/\n+/)
      .find(p => p.toLowerCase().includes(word.toLowerCase())) || ''
    await supabase.from('saved_words').upsert({
      user_id: userId,
      lemma: ctx.lemma || word.toLowerCase(),
      surface_form: word,
      article_id: article.id,
      context_sentence: contextSentence.trim(),
      contextual_translation: ctx.translation,
      saved_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lemma,article_id' })
    setSavedLemmas(prev => new Set([...prev, ctx.lemma || word.toLowerCase()]))
    setSavingWord(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="space-y-4 w-full max-w-2xl px-6">
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-2/3" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
          <div className="space-y-2 pt-6">
            {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-4xl mb-4">📄</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Article not found</h1>
          <p className="text-sm text-gray-500 mb-6">This article may have moved or been unpublished.</p>
          <Link to="/articles" className="text-sm text-blue-600 hover:underline">← Browse all articles</Link>
        </div>
      </div>
    )
  }

  const isGated = !article.is_free && !userId

  return (
    <div ref={articleRef}>
      <SEOHead article={article} />

      {/* Article toolbar — listen + language + word bank (sits below global nav) */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 h-11 flex items-center justify-between gap-4">

          {/* Listen button */}
          {ttsSupported && article?.body_text && (
            <button
              onClick={handleTtsToggle}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                ttsPlaying
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {ttsPlaying ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072M12 6a6 6 0 00-6 6v0a6 6 0 006 6m0-12v12" />
                  </svg>
                  Listen
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* Language picker */}
            <select
              value={nativeLang}
              onChange={e => handleLangChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
              title="Translate words into…"
            >
              {SUPPORTED_LANGS.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>

            {userId && (
              <Link to="/word-bank" className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {savedLemmas.size > 0 && <span className="text-xs text-blue-500">({savedLemmas.size})</span>}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-2xl mx-auto px-6 pt-10 pb-24">

        {/* Cover image */}
        {article.cover_image_url && (
          <div className="mb-8 -mx-6 sm:mx-0 sm:rounded-2xl overflow-hidden aspect-video bg-gray-100">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Tier switcher — shown when this article is part of a multi-level group */}
        {tierSiblings.length > 0 && (
          <TierSwitcher currentArticle={article} siblings={tierSiblings} />
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {article.article_tier && TIER_CONFIG[article.article_tier] && (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${TIER_CONFIG[article.article_tier].colour}`}>
              {TIER_CONFIG[article.article_tier].label}
            </span>
          )}
          {(article.topic_tags || []).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full capitalize">{tag}</span>
          ))}
          {article.word_count && (
            <span className="text-xs text-gray-400 ml-auto">{article.word_count} words · {readTime(article.word_count)}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 leading-tight mb-3">
          {article.title}
        </h1>

        {/* Subtitle / standfirst */}
        {article.subtitle && (
          <p className="text-lg text-gray-500 leading-relaxed mb-8 font-light">
            {article.subtitle}
          </p>
        )}

        {/* Tap hint — only shown first time */}
        {Object.keys(wordContexts).length > 0 && (
          <p className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
            <span>👆</span> Tap any word for an instant translation
          </p>
        )}

        {/* Body */}
        {isGated ? (
          <>
            <div className="font-serif text-[17px] text-gray-800 mb-4"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <TappableBody
                text={(article.body_text || '').split(' ').slice(0, 80).join(' ') + '…'}
                wordContexts={wordContexts}
                onWordTap={handleWordTap}
                savedLemmas={savedLemmas}
              />
            </div>
            <SubscriberGate level={article.level} />
          </>
        ) : (
          <div className="font-serif text-[17px] text-gray-800"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <TappableBody
              text={article.body_text}
              wordContexts={wordContexts}
              onWordTap={handleWordTap}
              savedLemmas={savedLemmas}
            />
          </div>
        )}

        {/* Bottom nav */}
        {!isGated && (
          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            <Link to="/articles" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              ← All articles
            </Link>
            {userId ? (
              <Link to="/word-bank" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
                Word bank {savedLemmas.size > 0 ? `(${savedLemmas.size} saved)` : ''} →
              </Link>
            ) : (
              <Link to="/login" className="text-sm text-blue-600 hover:underline">
                Sign in to save words →
              </Link>
            )}
          </div>
        )}

        {/* ── Comprehension quiz ──────────────────────────────────────────────── */}
        {!isGated && quizItems && quizItems.length > 0 && (
          <div className="mt-10">
            {!quizOpen ? (
              /* Test yourself CTA */
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white text-center">
                <div className="text-3xl mb-3">🧪</div>
                <h3 className="text-base font-bold mb-1">Test yourself</h3>
                <p className="text-sm text-blue-100 mb-4">
                  {quizItems.length} question{quizItems.length !== 1 ? 's' : ''} on this article
                </p>
                <button
                  onClick={openQuiz}
                  className="inline-block text-sm px-6 py-2.5 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                >
                  Start quiz →
                </button>
              </div>
            ) : quizDone ? (
              /* Quiz complete */
              <QuizResult
                answers={quizAnswers}
                items={quizItems}
                onRetake={openQuiz}
              />
            ) : (
              /* Active quiz */
              <QuizPanel
                item={quizItems[quizIdx]}
                index={quizIdx}
                total={quizItems.length}
                onAnswer={handleQuizAnswer}
              />
            )}
          </div>
        )}
      </article>

      {/* Translation bottom sheet — slides up from bottom, article stays readable */}
      <TranslationSheet
        word={tappedWord}
        context={tappedCtx}
        onClose={closeSheet}
        onSave={handleSaveWord}
        isSaved={tappedCtx ? savedLemmas.has(tappedCtx.lemma || tappedWord?.toLowerCase()) : false}
        saving={savingWord}
        userId={userId}
      />
    </div>
  )
}

// ── Quiz panel — renders one question at a time ───────────────────────────────
// Uses the same task_type patterns as the level test renderers.

function QuizPanel({ item, index, total, onAnswer }) {
  const progress = Math.round(((index) / total) * 100)

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">
          Question {index + 1} of {total}
        </span>
        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${Math.max(4, progress)}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="p-5">
        <QuizItemRenderer item={item} onAnswer={onAnswer} key={item.id} />
      </div>
    </div>
  )
}

function QuizItemRenderer({ item, onAnswer }) {
  switch (item.task_type) {
    case 'mcq':          return <QuizMCQ        item={item} onAnswer={onAnswer} />
    case 'true_false_ng':return <QuizTFNG       item={item} onAnswer={onAnswer} />
    case 'collocation':  return <QuizCollocation item={item} onAnswer={onAnswer} />
    case 'spell':        return <QuizSpell       item={item} onAnswer={onAnswer} />
    default:             return <QuizMCQ        item={item} onAnswer={onAnswer} />
  }
}

function quizShuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function QuizMCQ({ item, onAnswer }) {
  const [options]  = useState(() => quizShuffle([item.answer, ...(item.distractors || [])].slice(0, 4)))
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  function pick(opt) {
    if (revealed) return
    setSelected(opt)
    setRevealed(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-900 leading-relaxed mb-1">{item.prompt}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          let cls = 'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors '
          if (revealed) {
            if (opt === item.answer)  cls += 'bg-green-50 border-green-400 text-green-800'
            else if (opt === selected) cls += 'bg-red-50 border-red-300 text-red-700'
            else cls += 'bg-white border-gray-100 text-gray-400'
          } else {
            cls += 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
          }
          return <button key={i} className={cls} onClick={() => pick(opt)}>{opt}</button>
        })}
      </div>
      {revealed && (
        <button
          onClick={() => onAnswer(selected === item.answer, selected)}
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors mt-1"
        >
          Next →
        </button>
      )}
    </div>
  )
}

function QuizTFNG({ item, onAnswer }) {
  const OPTIONS = ['True', 'False', 'Not Given']
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  function pick(opt) {
    if (revealed) return
    setSelected(opt)
    setRevealed(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">True, False, or Not Given?</p>
      <p className="text-sm font-medium text-gray-900 leading-relaxed mb-2">{item.prompt}</p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map(opt => {
          let cls = 'w-full py-3 rounded-xl border text-sm font-semibold transition-colors '
          if (revealed) {
            if (opt === item.answer)  cls += 'bg-green-50 border-green-400 text-green-800'
            else if (opt === selected) cls += 'bg-red-50 border-red-300 text-red-700'
            else cls += 'bg-white border-gray-100 text-gray-400'
          } else {
            cls += 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
          }
          return <button key={opt} className={cls} onClick={() => pick(opt)}>{opt}</button>
        })}
      </div>
      {revealed && (
        <button
          onClick={() => onAnswer(selected === item.answer, selected)}
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors mt-1"
        >
          Next →
        </button>
      )}
    </div>
  )
}

function QuizCollocation({ item, onAnswer }) {
  const [options]  = useState(() => quizShuffle([item.answer, ...(item.distractors || [])].slice(0, 4)))
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const parts = item.prompt.split('___')

  function pick(opt) {
    if (revealed) return
    setSelected(opt)
    setRevealed(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold text-gray-900 text-center leading-8 bg-gray-50 rounded-xl p-4">
        {parts[0]}
        <span className={`inline-block mx-1 px-3 py-0.5 rounded-lg border-2 border-dashed font-bold ${
          revealed
            ? selected === item.answer ? 'border-green-400 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-700'
            : 'border-gray-300 text-gray-400'
        }`}>
          {selected || '___'}
        </span>
        {parts[1]}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => {
          let cls = 'py-3 rounded-xl border text-sm font-semibold transition-colors '
          if (revealed) {
            if (opt === item.answer)  cls += 'bg-green-50 border-green-400 text-green-800'
            else if (opt === selected) cls += 'bg-red-50 border-red-300 text-red-700'
            else cls += 'bg-white border-gray-100 text-gray-400'
          } else {
            cls += 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
          }
          return <button key={i} className={cls} onClick={() => pick(opt)}>{opt}</button>
        })}
      </div>
      {revealed && (
        <button
          onClick={() => onAnswer(selected === item.answer, selected)}
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          Next →
        </button>
      )}
    </div>
  )
}

function QuizSpell({ item, onAnswer }) {
  const [value,    setValue]    = useState('')
  const [revealed, setRevealed] = useState(false)
  const [correct,  setCorrect]  = useState(null)
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  function check() {
    if (!value.trim()) return
    const ok = value.trim().toLowerCase() === item.answer.trim().toLowerCase()
    setCorrect(ok)
    setRevealed(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-900 leading-relaxed mb-1">{item.prompt}</p>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !revealed && check()}
        disabled={revealed}
        placeholder="Type your answer…"
        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none ${
          revealed && correct  ? 'border-green-400 bg-green-50 text-green-800' :
          revealed && !correct ? 'border-red-300 bg-red-50 text-red-700' :
          'border-gray-200 bg-white text-gray-900 focus:border-blue-400'
        }`}
      />
      {revealed && !correct && (
        <div className="bg-gray-50 rounded-xl border px-4 py-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Correct answer</p>
          <p className="text-sm font-semibold text-blue-700">{item.answer}</p>
        </div>
      )}
      {!revealed
        ? <button onClick={check} disabled={!value.trim()}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors">
            Check →
          </button>
        : <button onClick={() => onAnswer(correct, value.trim())}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
            Next →
          </button>
      }
    </div>
  )
}

// ── Quiz result screen ────────────────────────────────────────────────────────

function QuizResult({ answers, items, onRetake }) {
  const correct = answers.filter(a => a.correct).length
  const total   = answers.length
  const pct     = Math.round((correct / total) * 100)

  const colour = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'
  const bgColour = pct >= 80 ? 'bg-green-50 border-green-200' : pct >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'

  return (
    <div className={`rounded-2xl border p-6 ${bgColour}`}>
      {/* Score */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{emoji}</div>
        <p className={`text-3xl font-black ${colour}`}>{pct}%</p>
        <p className="text-sm text-gray-600 mt-1">{correct} of {total} correct</p>
        {pct >= 80 && <p className="text-xs text-green-700 font-medium mt-1">Excellent work!</p>}
        {pct >= 50 && pct < 80 && <p className="text-xs text-yellow-700 font-medium mt-1">Good effort — review the ones you missed.</p>}
        {pct < 50 && <p className="text-xs text-red-700 font-medium mt-1">Keep reading and try again!</p>}
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-2 mb-6">
        {answers.map((ans, i) => {
          const item = items.find(it => it.id === ans.item_id)
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${ans.correct ? 'bg-white/70' : 'bg-white'}`}>
              <span className={`text-base flex-shrink-0 mt-0.5 ${ans.correct ? 'text-green-500' : 'text-red-400'}`}>
                {ans.correct ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 leading-relaxed truncate">{item?.prompt}</p>
                {!ans.correct && (
                  <p className="text-xs text-blue-700 mt-0.5">
                    ✓ {item?.answer}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onRetake}
        className="w-full py-3 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Retake quiz
      </button>
    </div>
  )
}
