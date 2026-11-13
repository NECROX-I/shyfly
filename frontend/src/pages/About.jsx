import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import Reveal from '../components/Reveal'
import { useConfig } from '../lib/hooks'
import { Butterfly, Sparkle } from '../lib/art'

export default function About() {
  const { content } = useConfig()
  const a = content.about
  return (
    <>
      <SEO title="Our story" description="Shyfly — For Every Woman, Every You." />
      <section className="relative overflow-hidden bg-blush py-20 text-center"><div className="bg-petal absolute inset-0" /><Butterfly className="mx-auto w-24 animate-float" />
        <div className="container-x relative"><img src="/logo-full.png" alt="Shyfly" className="mx-auto mt-4 w-72" /><p className="mx-auto mt-6 max-w-xl text-lg text-plum-800/80">{a.intro}</p></div></section>
      <section className="container-x grid max-w-5xl gap-14 py-20 md:grid-cols-2">
        <Reveal><p className="eyebrow">Our story</p><h2 className="h-section mt-3">{a.heading}</h2></Reveal>
        <Reveal delay={0.1} className="space-y-4 leading-relaxed text-plum-900/80">{(a.story || '').split(/\n\s*\n/).filter(Boolean).map((t, i) => <p key={i}>{t}</p>)}</Reveal>
      </section>
      <section className="container-x pb-10"><div className="grid gap-5 sm:grid-cols-3">{[['Hand-picked', 'Every product is chosen and checked by our team.'], ['Honest prices', 'Premium looks without premium markups.'], ['Cared for', 'Gift-ready packaging and friendly support.']].map(([t, d], i) => <Reveal key={t} delay={i * 0.1} className="rounded-3xl bg-blush p-8 text-center"><Sparkle className="mx-auto mb-4 h-6 w-6 text-gold-500" /><h3 className="font-display text-3xl font-semibold text-plum-800">{t}</h3><p className="mt-2 text-plum-800/70">{d}</p></Reveal>)}</div>
        <div className="mt-12 text-center"><Link to="/shop" className="btn-plum">Start exploring</Link></div></section>
    </>
  )
}
