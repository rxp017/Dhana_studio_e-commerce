const SHEETS = {
  quotes: { label: 'VIBE QUOTE SHEET', note: '6 QUOTE TRANSFERS · ONE A5 SHEET', bg: '#F2E8D9', accent: '#C3491F', accent2: '#8A4E7A' },
  floral: { label: 'WILDFLOWER PACK', note: 'CUT · PRESS · WEAR', bg: '#EDF0E3', accent: '#3D7A4E', accent2: '#DFA045' },
  stars: { label: 'RETRO STAR PACK', note: 'CUT · PRESS · WEAR', bg: '#F4EAF0', accent: '#8A4E7A', accent2: '#C3491F' },
  custom: { label: 'CUSTOM SHEET · YOUR DESIGN', note: 'PNG · TRANSPARENT BG · MIN 1000PX', bg: '#F2EDE2', accent: '#C3491F', accent2: '#6F6353' },
}
const Q = [
  ['BE YOU'], ['GOOD VIBES', 'ONLY'], ['STAY', 'GOLD'],
  ['MAIN', 'CHARACTER'], ['NO', 'THOUGHTS'], ['WEAR YOUR', 'VIBE'],
]
const star = (cx, cy, r, fill) => {
  const pts = [...Array(10)].map((_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5
    const rr = i % 2 === 0 ? r : r * .45
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`
  }).join(' ')
  return `<polygon points="${pts}" fill="${fill}"/>`
}
const flower = (cx, cy, r, petal, core) => {
  let s = ''
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3
    const px = (cx + Math.cos(a) * r * .6).toFixed(1), py = (cy + Math.sin(a) * r * .6).toFixed(1)
    s += `<ellipse cx="${px}" cy="${py}" rx="${(r * .4).toFixed(1)}" ry="${(r * .62).toFixed(1)}" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${px} ${py})" fill="${petal}"/>`
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${(r * .28).toFixed(1)}" fill="${core}"/>`
}
const die = (x, y, w, h) => `<g filter="url(#stsh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="#FFFDF6" stroke="#DAD0BC" stroke-width="2"/></g>`
function cell(d, x, y, w, h, i, k) {
  const cx = x + w / 2, cy = y + h / 2
  if (d === 'quotes') {
    const lines = Q[i]
    const fs = lines.some(l => l.length > 9) ? 23 : 29
    return lines.map((l, j) =>
      `<text x="${cx}" y="${(cy - (lines.length - 1) * fs / 2 + j * fs + fs * .35).toFixed(1)}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${fs}" letter-spacing="2" fill="${i % 2 ? k.accent : k.accent2}">${l}</text>`).join('')
  }
  if (d === 'floral') return flower(cx, cy, 60, i % 2 ? '#E7B7C4' : '#F2CE7B', k.accent) + flower(x + 36, y + h - 38, 24, '#F2CE7B', k.accent2)
  if (d === 'stars') return star(cx, cy, 64, i % 2 ? k.accent : k.accent2) + star(cx + 54, cy - 56, 24, k.accent2) + star(cx - 56, cy + 52, 16, '#DFA045')
  if (d === 'custom') return `<rect x="${x + 18}" y="${y + 18}" width="${w - 36}" height="${h - 36}" rx="14" fill="none" stroke="${k.accent}" stroke-width="2.5" stroke-dasharray="10 8"/>
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="Georgia, serif" font-size="25" font-weight="700" fill="${k.accent}">YOUR</text>
    <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-family="Georgia, serif" font-size="25" font-weight="700" fill="${k.accent}">DESIGN</text>
    ${star(x + w - 38, y + 36, 13, k.accent2)}`
  return ''
}
function render(design, detail) {
  const k = SHEETS[design] || SHEETS.quotes
  const w = 200, h = 240
  const cells = [[190, 300], [510, 300], [190, 590], [510, 590], [190, 880], [510, 880]]
  const body = cells.map(([x, y], i) => die(x, y, w, h) + cell(design, x, y, w, h, i, k)).join('')
  const vb = detail ? '160 270 580 900' : '0 0 900 1200'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="78%"><stop offset="0%" stop-color="#F7F2E7"/><stop offset="100%" stop-color="${k.bg}"/></radialGradient>
    <filter id="ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#4A3F2E" flood-opacity=".22"/></filter>
    <filter id="stsh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#4A3F2E" flood-opacity=".25"/></filter>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <text x="450" y="140" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="700" letter-spacing="4" fill="#4A3F2E">${k.label}</text>
  <text x="450" y="176" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" letter-spacing="4" fill="#8B7D66">${k.note}</text>
  <g filter="url(#ds)">${body}</g>
  <text x="64" y="1142" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="5" fill="#8B7D66">DHANA STUDIO</text>
  <text x="64" y="1166" font-family="Arial, sans-serif" font-size="13" letter-spacing="3" fill="#A2937B">D2D HEAT TRANSFER · IRON ON · 40+ WASHES</text>
</svg>`
}
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const svg = render(searchParams.get('design') || 'quotes', searchParams.get('view') === 'detail')
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000, immutable' } })
}