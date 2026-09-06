'use client'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { inr, offPct } from '@/lib/utils'
import Reveal from '@/components/Reveal'

export default function ProductCard({ p, delay = 0 }) {
  const off = offPct(p.mrp, p.price)
  const img = p.images?.[0] || `https://picsum.photos/seed/${p.id}/900/1200`
  const img2 = p.images?.[1] || img
  return (
    <Reveal delay={delay}>
      <Link href={`/product/${p.id}`} className="pcard" data-cursor>
        <div className="pcard-media">
          <img src={img} alt={p.name} loading="lazy" />
          <img src={img2} alt="" loading="lazy" className="alt" />
          <div className="pcard-badges">
            {p.is_new && <span className="chip chip-new">NEW</span>}
            {off > 0 && <span className="chip chip-off">{off}% OFF</span>}
            {p.stock > 0 && p.stock < 8 && <span className="chip chip-low">ONLY {p.stock} LEFT</span>}
          </div>
        </div>
        <div className="pcard-body">
          <div className="pcard-brand">DHANA STUDIO</div>
          <h3 className="pcard-name">{p.name}</h3>
          <div className="pcard-rate">
            <span className="rate-pill"><Star size={11} fill="currentColor" />{Number(p.rating).toFixed(1)}</span>
            <span className="rate-count">({p.rating_count})</span>
          </div>
          <div className="pcard-price">
            <span className="p">{inr(p.price)}</span>
            {p.mrp > p.price && <span className="mrp">{inr(p.mrp)}</span>}
            {off > 0 && <span className="off">{off}% off</span>}
          </div>
          {p.sizes?.length > 0 && <div className="pcard-sizes">{p.sizes.join(' · ')}</div>}
        </div>
      </Link>
    </Reveal>
  )
}