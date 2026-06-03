import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── Sub-components ────────────────────────────────────────────────────────────
import ChallengeSession  from '../components/challenge/ChallengeSession'
import ChallengeHomeCard from '../components/challenge/ChallengeHomeCard'
import PageMeta          from '../components/PageMeta'

// ── DailyChallenge page ───────────────────────────────────────────────────────
// Entry point: shows home card → launches session on Start

export default function DailyChallenge() {
  const navigate = useNavigate()

  const [state,       setState]       = useState('loading') // loading | no_challenge | home | session | already_done
  const [challenge,   setChallenge]   = useState(null)
  const [season,      setSeason]      = useState(null)
  const [word,        setWord]        = useState(null)
  const [streak,      setStreak]      = useState(null)
  const [user,        setUser]        = useState(null)
  const [completion,  setCompletion]  = useState(null)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)

    const today = new Date().toISOString().slice(0, 10)

    // Load today's challenge
    const { data: ch } = await supabase
      .from('daily_challenges')
      .select(`
        *,
        season:seasons(*),
        word:season_words(*)
      `)
      .eq('challenge_date', today)
      .eq('status', 'published')
      .maybeSingle()

    if (!ch) {
      setState('no_challenge')
      return
    }

    setChallenge(ch)
    setSeason(ch.season)
    setWord(ch.word)

    // Load streak if logged in
    if (u) {
      const { data: st } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', u.id)
        .maybeSingle()
      setStreak(st)

      // Check if already completed today
      const { data: comp } = await supabase
        .from('user_challenge_completions')
        .select('*')
        .eq('user_id', u.id)
        .eq('daily_challenge_id', ch.id)
        .maybeSingle()

      if (comp) {
        setCompletion(comp)
        setState('already_done')
        return
      }
    }

    setState('home')
  }

  function handleStart() {
    setState('session')
  }

  async function handleComplete(result) {
    // result: { score, max_score, answers }
    if (user) {
      // Save completion
      const { data: comp } = await supabase
        .from('user_challenge_completions')
        .insert({
          user_id:             user.id,
          daily_challenge_id:  challenge.id,
          score:               result.score,
          max_score:           result.max_score,
          answers:             result.answers,
        })
        .select()
        .single()

      setCompletion(comp)

      // Update streak
      await updateStreak(user.id, challenge.challenge_type, challenge.challenge_date)

      // Refresh streak display
      const { data: st } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      setStreak(st)
    }

    setState('already_done')
  }

  // ── Streak logic ─────────────────────────────────────────────────────────────
  // Streak only counts Mon–Fri daily challenges (not weekend quiz)

  async function updateStreak(userId, challengeType, dateStr) {
    if (challengeType !== 'daily') return  // weekend quiz doesn't count

    const today = dateStr
    const { data: current } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const prevDate = current?.last_completed_date
    const prevStreak = current?.current_streak || 0
    const prevLongest = current?.longest_streak || 0
    const prevSeasonScore = current?.season_score || 0
    const prevTotalScore = current?.total_score || 0

    // Is today the day after the last completed date (Mon-Fri consecutive)?
    // We count a break if more than 1 weekday has passed
    const isConsecutive = prevDate ? isNextWeekday(prevDate, today) : false
    const newStreak = isConsecutive ? prevStreak + 1 : 1
    const newLongest = Math.max(newStreak, prevLongest)

    const payload = {
      user_id:             userId,
      current_streak:      newStreak,
      longest_streak:      newLongest,
      last_completed_date: today,
      season_score:        prevSeasonScore,  // incremented separately
      total_score:         prevTotalScore,
      updated_at:          new Date().toISOString(),
    }

    if (current) {
      await supabase.from('user_streaks').update(payload).eq('user_id', userId)
    } else {
      await supabase.from('user_streaks').insert(payload)
    }
  }

  function isNextWeekday(prevDateStr, todayStr) {
    const prev  = new Date(prevDateStr + 'T00:00:00')
    const today = new Date(todayStr   + 'T00:00:00')
    const diffDays = Math.round((today - prev) / 86400000)

    // Mon→Tue, Tue→Wed, Wed→Thu, Thu→Fri = diff 1
    // Fri→Mon = diff 3 (skip Sat, Sun)
    const prevDow  = prev.getDay()  // 0=Sun … 6=Sat
    const todayDow = today.getDay()

    if (diffDays === 1) return true
    if (prevDow === 5 && todayDow === 1 && diffDays === 3) return true  // Fri → Mon
    return false
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <>
        <PageMeta
          title="Daily Challenge"
          description="Complete today's English challenge. Learn a new word, read a short passage, and test yourself — in under 5 minutes."
          canonical="/challenge"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  if (state === 'no_challenge') {
    return (
      <>
        <PageMeta
          title="Daily Challenge"
          description="Complete today's English challenge. Learn a new word, read a short passage, and test yourself — in under 5 minutes."
          canonical="/challenge"
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <p className="text-5xl mb-4">😴</p>
          <h2 className="text-2xl font-bold text-white mb-2">No challenge today</h2>
          <p className="text-gray-400">Come back tomorrow — or on a weekday.</p>
        </div>
      </>
    )
  }

  if (state === 'session') {
    return (
      <ChallengeSession
        challenge={challenge}
        season={season}
        word={word}
        user={user}
        onComplete={handleComplete}
      />
    )
  }

  // 'home' or 'already_done'
  return (
    <>
      <PageMeta
        title="Daily Challenge"
        description="Complete today's English challenge. Learn a new word, read a short passage, and test yourself — in under 5 minutes."
        canonical="/challenge"
      />
      <ChallengeHomeCard
        challenge={challenge}
        season={season}
        word={word}
        streak={streak}
        completion={completion}
        alreadyDone={state === 'already_done'}
        onStart={handleStart}
        onSignIn={() => navigate('/join')}
        user={user}
      />
    </>
  )
}
