// One place for the public identity of the site. Canonical URLs always point at the primary domain,
// even when the same build is opened on another domain (shyfly.in, *.vercel.app …).
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://shyflyfashion.com').replace(/\/+$/, '')
export const BRAND = 'Shyfly Fashion'
export const DEFAULT_TITLE = 'Shyfly Fashion – Women’s Jewellery, Clothing & Footwear Online'
export const DEFAULT_DESC = 'Shyfly Fashion – For Every Woman, Every You. Shop jewellery, clothing, footwear, handbags & accessories online with free shipping, Cash on Delivery & easy returns.'
export const DEFAULT_IMAGE = `${SITE_URL}/logo-full.png`
export const abs = (u) => (!u ? '' : /^https?:\/\//i.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`)
export const clip = (s, n = 155) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t }
