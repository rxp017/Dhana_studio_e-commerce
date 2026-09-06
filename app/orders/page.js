'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useApp } from '@/components/providers'
import { inr, fmtDate } from '@/lib/utils'
import { Package } from 'lucide-react'

const STEPS = ['Placed', 'Confirmed', 'Shipped', 'Delivered']
const IDX = { pending: 0, paid: 1, confirmed: 1, shipped: 2, delivered: 3 }

export default function Orders() {
  const { user, ready } = useApp()
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    if (user) supabase.from('orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []))
  }, [user])

  if (!ready) return null
  if (!user) return (
    <div className="wrap"><div className="empty">
      <h3>Log in to see your orders</h3>
      <p>Track every order from the print table to your doorstep.</p>
      <Link className="btn btn-verm" href="/auth?next=/orders">Log in</Link>
    </div></div>
  )

  return (
    <div className="wrap sec-sm">
      <div className="sec-head">
        <div>
          <div className="kicker">MY ORDERS</div>
          <h2 className="sec-title">In the <span className="it">pipeline</span></h2>
        </div>
      </div>
      {orders === null ? (
        <div className="skel" style={{ height: 200 }} />
      ) : orders.length === 0 ? (
        <div className="empty">
          <Package size={40} strokeWidth={1.2} />
          <h3>No orders yet</h3>
          <p>Your future favourites are waiting on the racks.</p>
          <Link className="btn btn-solid" href="/shop">Start shopping</Link>
        </div>
      ) : orders.map(o => (
        <article className="order-card" key={o.id}>
          <div className="order-head">
            <div>
              <div className="order-id">#{o.id.slice(0, 8).toUpperCase()}</div>
              <div className="order-date">{fmtDate(o.created_at)} · {o.items.length} item(s) · {inr(o.total)}</div>
            </div>
            <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`status-chip st-${o.status}`}>{o.status}</span>
              {!['cancelled', 'failed', 'pending'].includes(o.status) && (
                <Link className="btn btn-ghost sm-btn" href={`/invoice/${o.id}`}>Invoice</Link>
              )}
            </div>
          </div>
          {['cancelled', 'failed', 'returned'].includes(o.status) ? (
            <div className="order-foot" style={{ padding: '1rem 1.4rem' }}>
              This order was {o.status === 'failed' ? 'not completed' : o.status}. Questions? WhatsApp us.
            </div>
          ) : (
            <div className="tl">
              {STEPS.map((s, i) => (
                <div key={s} className={`tl-step ${i <= IDX[o.status] ? 'done' : ''} ${i === IDX[o.status] ? 'now' : ''}`}>
                  <div className="tl-dot" />{s}
                </div>
              ))}
            </div>
          )}
          <div className="order-items">
            {o.items.map((it, i) => (
              <div className="oi" key={i}>
                <img src={it.image || `https://picsum.photos/seed/${it.product_id}/200/260`} alt="" loading="lazy" />
                <div className="oi-info">
                  <Link href={`/product/${it.product_id}`}>{it.name}</Link>
                  <span>{[it.size && `Size ${it.size}`, it.color, `Qty ${it.qty}`].filter(Boolean).join(' · ')}</span>
                  {it.design_url && <a href={it.design_url} target="_blank" rel="noreferrer" style={{ color: 'var(--verm)', fontWeight: 700, fontSize: '.74rem' }}>custom design ↗</a>}
                </div>
                <b>{inr(it.price * it.qty)}</b>
              </div>
            ))}
            <div className="order-foot">
              <span>Deliver to: {o.address?.name}, {o.address?.city} — {o.address?.pincode}</span>
              <span>{o.razorpay_payment_id ? `Paid · ${o.razorpay_payment_id}` : 'Payment pending'}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}