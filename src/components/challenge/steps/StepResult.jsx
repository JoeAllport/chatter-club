// ── Step 5: Result screen ─────────────────────────────────────────────────────
// Score, breakdown, streak (updated by parent), tomorrow's riddle, share.

const SCORE_LABELS = [
  { min: 90, emoji: '🏆', label: 'Perfect!',    colour: 'text-yellow-300' },
  { min: 70, emoji: '⭐', label: 'Great job!',  colour: 'text-green-300' },
  { min: 50, emoji: '👍', label: 'Good effort', colour: 'text-blue-300' },
  { min:  0, emoji: '💪', label: 'Keep going',  colour: 'text-indigo-300' },
]

function getScoreLabel(pct) {
  return SCORE_LABELS.find(s => pct >= s.min) || SCORE_LABELS.at(-1)
}

const STEP_LABELS = {
  word:         { label: 'Word',        icon: '📖' },
  passage:      { label: 'Passage',     icon: '📄' },
  drill:        { label: 'Vocab drill', icon: '🃏' },
  wildcard:     { label: 'Wild card',   icon: '⚡' },
  weekend_quiz: { label: 'Quiz',        icon: '🌍' },
}

export default function StepResult({
  challenge, season, word, scores,
  totalEarned, totalPossible, onFinish,
}) {
  const pct = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 100
  const label = getScoreLabel(pct)

  const hasSteps = Object.keys(scores).length > 0

  return (
    <div className="flex-1 flex flex-col pt-6 pb-4">
      {/* Score hero */}
      <div className="text-center mb-8">
        <p className="text-6xl mb-3">{label.emoji}</p>
        <h2 className={`text-3xl font-bold mb-1 ${label.colour}`}>{label.label}</h2>
        {totalPossible > 0 && (
          <p className="text-gray-400 text-sm">
            You scored <span className="text-white font-semibold">{totalEarned}</span>
            {' '}out of{' '}
            <span className="text-white font-semibold">{totalPossible}</span>
            {' '}({pct}%)
          </p>
        )}
      </div>

      {/* Score bar */}
      {totalPossible > 0 && (
        <div className="mb-6">
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Step breakdown */}
      {hasSteps && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Breakdown</p>
          <div className="space-y-2">
            {Object.entries(scores).map(([key, { earned, possible }]) => {
              const meta = STEP_LABELS[key] || { label: key, icon: '•' }
              const stepPct = possible > 0 ? Math.round((earned / possible) * 100) : null
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{meta.icon}</span>
                  <span className="text-gray-300 text-sm flex-1">{meta.label}</span>
                  {possible > 0 ? (
                    <span className={`text-sm font-semibold ${
                      stepPct >= 80 ? 'text-green-400' :
                      stepPct >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {earned}/{possible}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-sm">✓</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tomorrow's riddle */}
      {challenge?.tomorrows_riddle && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tomorrow's riddle…</p>
          <p className="text-gray-200 italic leading-relaxed">{challenge.tomorrows_riddle}</p>
        </div>
      )}

      {/* Season + word reminder */}
      {word && (
        <div
          className="rounded-2xl p-4 mb-5 flex items-center gap-3"
          style={{
            background: season?.colour ? `${season.colour}15` : '#4f46e515',
            border: `1px solid ${season?.colour ? `${season.colour}30` : '#4f46e530'}`,
          }}
        >
          <span className="text-2xl">{season?.emoji || '📅'}</span>
          <div>
            <p className="text-white text-sm font-semibold">{season?.title}</p>
            <p className="text-gray-400 text-xs">
              Today's word: <span className="text-white font-medium">{word.word}</span>
            </p>
          </div>
        </div>
      )}

      {/* Share button stub */}
      <button
        onClick={() => {
          const text = `I scored ${totalEarned}/${totalPossible} on today's Chatter Club challenge! 🔥`
          if (navigator.share) {
            navigator.share({ text, url: window.location.origin + '/challenge' }).catch(() => {})
          } else {
            navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'))
          }
        }}
        className="w-full py-3 rounded-2xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium transition-all mb-3"
      >
        📤 Share your result
      </button>

      {/* Finish */}
      <button
        onClick={onFinish}
        className="w-full py-4 rounded-2xl text-white font-bold text-lg active:scale-95 transition-all"
        style={{
          background: season?.colour
            ? `linear-gradient(135deg, ${season.colour}, ${season.colour}cc)`
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        }}
      >
        Done ✓
      </button>
    </div>
  )
}
