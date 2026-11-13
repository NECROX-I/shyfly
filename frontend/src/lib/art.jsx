// Elegant SVG artwork shown when a product has no photo yet (also used for category circles)
const PALETTES = [
  ['#ffe3ec', '#f9a8c4'], ['#f6e0ea', '#c9608c'], ['#ffeadb', '#f7b79d'], ['#ece1fa', '#b9a5e0'],
  ['#fff3d9', '#e6c36a'], ['#dff1f2', '#86c6c6'], ['#ffd9e5', '#ec4876'], ['#f3e6ee', '#a93a6a'],
]

const GLYPHS = {
  ornaments: (
    <g>
      <path d="M18 24 Q50 92 82 24" />
      <path d="M26 30 Q50 78 74 30" opacity=".5" />
      <path d="M50 64 l8 11 -8 14 -8 -14 z" fill="currentColor" fillOpacity=".25" />
      {[[30, 44], [38, 56], [62, 56], [70, 44]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" fill="currentColor" />)}
    </g>
  ),
  clothing: (
    <g>
      <path d="M41 14 L37 34 Q50 42 63 34 L59 14" />
      <path d="M37 34 L26 88 Q50 95 74 88 L63 34" />
      <path d="M40 52 Q50 56 60 52" opacity=".6" />
    </g>
  ),
  footwear: (
    <g>
      <path d="M22 28 L31 28 C33 47 45 58 63 60 C79 62 89 66 89 74 L57 74 C51 74 45 70 41 66 L27 90 L20 90 L31 64 C24 54 22 42 22 28 Z" fill="currentColor" fillOpacity=".15" />
    </g>
  ),
  handbags: (
    <g>
      <path d="M26 40 H74 L80 86 H20 Z" fill="currentColor" fillOpacity=".12" />
      <path d="M38 40 V32 Q38 18 50 18 Q62 18 62 32 V40" />
      <circle cx="50" cy="54" r="3.2" fill="currentColor" />
    </g>
  ),
  eyewear: (
    <g>
      <circle cx="31" cy="52" r="17" fill="currentColor" fillOpacity=".12" />
      <circle cx="69" cy="52" r="17" fill="currentColor" fillOpacity=".12" />
      <path d="M48 50 Q50 45 52 50" />
      <path d="M14 48 L6 40 M86 48 L94 40" />
    </g>
  ),
  accessories: (
    <g>
      <path d="M50 50 C30 28 18 40 21 56 C24 70 38 64 50 50 C62 64 76 70 79 56 C82 40 70 28 50 50 Z" fill="currentColor" fillOpacity=".15" />
      <path d="M46 57 L37 84 M54 57 L63 84" />
      <circle cx="50" cy="52" r="5" fill="currentColor" />
    </g>
  ),
}

const hash = (s = '') => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

export function ProductArt({ kind = 'ornaments', seed = '', className = '', glyphOnly = false }) {
  const h = hash(seed || kind)
  const [c1, c2] = PALETTES[h % PALETTES.length]
  const id = `g${h}`
  const glyph = GLYPHS[kind] || GLYPHS.ornaments
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={kind}>
      {!glyphOnly && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#${id})`} />
          <circle cx={20 + (h % 40)} cy="22" r="30" fill="#fff" opacity=".14" />
          <circle cx={90 - (h % 30)} cy="95" r="36" fill="#fff" opacity=".12" />
          <path d="M80 14 l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6z" fill="#fff" opacity=".85" />
          <path d="M16 74 l1 2.8 2.8 1 -2.8 1 -1 2.8 -1 -2.8 -2.8 -1 2.8 -1z" fill="#fff" opacity=".7" />
        </>
      )}
      <g transform={glyphOnly ? '' : 'translate(14 14) scale(.72)'} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: glyphOnly ? 'inherit' : '#fff' }}>
        <g style={{ filter: glyphOnly ? 'none' : 'drop-shadow(0 2px 3px rgba(107,21,68,.35))' }}>{glyph}</g>
      </g>
    </svg>
  )
}

export const Butterfly = ({ className = '', style }) => (
  <svg viewBox="0 0 120 100" className={className} style={style} aria-hidden="true">
    <defs>
      <linearGradient id="bf1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f9698f" /><stop offset="1" stopColor="#d62d62" /></linearGradient>
      <linearGradient id="bf2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd2df" /><stop offset="1" stopColor="#f7a2bd" /></linearGradient>
    </defs>
    <g className="origin-center animate-flutter" style={{ transformOrigin: '60px 50px' }}>
      <path d="M60 48 C40 8 8 4 6 30 C5 52 38 60 60 52 Z" fill="url(#bf1)" />
      <path d="M60 48 C80 8 112 4 114 30 C115 52 82 60 60 52 Z" fill="url(#bf1)" />
      <path d="M60 54 C36 58 16 74 30 90 C44 100 56 78 60 54 Z" fill="url(#bf2)" />
      <path d="M60 54 C84 58 104 74 90 90 C76 100 64 78 60 54 Z" fill="url(#bf2)" />
    </g>
    <path d="M60 44 V74" stroke="#6b1544" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M60 44 C56 34 50 30 46 28 M60 44 C64 34 70 30 74 28" stroke="#6b1544" strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </svg>
)

export const Sparkle = ({ className = '', style }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true"><path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z" fill="currentColor" /></svg>
)
