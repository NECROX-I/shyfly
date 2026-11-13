const slugify = require('slugify');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { escapeRegex } = require('../utils/pricing');
const cloud = require('../config/cloudinary');
const mail = require('../utils/email');
const { cancelAndRestock, rzp, rzpEnabled } = require('./orderController');
const Settings = require('../models/Settings');
const { getSettings, invalidate } = require('../utils/settings');

// ── Dashboard ──────────────────────────────────────────────────
exports.stats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 13 * 864e5); since.setHours(0, 0, 0, 0);
  const live = { status: { $nin: ['cancelled', 'returned'] } };
  const [totals, byStatus, series, top, low, counts] = await Promise.all([
    Order.aggregate([{ $match: live }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { ...live, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([{ $match: live }, { $unwind: '$items' }, { $group: { _id: '$items.product', name: { $first: '$items.name' }, image: { $first: '$items.image' }, qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } }, { $sort: { qty: -1 } }, { $limit: 5 }]),
    Product.aggregate([{ $addFields: { stockLeft: { $sum: '$variants.stock' } } }, { $match: { stockLeft: { $lte: 5 }, isActive: true } }, { $sort: { stockLeft: 1 } }, { $limit: 8 }, { $project: { name: 1, slug: 1, stockLeft: 1, images: { $slice: ['$images', 1] } } }]),
    Promise.all([User.countDocuments({ role: 'customer' }), Product.countDocuments(), ContactMessage.countDocuments({ isRead: false }), require('../models/ReturnRequest').countDocuments({ status: 'requested' })]),
  ]);
  const map = Object.fromEntries(series.map((s) => [s._id, s]));
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = new Date(d.getTime() + 5.5 * 36e5).toISOString().slice(0, 10);
    days.push({ date: key, orders: map[key]?.orders || 0, revenue: map[key]?.revenue || 0 });
  }
  res.json({
    success: true,
    totals: { revenue: totals[0]?.revenue || 0, orders: totals[0]?.orders || 0, customers: counts[0], products: counts[1], unreadMessages: counts[2], openReturns: counts[3] },
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.n])),
    series: days, topProducts: top, lowStock: low,
  });
});

// ── Uploads ────────────────────────────────────────────────────
exports.uploadImages = asyncHandler(async (req, res) => {
  if (!cloud.isConfigured) throw new ApiError(400, 'Cloudinary is not configured. Paste image URLs instead, or add Cloudinary keys to .env');
  if (!req.files?.length) throw new ApiError(400, 'No images received');
  const images = await Promise.all(req.files.map((f) => cloud.uploadBuffer(f.buffer)));
  res.status(201).json({ success: true, images });
});

// ── Products ───────────────────────────────────────────────────
const cleanProduct = (b) => {
  const out = { ...b };
  delete out._id; delete out.slug; delete out.soldCount; delete out.rating;
  if (Array.isArray(out.tags)) out.tags = out.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  if (Array.isArray(out.variants)) out.variants = out.variants.map((v) => ({ ...v, stock: Math.max(0, Number(v.stock) || 0) }));
  if (!out.subCategory) out.subCategory = undefined;
  return out;
};

exports.listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1); const limit = 20;
  const match = {};
  if (req.query.q) { const rx = new RegExp(escapeRegex(req.query.q), 'i'); match.$or = [{ name: rx }, { tags: rx }]; }
  if (req.query.category) match.category = req.query.category;
  if (req.query.status === 'active') match.isActive = true;
  if (req.query.status === 'hidden') match.isActive = false;
  const [products, total] = await Promise.all([
    Product.find(match).populate('category', 'name').populate('subCategory', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(match),
  ]);
  res.json({ success: true, products, total, pages: Math.ceil(total / limit), page });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product: p });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const p = await Product.create(cleanProduct(req.body));
  res.status(201).json({ success: true, product: p });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Product not found');
  const data = cleanProduct(req.body);
  if (data.images) {
    const keep = new Set(data.images.map((i) => i.publicId).filter(Boolean));
    for (const old of p.images) if (old.publicId && !keep.has(old.publicId)) cloud.destroy(old.publicId);
  }
  p.set(data);
  await p.save();
  res.json({ success: true, product: p });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) throw new ApiError(404, 'Product not found');
  p.images.forEach((i) => cloud.destroy(i.publicId));
  res.json({ success: true });
});

