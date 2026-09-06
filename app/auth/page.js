'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
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
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [timer, setTimer] = useState(0)
  const tRef = useRef()

  useEffect(() => { if (user) router.replace(next) }, [user]) // eslint-disable-line
  useEffect(() => {
    if (timer > 0) tRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
    return () => clearTimeout(tRef.current)
  }, [timer])

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) return showToast('Enter a valid 10-digit Indian mobile number', 'err')
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` })
    setBusy(false)
    if (error) return showToast(error.message, 'err')
    setSent(true); setTimer(30)
    showToast('OTP sent to +91 ' + phone)
  }

  const verify = async () => {
    if (otp.length !== 6) return showToast('Enter the 6-digit OTP', 'err')
    setBusy(true)
    const { error } = await supabase.auth.verifyOtp({ phone: `+91${phone}`, token: otp, type: 'sms' })
    setBusy(false)
    if (error) return showToast(error.message, 'err')
    router.push(next)
  }

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) showToast(error.message, 'err')
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
        <h1>Welcome to the atelier</h1>
        <p className="lead">Log in to place orders, track them live, and unlock members-only drops.</p>

        <button className="btn g-btn wide" onClick={google}>
          <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.2-7-5.1L1.2 17.4C3.2 21.4 7.3 24 12 24z"/><path fill="#FBBC05" d="M5 14.2c-.3-.8-.4-1.5-.4-2.2s.2-1.5.4-2.2L1.2 6.6C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4L5 14.2z"/><path fill="#EA4335" d="M12 4.8c2.3 0 3.9 1 4.8 1.8l3.5-3.4C18 1.2 15.2 0 12 0 7.3 0 3.2 2.6 1.2 6.6l3.8 3c1-2.9 3.8-4.8 7-4.8z"/></svg>
          Continue with Google
        </button>

        <div className="or-div">OR WITH PHONE</div>

        {!sent ? (
          <>
            <div className="phone-row">
              <span className="pre">+91</span>
              <input inputMode="numeric" maxLength={10} placeholder="98765 43210"
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
            </div>
            <p className="otp-note">New to Dhana Studio? We&apos;ll create your account automatically — no passwords, ever.</p>
            <button className="btn btn-verm wide" style={{ marginTop: '.8rem' }} onClick={sendOtp} disabled={busy}>
              {busy ? 'Sending…' : 'Send OTP'} <ArrowRight size={14} className="arrow" />
            </button>
          </>
        ) : (
          <>
            <div className="field">
              <label>Enter the 6-digit OTP sent to +91 {phone}</label>
              <input className="otp-in" inputMode="numeric" maxLength={6} placeholder="••••••"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
            </div>
            <button className="btn btn-verm wide" style={{ marginTop: '1rem' }} onClick={verify} disabled={busy}>
              {busy ? 'Verifying…' : 'Verify & continue'}
            </button>
            <p className="otp-note" style={{ display: 'flex', gap: '.8rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <button className="link" onClick={sendOtp} disabled={timer > 0 || busy}>
                {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
              </button>
              <button className="link" onClick={() => { setSent(false); setOtp('') }}>Change number</button>
            </p>
          </>
        )}
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