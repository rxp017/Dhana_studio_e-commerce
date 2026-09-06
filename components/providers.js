'use client'
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Check, AlertCircle } from 'lucide-react'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const DEF = {
  free_ship: 999, ship_fee: 79, gst_rate: 5,
  topbar: ['Secure payments', 'Free shipping over ₹999', 'Custom prints in 24 hrs'],
  hero_kicker: 'DHANA STUDIO · PRINT ATELIER · INDIA',
  hero_title_a: 'Wear your', hero_title_b: 'own story.',
  hero_sub: 'Custom-printed t-shirts on heavyweight cotton. Bespoke printed sarees with hand-finished borders. Designed by you, printed by us, delivered across India in 4–6 days.',
  gstin: '', store_address: '', store_email: '', store_phone: '', whatsapp: '', instagram: '',
}

export default function AppProvider({ children }) {
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState(null)
  const [theme, setTheme] = useState('light')
  const [settings, setSettings] = useState(null)
  const tRef = useRef()

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem('dhana_cart') || '[]')) } catch {}
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    supabase.from('site_settings').select('data').eq('id', 1).maybeSingle()
      .then(({ data }) => setSettings(data?.data || {}))
  }, [])

  useEffect(() => { localStorage.setItem('dhana_cart', JSON.stringify(cart)) }, [cart])

  useEffect(() => {
    if (!user) return setProfile(null)
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => setProfile(data || { role: 'customer' }))
  }, [user])

  useEffect(() => {
    if (!profile) return
    let local = null
    try { local = localStorage.getItem('dhana_theme') } catch {}
    if (!local && (profile.theme === 'dark' || profile.theme === 'light')) {
      setTheme(profile.theme)
      document.documentElement.setAttribute('data-theme', profile.theme)
    }
  }, [profile])

  const applyVars = useCallback((s, t) => {
    const r = document.documentElement.style
    ;['--paper', '--ink', '--verm'].forEach(v => r.removeProperty(v))
    if (!s?.colors) return
    const c = t === 'dark' ? s.colors.dark : s.colors.light
    if (!c) return
    if (c.paper) r.setProperty('--paper', c.paper)
    if (c.ink) r.setProperty('--ink', c.ink)
    if (c.verm) r.setProperty('--verm', c.verm)
  }, [])

  useEffect(() => { applyVars(settings, theme) }, [settings, theme, applyVars])

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type })
    clearTimeout(tRef.current)
    tRef.current = setTimeout(() => setToast(null), 2800)
  }, [])

  const toggleTheme = () => {
    const t = theme === 'dark' ? 'light' : 'dark'
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    try { localStorage.setItem('dhana_theme', t) } catch {}
    if (user) supabase.from('profiles').update({ theme: t }).eq('id', user.id).then(() => {})
  }

  const addToCart = useCallback((p, size, color, qty = 1, open = true, design = null) => {
    setCart(prev => {
      const i = prev.findIndex(x => x.id === p.id && x.size === size && x.color === color && x.design === design)
      if (i > -1) {
        const next = [...prev]
        next[i] = { ...next[i], qty: Math.min(10, next[i].qty + qty) }
        return next
      }
      return [...prev, {
        id: p.id, name: p.name, price: p.price, mrp: p.mrp,
        image: design || p.images?.[0] || null,
        size: size || null, color: color || null, design, qty,
      }]
    })
    if (open) setCartOpen(true)
    showToast('Added to your cart')
  }, [showToast])

  const setQty = (id, size, color, design, qty) =>
    setCart(prev => prev.map(x => (x.id === id && x.size === size && x.color === color && x.design === design)
      ? { ...x, qty: Math.max(1, Math.min(10, qty)) } : x))

  const removeItem = (id, size, color, design) =>
    setCart(prev => prev.filter(x => !(x.id === id && x.size === size && x.color === color && x.design === design)))

  const count = cart.reduce((s, i) => s + i.qty, 0)
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const cfg = {
    free_ship: settings?.free_ship ?? DEF.free_ship,
    ship_fee: settings?.ship_fee ?? DEF.ship_fee,
    gst_rate: (settings?.gst_rate ?? DEF.gst_rate) / 100,
    gstPct: settings?.gst_rate ?? DEF.gst_rate,
  }

  return (
    <AppCtx.Provider value={{
      cart, setCart, cartOpen, setCartOpen, user, profile, ready,
      isAdmin: profile?.role === 'admin',
      addToCart, setQty, removeItem, clearCart: () => setCart([]),
      count, subtotal, showToast, theme, toggleTheme,
      settings: { ...DEF, ...(settings || {}) }, cfg,
    }}>
      {children}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'err' ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.msg}
        </div>
      )}
    </AppCtx.Provider>
  )
}