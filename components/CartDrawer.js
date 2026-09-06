'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers'
import { inr } from '@/lib/utils'
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, removeItem, subtotal, count, cfg } = useApp()
  const router = useRouter()
  const pct = Math.min(100, (subtotal / cfg.free_ship) * 100)
  const left = cfg.free_ship - subtotal

  useEffect(() => { document.body.style.overflow = cartOpen ? 'hidden' : '' }, [cartOpen])

  return (
    <>
      <div className={`ov ${cartOpen ? 'show' : ''}`} onClick={() => setCartOpen(false)} />
      <aside className={`drawer ${cartOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <h3>Your cart {count > 0 && <span className="drawer-count">({count})</span>}</h3>
          <button className="icon-btn" onClick={() => setCartOpen(false)}><X size={18} /></button>
        </div>
        {cart.length === 0 ? (
          <div className="drawer-empty">
            <ShoppingBag size={44} strokeWidth={1.1} />
            <p>Your cart is feeling light.</p>
            <Link href="/shop" className="btn btn-verm" onClick={() => setCartOpen(false)}>Start shopping</Link>
          </div>
        ) : (
          <>
            <div className="ship-bar">
              <div className="ship-msg">
                {left > 0
                  ? <>Add <b>{inr(left)}</b> more for <b>FREE delivery</b></>
                  : <>You have unlocked <b>FREE delivery</b></>}
              </div>
              <div className="ship-track"><div className="ship-fill" style={{ width: pct + '%' }} /></div>
            </div>
            <div className="drawer-items">
              {cart.map(it => (
                <div className="citem" key={it.id + (it.size || '') + (it.color || '') + (it.design || '')}>
                  <img src={it.image || `https://picsum.photos/seed/${it.id}/300/400`} alt={it.name} />
                  <div className="citem-info">
                    <Link href={`/product/${it.id}`} className="citem-name" onClick={() => setCartOpen(false)}>{it.name}</Link>
                    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                      {it.size && <span className="citem-size">Size {it.size}</span>}
                      {it.color && <span className="citem-size">{it.color}</span>}
                      {it.design && (
                        <a href={it.design} target="_blank" rel="noreferrer" className="citem-size" style={{ color: 'var(--verm)', borderColor: 'var(--verm)' }}>custom design ↗</a>
                      )}
                    </div>
                    <div className="citem-row">
                      <div className="qty sm">
                        <button onClick={() => setQty(it.id, it.size, it.color, it.design, it.qty - 1)}><Minus size={12} /></button>
                        <span>{it.qty}</span>
                        <button onClick={() => setQty(it.id, it.size, it.color, it.design, it.qty + 1)}><Plus size={12} /></button>
                      </div>
                      <b>{inr(it.price * it.qty)}</b>
                      <button className="citem-del" onClick={() => removeItem(it.id, it.size, it.color, it.design)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="drawer-foot">
              <div className="drawer-total"><span>Subtotal</span><b>{inr(subtotal)}</b></div>
              <p className="drawer-note">Prices exclusive of GST · {cfg.gstPct}% GST added at checkout</p>
              <button className="btn btn-verm wide" onClick={() => { setCartOpen(false); router.push('/checkout') }}>Proceed to checkout</button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}