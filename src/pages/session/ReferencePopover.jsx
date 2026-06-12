/**
 * ReferencePopover — slides up from the bottom.
 * Shows vocabulary and grammar reference for the current chapter.
 * Always accessible via the 💡 button during a session.
 */
import { useState } from 'react'

export default function ReferencePopover({ reference, onClose }) {
  const [tab, setTab] = useState('vocab')
  const { vocab = [], grammar = [], title = 'Reference' } = reference || {}

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
          <h3 className="font-bold text-gray-900 text-base">💡 {title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl p-1">✕</button>
        </div>

        {/* Tabs */}
        {vocab.length > 0 && grammar.length > 0 && (
          <div className="flex px-6 gap-2 mb-3 flex-shrink-0">
            {['vocab', 'grammar'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'vocab' ? 'Vocabulary' : 'Grammar'}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-6 pb-8 flex-1">
          {(tab === 'vocab' || grammar.length === 0) && vocab.length > 0 && (
            <div className="space-y-4">
              {vocab.map((item, i) => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900 text-base">{item.word}</p>
                    {item.pos && (
                      <span className="text-xs text-gray-400 italic flex-shrink-0 mt-0.5">{item.pos}</span>
                    )}
                  </div>
                  {item.definition && (
                    <p className="text-sm text-gray-600 mt-0.5">{item.definition}</p>
                  )}
                  {item.example && (
                    <p className="text-sm text-indigo-600 italic mt-1">"{item.example}"</p>
                  )}
                  {item.collocations && (
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="font-medium text-gray-500">Key phrases: </span>
                      {item.collocations}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'grammar' && grammar.length > 0 && (
            <div className="space-y-4">
              {grammar.map((item, i) => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                  <p className="font-bold text-gray-900 text-base mb-1">{item.rule}</p>
                  {item.explanation && (
                    <p className="text-sm text-gray-600">{item.explanation}</p>
                  )}
                  {item.examples?.map((ex, j) => (
                    <p key={j} className="text-sm text-indigo-600 italic mt-1">"{ex}"</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {vocab.length === 0 && grammar.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No reference available for this chapter yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
