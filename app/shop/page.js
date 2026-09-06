'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import ProductCard from '@/components/ProductCard'
import Reveal from '@/components/Reveal'
import { inr } from '@/lib/utils'
import { Search, SlidersHorizontal } from 'lucide-react'

function ShopInner() {
  const sp = useSearchParams()
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState('popular')
  const [qText, setQText] = useState('')
  const [q, setQ] = useState('')
  const [priceMax, setPriceMax] = useState(5000)
  const [size, setSize] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fOpen, setFOpen] = useState(false)

  useEffect(() => {
    setCat(sp.get('category') || 'all')
    setSort(sp.get('sort') || 'popular')
    const qs = sp.get('q') || ''
    setQText(qs); setQ(qs)
  }, [sp])

  useEffect(() => {
    const t = setTimeout(() => setQ(qText.trim()), 300)
    return () => clearTimeout(t)
  }, [qText])

  useEffect(() => {
    let query = supabase.from('products').select('*').eq('is_active', true)
    if (cat !== 'all') query = query.eq('category', cat)
    if (q) query = query.ilike('name', `%${q}%`)
    if (priceMax < 5000) query = query.lte('price', priceMax)
    const map = {
      popular: ['rating_count', false], new: ['created_at', false],
      price_asc: ['price', true], price_desc: ['price', false], rating: ['rating', false],
    }
    const [col, asc] = map[sort] || map.popular
    setLoading(true)
    query.order(col, { ascending: asc }).limit(60)
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
  }, [cat, q, priceMax, sort])

  const shown = size ? products.filter(p => (p.sizes || []).includes(size)) : products

  return (
    <div className="wrap sec-sm">
      <Reveal className="sec-head">
        <div>
          <div className="kicker">THE SHOP</div>
          <h2 className="sec-title">
            {cat === 'saree' ? <>Printed <span className="it">sarees</span></>
              : cat === 'tshirt' ? <>Custom <span className="it">tees</span></>
              : <>Everything we <span className="it">print</span></>}
          </h2>
        </div>
      </Reveal>

      <div className="shop">
        <button className="f-toggle btn btn-solid sm-btn" onClick={() => setFOpen(!fOpen)}>
          <SlidersHorizontal size={14} /> {fOpen ? 'Hide filters' : 'Filters'}
        </button>
        <aside className={`shop-side ${fOpen ? 'open' : ''}`}>
          <div className="f-group">
            <h4>Category</h4>
            <div className="f-pills">
              {[['all', 'All'], ['tshirt', 'T-Shirts'], ['saree', 'Sarees'], ['sticker', 'D2D Stickers']].map(([v, l]) => (
                <button key={v} className={`f-pill ${cat === v ? 'on' : ''}`} onClick={() => { setCat(v); setFOpen(false) }}>{l}</button>
              ))}
            </div>
          </div>
          <div className="f-group">
            <h4>Size</h4>
            <div className="f-pills">
              {[null, 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map(s => (
                <button key={s || 'any'} className={`f-pill ${size === s ? 'on' : ''}`} onClick={() => setSize(s)}>{s || 'Any'}</button>
              ))}
            </div>
          </div>
          <div className="f-group">
            <h4>Max price · {inr(priceMax)}</h4>
            <input className="f-range" type="range" min="300" max="5000" step="100" value={priceMax} onChange={e => setPriceMax(+e.target.value)} />
          </div>
        </aside>

        <div>
          <div className="shop-head">
            <span className="shop-count">{loading ? 'Loading the racks…' : `${shown.length} piece${shown.length === 1 ? '' : 's'}`}</span>
            <div className="shop-tools">
              <div className="mini-search">
                <Search size={14} />
                <input placeholder="Search" value={qText} onChange={e => setQText(e.target.value)} aria-label="Search products" />
              </div>
              <select className="sel" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="popular">Popularity</option>
                <option value="new">Newest first</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="pgrid">{[...Array(8)].map((_, i) => <div key={i} className="skel" style={{ aspectRatio: '3/4.6' }} />)}</div>
          ) : shown.length ? (
            <div className="pgrid">{shown.map((p, i) => <ProductCard key={p.id} p={p} delay={(i % 4) * 70} />)}</div>
          ) : (
            <div className="empty">
              <h3>Nothing matches.</h3>
              <p>Try clearing the size or price filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="wrap sec-sm"><div className="skel" style={{ height: 320 }} /></div>}>
      <ShopInner />
    </Suspense>
  )
}