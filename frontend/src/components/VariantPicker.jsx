import { useEffect, useMemo, useState } from 'react'
import { FiCheck } from 'react-icons/fi'

export function useVariants(product) {
  const colors = useMemo(() => [...new Map((product?.variants || []).filter((v) => v.color).map((v) => [v.color, { name: v.color, hex: v.colorHex }])).values()], [product])
  const sizes = useMemo(() => [...new Set((product?.variants || []).map((v) => v.size).filter(Boolean))], [product])
  const [color, setColor] = useState(null)
  const [size, setSize] = useState(null)

  useEffect(() => {
    if (!product) return
    const firstInStock = product.variants.find((v) => v.stock > 0)
    setColor(colors.length ? (firstInStock?.color || colors[0].name) : null)
    setSize(null)
  }, [product, colors])

  const match = (c, s) => product?.variants.find((v) => (!colors.length || v.color === c) && (!sizes.length || v.size === s))
  const variant = (!sizes.length || size) ? match(color, size) : null
  const sizeStock = (s) => match(color, s)?.stock || 0
  const colorStock = (c) => (product?.variants || []).filter((v) => v.color === c && (!size || v.size === size)).reduce((a, v) => a + v.stock, 0)
  const needsSize = sizes.length > 0 && !size
  return { colors, sizes, color, size, setColor, setSize, variant, sizeStock, colorStock, needsSize }
}

export default function VariantPicker({ v, shake }) {
  return (
    <div className="space-y-5">
      {v.colors.length > 0 && (
        <div>
          <p className="label">Colour: <span className="normal-case tracking-normal text-plum-900">{v.color}</span></p>
          <div className="flex flex-wrap gap-2.5">
            {v.colors.map((c) => {
              const out = v.colorStock(c.name) === 0
              return (
                <button key={c.name} onClick={() => v.setColor(c.name)} title={c.name} aria-label={c.name}
                  className={`relative grid h-10 w-10 place-items-center rounded-full ring-offset-2 transition ${v.color === c.name ? 'ring-2 ring-plum-700' : 'ring-1 ring-plum-100 hover:ring-plum-400'} ${out ? 'opacity-40' : ''}`}>
                  <span className="h-full w-full rounded-full border border-white" style={{ background: c.hex || '#ccc' }} />
                  {v.color === c.name && <FiCheck className={`absolute ${['#FAFAFA', '#F6F0E4', '#F4EDE4'].includes(c.hex) ? 'text-plum-800' : 'text-white'}`} size={16} />}
                  {out && <span className="absolute h-px w-full rotate-45 bg-plum-800" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {v.sizes.length > 0 && (
        <div className={shake ? 'animate-pop' : ''}>
          <p className="label">Size {v.needsSize && shake && <span className="ml-2 normal-case tracking-normal text-rose-500">— please select</span>}</p>
          <div className="flex flex-wrap gap-2">
            {v.sizes.map((s) => {
              const st = v.sizeStock(s)
              return (
                <button key={s} disabled={st === 0} onClick={() => v.setSize(s)}
                  className={`min-w-[48px] rounded-full border px-4 py-2.5 text-sm transition ${v.size === s ? 'border-plum-700 bg-plum-700 text-white' : 'border-plum-100 bg-white text-plum-900 hover:border-plum-500'} ${st === 0 ? 'cursor-not-allowed text-plum-300 line-through opacity-60' : ''} ${shake && v.needsSize ? 'border-rose-400' : ''}`}>
                  {s}{st > 0 && st <= 3 && <span className="ml-1.5 text-[10px] text-rose-500">{st} left</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
