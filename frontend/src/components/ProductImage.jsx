import { useState } from 'react'
import { ProductArt } from '../lib/art'
import { img } from '../lib/format'

export default function ProductImage({ product, index = 0, w = 600, className = '', alt }) {
  const [failed, setFailed] = useState(false)
  const url = product?.images?.[index]?.url
  const kind = product?.category?.slug || product?.category || 'ornaments'
  if (!url || failed) return <ProductArt kind={typeof kind === 'string' ? kind : 'ornaments'} seed={`${product?.name || ''}${index}`} className={className} />
  return <img src={img(url, w)} alt={alt || product?.name || ''} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} />
}
