export const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN')

export const discountPct = (p) => (p?.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0)

// Cloudinary on-the-fly resize; other URLs pass through
export const img = (url, w = 600) => {
  if (!url) return ''
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/upload/f_auto')) return url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`)
  return url
}

export const totalStock = (p) => (p?.variants || []).reduce((s, v) => s + (v.stock || 0), 0)

export const catSlug = (p) => p?.category?.slug || 'ornaments'

export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const STATUS_LABEL = {
  placed: 'Order placed', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped', out_for_delivery: 'Out for delivery',
  delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned',
}

export const STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']

export const waLink = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`

export const errMsg = (e, fallback = 'Something went wrong') => e?.response?.data?.message || e?.message || fallback
