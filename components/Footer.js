'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useApp } from '@/components/providers'
import Reveal from '@/components/Reveal'
import { Instagram, MessageCircle, Mail, ArrowRight } from 'lucide-react'

export default function Footer() {
  const { showToast } = useApp()
  const [email, setEmail] = useState('')
  const wa = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}`

  const sub = async e => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return showToast('Enter a valid email', 'err')
    const { error } = await supabase.from('subscribers').insert({ email: email.trim() })
    setEmail('')
    showToast(error ? 'You are already in the club' : 'Welcome to the club — ₹100 off is on its way')
  }

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="news-in">
          <Reveal>
            <div className="kicker" style={{ color: 'var(--verm-lt)' }}>THE PRINT CLUB</div>
            <h2>Get ₹100 off your first order</h2>
            <p>Early access to new drops, members-only designs and printing tips. No spam, ever.</p>
          </Reveal>
          <form className="news-form" onSubmit={sub}>
            <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email" />
            <button className="btn btn-solid" type="submit">Join <ArrowRight size={14} className="arrow" /></button>
          </form>
        </div>
        <div className="footer-grid">
          <div className="f-brand">
            <span className="logo-badge f-logo-badge"><img src="/logo.jpeg" alt="Dhana Studio" /></span>
            <p>A print atelier for people who wear their own stories. Custom t-shirts and bespoke sarees, printed and packed in India.</p>
            <div className="f-social">
              <a className="icon-btn light" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17} /></a>
              <a className="icon-btn light" href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={17} /></a>
              <a className="icon-btn light" href="mailto:hello@dhanastudio.in" aria-label="Email"><Mail size={17} /></a>
            </div>
          </div>
          <div>
            <h4>Shop</h4>
            <div className="f-links">
              <Link href="/shop?category=tshirt">Custom T-Shirts</Link>
              <Link href="/shop?category=saree">Printed Sarees</Link>
              <Link href="/shop?sort=new">New arrivals</Link>
              <a href={wa} target="_blank" rel="noreferrer">Custom orders</a>
            </div>
          </div>
          <div>
            <h4>Help</h4>
            <div className="f-links">
              <Link href="/orders">Track my order</Link>
              <Link href="/policy">Returns &amp; exchange</Link>
              <a href={wa} target="_blank" rel="noreferrer">WhatsApp us</a>
              <Link href="/auth">My account</Link>
            </div>
          </div>
          <div>
            <h4>Why we are different</h4>
            <div className="f-links">
              <span>Hi-definition DTG printing</span>
              <span>240 GSM combed cotton tees</span>
              <span>Hand-finished saree borders</span>
              <span>Ships pan-India in 4–6 days</span>
            </div>
          </div>
        </div>
        <div className="f-bottom">
          <span>© {new Date().getFullYear()} Dhana Studio · Made with pride in India</span>
          <div className="pay-chips">
            {['UPI', 'RuPay', 'VISA', 'Mastercard', 'NetBanking', 'Wallets'].map(p => <span className="pay-chip" key={p}>{p}</span>)}
          </div>
        </div>
      </div>
    </footer>
  )
}