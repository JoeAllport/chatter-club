/**
 * PassageScreen — shows the full passage before gap-by-gap answering.
 *
 * Used as a read-only intro before open_cloze and gap_fill screens.
 * Gaps are shown as numbered blanks: (1) ___ so students can read
 * the whole text and understand context before answering.
 *
 * data.passage     — raw passage string with gap markers
 * data.gapStyle    — 'numbered' (1) ___ | 'blank' ___  (default: numbered)
 * data.totalGaps   — number of gaps (shown in subheading)
 * data.title       — optional heading (e.g. "Part 2 — Open Cloze")
 * data.instruction — optional instruction line
 */
export default function PassageScreen({ data, onNext }) {
  const {
    passage = '',
    gapStyle = 'numbered',
    totalGaps = 0,
    title = '',
    instruction = 'Read the text carefully before filling in the gaps.',
  } = data

  // Render the passage with highlighted gap markers
  // open_cloze format:  (1) ___   (2) ___
  // gap_fill format:    ___
  const rendered = renderPassage(passage, gapStyle)

  return (
    <div className="flex flex-col h-full px-6 py-6">

      {/* Header */}
      <div className="flex-shrink-0 mb-5">
        {title && (
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
            {title}
          </p>
        )}
        <p className="text-sm text-gray-500 leading-snug">{instruction}</p>
        {totalGaps > 0 && (
          <p className="text-xs text-gray-400 mt-1">{totalGaps} gaps to complete</p>
        )}
      </div>

      {/* Passage */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-gray-50 rounded-2xl p-5 text-sm text-gray-800 leading-relaxed">
          {rendered}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 pt-5">
        <button
          onClick={() => onNext(null)}
          className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Start filling gaps →
        </button>
      </div>
    </div>
  )
}

// ── Passage renderer ──────────────────────────────────────────────────────────

function renderPassage(passage, gapStyle) {
  if (!passage) return null

  // Split on gap markers: "(1) ___" or plain "___"
  // open_cloze uses: (1) ___ or (1)___
  // gap_fill uses:   ___

  const parts = []

  if (gapStyle === 'numbered') {
    // Match "(N) ___" patterns — the gap marker from open_cloze blocks
    const regex = /\((\d+)\)\s*_{2,}/g
    let last = 0
    let match
    let gapNum = 0

    while ((match = regex.exec(passage)) !== null) {
      // Text before this gap
      if (match.index > last) {
        parts.push(
          <span key={`t${last}`}>{formatText(passage.slice(last, match.index))}</span>
        )
      }
      gapNum++
      parts.push(
        <span
          key={`g${gapNum}`}
          className="inline-flex items-center gap-1 mx-0.5"
        >
          <span className="text-xs font-bold text-indigo-500 align-super">({gapNum})</span>
          <span className="inline-block w-16 border-b-2 border-indigo-300 text-center text-indigo-400 text-xs pb-0.5">
            ____
          </span>
        </span>
      )
      last = match.index + match[0].length
    }
    if (last < passage.length) {
      parts.push(<span key={`t${last}`}>{formatText(passage.slice(last))}</span>)
    }
  } else {
    // Plain blank style: split on ___
    const segments = passage.split(/_{2,}/)
    segments.forEach((seg, i) => {
      parts.push(<span key={`t${i}`}>{formatText(seg)}</span>)
      if (i < segments.length - 1) {
        parts.push(
          <span key={`g${i}`} className="inline-block w-16 border-b-2 border-indigo-300 mx-0.5" />
        )
      }
    })
  }

  return <p className="whitespace-pre-wrap">{parts}</p>
}

// Basic markdown: *italic* and **bold**, newlines → <br>
function formatText(text) {
  if (!text) return null
  // Split on newlines first, then handle inline formatting
  return text.split('\n').map((line, li) => {
    const nodes = []
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
    let last = 0
    let match
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) nodes.push(line.slice(last, match.index))
      if (match[1]) nodes.push(<strong key={match.index}>{match[1]}</strong>)
      else if (match[2]) nodes.push(<em key={match.index}>{match[2]}</em>)
      last = match.index + match[0].length
    }
    if (last < line.length) nodes.push(line.slice(last))
    return (
      <span key={li}>
        {nodes}
        {li < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}
