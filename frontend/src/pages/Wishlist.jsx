import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import ProductCard from '../components/ProductCard'
import { GridSkeleton } from '../components/Skeletons'
import { useWishlist } from '../store'
import { shopAPI } from '../services/api'

export default function Wishlist() {
  const ids = useWishlist((s) => s.ids)
  const [items, setItems] = useState(null)
  useEffect(() => {
    if (!ids.length) return setItems([])
    shopAPI.byIds(ids).then((r) => setItems(ids.map((id) => r.data.products.find((p) => p._id === id)).filter(Boolean))).catch(() => setItems([]))
  }, [ids.length]) // eslint-disable-line
  const shown = (items || []).filter((p) => ids.includes(p._id))
  return (
    <div className="container-x py-12">
      <SEO title="My wishlist" />
      <p className="eyebrow">Saved for later</p><h1 className="h-section mt-2">My wishlist</h1>
      <div className="mt-10">
        {items === null ? <GridSkeleton n={4} cols="grid-cols-2 lg:grid-cols-4" /> : shown.length === 0 ? (
          <div className="py-16 text-center"><p className="font-display text-4xl font-semibold text-plum-800">Your wishlist is empty</p><p className="mt-2 text-plum-700/70">Tap the heart on anything you love.</p><Link to="/shop" className="btn-plum mt-6">Discover pieces</Link></div>
        ) : <div className="grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">{shown.map((p) => <ProductCard key={p._id} product={p} />)}</div>}
      </div>
    </div>
  )
}
