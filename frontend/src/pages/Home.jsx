import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiTruck, FiRefreshCw, FiShield, FiHeart, FiArrowRight } from 'react-icons/fi'
import { motion } from 'framer-motion'
import SEO from '../components/SEO'
import Reveal from '../components/Reveal'
import HeroCarousel from '../components/home/HeroCarousel'
import PromoTiles from '../components/home/PromoTiles'
import CategoryCircles from '../components/home/CategoryCircles'
import Shelf from '../components/home/Shelf'
import ProductCard from '../components/ProductCard'
import { GridSkeleton } from '../components/Skeletons'
import { Butterfly, Sparkle } from '../lib/art'
import { shopAPI } from '../services/api'
import { useCategories, useCountdownToMidnight, useConfig } from '../lib/hooks'
import { inr } from '../lib/format'

const Digit = ({ n, l }) => (
  <div className="grid h-14 w-14 place-items-center rounded-full bg-plum-800 text-white shadow-soft sm:h-16 sm:w-16">
    <div className="text-center leading-none"><div className="text-lg font-semibold tabular-nums sm:text-xl">{String(n).padStart(2, '0')}</div><div className="mt-0.5 text-[8px] uppercase tracking-wider text-plum-200">{l}</div></div>
  </div>
)

function MostLoved() {
  const t = useCountdownToMidnight()
  const [items, setItems] = useState(null)
  useEffect(() => { shopAPI.products({ sort: 'popular', limit: 8 }).then((r) => setItems(r.data.products)).catch(() => setItems([])) }, [])
  return (
    <section className="container-x py-14 sm:py-20">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <Reveal><p className="eyebrow">Bestsellers</p><h2 className="h-section mt-2">Customer most loved</h2></Reveal>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden text-right text-xs uppercase tracking-widest text-plum-700/60 sm:block">Today’s offers<br />end in</div>
          <div className="flex gap-2"><Digit n={t.h} l="Hours" /><Digit n={t.m} l="Minutes" /><Digit n={t.s} l="Seconds" /></div>
          <Link to="/shop?sort=popular" className="text-sm font-medium text-plum-800 underline underline-offset-4 hover:text-rose-500">See all products</Link>
        </div>
      </div>
      <div className="mt-10">
        {items === null ? <GridSkeleton n={8} cols="grid-cols-2 lg:grid-cols-4" /> : items.length === 0 ? (
          <p className="rounded-2xl bg-blush p-10 text-center text-plum-700">Products will appear here once you add them from the admin panel.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">{items.map((p, i) => <Reveal key={p._id} delay={(i % 4) * 0.06}><ProductCard product={p} /></Reveal>)}</div>
        )}
      </div>
    </section>
  )
}

const OCCASIONS = [['Wedding', 'wedding'], ['Festive', 'festive'], ['Party', 'party'], ['Office', 'office'], ['Everyday', 'daily'], ['Gifting', 'gift'], ['Summer', 'summer'], ['Beach', 'beach']]

