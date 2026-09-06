'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useApp } from '@/components/providers'
import ProductCard from '@/components/ProductCard'
import Reveal from '@/components/Reveal'
import { inr, offPct, deliveryBy } from '@/lib/utils'
import { Star, Truck, BadgeCheck, Minus, Plus, ShoppingBag, Zap, ChevronDown, MapPin, Upload } from 'lucide-react'

export default function ProductPage() {
  const { id } = useParams()
  const router = useRouter()
  const { addToCart, showToast, cfg } = useApp()
  const [p, setP] = useState(null)
  const [rel, setRel] = useState([])
  const [stickers, setStickers] = useState([])
  const [img, setImg] = useState(0)
  const [size, setSize] = useState(null)
  const [sizeErr, setSizeErr] = useState(false)
  const [color, setColor] = useState(null)
  const [colorErr, setColorErr] = useState(false)
  const [qty, setQty] = useState(1)
  const [zoom, setZoom] = useState(false)
  const [pin, setPin] = useState('')
  const [pinInfo, setPinInfo] = useState(null)
  const [load, setLoad] = useState(true)
  const [design, setDesign] = useState(null)
  const [designErr, setDesignErr] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setLoad(true); setImg(0); setSize(null); setColor(null); setQty(1); setPinInfo(null); setDesign(null)
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      setP(data); setLoad(false)
    })
  }, [id])

  useEffect(() => {
    if (!p) return
    supabase.from('products').select('*').eq('is_active', true).eq('category', p.category)
      .neq('id', p.id).order('rating_count', { ascending: false }).limit(6)
      .then(({ data }) => setRel(data || []))
    if (p.category === 'tshirt') {
      supabase.from('products').select('*').eq('is_active', true).eq('category', 'sticker')
        .order('rating_count', { ascending: false }).limit(4)
        .then(({ data }) => setStickers(data || []))
    }
  }, [p])

  if (load) return (
    <div className="wrap sec-sm">
      <div className="pdp">
        <div className="skel" style={{ aspectRatio: '3/4' }} />
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="skel" style={{ height: 40 }} />
          <div className="skel" style={{ height: 24, width: '60%' }} />
          <div className="skel" style={{ height: 120 }} />
        </div>
      </div>
    </div>
  )

  if (!p || !p.is_active) return (
    <div className="wrap"><div className="empty">
      <h3>This piece has walked off the rack.</h3>
      <p>It may have sold out or been retired.</p>
      <Link className="btn btn-solid" href="/shop">Back to the shop</Link>
    </div></div>
  )

  const off = offPct(p.mrp, p.price)
  const colors = p.colors || []
  const selColor = colors.find(c => c.name === color)
  const baseImages = p.images?.length ? p.images : [`https://picsum.photos/seed/${p.id}/900/1200`]
  const images = selColor?.image
    ? [selColor.image, ...baseImages.filter(u => u !== selColor.image)]
    : baseImages
  const wa = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}?text=${encodeURIComponent(`Hi Dhana Studio! I want a custom print like "${p.name}".`)}`

  const checkPin = () => {
    if (!/^\d{6}$/.test(pin)) return setPinInfo({ ok: false, msg: 'Enter a valid 6-digit pincode' })
    setPinInfo({ ok: true, msg: `Delivery by ${deliveryBy(5)} · Free shipping over ₹999` })
  }

  const uploadDesign = async file => {
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return showToast('Please upload a PNG, JPG or WebP image', 'err')
    if (file.size > 5 * 1024 * 1024) return showToast('Image must be under 5 MB', 'err')
    setUploading(true)
    const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const { error } = await supabase.storage.from('designs').upload(path, file)
    if (error) { setUploading(false); return showToast('Upload failed — try again', 'err') }
    const url = supabase.storage.from('designs').getPublicUrl(path).data.publicUrl
    setDesign(url); setUploading(false)
    showToast('Design uploaded — looking sharp!')
  }

  const add = buy => {
    if (p.sizes?.length && !size) {
      setSizeErr(true); setTimeout(() => setSizeErr(false), 500)
      return showToast(p.category === 'sticker' ? 'Please pick a sheet size first' : 'Please pick a size first', 'err')
    }
    if (colors.length && !color) {
      setColorErr(true); setTimeout(() => setColorErr(false), 500)
      return showToast('Please pick a colour first', 'err')
    }
    if (p.allow_custom && !design) {
      setDesignErr(true); setTimeout(() => setDesignErr(false), 500)
      return showToast('Please upload your design first', 'err')
    }
    addToCart(p, size, color, qty, !buy, design)
    if (buy) router.push('/checkout')
  }

  return (
    <div className="wrap pdp-wrap">
      <nav className="crumbs">
        <Link href="/">Home</Link> / <Link href={`/shop?category=${p.category}`}>{p.category === 'tshirt' ? 'T-Shirts' : p.category === 'saree' ? 'Sarees' : 'D2D Stickers'}</Link> / <span>{p.name}</span>
      </nav>
      <div className="pdp">
        <div className="pdp-gallery">
          <div className="pdp-thumbs">
            {images.map((src, i) => (
              <button key={i} className={`pdp-thumb ${i === img ? 'on' : ''}`} onClick={() => setImg(i)}>
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div
            className="pdp-media"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={e => {
              const r = e.currentTarget.getBoundingClientRect()
              e.currentTarget.firstElementChild.style.transformOrigin =
                `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`
            }}
          >
            <img src={images[img]} alt={p.name} style={{ transform: zoom ? 'scale(1.8)' : 'scale(1)' }} />
          </div>
        </div>

        <div className="pdp-info">
          <div className="pcard-brand">DHANA STUDIO</div>
          <h1>{p.name}</h1>
          <div className="pdp-rate">
            <span className="rate-pill"><Star size={11} fill="currentColor" />{Number(p.rating).toFixed(1)}</span>
            <span className="rate-count">{p.rating_count} ratings</span>
          </div>
          <div className="pdp-price-row">
            <span className="pdp-price">{inr(p.price)}</span>
            {p.mrp > p.price && <>
              <span className="pdp-mrp">{inr(p.mrp)}</span>
              <span className="pdp-off">{off}% off</span>
            </>}
          </div>
          <p className="gst-note">Price exclusive of taxes · {cfg.gstPct}% GST added at billing · Free shipping over ₹999</p>
          {p.stock > 0 && p.stock < 8 && <p className="stock-warn">Hurry — only {p.stock} left in stock</p>}

          {colors.length > 0 && (
            <>
              <div className="f-label" style={{ marginTop: '1.2rem' }}>Colour{color ? `: ${color}` : ''}</div>
              <div className={`swatches ${colorErr ? 'err' : ''}`}>
                {colors.map(c => (
                  <button key={c.name} title={c.name} aria-label={c.name}
                    className={`swatch ${color === c.name ? 'on' : ''}`} style={{ background: c.hex }}
                    onClick={() => { setColor(c.name); setImg(0) }} />
                ))}
              </div>
            </>
          )}

          {p.sizes?.length > 0 && (
            <>
              <div className="f-label" style={{ marginTop: '1.2rem' }}>{p.category === 'sticker' ? 'Select sheet size' : 'Select size'}</div>
              <div className={`size-row ${sizeErr ? 'err' : ''}`}>
                {p.sizes.map(s => (
                  <button key={s} className={`size-pill ${size === s ? 'on' : ''}`} onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
            </>
          )}

          {p.allow_custom && (
            <>
              <div className="f-label" style={{ marginTop: '1.2rem' }}>Upload your design (required)</div>
              <div className={`upl-box ${designErr ? 'err' : ''}`}>
                <div className="upl-row">
                  <label className="btn btn-solid sm-btn" style={{ cursor: 'pointer' }}>
                    <Upload size={14} /> {uploading ? 'Uploading…' : design ? 'Change file' : 'Choose image'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={uploading}
                      onChange={e => uploadDesign(e.target.files?.[0])} />
                  </label>
                  {design && <img src={design} alt="Your design" className="upl-prev" />}
                  {design && (
                    <a className="upl-note" style={{ color: 'var(--verm)', fontWeight: 700 }} href={design} target="_blank" rel="noreferrer">open ↗</a>
                  )}
                </div>
                <p className="upl-note">
                  PNG with transparent background works best · JPG/WebP okay · min 1000px wide · under 5 MB.
                  We scale your art to fit the sheet size you pick — keep important details away from the edges.
                </p>
              </div>
            </>
          )}

          <div className="f-label" style={{ marginTop: '1.2rem' }}>Quantity</div>
          <div className="qty-row">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={14} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(10, qty + 1))}><Plus size={14} /></button>
            </div>
            {p.stock > 0
              ? <span className="in-stock"><BadgeCheck size={15} /> In stock</span>
              : <span className="stock-warn">Out of stock</span>}
          </div>

          <div className="pdp-cta">
            <button className="btn btn-solid" disabled={p.stock <= 0} onClick={() => add(false)}><ShoppingBag size={15} /> Add to cart</button>
            <button className="btn btn-verm" disabled={p.stock <= 0} onClick={() => add(true)}><Zap size={15} /> Buy now</button>
          </div>

          <div className="pdp-box">
            <div className="f-label"><MapPin size={13} /> Check delivery</div>
            <div className="pin-row">
              <input inputMode="numeric" maxLength={6} placeholder="Enter 6-digit pincode"
                value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} />
              <button className="btn btn-solid sm-btn" onClick={checkPin}>Check</button>
            </div>
            {pinInfo && (
              <p className={`pin-msg ${pinInfo.ok ? 'ok' : 'err'}`}>
                {pinInfo.ok ? <Truck size={14} /> : <MapPin size={14} />} {pinInfo.msg}
              </p>
            )}
          </div>

          <div className="pdp-acc">
            <details open>
              <summary>Product details <ChevronDown size={15} /></summary>
              <div className="acc-body">{p.description}</div>
            </details>
            <details>
              <summary>Custom printing <ChevronDown size={15} /></summary>
              <div className="acc-body">
                Want this piece with <b>your own design, name or photo</b>? We print custom orders in 24 hours.
                <a href={wa} target="_blank" rel="noreferrer"> Chat with us on WhatsApp</a>.
              </div>
            </details>
            <details>
              <summary>Returns &amp; exchanges <ChevronDown size={15} /></summary>
              <div className="acc-body">
                <b>Exchange:</b> only for damaged/defective pieces, or if you received a size different from the one you ordered.<br />
                <b>Return:</b> only for damaged/defective pieces.<br />
                Both need a <b>mandatory unboxing video</b> and post-unboxing photos as proof.
                <Link href="/policy"> Read the full policy</Link>.
              </div>
            </details>
          </div>
        </div>
      </div>

      {rel.length > 0 && (
        <section className="sec">
          <Reveal className="sec-head">
            <div>
              <div className="kicker">PAIRS WELL WITH</div>
              <h2 className="sec-title">You may also <span className="it">love</span></h2>
            </div>
          </Reveal>
          <div className="pgrid">{rel.map((r, i) => <ProductCard key={r.id} p={r} delay={(i % 4) * 70} />)}</div>
        </section>
      )}

      {stickers.length > 0 && (
        <section className="sec" style={{ paddingTop: 0 }}>
          <Reveal className="sec-head">
            <div>
              <div className="kicker">COMPLETE THE LOOK</div>
              <h2 className="sec-title">D2D <span className="it">stickers</span></h2>
            </div>
          </Reveal>
          <div className="pgrid">{stickers.map((r, i) => <ProductCard key={r.id} p={r} delay={(i % 4) * 70} />)}</div>
        </section>
      )}
    </div>
  )
}