// ── Categories ─────────────────────────────────────────────────
exports.listCategories = asyncHandler(async (req, res) => {
  const cats = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  const counts = await Product.aggregate([{ $group: { _id: '$subCategory', n: { $sum: 1 } } }]);
  const topCounts = await Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]);
  const c = Object.fromEntries([...counts, ...topCounts].filter((x) => x._id).map((x) => [String(x._id), x.n]));
  res.json({ success: true, categories: cats.map((x) => ({ ...x, productCount: c[String(x._id)] || 0 })) });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, parent, tagline, image, sortOrder } = req.body;
  const cat = await Category.create({ name, parent: parent || null, tagline, image, sortOrder, slug: slugify(name, { lower: true, strict: true }) });
  res.status(201).json({ success: true, category: cat });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, parent, tagline, image, sortOrder, isActive } = req.body;
  const cat = await Category.findByIdAndUpdate(req.params.id, { name, parent: parent || null, tagline, image, sortOrder, isActive }, { new: true, runValidators: true });
  if (!cat) throw new ApiError(404, 'Category not found');
  res.json({ success: true, category: cat });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const [inUse, kids] = await Promise.all([
    Product.countDocuments({ $or: [{ category: req.params.id }, { subCategory: req.params.id }] }),
    Category.countDocuments({ parent: req.params.id }),
  ]);
  if (inUse || kids) throw new ApiError(400, 'Move or delete the products / sub-categories inside it first');
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ── Orders ─────────────────────────────────────────────────────
exports.listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1); const limit = 20;
  const match = {};
  if (req.query.status) match.status = req.query.status;
  if (req.query.payment) match['payment.status'] = req.query.payment;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
    match.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.phone': rx }];
  }
  const [orders, total] = await Promise.all([
    Order.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(match),
  ]);
  res.json({ success: true, orders, total, pages: Math.ceil(total / limit), page });
});

exports.updateOrder = asyncHandler(async (req, res) => {
  const { status, note, courier, trackingId, adminNotes, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (courier !== undefined) order.courier = courier;
  if (trackingId !== undefined) order.trackingId = trackingId;
  if (adminNotes !== undefined) order.adminNotes = adminNotes;
  if (paymentStatus && ['pending', 'paid', 'failed', 'refund_pending', 'refunded'].includes(paymentStatus)) {
    order.payment.status = paymentStatus;
    if (paymentStatus === 'paid' && !order.payment.paidAt) order.payment.paidAt = new Date();
  }
  if (status && status !== order.status) {
    if (!Order.STATUSES.includes(status)) throw new ApiError(400, 'Invalid status');
    if (status === 'cancelled') { await cancelAndRestock(order, note || 'Cancelled by store'); }
    else {
      order.status = status;
      order.timeline.push({ status, note });
      if (status === 'delivered' && order.payment.method === 'cod') { order.payment.status = 'paid'; order.payment.paidAt = new Date(); }
      await order.save();
    }
    mail.sendStatusUpdate(order);
  } else await order.save();
  res.json({ success: true, order });
});

// ── Coupons ────────────────────────────────────────────────────
exports.listCoupons = asyncHandler(async (req, res) => res.json({ success: true, coupons: await Coupon.find().sort({ createdAt: -1 }) }));
exports.createCoupon = asyncHandler(async (req, res) => res.status(201).json({ success: true, coupon: await Coupon.create(req.body) }));
exports.updateCoupon = asyncHandler(async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!c) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, coupon: c });
});
exports.deleteCoupon = asyncHandler(async (req, res) => { await Coupon.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// ── Customers / messages ───────────────────────────────────────
exports.customers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'customer' }).sort({ createdAt: -1 }).limit(200).select('name email phone createdAt isActive');
  const spend = await Order.aggregate([{ $match: { user: { $ne: null }, status: { $nin: ['cancelled', 'returned'] } } }, { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' } } }]);
  const m = Object.fromEntries(spend.map((s) => [String(s._id), s]));
  res.json({ success: true, customers: users.map((u) => ({ ...u.toObject(), orders: m[String(u._id)]?.orders || 0, spent: m[String(u._id)]?.spent || 0 })) });
});

exports.messages = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, messages });
});
exports.markMessage = asyncHandler(async (req, res) => { await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }); res.json({ success: true }); });

