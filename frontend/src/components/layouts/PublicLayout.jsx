import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import AnnouncementBar from '../AnnouncementBar'
import Navbar from '../Navbar'
import Footer from '../Footer'
import BottomNav from '../BottomNav'
import CartDrawer from '../CartDrawer'
import SearchOverlay from '../SearchOverlay'
import QuickView from '../QuickView'
import CompareBar from '../CompareBar'
import FloatingWhatsApp from '../FloatingWhatsApp'
import SparkleCursor from '../SparkleCursor'
import { PageLoader } from '../Skeletons'

export default function PublicLayout() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="min-h-[70vh]"><Suspense fallback={<PageLoader />}><Outlet /></Suspense></main>
      <Footer />
      <BottomNav />
      <CartDrawer />
      <SearchOverlay />
      <QuickView />
      <CompareBar />
      <FloatingWhatsApp />
      <SparkleCursor />
    </>
  )
}
