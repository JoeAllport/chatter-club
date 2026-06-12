/**
 * CompletionScreen — shown at the end of a session.
 * Displays score, time taken, and next action options.
 */

function ScoreRing({ pct }) {
  const size = 120
  const stroke = 8
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const colour = pct >= 80 ? '#22c55e' : pct >= 50 ? '#6366f1' : '#f59e0b'

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={colour} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

export default function CompletionScreen({ score, totalScreens, scoredScreens, timeSeconds, chapterTitle, onContinue, onReview, onExit }) {
  const pct = scoredScreens > 0 ? Math.round((score / scoredScreens) * 100) : 100
  const mins = Math.floor(timeSeconds / 60)
  const secs = timeSeconds % 60

  const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📖'
  const message = pct >= 80
    ? 'Excellent work!'
    : pct >= 60
      ? 'Good effort — keep going!'
      : 'Keep practising — it gets easier!'

  return (
    <div className="flex flex-col h-full px-6 py-10 items-center justify-between">
      {/* Top section */}
      <div className="flex flex-col items-center text-center">
        <div className="text-5xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{message}</h2>
        <p className="text-sm text-gray-400">{chapterTitle}</p>
      </div>

      {/* Score ring */}
      <div className="relative flex items-center justify-center">
        <ScoreRing pct={pct} />
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-black text-gray-900">{pct}%</span>
          <span className="text-xs text-gray-400">score</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-8 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">{score}/{scoredScreens}</p>
          <p className="text-xs text-gray-400 mt-0.5">correct</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">time</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalScreens}</p>
          <p className="text-xs text-gray-400 mt-0.5">screens</p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full space-y-3">
        <button
          onClick={onContinue}
          className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Continue →
        </button>
        {pct < 100 && onReview && (
          <button
            onClick={onReview}
            className="w-full py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl text-sm hover:border-indigo-300 hover:text-indigo-700 transition-all"
          >
            Review mistakes
          </button>
        )}
        <button
          onClick={onExit}
          className="w-full py-3 text-gray-400 text-sm hover:text-gray-600 transition-colors"
        >
          Back to course
        </button>
      </div>
    </div>
  )
}
