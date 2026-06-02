import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// ── Step components ────────────────────────────────────────────────────────────
import StepWordOfDay    from './steps/StepWordOfDay'
import StepPassage      from './steps/StepPassage'
import StepVocabDrill   from './steps/StepVocabDrill'
import StepWildCard     from './steps/StepWildCard'
import StepResult       from './steps/StepResult'

// ── Progress dots ─────────────────────────────────────────────────────────────

function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < current
              ? 'w-4 h-2 bg-indigo-500'
              : i === current
              ? 'w-6 h-2 bg-indigo-400'
              : 'w-2 h-2 bg-gray-700'
          }`}
        />
      ))}
    </div>
  )
}

// ── Session shell ─────────────────────────────────────────────────────────────
// Manages step flow, score accumulation, drill question loading.

export default function ChallengeSession({ challenge, season, word, user, onComplete }) {
  const isWeekend = challenge.challenge_type === 'weekend_quiz'

  // Steps: 0=word, 1=passage, 2=drill, 3=wildcard, 4=result
  // Weekend: 0=quiz, 1=result
  const STEPS = isWeekend
    ? ['weekend_quiz', 'result']
    : ['word', 'passage', 'drill', 'wildcard', 'result']

  const [step,         setStep]         = useState(0)
  const [scores,       setScores]       = useState({})    // step → { earned, possible }
  const [drillItems,   setDrillItems]   = useState([])
  const [drillLoading, setDrillLoading] = useState(false)
  const [weekendItems, setWeekendItems] = useState([])
  const [wildCardData, setWildCardData] = useState(null)
  const [passageData,  setPassageData]  = useState(null)
  const [exit,         setExit]         = useState(false)  // confirm exit

  // ── Load question sets ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isWeekend) {
      loadPassageSet()
      loadDrillSet()
      loadWildCardSet()
    } else {
      loadWeekendQuizSet()
    }
  }, [challenge.id])

  async function loadPassageSet() {
    if (!challenge.passage_set_id) return
    const { data } = await supabase
      .from('content_set_items')
      .select('position, content_items(*)')
      .eq('set_id', challenge.passage_set_id)
      .order('position')
    if (data) setPassageData(data.map(r => r.content_items))
  }

  async function loadDrillSet() {
    if (!challenge.drill_set_id) return
    setDrillLoading(true)
    const { data } = await supabase
      .from('content_set_items')
      .select('position, content_items(*)')
      .eq('set_id', challenge.drill_set_id)
      .order('position')
    if (data) setDrillItems(data.map(r => r.content_items))
    setDrillLoading(false)
  }

  async function loadWildCardSet() {
    if (!challenge.wild_card_set_id) return
    const { data } = await supabase
      .from('content_set_items')
      .select('position, content_items(*)')
      .eq('set_id', challenge.wild_card_set_id)
      .order('position')
    if (data) setWildCardData(data.map(r => r.content_items))
  }

  async function loadWeekendQuizSet() {
    if (!challenge.weekend_quiz_set_id) return
    const { data } = await supabase
      .from('content_set_items')
      .select('position, content_items(*)')
      .eq('set_id', challenge.weekend_quiz_set_id)
      .order('position')
    if (data) setWeekendItems(data.map(r => r.content_items))
  }

  // ── Step navigation ────────────────────────────────────────────────────────

  function handleStepDone(stepKey, earned, possible) {
    setScores(s => ({ ...s, [stepKey]: { earned, possible } }))
    setStep(s => s + 1)
  }

  function handleFinish() {
    const totalEarned   = Object.values(scores).reduce((a, s) => a + (s.earned  || 0), 0)
    const totalPossible = Object.values(scores).reduce((a, s) => a + (s.possible || 0), 0)
    onComplete({
      score:     totalEarned,
      max_score: totalPossible || 12,
      answers:   scores,
    })
  }

  // ── Scores for result screen ────────────────────────────────────────────────

  const totalEarned   = Object.values(scores).reduce((a, s) => a + (s.earned  || 0), 0)
  const totalPossible = Object.values(scores).reduce((a, s) => a + (s.possible || 0), 0)

  const currentStepKey = STEPS[step]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 max-w-xl mx-auto w-full">
        <button
          onClick={() => setExit(true)}
          className="text-gray-500 hover:text-white p-2 -ml-2 transition-colors"
        >
          ✕
        </button>
        <ProgressDots total={STEPS.length - 1} current={step} />
        {/* Score running total */}
        <div className="text-sm text-gray-400">
          {totalPossible > 0 ? `${totalEarned}/${totalPossible}` : ''}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-4 pb-8">

        {currentStepKey === 'word' && (
          <StepWordOfDay
            word={word}
            season={season}
            onDone={() => handleStepDone('word', 0, 0)}
          />
        )}

        {currentStepKey === 'passage' && (
          <StepPassage
            challenge={challenge}
            questions={passageData}
            onDone={(earned, possible) => handleStepDone('passage', earned, possible)}
          />
        )}

        {currentStepKey === 'drill' && (
          <StepVocabDrill
            items={drillItems}
            loading={drillLoading}
            onDone={(earned, possible) => handleStepDone('drill', earned, possible)}
          />
        )}

        {currentStepKey === 'wildcard' && (
          <StepWildCard
            challenge={challenge}
            items={wildCardData}
            onDone={(earned, possible) => handleStepDone('wildcard', earned, possible)}
          />
        )}

        {currentStepKey === 'weekend_quiz' && (
          <StepVocabDrill
            items={weekendItems}
            loading={!weekendItems.length}
            title="Weekend quiz"
            onDone={(earned, possible) => handleStepDone('weekend_quiz', earned, possible)}
          />
        )}

        {currentStepKey === 'result' && (
          <StepResult
            challenge={challenge}
            season={season}
            word={word}
            scores={scores}
            totalEarned={totalEarned}
            totalPossible={totalPossible}
            onFinish={handleFinish}
          />
        )}
      </div>

      {/* Exit confirm overlay */}
      {exit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full text-center">
            <p className="text-4xl mb-3">😬</p>
            <h3 className="text-white font-bold text-lg mb-2">Quit today's challenge?</h3>
            <p className="text-gray-400 text-sm mb-5">Your progress won't be saved.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setExit(false)}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
              >
                Keep going
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 rounded-xl bg-red-900/50 hover:bg-red-900 text-red-300 text-sm font-medium border border-red-800"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
