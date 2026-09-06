import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { FREE_SHIP, SHIP_FEE, GST_RATE } from '@/lib/utils'

export async function POST(req) {
  try {
    const { items, address, method } = await req.json()

    if (method !== 'online')
      return NextResponse.json({ error: 'Cash on delivery is not available. Please pay online.' }, { status: 400 })

    const KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim()
    const KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim()

    if (!KEY_ID || !KEY_SECRET)
      return NextResponse.json({
        error: 'Payment keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env.local file, then restart the dev server (Ctrl+C, then npm run dev).',
      }, { status: 500 })

    if (!KEY_ID.startsWith('rzp_'))
      return NextResponse.json({
        error: 'Your RAZORPAY_KEY_ID looks wrong — it must start with rzp_test_ (test mode) or rzp_live_ (live mode). Re-copy it from dashboard.razorpay.com → Settings → API Keys, paste it in .env.local, then Ctrl+C and run npm run dev again.',
      }, { status: 500 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please log in to place an order.' }, { status: 401 })
    if (!Array.isArray(items) || !items.length) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })

    const a = address || {}
    for (const k of ['name', 'phone', 'line1', 'city', 'state', 'pincode'])
      if (!a[k] || !String(a[k]).trim())
        return NextResponse.json({ error: 'Please complete your delivery address.' }, { status: 400 })

    const { data: srow } = await supabaseAdmin.from('site_settings').select('data').eq('id', 1).maybeSingle()
    const s = srow?.data || {}
    const FREE = Number(s.free_ship) || FREE_SHIP
    const FEE = Number(s.ship_fee) ?? SHIP_FEE
    const RATE = (Number(s.gst_rate) || 5) / 100 || GST_RATE

    const ids = [...new Set(items.map(i => i.id))]
    const { data: products } = await supabaseAdmin.from('products')
      .select('id,name,price,images,stock,category').in('id', ids)
    if (!products?.length) return NextResponse.json({ error: 'Products unavailable.' }, { status: 400 })

    let subtotal = 0
    const lines = []
    for (const it of items) {
      const p = products.find(x => x.id === it.id)
      if (!p) continue
      const qty = Math.max(1, Math.min(10, parseInt(it.qty) || 1))
      if ((p.stock || 0) < qty)
        return NextResponse.json({ error: `Only ${p.stock} left of "${p.name}".` }, { status: 409 })
      subtotal += p.price * qty
      const design = (typeof it.design === 'string' && it.design.startsWith('http') && it.design.length < 600) ? it.design : null
      lines.push({ product_id: p.id, name: p.name, image: design || p.images?.[0] || null, size: it.size || null, color: it.color || null, qty, price: p.price, category: p.category, design_url: design })
    }
    if (!lines.length) return NextResponse.json({ error: 'Products unavailable.' }, { status: 400 })

    const gst = Math.round(subtotal * RATE)
    const shipping = subtotal >= FREE ? 0 : FEE
    const total = subtotal + gst + shipping

    let rzRes, rz
    try {
      const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
      rzRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total * 100, currency: 'INR', receipt: `dhana-${Date.now()}` }),
      })
      rz = await rzRes.json()
    } catch {
      return NextResponse.json({ error: 'Could not connect to Razorpay at all — check your internet connection or try again in a minute.' }, { status: 502 })
    }

    if (!rzRes.ok || !rz?.id) {
      const desc = rz?.error?.description || rz?.error?.code || `HTTP ${rzRes.status}`
      let hint = ''
      if (rzRes.status === 401)
        hint = 'Your Key ID + Key Secret pair is wrong. In Razorpay go to Settings → API Keys → Generate Test Key, and copy BOTH values from the SAME popup into .env.local (no extra spaces), then Ctrl+C and npm run dev.'
      else if (rzRes.status === 400 && /secret/i.test(desc))
        hint = 'The Key Secret does not match this Key ID. Both must come from the same generated pair.'
      else if (rzRes.status === 429)
        hint = 'Too many attempts — wait 60 seconds and try again.'
      else if (rzRes.status >= 500)
        hint = 'Razorpay is having a moment. Try again in a minute.'
      return NextResponse.json({ error: `Payment gateway said: ${desc}${hint ? ' — ' + hint : ''}` }, { status: 502 })
    }

    const { data: order, error } = await supabaseAdmin.from('orders').insert({
      user_id: user.id, items: lines, address: a, subtotal, gst, shipping, total,
      razorpay_order_id: rz.id, status: 'pending', payment_method: 'online',
    }).select().single()
    if (error) return NextResponse.json({ error: 'Could not save your order.' }, { status: 500 })

    await supabaseAdmin.from('profiles').update({ default_address: a }).eq('id', user.id)

    return NextResponse.json({
      key: KEY_ID,
      order: { id: order.id, rp_order_id: rz.id, amount: rz.amount },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}