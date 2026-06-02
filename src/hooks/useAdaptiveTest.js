/**
 * useAdaptiveTest — Computerised Adaptive Testing (CAT) engine
 *
 * Algorithm overview:
 * ──────────────────
 * 1. Start at B1 (most common entry level for learners seeking help).
 * 2. After each answer, adjust the "current level" up or down.
 * 3. Track a history of (level, correct) pairs.
 * 4. "Converge" when we have ≥ 3 answers at the same level.
 * 5. Determine result = highest level where ≥ 2/3 answers were correct.
 * 6. Hard stop at MAX_QUESTIONS.
 *
 * Task-type weighting:
 * ──────────────────
 * Harder task types contribute more to the score calculation:
 *   mcq / true_false_ng   → 1.0  (recognition tasks)
 *   collocation            → 1.3  (production / usage knowledge)
 *   error_correction       → 1.5  (analytical / grammar)
 *
 * Skill category mapping (for the breakdown):
 *   mcq + true_false_ng  → 'vocabulary'
 *   collocation          → 'usage'
 *   error_correction     → 'grammar'
 */

import { useState, useCallback, useRef } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

export const LEVELS = ['A1', 'A2', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C2']

const LEVEL_IDX = Object.fromEntries(LEVELS.map((l, i) => [l, i]))

const TASK_WEIGHTS = {
  mcq:              1.0,
  true_false_ng:    1.0,
  collocation:      1.3,
  error_correction: 1.5,
}

const TASK_SKILL = {
  mcq:              'vocabulary',
  true_false_ng:    'vocabulary',
  collocation:      'usage',
  error_correction: 'grammar',
}

const START_LEVEL = 'B1'
const MIN_QUESTIONS = 12
const MAX_QUESTIONS = 30
const CONVERGENCE_THRESHOLD = 3  // answers at same level before we feel confident

// ── Helper ────────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Determine the final level from the answer log.
 * Returns the highest level where weighted correct rate ≥ 0.55.
 */
function computeResult(log) {
  // Group by level
  const byLevel = {}
  for (const entry of log) {
    if (!byLevel[entry.level]) byLevel[entry.level] = { weightedCorrect: 0, weightedTotal: 0 }
    byLevel[entry.level].weightedCorrect += entry.correct ? entry.weight : 0
    byLevel[entry.level].weightedTotal   += entry.weight
  }

  // Find the highest level where the learner scored ≥ 55% (weighted)
  let result = LEVELS[0]
  for (const level of LEVELS) {
    const stats = byLevel[level]
    if (!stats || stats.weightedTotal === 0) continue
    const rate = stats.weightedCorrect / stats.weightedTotal
    if (rate >= 0.55) result = level
  }
  return result
}

/**
 * Compute per-skill breakdown from log.
 * Returns { vocabulary: 0.8, usage: 0.6, grammar: 0.7 }
 */
function computeSkillScores(log) {
  const skills = { vocabulary: { c: 0, t: 0 }, usage: { c: 0, t: 0 }, grammar: { c: 0, t: 0 } }
  for (const entry of log) {
    const skill = entry.skill || 'vocabulary'
    if (!skills[skill]) skills[skill] = { c: 0, t: 0 }
    skills[skill].t++
    if (entry.correct) skills[skill].c++
  }
  return Object.fromEntries(
    Object.entries(skills).map(([k, v]) => [k, v.t > 0 ? Math.round((v.c / v.t) * 100) : null])
  )
}

/**
 * Check if the test has converged.
 * Converged = we have ≥ CONVERGENCE_THRESHOLD answers at the same level,
 * AND we've answered ≥ MIN_QUESTIONS total.
 */
function hasConverged(log, currentLevel) {
  if (log.length < MIN_QUESTIONS) return false
  const atLevel = log.filter(e => e.level === currentLevel).length
  return atLevel >= CONVERGENCE_THRESHOLD
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * @param {object[]} allItems  — full array of level-test content_items from DB
 *
 * Returns:
 *   currentItem   — the item to render right now (null if loading/done)
 *   progress      — { answered, total: MAX_QUESTIONS }
 *   currentLevel  — level the algorithm is currently testing at
 *   answer(correct, given) — call when the user answers
 *   isDone        — true when the test is complete
 *   result        — { level, skillScores, log } (only when isDone)
 *   restart()     — reset everything
 */
export function useAdaptiveTest(allItems) {
  const [currentLevel, setCurrentLevel] = useState(START_LEVEL)
  const [log,          setLog]          = useState([])         // answer log
  const [usedIds,      setUsedIds]      = useState(new Set())  // avoid repeating items
  const [isDone,       setIsDone]       = useState(false)
  const [result,       setResult]       = useState(null)
  const [currentItem,  setCurrentItem]  = useState(null)
  const [startTime,    setStartTime]    = useState(Date.now())

  // Use a ref so the answer callback always sees the latest values
  const stateRef = useRef({ currentLevel, log, usedIds })
  stateRef.current = { currentLevel, log, usedIds }

  // ── Pick next item ───────────────────────────────────────────────────────
  const pickItem = useCallback((level, used, items) => {
    const candidates = (items || []).filter(
      item => item.level === level && !used.has(item.id)
    )

    if (candidates.length === 0) return null

    // Shuffle and pick — prefer task types we haven't used much at this level
    return shuffle(candidates)[0]
  }, [])

  // ── Initialise first item ─────────────────────────────────────────────────
  // Called once items load. This is called by the parent page.
  const init = useCallback((items) => {
    const item = pickItem(START_LEVEL, new Set(), items)
    setCurrentItem(item)
    setStartTime(Date.now())
  }, [pickItem])

  // ── Answer callback ───────────────────────────────────────────────────────
  const answer = useCallback((correct, given, items) => {
    const { currentLevel: level, log: currentLog, usedIds: currentUsed } = stateRef.current
    if (!currentItem) return

    const weight = TASK_WEIGHTS[currentItem.task_type] ?? 1.0
    const skill  = TASK_SKILL[currentItem.task_type]  ?? 'vocabulary'
    const timeTaken = Date.now() - startTime

    const entry = {
      item_id:   currentItem.id,
      task_type: currentItem.task_type,
      level,
      correct,
      given,
      weight,
      skill,
      time_ms: timeTaken,
    }

    const newLog  = [...currentLog, entry]
    const newUsed = new Set([...currentUsed, currentItem.id])

    setLog(newLog)
    setUsedIds(newUsed)
    setStartTime(Date.now())

    // ── Determine next level ──────────────────────────────────────────────
    const currentIdx = LEVEL_IDX[level] ?? 2
    let nextIdx

    if (correct) {
      // Move up, but cap at C2
      nextIdx = Math.min(currentIdx + 1, LEVELS.length - 1)
    } else {
      // Move down, but floor at A1
      nextIdx = Math.max(currentIdx - 1, 0)
    }
    const nextLevel = LEVELS[nextIdx]

    // ── Check stopping conditions ─────────────────────────────────────────
    const done = newLog.length >= MAX_QUESTIONS || hasConverged(newLog, nextLevel)

    if (done) {
      const determinedLevel = computeResult(newLog)
      const skillScores     = computeSkillScores(newLog)
      setResult({ level: determinedLevel, skillScores, log: newLog })
      setIsDone(true)
      setCurrentItem(null)
      return
    }

    // ── Pick next item ────────────────────────────────────────────────────
    setCurrentLevel(nextLevel)
    const nextItem = pickItem(nextLevel, newUsed, items)

    if (!nextItem) {
      // No items available at next level — try adjacent levels
      const fallbackItem =
        pickItem(LEVELS[Math.max(nextIdx - 1, 0)], newUsed, items) ||
        pickItem(LEVELS[Math.min(nextIdx + 1, LEVELS.length - 1)], newUsed, items)

      if (!fallbackItem || newLog.length >= MIN_QUESTIONS) {
        // Can't continue — compute with what we have
        const determinedLevel = computeResult(newLog)
        const skillScores     = computeSkillScores(newLog)
        setResult({ level: determinedLevel, skillScores, log: newLog })
        setIsDone(true)
        setCurrentItem(null)
        return
      }
      setCurrentItem(fallbackItem)
    } else {
      setCurrentItem(nextItem)
    }
  }, [currentItem, pickItem, startTime])

  // ── Restart ───────────────────────────────────────────────────────────────
  const restart = useCallback((items) => {
    setCurrentLevel(START_LEVEL)
    setLog([])
    setUsedIds(new Set())
    setIsDone(false)
    setResult(null)
    setStartTime(Date.now())
    const item = pickItem(START_LEVEL, new Set(), items)
    setCurrentItem(item)
  }, [pickItem])

  return {
    currentItem,
    currentLevel,
    progress: { answered: log.length, total: MAX_QUESTIONS },
    answer,
    init,
    restart,
    isDone,
    result,
  }
}

// ── Named exports used by result screen ──────────────────────────────────────
export { computeResult, computeSkillScores, LEVEL_IDX }
