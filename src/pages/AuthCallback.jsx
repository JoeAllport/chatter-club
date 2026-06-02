import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Landing page for Supabase auth redirects:
 *   - Google OAuth redirects here after consent
 *   - Magic link clicks redirect here
 *
 * After the session is confirmed we check the user_profiles row.
 * If display_name is missing → onboarding not done → /onboarding
 * Otherwise → /home (platform home screen)
 */
export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    async function handleCallback() {
      // Supabase automatically exchanges the code/token from the URL hash
      // and fires onAuthStateChange. We just need to wait for it.
      const { data: { session } } = await supabase.auth.getSession()

      if (!mounted) return

      if (!session) {
        // Something went wrong — send back to join
        navigate('/join', { replace: true })
        return
      }

      const uid = session.user.id

      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, learning_goal')
        .eq('user_id', uid)
        .maybeSingle()

      if (!mounted) return

      const needsOnboarding = !profile?.display_name || !profile?.learning_goal

      if (needsOnboarding) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    }

    handleCallback()
    return () => { mounted = false }
  }, [navigate])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-4">💬</div>
        <p className="text-sm text-gray-400 animate-pulse">Signing you in…</p>
      </div>
    </div>
  )
}