// ── Store settings (owner-editable, no server access needed) ───
exports.getSettings = asyncHandler(async (req, res) => {
  invalidate();
  res.json({ success: true, settings: await getSettings(), razorpayKeys: rzpEnabled() });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const b = req.body; const set = {};
  for (const k of ['freeShippingMin', 'shippingFee', 'codFee', 'codMax', 'returnWindowDays', 'processingDays', 'deliveryMinDays', 'deliveryMaxDays'])
    if (b[k] !== undefined && b[k] !== '') { const n = Number(b[k]); if (!Number.isFinite(n) || n < 0) throw new ApiError(400, `Invalid ${k}`); set[k] = n; }
  if (set.deliveryMinDays !== undefined && set.deliveryMaxDays !== undefined && set.deliveryMinDays > set.deliveryMaxDays) throw new ApiError(400, 'Minimum delivery days cannot exceed maximum');
  for (const k of ['codEnabled', 'onlineEnabled']) if (typeof b[k] === 'boolean') set[k] = b[k];
  for (const k of ['storeName', 'businessName', 'address', 'gstin', 'supportPhone', 'supportEmail', 'whatsapp']) if (typeof b[k] === 'string') set[k] = b[k].trim().slice(0, 300);
  if (Array.isArray(b.announcements)) set.announcements = b.announcements.map((x) => String(x).trim().slice(0, 120)).filter(Boolean).slice(0, 8);
  if (Array.isArray(b.blockedPincodes)) set.blockedPincodes = b.blockedPincodes.map((x) => String(x).replace(/\D/g, '')).filter(Boolean).slice(0, 500);
  if (Array.isArray(b.fastZones)) set.fastZones = b.fastZones.map((z) => ({ label: String(z.label || '').slice(0, 40), prefix: String(z.prefix || '').replace(/\D/g, '').slice(0, 6), minDays: Number(z.minDays) || 0, maxDays: Number(z.maxDays) || 0 })).filter((z) => z.prefix && z.maxDays >= z.minDays).slice(0, 50);
  // website content
  const KINDS = ['ornaments', 'clothing', 'footwear', 'handbags', 'eyewear', 'accessories'];
  const str = (v, n) => String(v ?? '').trim().slice(0, n);
  const link = (v) => { const x = str(v, 200); return x.startsWith('/') || /^https?:\/\//.test(x) ? x : x ? `/${x}` : '/shop'; };
  if (Array.isArray(b.heroSlides)) set.heroSlides = b.heroSlides.slice(0, 6).map((h) => ({ eyebrow: str(h.eyebrow, 40), title1: str(h.title1, 40), title2: str(h.title2, 40), sub: str(h.sub, 220), cta: str(h.cta, 30) || 'Shop now', to: link(h.to), kind: KINDS.includes(h.kind) ? h.kind : 'ornaments', image: str(h.image, 500) })).filter((h) => h.title1 || h.title2);
  if (Array.isArray(b.promoTiles)) set.promoTiles = b.promoTiles.slice(0, 4).map((t) => ({ tag: str(t.tag, 16), label: str(t.label, 60), sub: str(t.sub, 30), to: link(t.to), kind: KINDS.includes(t.kind) ? t.kind : 'ornaments' })).filter((t) => t.label);
  if (b.social && typeof b.social === 'object') set.social = { instagram: str(b.social.instagram, 300), facebook: str(b.social.facebook, 300), youtube: str(b.social.youtube, 300) };
  if (b.about && typeof b.about === 'object') set.about = { heading: str(b.about.heading, 150), intro: str(b.about.intro, 400), story: str(b.about.story, 3000) };
  if (b.policies && typeof b.policies === 'object') set.policies = Object.fromEntries(['shipping', 'returns', 'privacy', 'terms'].map((k) => [k, str(b.policies[k], 6000)]));
  if (typeof b.footerTagline === 'string') set.footerTagline = str(b.footerTagline, 250);
  await Settings.findOneAndUpdate({ key: 'main' }, { $set: set }, { upsert: true, setDefaultsOnInsert: true });
  invalidate();
  res.json({ success: true, settings: await getSettings() });
});

// ── Refund a paid online order through Razorpay ────────────────
exports.refundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.payment.method !== 'razorpay' || !order.payment.razorpayPaymentId) throw new ApiError(400, 'Only paid online orders can be refunded here. For COD, refund manually and mark payment as refunded.');
  if (!['paid', 'refund_pending'].includes(order.payment.status)) throw new ApiError(400, 'This order has no refundable payment');
  if (!rzpEnabled()) throw new ApiError(400, 'Razorpay keys are not configured');
  const amount = Math.min(Number(req.body.amount) || order.total, order.total);
  try {
    const r = await rzp().payments.refund(order.payment.razorpayPaymentId, { amount: Math.round(amount * 100), notes: { order: order.orderNumber, reason: String(req.body.reason || 'Store refund').slice(0, 100) } });
    order.payment.status = 'refunded'; order.payment.refundId = r.id; order.payment.refundedAt = new Date(); order.payment.refundedAmount = amount;
    order.timeline.push({ status: order.status, note: `Refund of ₹${amount} initiated (${r.id})` });
    await order.save();
    res.json({ success: true, order });
  } catch (e) {
    throw new ApiError(400, e?.error?.description || e.message || 'Razorpay refund failed');
  }
});

