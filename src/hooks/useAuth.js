// useAuth.js — lightweight auth + subscription state hook
// Returns { userId, isPro, checking }

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [userId,   setUserId]   = useState(null)
  const [isPro,    setIsPro]    = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load(session) {
      const user = session?.user ?? null

      if (!user) {
        if (mounted) { setUserId(null); setIsPro(false); setChecking(false) }
        return
      }

      // Check is_pro on user_profiles (Stripe sets this post-launch; always false for now)
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('is_pro')
        .eq('user_id', user.id)
        .maybeSingle()

      if (mounted) {
        setUserId(user.id)
        setIsPro(prof?.is_pro ?? false)
        setChecking(false)
      }
    }

    // Initial session
    supabase.auth.getSession().then(({ data }) => load(data.session))

    // Live updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      load(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { userId, isPro, checking }
}
