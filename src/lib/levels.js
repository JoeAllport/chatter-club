// levels.js — User-facing level display utilities
//
// CEFR codes (A1–C2) stay in the database as the internal spine.
// Users see Easy / Medium / Advanced only.
// Three-tier model:
//   Easy     → A1, A2, A2+, B1        (foundation tier)
//   Medium   → B1+, B2, B2+           (standard tier)
//   Advanced → C1, C2                 (advanced tier)
//
// Article tiers map directly:
//   foundation → Easy
//   standard   → Medium
//   advanced   → Advanced

// ── Core mapping ─────────────────────────────────────────────────────────────

export const CEFR_TO_DISPLAY = {
  A1:   'Easy',
  A2:   'Easy',
  'A2+':'Easy',
  B1:   'Easy',
  'B1+':'Medium',
  B2:   'Medium',
  'B2+':'Medium',
  C1:   'Advanced',
  C2:   'Advanced',
}

export const TIER_TO_DISPLAY = {
  foundation: 'Easy',
  standard:   'Medium',
  advanced:   'Advanced',
}

// ── Display labels ────────────────────────────────────────────────────────────

export function cefrToDisplay(cefrCode) {
  return CEFR_TO_DISPLAY[cefrCode] || cefrCode || null
}

export function tierToDisplay(tier) {
  return TIER_TO_DISPLAY[tier] || tier || null
}

// ── Pill styles ───────────────────────────────────────────────────────────────
// Returns Tailwind class string for a level pill

export const DISPLAY_LEVEL_COLOURS = {
  Easy:     'bg-green-100 text-green-800 border-green-200',
  Medium:   'bg-yellow-100 text-yellow-900 border-yellow-300',
  Advanced: 'bg-blue-100 text-blue-800 border-blue-200',
}

export function levelPillClass(cefrCode) {
  const label = cefrToDisplay(cefrCode)
  return DISPLAY_LEVEL_COLOURS[label] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export function tierPillClass(tier) {
  const label = tierToDisplay(tier)
  return DISPLAY_LEVEL_COLOURS[label] || 'bg-gray-100 text-gray-600 border-gray-200'
}

// ── Level test result display ─────────────────────────────────────────────────
// Maps a CEFR result to the three-tier label + a friendly description

export function levelTestResult(cefrCode) {
  const display = cefrToDisplay(cefrCode)
  const descriptions = {
    Easy:     'You have a solid foundation in English. Focus on building vocabulary and fluency.',
    Medium:   'You have a good command of English. You can communicate confidently in most situations.',
    Advanced: 'You have an excellent level of English. You can handle complex language with precision.',
  }
  return {
    display,
    description: descriptions[display] || '',
    cefr: cefrCode,  // kept internally for adaptive test logic, not shown to user
  }
}

// ── Filter options (for article/podcast list filters) ─────────────────────────

export const LEVEL_FILTER_OPTIONS = [
  { value: 'Easy',     label: 'Easy',     pillClass: DISPLAY_LEVEL_COLOURS.Easy },
  { value: 'Medium',   label: 'Medium',   pillClass: DISPLAY_LEVEL_COLOURS.Medium },
  { value: 'Advanced', label: 'Advanced', pillClass: DISPLAY_LEVEL_COLOURS.Advanced },
]

// Maps a display level back to the CEFR codes it covers (for DB filtering)
export const DISPLAY_TO_CEFR = {
  Easy:     ['A1', 'A2', 'A2+', 'B1'],
  Medium:   ['B1+', 'B2', 'B2+'],
  Advanced: ['C1', 'C2'],
}
