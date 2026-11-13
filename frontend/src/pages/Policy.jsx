import { Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { useConfig } from '../lib/hooks'

export default function Policy() {
  const { slug } = useParams()
  const cfg = useConfig()
  const titles = { shipping: 'Shipping policy', returns: 'Returns & exchange', privacy: 'Privacy policy', terms: 'Terms of service' }
  const text = cfg.content?.policies?.[slug]
  const P = titles[slug] && (text || !cfg.loaded) ? [titles[slug], (text || '').split(/\n\s*\n/).filter(Boolean)] : null
  if (!P) return <Navigate to="/" replace />
  return (
    <div className="container-x max-w-3xl py-14">
      <SEO title={P[0]} />
      <h1 className="h-section">{P[0]}</h1>
      <div className="mt-8 space-y-4 text-[16px] leading-relaxed text-plum-900/80">{P[1].map((t, i) => <p key={i}>{t}</p>)}</div>
    </div>
  )
}
