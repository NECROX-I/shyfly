import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 20000 })

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('shyfly-auth')
    const token = raw && JSON.parse(raw)?.state?.token
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch (_) {}
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('shyfly-auth')) {
      const url = err.config?.url || ''
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('shyfly-auth')
        if (window.location.pathname.startsWith('/admin')) window.location.href = '/admin/login'
      }
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login: (d) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  forgot: (email) => api.post('/auth/forgot-password', { email }),
  reset: (d) => api.post('/auth/reset-password', d),
  changePassword: (d) => api.put('/auth/password', d),
  update: (d) => api.put('/auth/me', d),
  wishlist: () => api.get('/auth/wishlist'),
  setWishlist: (ids) => api.put('/auth/wishlist', { ids }),
}

export const shopAPI = {
  categories: () => api.get('/products/categories'),
  products: (params) => api.get('/products', { params }),
  suggest: (q) => api.get('/products/suggest', { params: { q } }),
  one: (slug) => api.get(`/products/${slug}`),
  related: (slug) => api.get(`/products/${slug}/related`),
  byIds: (ids) => api.post('/products/by-ids', { ids }),
  reviews: (id) => api.get(`/products/${id}/reviews`),
  addReview: (id, d) => api.post(`/products/${id}/reviews`, d),
  config: () => api.get('/store/config'),
  coupons: () => api.get('/store/coupons'),
  validateCoupon: (code, subtotal) => api.post('/store/coupons/validate', { code, subtotal }),
  contact: (d) => api.post('/store/contact', d),
  pincode: (pin) => api.get(`/store/pincode/${pin}`),
}

export const orderAPI = {
  place: (d) => api.post('/orders', d),
  verify: (d) => api.post('/orders/verify-payment', d),
  track: (params) => api.get('/orders/track', { params }),
  cancel: (d) => api.post('/orders/cancel', d),
  mine: () => api.get('/orders/mine'),
  requestReturn: (d) => api.post('/orders/return', d),
}

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  upload: (files) => { const f = new FormData(); [...files].forEach((x) => f.append('images', x)); return api.post('/admin/upload', f) },
  products: (params) => api.get('/admin/products', { params }),
  product: (id) => api.get(`/admin/products/${id}`),
  createProduct: (d) => api.post('/admin/products', d),
  updateProduct: (id, d) => api.put(`/admin/products/${id}`, d),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  categories: () => api.get('/admin/categories'),
  createCategory: (d) => api.post('/admin/categories', d),
  updateCategory: (id, d) => api.put(`/admin/categories/${id}`, d),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  orders: (params) => api.get('/admin/orders', { params }),
  updateOrder: (id, d) => api.put(`/admin/orders/${id}`, d),
  coupons: () => api.get('/admin/coupons'),
  createCoupon: (d) => api.post('/admin/coupons', d),
  updateCoupon: (id, d) => api.put(`/admin/coupons/${id}`, d),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  customers: () => api.get('/admin/customers'),
  messages: () => api.get('/admin/messages'),
  returns: (params) => api.get('/admin/returns', { params }),
  updateReturn: (id, d) => api.put(`/admin/returns/${id}`, d),
  admins: () => api.get('/admin/admins'),
  createAdmin: (d) => api.post('/admin/admins', d),
  updateAdmin: (id, d) => api.put(`/admin/admins/${id}`, d),
  setupStatus: () => api.get('/admin/setup-status'),
  download: (path, params) => api.get(path, { params, responseType: 'blob' }),
  settings: () => api.get('/admin/settings'),
  saveSettings: (d) => api.put('/admin/settings', d),
  refund: (id, d) => api.post(`/admin/orders/${id}/refund`, d),
  readMessage: (id) => api.put(`/admin/messages/${id}/read`),
}

export default api
