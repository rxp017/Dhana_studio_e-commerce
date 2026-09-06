'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/components/providers'
import Reveal from '@/components/Reveal'
import { inr, loadScript, deliveryBy } from '@/lib/utils'
import { Truck, ShieldCheck, Lock, Package } from 'lucide-react'

const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']

export default function Checkout() {
  const { cart, subtotal, user, profile, ready, clearCart, showToast, cfg } = useApp()
  const [form, setForm] = useState({ name: '', phone: '', line1: '', city: '', state: 'Tamil Nadu', pincode: '', notes: '' })
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const [agree, setAgree] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    const a = profile?.default_address
    setForm(f => ({
      ...f,
      name: f.name || profile?.full_name || a?.name || '',
      phone: f.phone || profile?.phone || (user?.phone || '').replace('+91', '') || a?.phone || '',
      line1: f.line1 || a?.line1 || '',
      city: f.city || a?.city || '',
      state: a?.state || f.state,
      pincode: f.pincode || a?.pincode || '',
    }))
  }, [profile, user])

  const gst = Math.round(subtotal * cfg.gst_rate)
  const shipping = subtotal >= cfg.free_ship || subtotal === 0 ? 0 : cfg.ship_fee
  const total = subtotal + gst + shipping

  const set = k => e => setForm({ ...form, [k]: e.target.value })

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile'
    if (!form.line1.trim()) e.line1 = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = '6-digit pincode'
    setErrs(e)
    return !Object.keys(e).length
  }

  const items = cart.map(i => ({ id: i.id, size: i.size, color: i.color, qty: i.qty, design: i.design || null }))

  const startOrder = async () => {
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, address: form, method: 'online' }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not start the order')
    return data
  }

  const payOnline = async () => {
    if (!validate()) return
    if (!agree) return showToast('Please accept the Returns & Exchange policy to continue', 'err')
    setBusy(true)
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js')
      const data = await startOrder()
      const rzp = new window.Razorpay({
        key: data.key,
        order_id: data.order.rp_order_id,
        amount: data.order.amount,
        currency: 'INR',
        name: 'Dhana Studio',
        description: `Order #${data.order.id.slice(0, 8).toUpperCase()}`,
        image: `${location.origin}/logo.jpeg`,
        prefill: { name: form.name, contact: `+91${form.phone}` },
        theme: { color: '#C3491F' },
        // Payment layout:
        // - UPI block is first: on desktop it shows QR + UPI ID,
        //   on mobile it auto-detects installed apps (GPay/PhonePe/Paytm)
        //   and still offers QR + entering a UPI ID.
        // - Then cards, net banking and wallets.
        config: {
          display: {
            blocks: {
              upi: { name: 'UPI — GPay, PhonePe, Paytm', instruments: [{ method: 'upi', flows: ['qr', 'intent', 'collect'] }] },
              cards: { name: 'Credit / Debit Card', instruments: [{ method: 'card' }] },
              netbanking: { name: 'Net Banking', instruments: [{ method: 'netbanking' }] },
              wallets: { name: 'Wallets', instruments: [{ method: 'wallet' }] },
            },
            sequence: ['block.upi', 'block.cards', 'block.netbanking', 'block.wallets'],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async r => {
          const v = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rp_order_id: r.razorpay_order_id,
              rp_payment_id: r.razorpay_payment_id,
              signature: r.razorpay_signature,
            }),
          }).then(x => x.json())
          if (v.ok) {
            clearCart()
            setDone({ id: v.order_id || data.order.id, total, name: form.name })
          } else showToast(v.error || 'Payment verification failed — contact support', 'err')
        },
        modal: { ondismiss: () => showToast('Payment window closed — your cart is safe.', 'err') },
      })
      rzp.open()
    } catch (err) {
      showToast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  if (done) return (
    <div className="wrap">
      <div className="success panel">
        <div className="check-ring">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path className="draw" d="M4 12.5l5 5L20 6.5" />
          </svg>
        </div>
        <h1>Payment successful!</h1>
        <p className="succ-sub">
          Thank you, {done.name.split(' ')[0]}. Order <b>#{done.id.slice(0, 8).toUpperCase()}</b>
          {} for <b>{inr(done.total)}</b> (including {cfg.gstPct}% GST) is confirmed and will reach you by <b>{deliveryBy(6)}</b>.
          Your invoice is ready.
        </p>
        <div className="succ-cta">
          <Link className="btn btn-verm" href={`/invoice/${done.id}`}>View &amp; print invoice</Link>
          <Link className="btn btn-ghost" href="/orders">Track my order</Link>
          <Link className="btn btn-ghost" href="/shop">Continue shopping</Link>
        </div>
      </div>
    </div>
  )

  if (!ready) return null

  if (!user) return (
    <div className="wrap"><div className="empty">
      <Package size={40} strokeWidth={1.2} />
      <h3>Log in to check out</h3>
      <p>Your cart is saved — it takes 20 seconds with Google.</p>
      <Link className="btn btn-verm" href="/auth?next=/checkout">Log in / Sign up</Link>
    </div></div>
  )

  if (cart.length === 0) return (
    <div className="wrap"><div className="empty">
      <h3>Your cart is empty.</h3>
      <p>Fill it with something worth printing.</p>
      <Link className="btn btn-solid" href="/shop">Start shopping</Link>
    </div></div>
  )

  return (
    <div className="wrap sec-sm">
      <Reveal className="sec-head">
        <div>
          <div className="kicker">ALMOST YOURS</div>
          <h2 className="sec-title">Secure <span className="it">checkout</span></h2>
        </div>
      </Reveal>
      <div className="co-grid">
        <div className="panel">
          <h3><Truck size={16} /> Delivery details</h3>
          <div className="form-grid">
            <div className="field"><label>Full name</label>
              <input value={form.name} onChange={set('name')} />
              {errs.name && <span className="err-msg">{errs.name}</span>}
            </div>
            <div className="field"><label>Mobile number</label>
              <input inputMode="numeric" maxLength={10} value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
              {errs.phone && <span className="err-msg">{errs.phone}</span>}
            </div>
            <div className="field full"><label>Address (house no, street, area)</label>
              <input value={form.line1} onChange={set('line1')} />
              {errs.line1 && <span className="err-msg">{errs.line1}</span>}
            </div>
            <div className="field"><label>City</label>
              <input value={form.city} onChange={set('city')} />
              {errs.city && <span className="err-msg">{errs.city}</span>}
            </div>
            <div className="field"><label>State</label>
              <select value={form.state} onChange={set('state')}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field"><label>Pincode</label>
              <input inputMode="numeric" maxLength={6} value={form.pincode}
                onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
              {errs.pincode && <span className="err-msg">{errs.pincode}</span>}
            </div>
            <div className="field full"><label>Instructions for delivery partner (optional)</label>
              <input value={form.notes} onChange={set('notes')} placeholder="Landmark, gate code, call before delivery…" />
            </div>
          </div>
        </div>

        <div className="panel co-sum">
          <h3><ShieldCheck size={16} /> Order summary</h3>
          {cart.map((it, i) => (
            <div className="sum-item" key={i}>
              <img src={it.image || `https://picsum.photos/seed/${it.id}/300/400`} alt="" />
              <div className="sum-info">
                <span className="sum-name">{it.name}</span>
                <span className="sum-meta">
                  {[it.size && `Size ${it.size}`, it.color, `Qty ${it.qty}`].filter(Boolean).join(' · ')}
                </span>
                {it.design && (
                  <a className="sum-meta" href={it.design} target="_blank" rel="noreferrer" style={{ color: 'var(--verm)', fontWeight: 700 }}>custom design ↗</a>
                )}
                <b>{inr(it.price * it.qty)}</b>
              </div>
            </div>
          ))}
          <div className="sum-rows">
            <div className="sum-line"><span>Subtotal (excl. GST)</span><span>{inr(subtotal)}</span></div>
            <div className="sum-line"><span>GST ({cfg.gstPct}%)</span><span>{inr(gst)}</span></div>
            <div className="sum-line"><span>Delivery</span>
              <span>{shipping === 0 ? <b className="green">FREE</b> : inr(shipping)}</span>
            </div>
            <div className="sum-total"><span>Total</span><span>{inr(total)}</span></div>
          </div>
          <label className="check" style={{ marginBottom: '1rem' }}>
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
            <span>I agree to the <Link href="/policy" style={{ color: 'var(--verm)', fontWeight: 700 }}>Returns &amp; Exchange policy</Link> (unboxing video required for claims)</span>
          </label>
          <button className="btn btn-verm wide" onClick={payOnline} disabled={busy}>
            {busy ? <span className="spinner" /> : <Lock size={14} />} Pay {inr(total)} securely
          </button>
          <p className="secure-note">
            <ShieldCheck size={13} /> UPI · QR · GPay · PhonePe · Paytm · Cards · Net Banking · Wallets
          </p>
        </div>
      </div>
    </div>
  )
}