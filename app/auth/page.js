'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useApp } from '@/components/providers'
import { ChevronLeft, Package, Zap, Sparkles, ArrowRight } from 'lucide-react'

function AuthInner() {
  const { user, showToast } = useApp()
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/'
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (user) router.replace(next) }, [user]) // eslint-disable-line

  const google = async () => {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) { setBusy(false); showToast(error.message, 'err') }
  }

  return (
    <div className="auth">
      <div className="auth-hero">
        <div>
          <div className="kicker" style={{ color: 'var(--verm-lt)' }}>MEMBERS</div>
          <h2 style={{ marginTop: '.9rem' }}>One login,<br /><em className="it">endless prints.</em></h2>
        </div>
        <div className="auth-perk"><Package size={18} /><div><b>Track every order</b><small>Live status from print table to doorstep</small></div></div>
        <div className="auth-perk"><Zap size={18} /><div><b>Faster checkout</b><small>Your address saved, one-tap reorders</small></div></div>
        <div className="auth-perk"><Sparkles size={18} /><div><b>Members-only drops</b><small>First access to limited print runs</small></div></div>
      </div>
      <div className="auth-form">
        <Link href="/" className="back-link"><ChevronLeft size={14} /> Back to the store</Link>
        <h1>Welcome to the studio</h1>
        <p className="lead">Log in to place orders, track them live, and unlock members-only drops.</p>

        <button className="btn g-btn wide" onClick={google} disabled={busy}>
          <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.2-7-5.1L1.2 17.4C3.2 21.4 7.3 24 12 24z"/><path fill="#FBBC05" d="M5 14.2c-.3-.8-.4-1.5-.4-2.2s.2-1.5.4-2.2L1.2 6.6C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4L5 14.2z"/><path fill="#EA4335" d="M12 4.8c2.3 0 3.9 1 4.8 1.8l3.5-3.4C18 1.2 15.2 0 12 0 7.3 0 3.2 2.6 1.2 6.6l3.8 3c1-2.9 3.8-4.8 7-4.8z"/></svg>
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </button>
        {!busy && <ArrowRight size={14} className="arrow" style={{ display: 'none' }} />}
        <p className="otp-note" style={{ marginTop: '1rem' }}>
          New here? Your account is created automatically — no passwords, no forms.
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  )
}