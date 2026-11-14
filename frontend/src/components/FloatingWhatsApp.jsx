import { useLocation } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import { useConfig } from '../lib/hooks'
import { waLink } from '../lib/format'

export default function FloatingWhatsApp() {
  const { whatsapp } = useConfig()
  const { pathname } = useLocation()
  if (!whatsapp) return null
  // on phones it would cover the sticky Add-to-bag / Pay bars
  const hideOnMobile = /^\/(product|checkout|cart)/.test(pathname)
  return (
    <a href={waLink(whatsapp, 'Hi Shyfly! I need help with an order 💗')} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
      className={`fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px))] right-4 z-30 grid h-12 w-12 place-items-center sm:h-14 sm:w-14 ${hideOnMobile ? 'max-lg:hidden' : ''} rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-110 lg:bottom-6 lg:right-6`}>
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />
      <FaWhatsapp size={28} className="relative" />
    </a>
  )
}
