// ── Challenge home card ───────────────────────────────────────────────────────
// Shown before starting (or after completing) today's challenge.

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function StreakFlame({ count }) {
  if (!count) return null
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-white font-bold text-xl leading-none">{count}</p>
        <p className="text-gray-400 text-xs">day streak</p>
      </div>
    </div>
  )
}

function ScoreBar({ score, maxScore }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const colour = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">Your score</span>
        <span className="text-white font-semibold">{score} / {maxScore}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ChallengeHomeCard({
  challenge, season, word, streak, completion,
  alreadyDone, onStart, onSignIn, user,
}) {
  const today = new Date()
  const dow = DAY_NAMES[today.getDay()]
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })

  const isWeekend = challenge?.challenge_type === 'weekend_quiz'

  return (
    <div className="min-h-screen bg-gray-950 flex items-start justify-center pt-12 px-4 pb-16">
      <div className="w-full max-w-lg">

        {/* Season header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-3"
            style={{
              backgroundColor: season?.colour ? `${season.colour}22` : '#3b82f622',
              color:            season?.colour || '#818cf8',
              border:           `1px solid ${season?.colour ? `${season.colour}44` : '#3b82f644'}`,
            }}
          >
            <span>{season?.emoji || '📅'}</span>
            <span>{season?.title || 'Daily Challenge'}</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-1">
            {alreadyDone ? 'You're done for today!' : `${dow}, ${dateStr}`}
          </h1>
          <p className="text-gray-400 text-sm">
            {isWeekend ? 'Weekend quiz' : `Day ${challenge?.day_number} · ${challenge?.title || ''}`}
          </p>
        </div>

        {/* Main card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-5">

          {/* Word preview (weekday only) */}
          {word && !isWeekend && (
            <div
              className="p-6 border-b border-gray-800"
              style={{ background: season?.colour ? `linear-gradient(135deg, ${season.colour}18, transparent)` : undefined }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Today's word</p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight capitalize">{word.word}</h2>
                  <p className="text-gray-400 text-sm mt-0.5">{word.ipa} · {word.part_of_speech}</p>
                  <p className="text-gray-300 mt-2 leading-relaxed">{word.definition}</p>
                </div>
                {/* Audio stub — wire up TTS later */}
                <button className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors mt-1">
                  🔊
                </button>
              </div>
              {word.example && (
                <p className="text-gray-500 text-sm mt-3 italic border-l-2 border-gray-700 pl-3">
                  "{word.example}"
                </p>
              )}
            </div>
          )}

          {/* Weekend quiz preview */}
          {isWeekend && (
            <div className="p-6 border-b border-gray-800 bg-gradient-to-br from-purple-900/20 to-transparent">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Weekend quiz</p>
              <h2 className="text-2xl font-bold text-white">{challenge?.title}</h2>
              <p className="text-gray-400 mt-1.5 text-sm">5 general knowledge questions · 2 word recap</p>
            </div>
          )}

          {/* What's inside */}
          {!alreadyDone && (
            <div className="p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Today's session</p>
              <div className="space-y-2">
                {isWeekend ? (
                  <>
                    <StepRow icon="🌍" label="General knowledge" sub="5 themed questions" />
                    <StepRow icon="🔁" label="Word recap" sub="2 questions from this week" />
                  </>
                ) : (
                  <>
                    <StepRow icon="📖" label="Word of the day" sub={word?.word ? `Learn "${word.word}"` : 'Vocabulary'} />
                    <StepRow icon="📄" label="Mini passage" sub="100–150 words · 2 questions" />
                    <StepRow icon="🃏" label="Vocab drill" sub="5 questions from this season" />
                    <StepRow icon="⚡" label="Wild card" sub={WILD_CARD_LABEL[challenge?.wild_card_type] || 'Bonus challenge'} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Already done — show score */}
          {alreadyDone && completion && (
            <div className="p-5">
              <ScoreBar score={completion.score} maxScore={completion.max_score} />
              {challenge?.tomorrows_riddle && (
                <div className="mt-4 bg-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Tomorrow's riddle…</p>
                  <p className="text-gray-200 italic text-sm">{challenge.tomorrows_riddle}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Streak / stats row */}
        {streak && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between mb-5">
            <StreakFlame count={streak.current_streak} />
            <div className="text-right">
              <p className="text-xs text-gray-500">Season score</p>
              <p className="text-white font-bold">{streak.season_score?.toLocaleString() || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Longest streak</p>
              <p className="text-white font-bold">{streak.longest_streak}</p>
            </div>
          </div>
        )}

        {/* CTA */}
        {alreadyDone ? (
          <div className="text-center text-gray-500 text-sm">
            <p>Come back tomorrow to keep your streak! 🔥</p>
            {!user && (
              <button onClick={onSignIn} className="mt-3 text-indigo-400 hover:text-indigo-300 underline">
                Sign in to track your streak
              </button>
            )}
          </div>
        ) : user ? (
          <button
            onClick={onStart}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
            style={{
              background: season?.colour
                ? `linear-gradient(135deg, ${season.colour}, ${season.colour}cc)`
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: `0 4px 24px ${season?.colour || '#6366f1'}44`,
            }}
          >
            Start today's challenge →
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onStart}
              className="w-full py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg transition-all"
            >
              Try without signing in
            </button>
            <button
              onClick={onSignIn}
              className="w-full py-3 rounded-2xl text-indigo-400 hover:text-indigo-300 font-medium text-sm border border-indigo-800 hover:border-indigo-600 transition-all"
            >
              Sign in to track your streak
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StepRow({ icon, label, sub }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-lg w-7 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-gray-200 text-sm font-medium">{label}</span>
        {sub && <span className="text-gray-500 text-xs ml-2">{sub}</span>}
      </div>
      <span className="text-gray-600 text-xs">~1 min</span>
    </div>
  )
}

const WILD_CARD_LABEL = {
  word_formation: 'Word formation',
  odd_one_out:    'Odd one out',
  fill_gap:       'Fill the gap',
  speed_burst:    'Speed burst',
  translation:    'Translation challenge',
}
