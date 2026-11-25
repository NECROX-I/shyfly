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
  // product page has a sticky Add-to-bag bar on desktop too → lift the button above it
  const onProduct = pathname.startsWith('/product')
  return (
    <a href={waLink(whatsapp, 'Hi Shyfly! I need help with an order 💗')} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
      className={`fixed bottom-[calc(var(--bnav-h,58px)+14px)] left-3 z-30 grid h-11 w-11 place-items-center sm:left-4 sm:h-12 sm:w-12 ${hideOnMobile ? 'max-lg:hidden' : ''} rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-110 lg:left-auto lg:right-6 lg:h-14 lg:w-14 ${onProduct ? 'lg:bottom-24' : 'lg:bottom-6'}`}>
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />
      <FaWhatsapp className="relative h-6 w-6 lg:h-7 lg:w-7" />
    </a>
  )
}
