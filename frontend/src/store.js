import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from './services/api'

const lineKey = (productId, variantId) => `${productId}:${variantId}`

// ── Cart ──────────────────────────────────────────────────────
export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      coupon: null, // { code, discount }
      add: (product, variant, qty = 1) => {
        const key = lineKey(product._id, variant._id)
        const items = get().items
        const found = items.find((i) => i.key === key)
        const max = Math.min(10, variant.stock)
        if (found) set({ items: items.map((i) => (i.key === key ? { ...i, qty: Math.min(max, i.qty + qty), max } : i)), coupon: null })
        else set({
          items: [...items, {
            key, productId: product._id, variantId: variant._id, slug: product.slug, name: product.name,
            image: product.images?.[0]?.url || '', category: product.category?.slug,
            price: product.price, mrp: product.mrp, size: variant.size, color: variant.color, qty: Math.min(max, qty), max,
          }],
          coupon: null,
        })
      },
      setQty: (key, qty) => set({ items: get().items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(i.max || 10, qty)) } : i)), coupon: null }),
      remove: (key) => set({ items: get().items.filter((i) => i.key !== key), coupon: null }),
      clear: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
      savings: () => get().items.reduce((s, i) => s + Math.max(0, (i.mrp || i.price) - i.price) * i.qty, 0),
    }),
    { name: 'shyfly-cart', version: 1 }
  )
)

// ── Wishlist (guest-local, merged to account on login) ─────────
export const useWishlist = create(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      toggle: (id) => {
        const ids = get().ids
        const next = ids.includes(id) ? ids.filter((i) => i !== id) : [id, ...ids]
        set({ ids: next })
        if (useAuth.getState().token) authAPI.setWishlist(next).catch(() => {})
        return !ids.includes(id)
      },
      merge: async () => {
        try {
          const { data } = await authAPI.me()
          const merged = [...new Set([...get().ids, ...(data.user.wishlist || [])])]
          set({ ids: merged })
          authAPI.setWishlist(merged).catch(() => {})
        } catch (_) {}
      },
    }),
    { name: 'shyfly-wishlist' }
  )
)

// ── Compare ───────────────────────────────────────────────────
export const useCompare = create((set, get) => ({
  items: [],
  toggle: (p) => {
    const items = get().items
    if (items.find((i) => i._id === p._id)) { set({ items: items.filter((i) => i._id !== p._id) }); return 'removed' }
    if (items.length >= 4) return 'full'
    set({ items: [...items, p] }); return 'added'
  },
  remove: (id) => set({ items: get().items.filter((i) => i._id !== id) }),
  clear: () => set({ items: [] }),
}))

// ── Recently viewed ───────────────────────────────────────────
export const useRecent = create(
  persist(
    (set, get) => ({
      ids: [],
      push: (id) => set({ ids: [id, ...get().ids.filter((i) => i !== id)].slice(0, 12) }),
    }),
    { name: 'shyfly-recent' }
  )
)

// ── Auth ──────────────────────────────────────────────────────
export const useAuth = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (user, token) => { set({ user, token }); useWishlist.getState().merge() },
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'shyfly-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)

// ── UI (not persisted) ────────────────────────────────────────
export const useUI = create((set) => ({
  cartOpen: false,
  searchOpen: false,
  menuOpen: false,
  quickView: null,
  setCart: (v) => set({ cartOpen: v }),
  setSearch: (v) => set({ searchOpen: v }),
  setMenu: (v) => set({ menuOpen: v }),
  setQuickView: (p) => set({ quickView: p }),
}))
