const HEX = {
  black: '#221E1A', white: '#F5F0E5', cream: '#E6D7B8', red: '#B3261E', lavender: '#B4A1DC',
  indigo: '#2E3A54', charcoal: '#2B2723', teal: '#1F5F5B', mustard: '#D9A62E', rose: '#D98A9C',
}
const PAL = {
  kaavi: ['#C6391B', '#8A2A12'], indigo: ['#93A7CC', '#C9D4E8'], kalamkari: ['#7A4A21', '#3E2413'],
  marigold: ['#E8B33B', '#F2CE7B'], inkdrift: ['#D9481C', '#E8834F'], devanagari: ['#D9481C', '#F2643C'],
}
const TEE = 'M360,178 Q450,262 540,178 L648,200 Q718,222 762,300 L786,372 L742,584 Q730,610 700,606 L640,588 Q622,584 620,560 L636,1058 Q450,1078 264,1058 L280,560 Q278,584 260,588 L200,606 Q170,610 158,584 L114,372 L138,300 Q182,222 252,200 Z'

function motif(d, a, a2) {
  if (d === 'kaavi') return `
    <g stroke="${a}" fill="none"><circle r="92" stroke-width="10"/><circle r="62" stroke-width="4"/></g>
    <circle r="26" fill="${a}"/>
    ${[...Array(12)].map((_, i) => { const t = i * 30 * Math.PI / 180; return `<circle cx="${(Math.cos(t) * 77).toFixed(1)}" cy="${(Math.sin(t) * 77).toFixed(1)}" r="6" fill="${a2}"/>` }).join('')}
    <path d="M-112,-118 h224 M-112,118 h224" stroke="${a}" stroke-width="6"/>
    ${[...Array(11)].map((_, i) => `<path d="M${-100 + i * 20},-118 l8,13 l8,-13 z" fill="${a2}"/>`).join('')}`
  if (d === 'kalamkari') return `
    <g fill="none" stroke="${a2}"><rect x="-112" y="-122" width="224" height="244" rx="8" stroke-width="5"/><rect x="-98" y="-108" width="196" height="216" rx="6" stroke-width="3"/></g>
    <path d="M0,96 C-9,40 -11,-12 0,-58 C11,-12 9,40 0,96 Z" fill="${a}"/>
    <path d="M0,-58 C-27,-73 -39,-99 -31,-120 M0,-58 C27,-73 39,-99 31,-120" stroke="${a2}" stroke-width="5" fill="none"/>
    ${[...Array(6)].map((_, i) => `<circle cx="0" cy="${72 - i * 24}" r="${3 + i % 3}" fill="${a2}"/>`).join('')}
    ${[-1, 1].map(s => [...Array(4)].map((_, i) => `<circle cx="${s * (16 + i * 11)}" cy="${28 - i * 26}" r="4" fill="${a}"/>`).join('')).join('')}`
  if (d === 'marigold') return `
    <circle r="84" fill="none" stroke="${a}" stroke-width="7"/>
    ${[...Array(16)].map((_, i) => { const t = i * 22.5 * Math.PI / 180; return `<line x1="${(Math.cos(t) * 96).toFixed(1)}" y1="${(Math.sin(t) * 96).toFixed(1)}" x2="${(Math.cos(t) * 116).toFixed(1)}" y2="${(Math.sin(t) * 116).toFixed(1)}" stroke="${a2}" stroke-width="6"/>` }).join('')}
    <circle r="30" fill="${a}"/>
    <text y="152" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="900" letter-spacing="7" fill="${a}">MARIGOLD</text>`
  if (d === 'inkdrift') return `
    <defs><filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter></defs>
    <path d="M-100,62 C-58,-78 42,-112 92,-42" stroke="${a}" stroke-width="16" fill="none" stroke-linecap="round" opacity=".92"/>
    <path d="M-92,-28 C-20,42 62,22 106,72" stroke="${a2}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".8"/>
    <ellipse cx="62" cy="-62" rx="34" ry="22" fill="${a}" opacity=".55" filter="url(#soft)"/>
    <ellipse cx="-62" cy="42" rx="26" ry="16" fill="${a2}" opacity=".5" filter="url(#soft)"/>`
  if (d === 'devanagari') return `
    <text text-anchor="middle" dominant-baseline="central" font-family="'Noto Serif Devanagari','Noto Sans Devanagari',serif" font-size="128" fill="${a}">ध</text>
    <circle r="94" fill="none" stroke="${a}" stroke-width="4" stroke-dasharray="6 10"/>`
  return ''
}

function render(color, design) {
  const fill = HEX[color] || HEX.cream
  const [a, a2] = PAL[design] || PAL.kaavi
  const dye = design === 'indigo'
  const chest = design === 'devanagari'
    ? `<g transform="translate(338,468) scale(.6)">${motif(design, a, a2)}</g>`
    : dye ? '' : `<g transform="translate(450,560)">${motif(design, a, a2)}</g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="78%"><stop offset="0%" stop-color="#F4ECDB"/><stop offset="100%" stop-color="#E2D6BC"/></radialGradient>
    <linearGradient id="sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#000" stop-opacity=".16"/><stop offset="18%" stop-color="#000" stop-opacity="0"/><stop offset="82%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".18"/></linearGradient>
    <linearGradient id="dy" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${a}" stop-opacity="0"/><stop offset="55%" stop-color="${a}" stop-opacity=".45"/><stop offset="100%" stop-color="${a}" stop-opacity=".85"/></linearGradient>
    <filter id="ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#3A3226" flood-opacity=".32"/></filter>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <ellipse cx="450" cy="1090" rx="285" ry="22" fill="#3A3226" opacity=".16"/>
  <g filter="url(#ds)">
    <path d="${TEE}" fill="${fill}"/>
    <path d="${TEE}" fill="url(#sh)"/>
    ${dye ? `<path d="${TEE}" fill="url(#dy)"/>` : ''}
    <path d="M352,180 Q450,272 548,180" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="15" stroke-linecap="round"/>
    <path d="M362,178 Q450,258 538,178" fill="none" stroke="${fill}" stroke-width="9" stroke-linecap="round"/>
    <path d="M272,1010 Q450,1028 628,1010" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="4" stroke-dasharray="2 7"/>
    <path d="M180,556 L238,580 M720,556 L662,580" stroke="#000" stroke-opacity=".13" stroke-width="4" stroke-dasharray="2 7"/>
    ${chest}
  </g>
  <text x="64" y="1142" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="5" fill="#8B7D66">DHANA STUDIO</text>
  <text x="64" y="1166" font-family="Arial, sans-serif" font-size="13" letter-spacing="3" fill="#A2937B">OVERSIZED FIT · 240 GSM · ${String(color).toUpperCase()}</text>
</svg>`
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const svg = render(searchParams.get('color') || 'cream', searchParams.get('design') || 'kaavi')
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000, immutable' } })
}