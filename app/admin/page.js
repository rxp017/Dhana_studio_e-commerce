'use client'
import { Fragment, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useApp } from '@/components/providers'
import { inr, fmtDate, COLOR_HEX } from '@/lib/utils'
import { Pencil, Trash2, Upload, RefreshCcw, AlertTriangle, Activity, ShieldCheck, Save } from 'lucide-react'

const STATUSES = ['pending', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'returned']
const blank = {
  name: '', category: 'tshirt', price: '', mrp: '', stock: '50',
  sizes: 'S, M, L, XL, XXL', colors: 'Black, White, Cream, Red, Lavender',
  images: '', description: '', is_new: false, is_active: true, allow_custom: false,
}

export default function Admin() {
  const { user, ready, isAdmin, showToast } = useApp()
  const [tab, setTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [stFilter, setStFilter] = useState('all')
  const [exp, setExp] = useState(null)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  // settings
  const [S, setS] = useState(null)
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [verified, setVerified] = useState(false)

  const load = useCallback(async () => {
    const [{ data: os }, { data: ps }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ])
    setOrders(os || []); setProducts(ps || [])
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    load()
    supabase.from('site_settings').select('data').eq('id', 1).maybeSingle()
      .then(({ data }) => setS({ topbar: ['', '', ''], ...(data?.data || {}) }))
  }, [isAdmin, load])

  if (!ready) return null
  if (!user || !isAdmin) return (
    <div className="wrap"><div className="gate">
      <div className="kicker">RESTRICTED</div>
      <h1>Staff only beyond this point.</h1>
      <p className="gate-sub">This portal manages Dhana Studio&apos;s products, orders and settings.</p>
      {!user
        ? <Link className="btn btn-verm" href="/auth?next=/admin">Log in</Link>
        : <Link className="btn btn-solid" href="/">Back to store</Link>}
    </div></div>
  )

  const paid = orders.filter(o => !['pending', 'cancelled', 'failed'].includes(o.status))
  const revenue = paid.reduce((s, o) => s + o.total, 0)
  const aov = paid.length ? Math.round(revenue / paid.length) : 0
  const toShip = orders.filter(o => ['paid', 'confirmed'].includes(o.status))
  const live = products.filter(p => p.is_active)
  const low = products.filter(p => p.is_active && p.stock < 10)
  const counts = Object.fromEntries(STATUSES.map(s => [s, orders.filter(o => o.status === s).length]))

  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 13 + i); return d })
  const dayCounts = days.map(d => orders.filter(o => { const od = new Date(o.created_at); od.setHours(0, 0, 0, 0); return od.getTime() === d.getTime() }).length)
  const maxC = Math.max(1, ...dayCounts)

  const recent = user?.last_sign_in_at && (Date.now() - new Date(user.last_sign_in_at).getTime() < 10 * 60 * 1000)

  const toggle = async (p, key, val) => {
    await supabase.from('products').update({ [key]: val }).eq('id', p.id)
    setProducts(ps => ps.map(x => x.id === p.id ? { ...x, [key]: val } : x))
  }

  const save = async () => {
    if (!form.name.trim() || !form.price) return showToast('Name and price are required', 'err')
    setBusy(true)
    const payload = {
      name: form.name.trim(), category: form.category,
      price: Math.round(+form.price), mrp: form.mrp ? Math.round(+form.mrp) : null,
      stock: Math.round(+form.stock || 0),
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean)
        .map(n => ({ name: n, hex: COLOR_HEX[n.toLowerCase()] || '#999999', image: null })),
      images: form.images.split(/[\n,]/).map(s => s.trim()).filter(Boolean),
      description: form.description, is_new: form.is_new, is_active: form.is_active, allow_custom: form.allow_custom,
    }
    const { error } = editing
      ? await supabase.from('products').update(payload).eq('id', editing.id)
      : await supabase.from('products').insert(payload)
    setBusy(false)
    if (error) return showToast(error.message, 'err')
    showToast(editing ? 'Product updated' : 'Product added')
    setEditing(null); setForm(blank); load()
  }

  const uploadFiles = async files => {
    if (!files?.length) return
    setUploading(true)
    const urls = []
    for (const f of files) {
      const path = `${Date.now()}-${f.name.replace(/\s+/g, '-')}`
      const { error } = await supabase.storage.from('products').upload(path, f)
      if (!error) urls.push(supabase.storage.from('products').getPublicUrl(path).data.publicUrl)
    }
    setForm(f => ({ ...f, images: [f.images, ...urls].filter(Boolean).join('\n') }))
    setUploading(false)
    showToast(urls.length ? `${urls.length} image(s) uploaded` : 'Upload failed', urls.length ? 'ok' : 'err')
  }

  // ---- settings + OTP ----
  const upd = (k, v) => setS(s => ({ ...s, [k]: v }))
  const updTb = (i, v) => setS(s => { const tb = [...(s.topbar || ['', '', ''])]; tb[i] = v; return { ...s, topbar: tb } })
  const updC = (t, k, v) => setS(s => ({ ...s, colors: { ...(s.colors || {}), [t]: { ...((s.colors || {})[t] || {}), [k]: v } } }))

  const sendOtp = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email: user.email, shouldCreateUser: false })
    if (error) return showToast('Could not send code — log out and back in with Google, then save within 10 minutes', 'err')
    setOtpSent(true)
    showToast('Verification code sent to ' + user.email)
  }

  const verifyOtp = async () => {
    const { error } = await supabase.auth.verifyOtp({ email: user.email, token: otp, type: 'email' })
    if (error) return showToast('Wrong code — try again', 'err')
    setVerified(true)
    showToast('Email verified — you can save now')
  }

  const saveSettings = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: S }),
      })
      const j = await res.json()
      if (!res.ok) return showToast(j.error, 'err')
      showToast('Settings saved — reloading with your changes')
      setTimeout(() => location.reload(), 900)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="wrap sec-sm">
      <div className="sec-head">
        <div>
          <div className="kicker">ADMIN PORTAL</div>
          <h2 className="sec-title">Mission <span className="it">control</span></h2>
        </div>
        <button className="btn btn-ghost sm-btn" onClick={load}><RefreshCcw size={14} /> Refresh</button>
      </div>
      <div className="adm-tabs">
        {['overview', 'orders', 'products', 'settings'].map(t => (
          <button key={t} className={`adm-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="stat-grid">
            <div className="stat big"><div className="lab">REVENUE (PAID)</div><div className="val">{inr(revenue)}</div></div>
            <div className="stat"><div className="lab">TOTAL ORDERS</div><div className="val">{orders.length}</div></div>
            <div className="stat"><div className="lab">DELIVERED</div><div className="val">{counts.delivered}</div></div>
            <div className="stat"><div className="lab">RETURNED</div><div className="val">{counts.returned}</div></div>
            <div className="stat"><div className="lab">CANCELLED</div><div className="val">{counts.cancelled}</div></div>
            <div className="stat"><div className="lab">TO SHIP</div><div className="val">{toShip.length}</div></div>
            <div className="stat"><div className="lab">AVG ORDER</div><div className="val">{inr(aov)}</div></div>
            <div className="stat"><div className="lab">LIVE PRODUCTS</div><div className="val">{live.length}</div></div>
          </div>
          <div className="stat-chips">
            {STATUSES.map(s => <span key={s} className="stat-chip2">{s}: <b>{counts[s]}</b></span>)}
          </div>
          <div className="panel" style={{ marginBottom: '1.4rem' }}>
            <h3><Activity size={16} /> Orders · last 14 days</h3>
            <div className="chart">
              {dayCounts.map((c, i) => (
                <div key={i} className="bar" style={{ height: (c / maxC) * 100 + '%' }}>{c > 0 && <span>{c}</span>}</div>
              ))}
            </div>
            <div className="chart-x">{days.map((d, i) => <span key={i}>{i % 2 === 0 ? d.getDate() : ''}</span>)}</div>
          </div>
          {low.length > 0 && (
            <div className="panel low-panel">
              <h3><AlertTriangle size={16} /> Low stock</h3>
              <div className="low-list">{low.map(p => <span key={p.id}>{p.name} — {p.stock} left</span>)}</div>
            </div>
          )}
        </>
      )}

      {tab === 'orders' && (
        <>
          <div className="shop-head">
            <span className="shop-count">{orders.length} orders</span>
            <select className="sel" value={stFilter} onChange={e => setStFilter(e.target.value)}>
              <option value="all">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
              <tbody>
                {orders.filter(o => stFilter === 'all' || o.status === stFilter).map(o => (
                  <Fragment key={o.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExp(exp === o.id ? null : o.id)}>
                      <td>{fmtDate(o.created_at)}</td>
                      <td><b>#{o.id.slice(0, 8).toUpperCase()}</b></td>
                      <td>{o.address?.name}<div className="tbl-sub">{o.address?.phone}</div></td>
                      <td>{o.items.length}</td>
                      <td><b>{inr(o.total)}</b></td>
                      <td>{o.razorpay_payment_id ? <span className="ok-txt">paid</span> : <span className="warn-txt">unpaid</span>}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <select className="sel sm" value={o.status} onChange={async e => {
                          const s = e.target.value
                          await supabase.from('orders').update({ status: s }).eq('id', o.id)
                          setOrders(os => os.map(x => x.id === o.id ? { ...x, status: s } : x))
                          showToast('Status updated')
                        }}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                    {exp === o.id && (
                      <tr className="exp-row"><td colSpan={7}>
                        <div className="exp-in">
                          <div><b>Deliver to:</b> {o.address?.name}, {o.address?.line1}, {o.address?.city}, {o.address?.state} — {o.address?.pincode} · {o.address?.phone}</div>
                          {o.address?.notes && <div><b>Delivery partner instructions:</b> {o.address.notes}</div>}
                          {o.items.map((it, i) => (
                            <div key={i}>{it.name} {it.size && `(size ${it.size})`} {it.color && `· ${it.color}`} × {it.qty} — {inr(it.price * it.qty)}
                              {it.design_url && <> · <a href={it.design_url} target="_blank" rel="noreferrer" style={{ color: "var(--verm)", fontWeight: 700 }}>customer design ↗</a></>}
                            </div>
                          ))}
                        </div>
                      </td></tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'products' && (
        <>
          <div className="panel adm-form form-grid">
            <h3 className="full">{editing ? `Editing: ${editing.name}` : 'Add a new product'}</h3>
            <div className="field"><label>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="tshirt">T-Shirt</option><option value="saree">Saree</option><option value="sticker">D2D Sticker</option>
              </select></div>
            <div className="field"><label>Price (₹, excl. GST)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div className="field"><label>MRP (₹, strike-through)</label>
              <input type="number" value={form.mrp} onChange={e => setForm({ ...form, mrp: e.target.value })} /></div>
            <div className="field"><label>Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
            <div className="field"><label>Sizes (comma separated)</label>
              <input value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })} /></div>
            <div className="field full"><label>Colours (comma separated — Black, White, Cream, Red, Lavender)</label>
              <input value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} /></div>
            <div className="field full"><label>Image URLs (one per line)</label>
              <textarea rows={2} value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} /></div>
            <div className="field full upload-row">
              <label className="btn btn-solid sm-btn">
                <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload images'}
                <input type="file" accept="image/*" multiple hidden disabled={uploading}
                  onChange={e => uploadFiles(e.target.files)} />
              </label>
              <label className="check"><input type="checkbox" checked={form.is_new}
                onChange={e => setForm({ ...form, is_new: e.target.checked })} /> New arrival</label>
              <label className="check"><input type="checkbox" checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Live on store</label>
              <label className="check"><input type="checkbox" checked={form.allow_custom}
                onChange={e => setForm({ ...form, allow_custom: e.target.checked })} /> Custom design upload</label>
            </div>
            <div className="field full"><label>Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-actions full">
              <button className="btn btn-verm" onClick={save} disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
              </button>
              {editing && <button className="btn btn-ghost" onClick={() => { setEditing(null); setForm(blank) }}>Cancel</button>}
            </div>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th></th><th>Product</th><th>Cat</th><th>Price</th><th>Stock</th><th>New</th><th>Live</th><th></th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><img className="tbl-thumb" src={p.images?.[0] || `https://picsum.photos/seed/${p.id}/120/160`} alt="" /></td>
                    <td><b>{p.name}</b><div className="tbl-sub">{p.sizes?.join(' · ')}</div></td>
                    <td>{p.category}</td>
                    <td>{inr(p.price)}{p.mrp ? <div className="tbl-sub strike">{inr(p.mrp)}</div> : null}</td>
                    <td><input className="stock-in" type="number" defaultValue={p.stock} onBlur={async e => {
                      const v = Math.max(0, +e.target.value || 0)
                      if (v !== p.stock) {
                        await supabase.from('products').update({ stock: v }).eq('id', p.id)
                        setProducts(ps => ps.map(x => x.id === p.id ? { ...x, stock: v } : x))
                      }
                    }} /></td>
                    <td><button className={`sw ${p.is_new ? 'on' : ''}`} onClick={() => toggle(p, 'is_new', !p.is_new)} aria-label="Toggle new" /></td>
                    <td><button className={`sw ${p.is_active ? 'on' : ''}`} onClick={() => toggle(p, 'is_active', !p.is_active)} aria-label="Toggle live" /></td>
                    <td>
                      <div className="row-acts">
                        <button className="icon-btn" title="Edit" onClick={() => {
                          setEditing(p)
                          setForm({
                            name: p.name, category: p.category, price: '' + p.price,
                            mrp: p.mrp ? '' + p.mrp : '', stock: '' + p.stock,
                            sizes: (p.sizes || []).join(', '),
                            colors: (p.colors || []).map(c => c.name).join(', '),
                            images: (p.images || []).join('\n'),
                            description: p.description || '', is_new: p.is_new, is_active: p.is_active, allow_custom: !!p.allow_custom,
                          })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}><Pencil size={15} /></button>
                        <button className="icon-btn" title="Delete" onClick={async () => {
                          if (confirm(`Delete "${p.name}" permanently?`)) {
                            await supabase.from('products').delete().eq('id', p.id)
                            setProducts(ps => ps.filter(x => x.id !== p.id))
                          }
                        }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'settings' && S && (
        <div className="panel">
          <h3><Save size={16} /> Site settings — everything the customer sees</h3>
          <div className="set-grid">
            <div className="field full"><label>Top strip · left</label>
              <input value={(S.topbar || [])[0] || ''} onChange={e => updTb(0, e.target.value)} /></div>
            <div className="field full"><label>Top strip · middle</label>
              <input value={(S.topbar || [])[1] || ''} onChange={e => updTb(1, e.target.value)} /></div>
            <div className="field full"><label>Top strip · right</label>
              <input value={(S.topbar || [])[2] || ''} onChange={e => updTb(2, e.target.value)} /></div>
            <div className="field full"><label>Hero kicker (small top line)</label>
              <input value={S.hero_kicker || ''} onChange={e => upd('hero_kicker', e.target.value)} /></div>
            <div className="field"><label>Hero title · line 1</label>
              <input value={S.hero_title_a || ''} onChange={e => upd('hero_title_a', e.target.value)} /></div>
            <div className="field"><label>Hero title · line 2 (italic accent)</label>
              <input value={S.hero_title_b || ''} onChange={e => upd('hero_title_b', e.target.value)} /></div>
            <div className="field full"><label>Hero paragraph</label>
              <textarea rows={3} value={S.hero_sub || ''} onChange={e => upd('hero_sub', e.target.value)} /></div>
            <div className="field"><label>Free shipping above (₹)</label>
              <input type="number" value={S.free_ship ?? 999} onChange={e => upd('free_ship', +e.target.value)} /></div>
            <div className="field"><label>Delivery fee below that (₹)</label>
              <input type="number" value={S.ship_fee ?? 79} onChange={e => upd('ship_fee', +e.target.value)} /></div>
            <div className="field full"><label>GST rate (%) — added at billing on product price</label>
              <input type="number" value={S.gst_rate ?? 5} onChange={e => upd('gst_rate', +e.target.value)} /></div>
            <div className="field full"><label>Store address (invoice)</label>
              <input value={S.store_address || ''} onChange={e => upd('store_address', e.target.value)} /></div>
            <div className="field"><label>Store email (invoice)</label>
              <input value={S.store_email || ''} onChange={e => upd('store_email', e.target.value)} /></div>
            <div className="field"><label>Store phone (invoice)</label>
              <input value={S.store_phone || ''} onChange={e => upd('store_phone', e.target.value)} /></div>
            <div className="field"><label>GSTIN (invoice)</label>
              <input value={S.gstin || ''} onChange={e => upd('gstin', e.target.value)} /></div>
            <div className="field"><label>WhatsApp number (91XXXXXXXXXX)</label>
              <input value={S.whatsapp || ''} onChange={e => upd('whatsapp', e.target.value)} /></div>
            <div className="field"><label>Instagram URL</label>
              <input value={S.instagram || ''} onChange={e => upd('instagram', e.target.value)} /></div>
            <div className="field"><label>Light theme · background (soft cream)</label>
              <div className="color-row"><input type="color" value={(S.colors?.light?.paper) || '#EFE6D3'} onChange={e => updC('light', 'paper', e.target.value)} /><span className="tbl-sub">page background</span></div></div>
            <div className="field"><label>Light theme · text (deep warm brown)</label>
              <div className="color-row"><input type="color" value={(S.colors?.light?.ink) || '#2B231A'} onChange={e => updC('light', 'ink', e.target.value)} /><span className="tbl-sub">main text</span></div></div>
            <div className="field"><label>Light theme · accent (vermillion)</label>
              <div className="color-row"><input type="color" value={(S.colors?.light?.verm) || '#D9481C'} onChange={e => updC('light', 'verm', e.target.value)} /><span className="tbl-sub">buttons &amp; highlights</span></div></div>
            <div className="field"><label>Dark theme · background (warm black)</label>
              <div className="color-row"><input type="color" value={(S.colors?.dark?.paper) || '#171310'} onChange={e => updC('dark', 'paper', e.target.value)} /><span className="tbl-sub">page background</span></div></div>
            <div className="field"><label>Dark theme · text (warm cream)</label>
              <div className="color-row"><input type="color" value={(S.colors?.dark?.ink) || '#EDE3CF'} onChange={e => updC('dark', 'ink', e.target.value)} /><span className="tbl-sub">main text</span></div></div>
            <div className="field"><label>Dark theme · accent</label>
              <div className="color-row"><input type="color" value={(S.colors?.dark?.verm) || '#F2643C'} onChange={e => updC('dark', 'verm', e.target.value)} /><span className="tbl-sub">buttons &amp; highlights</span></div></div>
          </div>

          <div className="otp-box">
            <ShieldCheck size={18} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <b>Email verification required to save</b>
              <div style={{ fontSize: '.74rem', color: 'var(--ink-2)', marginTop: '.2rem' }}>
                {verified ? '✓ Verified — save enabled.'
                  : recent ? 'Recently logged in — save enabled.'
                  : otpSent ? `Code sent to ${user.email}. Enter it below.`
                  : `A 6-digit code will be sent to ${user.email} to confirm it's really you.`}
              </div>
            </div>
            {!verified && !recent && (
              !otpSent
                ? <button className="btn btn-solid sm-btn" onClick={sendOtp}>Send code</button>
                : <>
                    <input value={otp} maxLength={6} placeholder="••••••"
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                    <button className="btn btn-solid sm-btn" onClick={verifyOtp}>Verify</button>
                  </>
            )}
          </div>

          <button className="btn btn-verm" onClick={saveSettings} disabled={!(verified || recent) || busy}>
            {busy ? 'Saving…' : 'Save all settings'}
          </button>
        </div>
      )}
    </div>
  )
}