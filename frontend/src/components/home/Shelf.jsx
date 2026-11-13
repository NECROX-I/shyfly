import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'framer-motion'
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { shopAPI } from '../../services/api'
import ProductCard from '../ProductCard'
import { CardSkeleton } from '../Skeletons'
import Reveal from '../Reveal'

// A dedicated, lazy-loaded product shelf for one category (Ornaments / Footwear / Handbags …)
export default function Shelf({ category, index, tone = 'white' }) {
  const ref = useRef(null)
  const seen = useInView(ref, { once: true, margin: '300px' })
  const [products, setProducts] = useState(null)
  const scroller = useRef(null)

  useEffect(() => {
    if (!seen) return
    shopAPI.products({ category: category.slug, limit: 10, sort: 'popular' }).then((r) => setProducts(r.data.products)).catch(() => setProducts([]))
  }, [seen, category.slug])

  const scrollBy = (d) => scroller.current?.scrollBy({ left: d * scroller.current.clientWidth * 0.8, behavior: 'smooth' })
  if (products && products.length === 0) return null

  return (
    <section ref={ref} className={`relative py-16 sm:py-20 ${tone === 'blush' ? 'bg-blush' : ''}`}>
      {tone === 'blush' && <div className="pointer-events-none absolute inset-0 bg-petal opacity-60" />}
      <div className="container-x relative">
        <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">{String(index + 1).padStart(2, '0')} — {category.name}</p>
            <h2 className="h-section mt-3 max-w-xl">{category.tagline || category.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => scrollBy(-1)} aria-label="Scroll left" className="hidden h-11 w-11 place-items-center rounded-full border border-plum-200 bg-white text-plum-700 transition hover:bg-plum-700 hover:text-white sm:grid"><FiChevronLeft size={20} /></button>
            <button onClick={() => scrollBy(1)} aria-label="Scroll right" className="hidden h-11 w-11 place-items-center rounded-full border border-plum-200 bg-white text-plum-700 transition hover:bg-plum-700 hover:text-white sm:grid"><FiChevronRight size={20} /></button>
            <Link to={`/shop/${category.slug}`} className="btn-outline !px-6 !py-3">View all <FiArrowRight /></Link>
          </div>
        </Reveal>

        <div className="no-scrollbar mt-6 flex gap-2.5 overflow-x-auto">
          {category.children.map((s) => <Link key={s._id} to={`/shop/${category.slug}/${s.slug}`} className="chip shrink-0">{s.name}</Link>)}
        </div>

        <div ref={scroller} className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:gap-5 sm:px-0">
          {(products || Array.from({ length: 5 })).map((p, k) => (
            <div key={p?._id || k} className="w-[62%] shrink-0 snap-start sm:w-[34%] md:w-[26%] lg:w-[21%] xl:w-[18.4%]">
              {p ? <ProductCard product={p} /> : <CardSkeleton />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
