import { FaWhatsapp } from 'react-icons/fa'
import { useConfig } from '../lib/hooks'
import { waLink } from '../lib/format'

export default function FloatingWhatsApp() {
  const { whatsapp } = useConfig()
  if (!whatsapp) return null
  return (
    <a href={waLink(whatsapp, 'Hi Shyfly! I need help with an order 💗')} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
      className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-110 lg:bottom-6 lg:right-6">
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />
      <FaWhatsapp size={28} className="relative" />
    </a>
  )
}
