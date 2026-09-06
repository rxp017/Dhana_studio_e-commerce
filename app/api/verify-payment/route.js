import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req) {
  try {
    const { rp_order_id, rp_payment_id, signature } = await req.json()
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rp_order_id}|${rp_payment_id}`)
      .digest('hex')
    if (expected !== signature)
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })

    const { data: order } = await supabaseAdmin.from('orders')
      .select('id, items, status').eq('razorpay_order_id', rp_order_id).single()
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    if (['paid', 'confirmed', 'shipped', 'delivered'].includes(order.status))
      return NextResponse.json({ ok: true, order_id: order.id })

    const { error } = await supabaseAdmin.from('orders')
      .update({ status: 'paid', razorpay_payment_id: rp_payment_id }).eq('id', order.id)
    if (error) return NextResponse.json({ error: 'Could not update your order.' }, { status: 500 })

    for (const it of order.items || [])
      if (it.product_id)
        await supabaseAdmin.rpc('decrement_stock', { p_product: it.product_id, p_qty: it.qty })

    return NextResponse.json({ ok: true, order_id: order.id })
  } catch {
    return NextResponse.json({ error: 'Verification error.' }, { status: 500 })
  }
}