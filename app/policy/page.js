import Link from 'next/link'
import Reveal from '@/components/Reveal'
import { RefreshCcw, Undo2, Video, MessageCircle, Printer } from 'lucide-react'

export default function PolicyPage() {
  return (
    <div className="wrap pol-hero">
      <Reveal>
        <div className="kicker">POLICIES</div>
        <h1 className="sec-title">Returns &amp; <span className="it">exchanges</span></h1>
        <p className="pol-lead">
          Short and honest — like it should be. Please read this once before ordering;
          it takes two minutes and saves everyone pain later.
        </p>
        <div className="pol-chips">
          <span className="pol-chip">7-day window</span>
          <span className="pol-chip">Damage or wrong size only</span>
          <span className="pol-chip">Unboxing video mandatory</span>
        </div>
      </Reveal>

      <Reveal>
        <div className="pol-panel">
          <h3><RefreshCcw size={17} /> Exchange policy</h3>
          <ul>
            <li><b>You can exchange</b> a product only if (a) it arrived <b>damaged or defective</b> — print peel, fabric tear, stain, or wrong print — or (b) you received a <b>wrong size</b>, different from the size you selected while placing the order.</li>
            <li><b>You cannot exchange</b> if you picked the wrong size yourself, changed your mind, or dislike the colour — we show true-to-life photos for exactly this reason.</li>
            <li>Exchange requests must be raised within <b>7 days of delivery</b>.</li>
            <li>Once a claim is approved, the replacement ships to you <b>free of cost</b>.</li>
          </ul>
        </div>
      </Reveal>

      <Reveal>
        <div className="pol-panel">
          <h3><Undo2 size={17} /> Return &amp; refund policy</h3>
          <ul>
            <li><b>Returns are accepted only for damaged or defective products.</b> There are no change-of-mind returns.</li>
            <li>Once your return is approved and picked up, the refund reaches your <b>original payment method within 5–7 working days</b> after our quality check.</li>
            <li>Shipping fees are refunded only when the return is our fault (damaged or wrong item shipped).</li>
          </ul>
        </div>
      </Reveal>

      <Reveal>
        <div className="pol-panel">
          <h3><Video size={17} /> Mandatory proof — the unboxing video</h3>
          <ul>
            <li>Every exchange or return claim <b>must include one continuous unboxing video</b>: start recording <b>before</b> opening the package, show the shipping label clearly, open the parcel on camera, and reveal the product with close-ups of any damage.</li>
            <li>Also attach <b>clear photos of the product after unboxing</b> — front, back, and the damaged or defective area.</li>
            <li><b>Claims without an unboxing video are automatically rejected.</b> No exceptions — this is what keeps our prices fair by stopping fake claims.</li>
          </ul>
        </div>
      </Reveal>

      <Reveal>
        <div className="pol-panel">
          <h3><MessageCircle size={17} /> How to raise a request</h3>
          <ul>
            <li>Within 7 days of delivery, message us on <b>WhatsApp</b> with your <b>order ID</b>, the unboxing video, and the photos.</li>
            <li>We verify within <b>48 hours</b>, arrange a free pickup, and ship your replacement in <b>3–5 working days</b> — or process your refund.</li>
            <li>Keep the product unused, unwashed, and with its packaging until the claim is closed.</li>
          </ul>
        </div>
      </Reveal>

      <Reveal>
        <div className="pol-panel">
          <h3><Printer size={17} /> Custom-printed orders</h3>
          <ul>
            <li>Custom designs — your photo, name, or artwork — are <b>non-returnable and non-exchangeable</b>, unless the product itself is damaged or defective.</li>
            <li>We always send a free digital mock-up for your approval before printing. Once you approve it, the design is final.</li>
          </ul>
        </div>
      </Reveal>

      <Reveal>
        <p className="pol-end">
          Questions? <Link href="/orders">Track your order</Link> or reach us on WhatsApp — we reply fast.
        </p>
      </Reveal>
    </div>
  )
}