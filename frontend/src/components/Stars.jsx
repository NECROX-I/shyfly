import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa'

export default function Stars({ value = 0, size = 13, count, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-gold-500 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (value >= i ? <FaStar key={i} size={size} /> : value >= i - 0.5 ? <FaStarHalfAlt key={i} size={size} /> : <FaRegStar key={i} size={size} />))}
      {count !== undefined && <span className="ml-1.5 text-xs text-plum-700/60">({count})</span>}
    </span>
  )
}
