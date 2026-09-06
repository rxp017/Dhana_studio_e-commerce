'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { inr, fmtDate, inWords, STORE } from '@/lib/utils'
import { Printer, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function InvoicePage() {
  const { id } = useParams()
  const [o, setO] = useState(undefined)
  const [st, setSt] = useState(null)

  useEffect(() => {
    supabase.from('orders').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => setO(data || null))
    supabase.from('site_settings').select('data').eq('id', 1).maybeSingle()
      .then(({ data }) => setSt(data?.data || {}))
  }, [id])

  if (o === undefined) return <div className="wrap sec-sm"><div className="skel" style={{ height: 420 }} /></div>

  if (o === null) return (
    <div className="wrap"><div className="empty">
      <h3>Invoice not found.</h3>
      <p>This invoice does not exist or belongs to another account.</p>
      <Link className="btn btn-solid" href="/orders">Back to my orders</Link>
    </div></div>
  )

  const store = {
    ...STORE,
    address: st?.store_address || STORE.address,
    email: st?.store_email || STORE.email,
    phone: st?.store_phone || STORE.phone,
    gstin: st?.gstin || STORE.gstin,
  }
  const rate = Number(st?.gst_rate) || 5

  // prices are exclusive of GST: rate% total, split as CGST + SGST
  const rows = (o.items || []).map(it => {
    const taxable = it.price * it.qty
    const tax = Math.round(taxable * rate / 100)
    const cgst = Math.round((tax / 2) * 100) / 100
    return { ...it, taxable, cgst, sgst: Math.round((tax - cgst) * 100) / 100, hsn: store.hsn[it.category] || '—' }
  })
  const taxableSum = rows.reduce((s, r) => s + r.taxable, 0)
  const cgstSum = rows.reduce((s, r) => s + r.cgst, 0)
  const sgstSum = rows.reduce((s, r) => s + r.sgst, 0)
  const roundOff = o.total - (taxableSum + cgstSum + sgstSum + o.shipping)

  return (
    <div className="wrap sec-sm">
      <div className="inv-actions no-print">
        <Link className="btn btn-ghost sm-btn" href="/orders"><ArrowLeft size={14} /> Back to orders</Link>
        <button className="btn btn-verm sm-btn" onClick={() => window.print()}><Printer size={14} /> Print / Save as PDF</button>
      </div>

      {o.status === 'pending' && (
        <div className="pin-msg err" style={{ justifyContent: 'center', maxWidth: 840, margin: '0 auto 1.2rem' }}>
          <AlertTriangle size={14} /> Payment pending — this invoice becomes valid after successful payment.
        </div>
      )}

      <div className="inv-sheet">
        <div className="inv-top">
          <div>
            <img src="/logo.jpeg" alt="Dhana Studio" className="inv-logo" /><div className="inv-brand">Dhana Studio<small>CUSTOM PRINT ATELIER</small></div>
            <div className="inv-addr">
              {store.address}<br />
              {store.email} · {store.phone}<br />
              GSTIN: {store.gstin || 'To be updated'}
            </div>
          </div>
          <div className="inv-title">TAX INVOICE</div>
        </div>

        <div className="inv-meta">
          <div className="inv-box">
            <h4>Billed to</h4>
            <b>{o.address?.name}</b><br />
            {o.address?.line1}, {o.address?.city},<br />
            {o.address?.state} — {o.address?.pincode}<br />
            +91 {o.address?.phone}
          </div>
          <div className="inv-box">
            <h4>Invoice details</h4>
            Invoice No: <b>DS-{o.id.slice(0, 8).toUpperCase()}</b><br />
            Date: {fmtDate(o.created_at)}<br />
            Place of Supply: {o.address?.state}<br />
            Payment: Online (Razorpay){o.razorpay_payment_id ? <> · {o.razorpay_payment_id}</> : ''}
          </div>
        </div>

        <table className="inv-table">
          <thead>
            <tr><th>#</th><th>Item</th><th>HSN</th><th>Qty</th><th>Taxable ₹</th><th>CGST ₹</th><th>SGST ₹</th><th>Total ₹</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td><b>{r.name}</b>{[r.size && ` · Size ${r.size}`, r.color].filter(Boolean).join(' · ')}</td>
                <td>{r.hsn}</td>
                <td>{r.qty}</td>
                <td>{r.taxable.toLocaleString('en-IN')}</td>
                <td>{r.cgst.toFixed(2)}</td>
                <td>{r.sgst.toFixed(2)}</td>
                <td><b>{(r.taxable + r.cgst + r.sgst).toLocaleString('en-IN')}</b></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-tot">
          <div className="tr"><span>Taxable value</span><span>₹{taxableSum.toLocaleString('en-IN')}</span></div>
          <div className="tr"><span>CGST @ {rate / 2}%</span><span>₹{cgstSum.toFixed(2)}</span></div>
          <div className="tr"><span>SGST @ {rate / 2}%</span><span>₹{sgstSum.toFixed(2)}</span></div>
          <div className="tr"><span>Delivery</span><span>{o.shipping === 0 ? 'FREE' : '₹' + o.shipping}</span></div>
          {roundOff !== 0 && <div className="tr"><span>Round off</span><span>{roundOff > 0 ? '+' : ''}₹{Math.abs(roundOff).toFixed(2)}</span></div>}
          <div className="tr grand"><span>Grand Total (incl. GST)</span><span>{inr(o.total)}</span></div>
        </div>

        <p className="inv-words">Amount in words: Rupees {inWords(o.total)} Only</p>
        <p className="inv-words">All prices are exclusive of GST. GST charged at {rate}% (CGST {rate / 2}% + SGST {rate / 2}%) as per applicable law.</p>
        {o.address?.notes && <p className="inv-words">Delivery instructions: {o.address.notes}</p>}

        <div className="inv-decl">
          <div style={{ maxWidth: '62%' }}>
            <b>Declaration:</b> We declare that this invoice shows the actual price of the goods described
            and that all particulars are true and correct. Exchange/return claims require an unboxing video as per store policy.
          </div>
          <div className="inv-sign">
            <div className="line">For Dhana Studio — Authorised Signatory</div>
          </div>
        </div>

        <div className="inv-foot">This is a computer-generated invoice</div>
      </div>
    </div>
  )
}