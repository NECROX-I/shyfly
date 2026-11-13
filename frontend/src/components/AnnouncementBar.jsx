import { useConfig } from '../lib/hooks'
import { inr } from '../lib/format'
import { Sparkle } from '../lib/art'

export default function AnnouncementBar() {
  const cfg = useConfig()
  const msgs = cfg.announcements?.length ? cfg.announcements : [`Free shipping above ${inr(cfg.freeShippingMin)}`, ...(cfg.codEnabled === false ? [] : ['Cash on Delivery available']), ...(cfg.returnWindowDays > 0 ? [`Easy ${cfg.returnWindowDays}-day returns`] : []), 'Secure payments by Razorpay']
  const row = [...msgs, ...msgs]
  return (
    <div className="overflow-hidden bg-plum-800 py-2 text-[11px] uppercase tracking-[.22em] text-plum-50">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[...row, ...row].map((m, i) => <span key={i} className="flex items-center gap-10">{m}<Sparkle className="h-2.5 w-2.5 text-gold-400" /></span>)}
      </div>
    </div>
  )
}
