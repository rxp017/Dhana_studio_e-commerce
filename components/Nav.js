'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useApp } from '@/components/providers'
import { inr } from '@/lib/utils'
import { ShoppingBag, User, Search, Menu, X, LogOut, Package, Settings, Truck, Sparkles, ShieldCheck, Printer, Sun, Moon } from 'lucide-react'

export default function Nav() {
  const { count, setCartOpen, user, profile, isAdmin, theme, toggleTheme, settings } = useApp()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sugs, setSugs] = useState([])
  const [menu, setMenu] = useState(false)
  const [acct, setAcct] = useState(false)
  const [mq, setMq] = useState('')
  const acctRef = useRef(null)
  const tRef = useRef()

  const tb = settings?.topbar || ['Secure payments', 'Free shipping over ₹999', 'Custom prints in 24 hrs']
  const tbIcons = [ShieldCheck, Truck, Printer]

  useEffect(() => {
    if (!q.trim()) { setSugs([]); return }
    clearTimeout(tRef.current)
    tRef.current = setTimeout(async () => {
      const { data } = await supabase.from('products')
        .select('id,name,price,images,category').eq('is_active', true)
        .ilike('name', `%${q.trim()}%`).limit(6)
      setSugs(data || [])
    }, 250)
  }, [q])

  useEffect(() => {
    const h = e => { if (acctRef.current && !acctRef.current.contains(e.target)) setAcct(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : '' }, [menu])

  const go = e => {
    e.preventDefault()
    setMenu(false)
    if (q.trim()) router.push(`/shop?q=${encodeURIComponent(q.trim())}`)
    setSugs([])
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAcct(false); setMenu(false)
    router.push('/')
  }

  const name = profile?.full_name || user?.email?.split('@')[0] || user?.phone || 'friend'

  return (
    <header className="site-head">
      <div className="topbar">
        <div className="wrap">
          {tb.slice(0, 3).map((t, i) => {
            const Icon = tbIcons[i] || ShieldCheck
            return <span key={i} className={i === 2 ? 'hide-m' : ''}><Icon size={12} /> {t}</span>
          })}
        </div>
      </div>
      <nav className="nav">
        <div className="wrap nav-in">
          <button className="icon-btn nav-burger" onClick={() => setMenu(true)} aria-label="Menu"><Menu size={20} /></button>
          <Link href="/" className="logo" aria-label="Dhana Studio — home">
            <span className="logo-badge"><img src="/logo.jpeg" alt="Dhana Studio" /></span>
          </Link>
          <ul className="nav-links">
            <li><Link className="nlink" href="/">Home</Link></li>
            <li><Link className="nlink" href="/shop">All</Link></li>
            <li><Link className="nlink" href="/shop?category=tshirt">T-Shirts</Link></li>
            <li><Link className="nlink" href="/shop?category=saree">Sarees</Link></li>
            <li><Link className="nlink" href="/shop?category=sticker">Stickers</Link></li>
            <li><Link className="nlink" href="/shop?sort=new">New Arrivals</Link></li>
          </ul>
          <form className="nav-search" onSubmit={go}>
            <Search size={15} />
            <input placeholder="Search tees, sarees, prints…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />
            {sugs.length > 0 && (
              <div className="sugs">
                {sugs.map(s => (
                  <Link href={`/product/${s.id}`} className="sug" key={s.id} onClick={() => setSugs([])}>
                    <img src={s.images?.[0] || `https://picsum.photos/seed/${s.id}/120/160`} alt="" />
                    <div><b>{s.name}</b><small>{inr(s.price)} · {s.category === 'tshirt' ? 'T-Shirt' : s.category === 'saree' ? 'Saree' : 'Stickers'}</small></div>
                  </Link>
                ))}
              </div>
            )}
          </form>
          <div className="nav-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark / light mode" title="Dark / light mode">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="acct" ref={acctRef}>
              <button className="icon-btn" onClick={() => setAcct(!acct)} aria-label="Account"><User size={19} /></button>
              {acct && (
                <div className="acct-menu">
                  <div className="acct-hello">Hello, <b>{name}</b></div>
                  {user ? (
                    <>
                      <Link href="/orders" onClick={() => setAcct(false)}><Package size={15} /> My orders</Link>
                      {isAdmin && <Link href="/admin" onClick={() => setAcct(false)}><Settings size={15} /> Admin portal</Link>}
                      <button onClick={signOut}><LogOut size={15} /> Sign out</button>
                    </>
                  ) : (
                    <Link href="/auth" onClick={() => setAcct(false)}><User size={15} /> Log in / Sign up</Link>
                  )}
                </div>
              )}
            </div>
            <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)} aria-label="Cart">
              <ShoppingBag size={19} />
              {count > 0 && <span className="badge">{count}</span>}
            </button>
          </div>
        </div>
      </nav>

      <div className={`ov ${menu ? 'show' : ''}`} onClick={() => setMenu(false)} />
      <aside className={`m-menu ${menu ? 'open' : ''}`}>
        <div className="m-head">
          <span className="logo-badge"><img src="/logo.jpeg" alt="Dhana Studio" /></span>
          <button className="icon-btn" onClick={() => setMenu(false)}><X size={20} /></button>
        </div>
        <form className="m-search" onSubmit={e => { go(e); setMq('') }}>
          <Search size={15} />
          <input placeholder="Search the studio…" value={mq} onChange={e => setMq(e.target.value)} />
        </form>
        <nav className="m-links" onClick={() => setMenu(false)}>
          <Link href="/">Home</Link>
          <Link href="/shop">All pieces</Link>
          <Link href="/shop?category=tshirt">T-Shirts</Link>
          <Link href="/shop?category=saree">Sarees</Link>
          <Link href="/shop?category=sticker">D2D Stickers</Link>
          <Link href="/shop?sort=new">New arrivals</Link>
          <Link href="/orders">My orders</Link>
          <Link href="/policy">Returns &amp; exchange</Link>
          {isAdmin && <Link href="/admin">Admin portal</Link>}
          {!user && <Link href="/auth">Log in / Sign up</Link>}
        </nav>
        <div className="m-foot"><Sparkles size={13} /> Custom prints, made in India</div>
      </aside>
    </header>
  )
}