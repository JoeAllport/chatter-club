/**
 * IntroScreen — text or instructions block rendered as a full session screen.
 * Student reads and taps "Got it" to continue.
 */
export default function IntroScreen({ data, onNext }) {
  const isInstruction = data.blockType === 'instructions'

  // Minimal markdown rendering
  const html = (data.body || '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3} (.+)$/gm, '<p class="font-bold text-lg text-gray-900 mb-2">$1</p>')
    .replace(/\n---\n/g, '<hr class="my-4 border-gray-100" />')
    .replace(/\n/g, '<br />')

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {isInstruction ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-indigo-600">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">{data.body}</p>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>

      <div className="px-6 pb-8 pt-4 flex-shrink-0">
        <button
          onClick={onNext}
          className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Got it →
        </button>
      </div>
    </div>
  )
}
