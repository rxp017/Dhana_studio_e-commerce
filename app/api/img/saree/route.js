const C = {
  temple: { body: '#A8341C', border: '#C9A227', b2: '#F0DFA8', pallu: '#8E2A14', motif: '#F5E6C4', label: 'TEMPLE BORDER SILK' },
  organza: { body: '#E9B7A0', border: '#F2E7DA', b2: '#D8A7C4', pallu: '#D8A7C4', motif: '#FFFFFF', label: 'SUNSET ORGANZA' },
  ajrakh: { body: '#27436B', border: '#B3452C', b2: '#F0E3D0', pallu: '#1F3760', motif: '#F0E3D0', label: 'AJRAKH MODAL' },
  kanjivaram: { body: '#232D52', border: '#C9A227', b2: '#5B2A6E', pallu: '#1B2445', motif: '#E7C869', label: 'MIDNIGHT KANJIVARAM' },
  ikat: { body: '#EFE6D2', border: '#33507E', b2: '#8FA3C9', pallu: '#E7DCC2', motif: '#33507E', label: 'INDIGO IKAT COTTON' },
  peacock: { body: '#12655E', border: '#C9A227', b2: '#0E4B47', pallu: '#0E514B', motif: '#E7C869', label: 'PEACOCK ZARI SILK' },
}
const paisley = (x, y, s, fill, eye) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0,-26 C16,-22 24,-4 14,10 C8,18 -8,16 -12,4 C-15,-6 -8,-20 0,-26 Z" fill="${fill}"/><circle cx="1" cy="-4" r="6" fill="${eye}"/></g>`

