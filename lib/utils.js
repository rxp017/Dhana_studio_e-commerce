export const FREE_SHIP = 999
export const SHIP_FEE = 79
export const GST_RATE = 0.05
export const gstOf = sub => Math.round(Number(sub || 0) * GST_RATE)

export const STORE = {
  name: 'Dhana Studio',
  address: '12, Print Street, T. Nagar, Chennai, Tamil Nadu - 600017',
  email: 'hello@dhanastudio.in',
  phone: '+91 98765 43210',
  gstin: process.env.NEXT_PUBLIC_GSTIN || '',
  hsn: { tshirt: '6109', saree: '5407', sticker: '3919' },
}

export const COLOR_HEX = {
  black: '#191512', white: '#F5F2EC', cream: '#E8DCC3', red: '#C62828',
  lavender: '#B39DDB', maroon: '#7B1E26', navy: '#1F2A44', green: '#1E7A3C',
  yellow: '#E8C547', pink: '#E8A0B4', grey: '#8D8D8D', blue: '#2C5F8A',
}

export const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN')

export const offPct = (mrp, price) =>
  mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : 0

export const fmtDate = s =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const deliveryBy = (days = 5) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export const loadScript = src =>
  new Promise((ok, no) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = ok
    s.onerror = no
    document.body.appendChild(s)
  })

const ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
const two = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')
const three = n => (n > 99 ? ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' : '') : '') + (n % 100 ? two(n % 100) : '')

export const inWords = n => {
  n = Math.round(Number(n) || 0)
  if (n === 0) return 'Zero'
  let s = ''
  const cr = Math.floor(n / 10000000); n %= 10000000
  const lk = Math.floor(n / 100000); n %= 100000
  const th = Math.floor(n / 1000); n %= 1000
  if (cr) s += inWords(cr) + ' Crore '
  if (lk) s += two(lk) + ' Lakh '
  if (th) s += two(th) + ' Thousand '
  if (n) s += three(n) + ' '
  return s.trim()
}