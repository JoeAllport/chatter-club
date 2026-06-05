// ── Step 1: Word of the Day ───────────────────────────────────────────────────
// Shows the word, IPA, definition, example. No scoring — just learn it.

import { useState } from 'react'

export default function StepWordOfDay({ word, season, onDone }) {
  const [revealed, setRevealed] = useState(false)

  if (!word) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-gray-500">No word for today.</p>
        <button onClick={onDone} className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl">
          Continue →
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col pt-6">
      {/* Label */}
      <div className="text-center mb-8">
        <span className="text-xs text-gray-500 uppercase tracking-widest">Word of the day</span>
      </div>

      {/* Word card */}
      <div
        className="rounded-2xl p-8 mb-6 text-center flex-1 flex flex-col justify-center"
        style={{
          background: season?.colour
            ? `linear-gradient(145deg, ${season.colour}18, ${season.colour}08)`
            : 'linear-gradient(145deg, #312e8120, #1e1b4b10)',
          border: `1px solid ${season?.colour ? `${season.colour}30` : '#4f46e530'}`,
        }}
      >
        {/* Icon (Noun Project — only for concrete nouns/verbs) */}
        {word.icon_url && (
          <div className="flex justify-center mb-5">
            <img
              src={word.icon_url}
              alt={word.word}
              className="w-16 h-16 opacity-80"
              style={{ filter: `invert(1) sepia(1) saturate(2) hue-rotate(${season?.colour ? '200deg' : '220deg'})` }}
            />
          </div>
        )}

        {/* Word */}
        <h1
          className="text-5xl font-bold tracking-tight mb-3"
          style={{ color: season?.colour || '#a5b4fc' }}
        >
          {word.word}
        </h1>

        {/* IPA + POS */}
        <p className="text-gray-400 text-sm mb-1">{word.ipa}</p>
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-6">{word.part_of_speech}</p>

        {/* Definition */}
        <p className="text-gray-200 text-lg leading-relaxed max-w-sm mx-auto">
          {word.definition}
        </p>

        {/* Example — reveal on tap */}
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 text-sm text-gray-500 hover:text-gray-300 underline transition-colors"
          >
            Show example sentence
          </button>
        ) : (
          <div className="mt-6 border-l-2 border-gray-600 pl-4 text-left">
            <p className="text-gray-400 text-sm italic">"{word.example}"</p>
          </div>
        )}

        {/* Audio button stub */}
        <button
          className="mt-6 mx-auto flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          title="Audio coming soon"
        >
          🔊 Listen
        </button>
      </div>

      {/* Continue */}
      <button
        onClick={onDone}
        className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
        style={{
          background: season?.colour
            ? `linear-gradient(135deg, ${season.colour}, ${season.colour}cc)`
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        }}
      >
        I've got it →
      </button>
    </div>
  )
}