export default function Home() {
  const cats = useCategories()
  const cfg = useConfig()
  const features = [
    [FiTruck, 'Free shipping', `On orders above ${inr(cfg.freeShippingMin)}`],
    [FiShield, 'Secure payments', 'UPI, cards, net banking, COD'],
    [FiRefreshCw, cfg.returnWindowDays > 0 ? 'Easy returns' : 'Quality checked', cfg.returnWindowDays > 0 ? `${cfg.returnWindowDays}-day hassle-free exchange` : 'Every piece inspected before dispatch'],
    [FiHeart, 'Made with love', 'Hand-picked, quality-checked'],
  ]
  return (
    <>
      <SEO description="Shop ornaments, clothing, footwear, handbags, eyewear and accessories at Shyfly. Free shipping, Cash on Delivery, easy returns." />

      <section className="container-x pt-5 sm:pt-8"><CategoryCircles /></section>

      <section className="container-x pt-3 sm:pt-5">
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7">{cfg.loaded ? <HeroCarousel key={cfg.content.heroSlides.length} slides={cfg.content.heroSlides} /> : <div className="skeleton h-full min-h-[440px] rounded-[28px] sm:min-h-[560px]" />}</div>
          <div className="lg:col-span-5">{cfg.loaded ? <PromoTiles tiles={cfg.content.promoTiles} /> : <div className="skeleton h-full min-h-[300px] rounded-[22px]" />}</div>
        </div>
      </section>

      {/* marquee */}
      <div className="my-14 overflow-hidden border-y border-plum-100 py-5">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-4xl font-medium italic text-plum-700/80 sm:text-5xl">
          {Array.from({ length: 2 }).flatMap((_, k) => ['Ornaments', 'Clothing', 'Footwear', 'Handbags', 'Eyewear', 'Accessories'].map((w) => (
            <span key={w + k} className="flex items-center gap-12">{w}<Sparkle className="h-5 w-5 text-rose-400" /></span>
          )))}
          {Array.from({ length: 2 }).flatMap((_, k) => ['Ornaments', 'Clothing', 'Footwear', 'Handbags', 'Eyewear', 'Accessories'].map((w) => (
            <span key={w + 'b' + k} className="flex items-center gap-12">{w}<Sparkle className="h-5 w-5 text-rose-400" /></span>
          )))}
        </div>
      </div>

      <MostLoved />

      {/* a dedicated shelf per category */}
      {cats.map((c, i) => <Shelf key={c._id} category={c} index={i} tone={i % 2 === 0 ? 'blush' : 'white'} />)}

      {/* occasions */}
      <section className="container-x py-16 sm:py-20">
        <Reveal className="text-center"><p className="eyebrow">Shop by occasion</p><h2 className="h-section mt-3">Whatever the moment</h2></Reveal>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {OCCASIONS.map(([label, q], i) => (
            <motion.div key={q} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={`/shop?q=${q}`} className="inline-block rounded-full border border-plum-200 bg-white px-8 py-4 font-display text-2xl font-semibold text-plum-800 transition hover:-translate-y-1 hover:border-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-lift">{label}</Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* gifting banner */}
      <section className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-plum-800 via-plum-700 to-rose-500 px-6 py-14 text-center text-white sm:px-16 sm:py-20">
            <Butterfly className="absolute -left-4 top-6 w-24 animate-float opacity-90 sm:left-16 sm:w-32" />
            <Butterfly className="absolute -right-2 bottom-4 w-20 animate-float opacity-80 sm:right-20 sm:w-28" style={{ animationDelay: '1.5s' }} />
            <Sparkle className="absolute left-1/4 top-10 h-5 w-5 animate-pulse text-gold-300" /><Sparkle className="absolute bottom-10 right-1/3 h-4 w-4 animate-pulse text-white/80" />
            <p className="text-[11px] uppercase tracking-[.4em] text-gold-300">The gifting edit</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.02] sm:text-7xl">Give her a little <span className="italic text-rose-100">fluttering</span> joy</h2>
            <p className="mx-auto mt-5 max-w-md text-white/80">Beautifully packed jewellery, bags and accessories — ready to gift from {inr(249)}.</p>
            <Link to="/shop?q=gift" className="btn-white btn-sheen mt-8">Shop gifts <FiArrowRight /></Link>
          </div>
        </Reveal>
      </section>

      {/* features */}
      <section className="container-x pt-16">
        <div className="grid grid-cols-2 gap-6 rounded-3xl bg-blush p-6 sm:p-10 lg:grid-cols-4">
          {features.map(([I, t, s], i) => (
            <Reveal key={t} delay={i * 0.07} className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-rose-500 shadow-soft"><I size={22} /></span>
              <div><p className="font-semibold text-plum-800">{t}</p><p className="text-sm text-plum-700/70">{s}</p></div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