function render(design, detail) {
  const k = C[design] || C.temple
  const vb = detail ? '150 190 600 800' : '0 0 900 1200'
  const bodyFill = design === 'organza' ? 'url(#og)' : k.body

  let defs = `<radialGradient id="bg" cx="50%" cy="40%" r="78%"><stop offset="0%" stop-color="#F4ECDB"/><stop offset="100%" stop-color="#E2D6BC"/></radialGradient>
    ${design === 'organza' ? `<linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E9B7A0"/><stop offset="55%" stop-color="#D8A7C4"/><stop offset="100%" stop-color="#B9AEDD"/></linearGradient>` : ''}
    <linearGradient id="pleat" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#000" stop-opacity=".13"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></linearGradient>
    <pattern id="fold" width="140" height="20" patternUnits="userSpaceOnUse"><rect width="140" height="20" fill="url(#pleat)"/></pattern>
    <filter id="ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#3A3226" flood-opacity=".3"/></filter>
    <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>`

  if (design === 'temple') defs += `
    <pattern id="bp" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M28,10 L42,28 L28,46 L14,28 Z" fill="${k.motif}" opacity=".8"/></pattern>
    <pattern id="pp" width="44" height="38" patternUnits="userSpaceOnUse"><path d="M22,4 L38,30 L6,30 Z" fill="${k.border}" opacity=".95"/><circle cx="22" cy="21" r="3" fill="${k.motif}"/></pattern>
    <pattern id="bd" width="24" height="30" patternUnits="userSpaceOnUse"><path d="M12,4 L22,26 L2,26 Z" fill="${k.b2}" opacity=".9"/></pattern>`
  if (design === 'ajrakh') defs += `
    <pattern id="bp" width="60" height="60" patternUnits="userSpaceOnUse"><polygon points="30,6 36,24 54,30 36,36 30,54 24,36 6,30 24,24" fill="${k.motif}" opacity=".85"/></pattern>
    <pattern id="pp" width="46" height="46" patternUnits="userSpaceOnUse"><polygon points="23,4 28,18 42,23 28,28 23,42 18,28 4,23 18,18" fill="${k.motif}" opacity=".9"/><circle cx="23" cy="23" r="2.5" fill="${k.border}"/></pattern>
    <pattern id="bd" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="3" fill="${k.b2}" opacity=".9"/></pattern>`
  if (design === 'kanjivaram') defs += `
    <pattern id="bp" width="34" height="34" patternUnits="userSpaceOnUse"><rect width="17" height="17" fill="${k.motif}" opacity=".38"/><rect x="17" y="17" width="17" height="17" fill="${k.motif}" opacity=".38"/><circle cx="8.5" cy="8.5" r="2" fill="${k.motif}" opacity=".8"/><circle cx="25.5" cy="25.5" r="2" fill="${k.motif}" opacity=".8"/></pattern>
    <pattern id="pp" width="56" height="44" patternUnits="userSpaceOnUse">${paisley(28, 22, .8, k.motif, k.b2)}</pattern>
    <pattern id="bd" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="2.6" fill="${k.b2}" opacity=".9"/></pattern>`
  if (design === 'ikat') defs += `
    <pattern id="bp" width="76" height="60" patternUnits="userSpaceOnUse"><path d="M0,42 L38,14 L76,42" stroke="${k.motif}" stroke-width="9" fill="none" opacity=".85"/><path d="M0,54 L38,26 L76,54" stroke="${k.motif}" stroke-width="9" fill="none" opacity=".3"/></pattern>
    <pattern id="bd" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="3" fill="#fff" opacity=".55"/></pattern>`
  if (design === 'peacock') defs += `
    <pattern id="bd" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="2.6" fill="${k.motif}" opacity=".9"/></pattern>`
  if (design === 'organza') defs += `
    <pattern id="bd" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="2" fill="#fff" opacity=".7"/></pattern>`

  let pallu = `<rect x="170" y="210" width="560" height="225" fill="${k.pallu}"/>`
  if (design === 'temple' || design === 'ajrakh' || design === 'kanjivaram') pallu += `<rect x="170" y="210" width="560" height="225" fill="url(#pp)"/>`
  if (design === 'ikat') pallu += `<path d="M170,300 L340,240 L510,300 M340,300 L510,240 M170,380 L340,320 L510,380 M340,380 L510,320 M510,300 L730,240 M510,380 L730,320" stroke="${k.motif}" stroke-width="10" fill="none" opacity=".8"/>`
  if (design === 'peacock') pallu += paisley(280, 320, 1.4, k.motif, '#2E6E9E') + paisley(450, 320, 1.4, k.motif, '#2E6E9E') + paisley(620, 320, 1.4, k.motif, '#2E6E9E')
  if (design === 'organza') pallu += `<ellipse cx="300" cy="320" rx="70" ry="46" fill="#F2C4B4" opacity=".7" filter="url(#blur)"/><ellipse cx="480" cy="300" rx="80" ry="50" fill="#D9B7E0" opacity=".7" filter="url(#blur)"/><ellipse cx="640" cy="330" rx="66" ry="44" fill="#BFC6EC" opacity=".7" filter="url(#blur)"/>`
  pallu += `<rect x="170" y="429" width="560" height="6" fill="${k.border}"/>`

  let body = ''
  if (['temple', 'ajrakh', 'kanjivaram', 'ikat'].includes(design))
    body = `<rect x="216" y="445" width="468" height="555" fill="url(#bp)"/>`
  if (design === 'peacock')
    body = paisley(310, 580, 1.5, k.motif, '#2E6E9E') + paisley(480, 660, 1.5, k.motif, '#2E6E9E') + paisley(630, 560, 1.5, k.motif, '#2E6E9E') + paisley(380, 830, 1.5, k.motif, '#2E6E9E') + paisley(560, 890, 1.5, k.motif, '#2E6E9E')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">
  <defs>${defs}</defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <g filter="url(#ds)">
    <rect x="170" y="210" width="560" height="820" rx="8" fill="${bodyFill}"/>
    ${pallu}
    ${body}
    <rect x="170" y="210" width="46" height="820" fill="${k.border}"/>
    <rect x="684" y="210" width="46" height="820" fill="${k.border}"/>
    ${design === 'kanjivaram' ? `<rect x="180" y="210" width="10" height="820" fill="${k.b2}"/><rect x="684" y="210" width="10" height="820" fill="${k.b2}"/>` : ''}
    <rect x="170" y="210" width="46" height="820" fill="url(#bd)"/>
    <rect x="684" y="210" width="46" height="820" fill="url(#bd)"/>
    <rect x="170" y="1012" width="560" height="18" fill="${k.border}"/>
    <rect x="170" y="210" width="560" height="820" fill="url(#fold)" opacity=".55"/>
  </g>
  <text x="64" y="1142" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="5" fill="#8B7D66">DHANA STUDIO</text>
  <text x="64" y="1166" font-family="Arial, sans-serif" font-size="13" letter-spacing="3" fill="#A2937B">${k.label}</text>
</svg>`
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const svg = render(searchParams.get('design') || 'temple', searchParams.get('view') === 'detail')
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000, immutable' } })
}