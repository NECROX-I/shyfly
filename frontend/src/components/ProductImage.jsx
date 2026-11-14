import { useState } from 'react'
import { ProductArt } from '../lib/art'
import { img } from '../lib/format'

export default function ProductImage({ product, index = 0, w = 600, className = '', alt, sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw', priority = false }) {
  const [failed, setFailed] = useState(false)
  const url = product?.images?.[index]?.url
  const kind = product?.category?.slug || product?.category || 'ornaments'
  if (!url || failed) return <ProductArt kind={typeof kind === 'string' ? kind : 'ornaments'} seed={`${product?.name || ''}${index}`} className={className} />
  const cl = url.includes('res.cloudinary.com')
  return <img src={img(url, w)} srcSet={cl ? `${img(url, 320)} 320w, ${img(url, 480)} 480w, ${img(url, 720)} 720w, ${img(url, 1000)} 1000w` : undefined} sizes={cl ? sizes : undefined} alt={alt || product?.name || ''} loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} className={className} />
}
