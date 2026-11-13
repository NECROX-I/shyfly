import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './store'
import { authAPI } from './services/api'
import PublicLayout from './components/layouts/PublicLayout'
import Home from './pages/Home'
import { PageLoader } from './components/Skeletons'

const Shop = lazy(() => import('./pages/Shop'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const CartPage = lazy(() => import('./pages/CartPage'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const TrackOrder = lazy(() => import('./pages/TrackOrder'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Compare = lazy(() => import('./pages/Compare'))
const Account = lazy(() => import('./pages/Account'))
const Login = lazy(() => import('./pages/Login'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Policy = lazy(() => import('./pages/Policy'))
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminPeople = lazy(() => import('./pages/admin/AdminPeople'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminContent = lazy(() => import('./pages/admin/AdminContent'))
const AdminReturns = lazy(() => import('./pages/admin/AdminReturns'))
const AdminTeam = lazy(() => import('./pages/admin/AdminTeam'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Invoice = lazy(() => import('./pages/Invoice'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function AdminGuard({ children }) {
  const user = useAuth((s) => s.user)
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  const { token, setUser, logout } = useAuth()
  // refresh profile (and drop dead tokens) on load
  useEffect(() => { if (token) authAPI.me().then((r) => setUser(r.data.user)).catch(() => logout()) }, []) // eslint-disable-line

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:category" element={<Shop />} />
            <Route path="/shop/:category/:sub" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/account" element={<Account />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/policy/:slug" element={<Policy />} />
          </Route>

          <Route path="/invoice" element={<Invoice />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="people" element={<AdminPeople />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="returns" element={<AdminReturns />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