// ── Team & security ────────────────────────────────────────────
const crypto = require('crypto');
const { EJSON } = require('mongoose').mongo.BSON;

exports.listAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 }).select('name email isActive createdAt');
  res.json({ success: true, admins });
});

exports.createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(400, 'Enter a valid email');
  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) { existing.role = 'admin'; existing.isActive = true; await existing.save(); return res.status(201).json({ success: true, admin: { _id: existing._id, name: existing.name, email: existing.email, isActive: true }, promoted: true }); }
  if (!name || !password || String(password).length < 8) throw new ApiError(400, 'Name and a password of at least 8 characters are required');
  const u = await User.create({ name, email, password, role: 'admin' });
  res.status(201).json({ success: true, admin: { _id: u._id, name: u.name, email: u.email, isActive: true } });
});

exports.updateAdmin = asyncHandler(async (req, res) => {
  const u = await User.findOne({ _id: req.params.id, role: 'admin' }).select('+password');
  if (!u) throw new ApiError(404, 'Admin not found');
  const { isActive, password, remove } = req.body;
  const isSelf = String(u._id) === String(req.user._id);
  if ((isActive === false || remove) && isSelf) throw new ApiError(400, 'You cannot deactivate or remove your own account');
  if (isActive === false || remove) {
    const others = await User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: u._id } });
    if (!others) throw new ApiError(400, 'At least one active admin must remain');
  }
  if (remove) u.role = 'customer';
  if (typeof isActive === 'boolean') u.isActive = isActive;
  if (password) { if (String(password).length < 8) throw new ApiError(400, 'Password must be at least 8 characters'); u.password = password; }
  await u.save();
  res.json({ success: true });
});

