import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { useCompare } from '../store'
import ProductImage from './ProductImage'

export default function CompareBar() {
  const { items, remove, clear } = useCompare()
  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-0 bottom-16 z-30 px-3 lg:bottom-5">
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-full bg-plum-800 py-2 pl-3 pr-2 text-white shadow-lift">
            <div className="flex -space-x-2">
              {items.map((p) => (
                <div key={p._id} className="group relative h-10 w-10 overflow-hidden rounded-full border-2 border-plum-800">
                  <ProductImage product={p} w={100} className="h-full w-full object-cover" />
                  <button onClick={() => remove(p._id)} className="absolute inset-0 grid place-items-center bg-plum-900/70 opacity-0 group-hover:opacity-100" aria-label="Remove"><FiX size={14} /></button>
                </div>
              ))}
            </div>
            <p className="flex-1 text-sm">{items.length} to compare</p>
            <button onClick={clear} className="px-2 text-xs uppercase tracking-wider text-plum-200 hover:text-white">Clear</button>
            <Link to="/compare" className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[.16em] text-plum-800">Compare</Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
