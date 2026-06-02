import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const GOOGLE_SCOPES = 'openid email profile'

// ── Component ─────────────────────────────────────────────────────────────────

export default function Join() {
  const navigate = useNavigate()

  const [email,     setEmail]     = useState('')
  const [sent,      setSent]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [googleBusy,setGoogleBusy]= useState(false)
  const [error,     setError]     = useState('')

  // ── Google OAuth ────────────────────────────────────────────────────────────
  async function handleGoogle() {
    setError('')
    setGoogleBusy(true)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: GOOGLE_SCOPES,
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (err) {
      setError(err.message)
      setGoogleBusy(false)
    }
    // On success Supabase redirects the browser — nothing more to do here
  }

  // ── Magic link ──────────────────────────────────────────────────────────────
  async function handleMagicLink(e) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Top bar */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/articles" className="text-lg font-bold text-gray-950 tracking-tight">
            Chatter Club
          </Link>
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="text-4xl mb-3">💬</div>
            <h1 className="text-2xl font-bold text-gray-950 mb-2">Join Chatter Club</h1>
            <p className="text-sm text-gray-500">
              Read real English. Tap any word to translate. Build vocabulary that sticks.
            </p>
          </div>

          {sent ? (
            /* ── Magic link sent ───────────────────────────────────────────── */
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-6">
                We've sent a sign-in link to <strong>{email}</strong>. Click it to continue.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* ── Error ──────────────────────────────────────────────────── */}
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ── Google OAuth ────────────────────────────────────────────── */}
              <button
                onClick={handleGoogle}
                disabled={googleBusy}
                className="w-full flex items-center justify-center gap-3 h-11 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4"
              >
                {googleBusy ? (
                  <SpinnerIcon />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              {/* ── Divider ─────────────────────────────────────────────────── */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or use your email</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* ── Magic link form ─────────────────────────────────────────── */}
              <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="h-11 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Send sign-in link'}
                </button>
              </form>

              {/* ── Terms nudge ─────────────────────────────────────────────── */}
              <p className="mt-6 text-center text-xs text-gray-400">
                By joining you agree to our{' '}
                <a href="/terms" className="underline hover:text-gray-700">terms</a>
                {' '}and{' '}
                <a href="/privacy" className="underline hover:text-gray-700">privacy policy</a>.
              </p>

              {/* ── Sign in link ─────────────────────────────────────────────── */}
              <p className="mt-4 text-center text-xs text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="underline hover:text-gray-700">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}