// ── Setup status (what is configured on the server) ────────────
exports.setupStatus = asyncHandler(async (req, res) => {
  const S = await getSettings();
  res.json({
    success: true,
    checks: [
      { key: 'razorpay', label: 'Online payments (Razorpay keys)', ok: rzpEnabled(), help: 'Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.' },
      { key: 'webhook', label: 'Payment webhook secret', ok: !!process.env.RAZORPAY_WEBHOOK_SECRET, help: 'Add RAZORPAY_WEBHOOK_SECRET and the webhook URL in the Razorpay dashboard.' },
      { key: 'cloudinary', label: 'Photo uploads (Cloudinary)', ok: cloud.isConfigured, help: 'Add the three CLOUDINARY_* keys. Until then, paste image URLs.' },
      { key: 'email', label: 'Order & password emails (Resend)', ok: !!process.env.RESEND_API_KEY, help: 'Add RESEND_API_KEY and ADMIN_NOTIFY_EMAIL.' },
      { key: 'business', label: 'Business name & address filled in', ok: !!(S.businessName && S.address), help: 'Fill Admin → Store settings → Business details (needed for invoices).' },
      { key: 'whatsapp', label: 'WhatsApp number set', ok: !!S.whatsapp, help: 'Add it in Store settings → Business details.' },
      { key: 'secret', label: 'Strong login secret', ok: (process.env.JWT_SECRET || '').length >= 32, help: 'Set JWT_SECRET to a random 32+ character value.' },
      { key: 'prod', label: 'Running in production mode', ok: process.env.NODE_ENV === 'production', help: 'Set NODE_ENV=production on the host.' },
    ],
  });
});

// ── Backups & exports ──────────────────────────────────────────
exports.backup = asyncHandler(async (req, res) => {
  const data = {
    meta: { app: 'shyfly', exportedAt: new Date().toISOString(), note: 'Customer passwords are NOT included. Customers can use "Forgot password" after a restore.' },
    settings: await Settings.find().lean(), categories: await Category.find().lean(), products: await Product.find().lean(),
    orders: await Order.find().lean(), returns: await require('../models/ReturnRequest').find().lean(), coupons: await Coupon.find().lean(), messages: await ContactMessage.find().lean(),
    users: await User.find().select('-password -resetTokenHash -resetExpires').lean(),
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="shyfly-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(EJSON.stringify(data, { relaxed: true }));
});

exports.ordersCsv = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) { match.createdAt = {}; if (req.query.from) match.createdAt.$gte = new Date(req.query.from); if (req.query.to) { const t = new Date(req.query.to); t.setHours(23, 59, 59, 999); match.createdAt.$lte = t; } }
  const orders = await Order.find(match).sort({ createdAt: -1 }).limit(20000);
  const esc = (v) => { v = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const head = ['Order', 'Date', 'Customer', 'Phone', 'Email', 'City', 'State', 'Pincode', 'Items', 'Subtotal', 'Discount', 'Coupon', 'Shipping', 'COD fee', 'Total', 'Payment', 'Payment status', 'Status', 'Courier', 'Tracking'];
  const rows = orders.map((o) => [o.orderNumber, o.createdAt.toISOString().slice(0, 10), o.customer.name, o.customer.phone, o.customer.email, o.address.city, o.address.state, o.address.pincode, o.items.map((i) => `${i.name}${i.size ? ' ' + i.size : ''}${i.color ? ' ' + i.color : ''} x${i.qty}`).join(' | '), o.subtotal, o.discount, o.couponCode, o.shipping, o.codFee, o.total, o.payment.method, o.payment.status, o.status, o.courier, o.trackingId].map(esc).join(','));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="shyfly-orders-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('\ufeff' + [head.join(','), ...rows].join('\n'));
});
