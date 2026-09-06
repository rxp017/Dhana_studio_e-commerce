'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import HeroGL from '@/components/HeroGL'
import Reveal from '@/components/Reveal'
import ProductCard from '@/components/ProductCard'
import { useApp } from '@/components/providers'
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Truck, ShieldCheck, RefreshCcw, Printer, Star, Sparkle } from 'lucide-react'

export default function Home() {
  const { settings } = useApp()
  const [newP, setNewP] = useState([])
  const [topP, setTopP] = useState([])
  const rail = useRef(null)

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true)
      .order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => setNewP(data || []))
    supabase.from('products').select('*').eq('is_active', true)
      .order('rating_count', { ascending: false }).limit(8)
      .then(({ data }) => setTopP(data || []))
  }, [])

  const slide = d => rail.current?.scrollBy({ left: d * 620, behavior: 'smooth' })
  const wa = `https://wa.me/${settings?.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP}?text=${encodeURIComponent('Hi Dhana Studio! I want to place a custom print order.')}`

  const steps = [
    ['You imagine', 'Send your artwork, photo or idea on WhatsApp — or pick a design from our studio library. We mock it up for free.'],
    ['We print', 'Hi-definition DTG printing on 240 GSM combed cotton; digital silk for sarees. Every piece is cured, washed and checked by hand.'],
    ['You shine', 'Steam-pressed, packed with care and shipped pan-India in 4–6 days. Secure checkout, easy damage exchanges.'],
  ]

  return (
    <>
      <section className="hero">
        <HeroGL />
        <div className="wrap hero-in">
          <div className="hero-grid">
            <div>
              <img src="/logo.jpeg" alt="Dhana Studio — Wear Your Vibe. Be You." className="hero-logo" />
              <p className="kicker">{settings?.hero_kicker}</p>
              <h1>
                <span className="hline"><span style={{ '--i': 0 }}>{settings?.hero_title_a}</span></span>
                <span className="hline"><span style={{ '--i': 1 }}><em className="it">{settings?.hero_title_b}</em></span></span>
              </h1>
              <p className="hero-sub">{settings?.hero_sub}</p>
              <div className="hero-cta">
                <Link href="/shop?category=tshirt" className="btn btn-verm">Shop t-shirts <ArrowRight size={15} className="arrow" /></Link>
                <Link href="/shop?category=saree" className="btn btn-ghost">Shop sarees <ArrowRight size={15} className="arrow" /></Link>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hv-back"><img src="/api/img/saree?design=temple" alt="Temple border printed saree" /></div>
              <div className="hv-main"><img src="/api/img/tee?color=cream&design=kaavi" alt="Kaavi block-print oversized t-shirt" /></div>
              <div className="hv-tag">
                <div className="t">NEW DROP · OVERSIZED</div>
                <div className="p">₹650<span className="m">₹1,299</span></div>
                <div className="hv-swatches">
                  <span className="hv-swatch" style={{ background: '#221E1A' }} />
                  <span className="hv-swatch" style={{ background: '#F5F0E5' }} />
                  <span className="hv-swatch" style={{ background: '#E6D7B8' }} />
                  <span className="hv-swatch" style={{ background: '#B3261E' }} />
                  <span className="hv-swatch" style={{ background: '#B4A1DC' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-meta">
          <div className="wrap">
            <span className="hm-item"><Star size={13} fill="currentColor" /> 4.8/5 from 2,300+ buyers</span>
            <span className="hm-item hide-m"><ShieldCheck size={13} /> Secure payments</span>
            <span className="hm-item hide-m"><Truck size={13} /> Free shipping over ₹999</span>
            <span className="cue"><span className="cue-line" />SCROLL</span>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="mq-track">
          {[0, 1].map(g => (
            <div className="mq-group" key={g}>
              {['FREE SHIPPING OVER ₹999', 'SECURE RAZORPAY CHECKOUT', 'CUSTOM PRINTS IN 24 HRS', '7-DAY DAMAGE COVER', 'PRINTED & PACKED IN INDIA'].map(t => (
                <span className="mq-item" key={t}>{t}<Sparkle size={13} /></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="trust">
        <div className="wrap">
          {[
            [Truck, 'Free shipping', 'On orders over ₹999'],
            [ShieldCheck, 'Secure checkout', 'UPI, cards & netbanking'],
            [RefreshCcw, '7-day damage cover', 'Exchange on defects'],
            [Printer, 'Custom prints', 'Your design, shipped in 24 hrs'],
          ].map(([Icon, t, s]) => (
            <div className="trust-item" key={t}><Icon size={20} /><div><b>{t}</b><small>{s}</small></div></div>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <div className="kicker">THE COLLECTIONS</div>
              <h2 className="sec-title">Two crafts, <span className="it">one studio</span></h2>
            </div>
          </Reveal>
          <div className="split">
            <Reveal>
              <Link className="split-card" href="/shop?category=tshirt" data-cursor>
                <img src="/api/img/tee?color=black&design=kaavi" alt="Custom printed oversized t-shirts" />
                <div className="split-plate">
                  <div className="split-k">MRP ₹1,299 · NOW ₹650</div>
                  <h3>Custom T-Shirts</h3>
                  <p>240 GSM combed cotton, hi-def prints, 5 colours</p>
                  <span className="split-cta">Shop tees <ArrowUpRight size={15} /></span>
                </div>
              </Link>
            </Reveal>
            <Reveal delay={130}>
              <Link className="split-card" href="/shop?category=saree" data-cursor>
                <img src="/api/img/saree?design=kanjivaram" alt="Printed sarees" />
                <div className="split-plate">
                  <div className="split-k">MRP ₹1,399 · NOW ₹750</div>
                  <h3>Printed Sarees</h3>
                  <p>Digital silk &amp; modal, hand-finished borders</p>
                  <span className="split-cta">Shop sarees <ArrowUpRight size={15} /></span>
                </div>
              </Link>
            </Reveal>
            <Reveal delay={260}>
              <Link className="split-card" href="/shop?category=sticker" data-cursor>
                <img src="/api/img/sticker?design=custom" alt="D2D sticker packs" />
                <div className="split-plate">
                  <div className="split-k">FROM ₹199</div>
                  <h3>D2D Stickers</h3>
                  <p>Paste-on prints for your tees — or upload your own design</p>
                  <span className="split-cta">Shop stickers <ArrowUpRight size={15} /></span>
                </div>
              </Link>
            </Reveal>
          
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <Reveal>
              <div className="kicker">JUST LANDED</div>
              <h2 className="sec-title">New <span className="it">arrivals</span></h2>
            </Reveal>
            <div className="rail-nav">
              <button onClick={() => slide(-1)} aria-label="Scroll left"><ChevronLeft size={18} /></button>
              <button onClick={() => slide(1)} aria-label="Scroll right"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="rail" ref={rail}>
            {newP.map((p, i) => <ProductCard key={p.id} p={p} delay={i * 60} />)}
          </div>
          <div style={{ marginTop: '1.2rem' }}>
            <Link href="/shop?sort=new" className="see-all">View all new arrivals <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="method">
        <div className="wrap">
          <Reveal className="sec-head inv">
            <div>
              <div className="kicker" style={{ color: 'var(--verm-lt)' }}>HOW IT WORKS</div>
              <h2 className="sec-title">From your mind <span className="it">to your wardrobe</span></h2>
            </div>
            <a className="btn btn-verm" href={wa} target="_blank" rel="noreferrer">Start a custom order <ArrowUpRight size={15} /></a>
          </Reveal>
          <div className="method-grid">
            {steps.map(([t, d], i) => (
              <Reveal className="step" key={t} delay={i * 130}>
                <div className="step-num">{String(i + 1).padStart(2, '0')}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <div className="kicker">CROWD FAVOURITES</div>
              <h2 className="sec-title">Loved by <span className="it">10,000+</span> customers</h2>
            </div>
          </Reveal>
          <div className="pgrid">
            {topP.map((p, i) => <ProductCard key={p.id} p={p} delay={(i % 4) * 70} />)}
          </div>
        </div>
      </section>

      <section className="quote-sec">
        <div className="wrap">
          <Reveal>
            <div className="bigquote">
              <p className="qtext">The saree I designed for my sister&apos;s engagement got us stopped all evening. The print quality is honestly unreal.</p>
              <div className="qwho">
                <span className="qstars">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</span>
                <b>Ananya R.</b> · Coimbatore · Verified buyer
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}