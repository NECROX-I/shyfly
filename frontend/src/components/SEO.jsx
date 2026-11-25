import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { SITE_URL, BRAND, DEFAULT_TITLE, DEFAULT_DESC, DEFAULT_IMAGE, abs } from '../lib/site'

// title/description/canonical/social tags + optional JSON-LD (object or array) for every page.
// Canonical is the path only (no ?filters, ?q=) on the primary domain, so duplicates collapse into one URL.
export default function SEO({ title, description, image, noindex, type = 'website', jsonLd }) {
  const { pathname } = useLocation()
  // index.html carries static copies of these tags for crawlers that don't run JS; once React renders, Helmet owns them
  useEffect(() => { document.head.querySelectorAll('[data-static-seo]').forEach((n) => n.remove()) }, [])

  const t = title ? `${title} | ${BRAND}` : DEFAULT_TITLE
  const d = description || DEFAULT_DESC
  const url = SITE_URL + (pathname === '/' ? '/' : pathname.replace(/\/+$/, ''))
  const img = abs(image) || DEFAULT_IMAGE
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,follow" />}
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={img} />
      {ld.map((o, i) => <script key={i} type="application/ld+json">{JSON.stringify(o)}</script>)}
    </Helmet>
  )
}
