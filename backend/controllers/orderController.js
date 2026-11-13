const crypto = require('crypto');
const Razorpay = require('razorpay');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getSettings, checkPincode } = require('../utils/settings');
const mail = require('../utils/email');
const ReturnRequest = require('../models/ReturnRequest');

const rzpEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const rzp = () => new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// ── stock helpers ──────────────────────────────────────────────
const reserve = async (lines) => {
  const done = [];
  try {
    for (const l of lines) {
      const r = await Product.updateOne(
        { _id: l.product, isActive: true, variants: { $elemMatch: { _id: l.variantId, stock: { $gte: l.qty } } } },
        { $inc: { 'variants.$.stock': -l.qty, soldCount: l.qty } }
      );
      if (!r.modifiedCount) throw new ApiError(409, `Sorry, "${l.name}" just went out of stock`);
      done.push(l);
    }
  } catch (e) { await restock(done); throw e; }
};

const restock = async (lines) => {
  for (const l of lines)
    await Product.updateOne({ _id: l.product }, { $inc: { 'variants.$[v].stock': l.qty, soldCount: -l.qty } }, { arrayFilters: [{ 'v._id': l.variantId }] });
};

const cancelAndRestock = async (order, note) => {
  if (!order.stockRestored) { await restock(order.items); order.stockRestored = true; }
  order.status = 'cancelled';
  if (order.payment.status === 'paid') order.payment.status = 'refund_pending';
  else if (order.payment.status === 'pending') order.payment.status = 'failed';
  order.timeline.push({ status: 'cancelled', note });
  await order.save();
};
exports.cancelAndRestock = cancelAndRestock;
exports.rzp = rzp;
exports.restock = restock;
exports.rzpEnabled = rzpEnabled;

const markPaid = async (order, paymentId) => {
  if (order.payment.status === 'paid' || order.payment.status === 'refund_pending') return order;
  if (order.status === 'cancelled') { // paid after we released the stock
    order.payment.status = 'refund_pending'; order.payment.razorpayPaymentId = paymentId;
    order.timeline.push({ status: 'cancelled', note: 'Payment received after expiry — refund to be issued' });
    return order.save();
  }
  order.payment.status = 'paid'; order.payment.razorpayPaymentId = paymentId; order.payment.paidAt = new Date();
  order.status = 'confirmed';
  order.timeline.push({ status: 'confirmed', note: 'Payment received' });
  await order.save();
  mail.sendOrderPlaced(order);
  return order;
};

const publicOrder = (o) => ({
  _id: o._id, orderNumber: o.orderNumber, status: o.status, timeline: o.timeline, items: o.items,
  subtotal: o.subtotal, discount: o.discount, shipping: o.shipping, codFee: o.codFee, total: o.total,
  couponCode: o.couponCode, courier: o.courier, trackingId: o.trackingId, createdAt: o.createdAt,
  eta: o.eta, customer: { name: o.customer.name, phone: o.customer.phone, email: o.customer.email },
  address: { line1: o.address.line1, line2: o.address.line2, landmark: o.address.landmark, city: o.address.city, state: o.address.state, pincode: o.address.pincode },
  payment: { method: o.payment.method, status: o.payment.status },
});

// ── Place order ────────────────────────────────────────────────
exports.placeOrder = asyncHandler(async (req, res) => {
  const { items, customer, address, paymentMethod, couponCode, notes } = req.body;
  const S = await getSettings();
  const R = { freeShippingMin: S.freeShippingMin, shippingFee: S.shippingFee, codFee: S.codFee, codMax: S.codMax };

  if (paymentMethod === 'razorpay' && (!rzpEnabled() || !S.onlineEnabled)) throw new ApiError(400, 'Online payment is not available right now. Please choose Cash on Delivery.');

  // merge duplicate lines
  const merged = new Map();
  for (const it of items) {
    const key = `${it.productId}:${it.variantId || ''}`;
    const prev = merged.get(key);
    merged.set(key, { ...it, qty: Math.min(10, (prev ? prev.qty : 0) + Number(it.qty)) });
  }
  const products = await Product.find({ _id: { $in: [...merged.values()].map((i) => i.productId) }, isActive: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = [];
  for (const it of merged.values()) {
    const p = byId.get(String(it.productId));
    if (!p) throw new ApiError(400, 'An item in your bag is no longer available');
    const v = it.variantId ? p.variants.id(it.variantId) : p.variants.length === 1 ? p.variants[0] : null;
    if (!v) throw new ApiError(400, `Please choose a size/colour for "${p.name}"`);
    if (v.stock < it.qty) throw new ApiError(409, v.stock ? `Only ${v.stock} left of "${p.name}"` : `"${p.name}" is out of stock`);
    lines.push({ product: p._id, variantId: v._id, name: p.name, slug: p.slug, image: p.images?.[0]?.url || '', size: v.size, color: v.color, price: p.price, qty: it.qty });
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  let discount = 0; let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim() });
    if (!coupon) throw new ApiError(400, 'Invalid coupon code');
    const c = coupon.compute(subtotal);
    if (c.error) throw new ApiError(400, c.error);
    discount = c.amount;
  }
  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount >= R.freeShippingMin ? 0 : R.shippingFee;
  const codFee = paymentMethod === 'cod' ? R.codFee : 0;
  const total = afterDiscount + shipping + codFee;
  if (paymentMethod === 'cod' && total > R.codMax) throw new ApiError(400, `Cash on Delivery is available up to ₹${R.codMax}. Please pay online.`);

  const pin = checkPincode(S, address.pincode);
  if (!pin.serviceable) throw new ApiError(400, pin.reason);
  if (paymentMethod === 'cod' && !S.codEnabled) throw new ApiError(400, 'Cash on Delivery is currently unavailable. Please pay online.');

  await reserve(lines);
  let couponTaken = false;
  try {
    if (coupon) {
      const r = await Coupon.updateOne({ _id: coupon._id, $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] }, { $inc: { usedCount: 1 } });
      if (!r.modifiedCount) throw new ApiError(400, 'This coupon has been fully used');
      couponTaken = true;
    }
    const order = new Order({
      user: req.user?._id, customer, address, items: lines, subtotal, discount, couponCode: coupon?.code,
      shipping, codFee, total, notes, eta: { from: pin.from, to: pin.to },
      payment: { method: paymentMethod, status: 'pending' },
      status: 'placed', timeline: [{ status: 'placed', note: paymentMethod === 'cod' ? 'Order placed (Cash on Delivery)' : 'Awaiting payment' }],
    });
    await order.validate();

    let razorpay;
    if (paymentMethod === 'razorpay') {
      const rzOrder = await rzp().orders.create({ amount: total * 100, currency: 'INR', receipt: order.orderNumber });
      order.payment.razorpayOrderId = rzOrder.id;
      razorpay = { orderId: rzOrder.id, amount: rzOrder.amount, keyId: process.env.RAZORPAY_KEY_ID };
    }
    await order.save();
    if (paymentMethod === 'cod') mail.sendOrderPlaced(order);
    res.status(201).json({ success: true, order: publicOrder(order), razorpay });
  } catch (e) {
    await restock(lines);
    if (couponTaken) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: -1 } });
    throw e;
  }
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (!safeEqual(expected, razorpay_signature)) throw new ApiError(400, 'Payment verification failed');
  const order = await Order.findOne({ 'payment.razorpayOrderId': razorpay_order_id });
  if (!order) throw new ApiError(404, 'Order not found');
  await markPaid(order, razorpay_payment_id);
  res.json({ success: true, order: publicOrder(order) });
});

// mounted with express.raw() in server.js
exports.razorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(200).send('webhook disabled');
  const sig = req.headers['x-razorpay-signature'];
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  if (!sig || !safeEqual(expected, sig)) return res.status(400).send('bad signature');
  const event = JSON.parse(req.body.toString('utf8'));
  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const pay = event.payload?.payment?.entity;
    if (pay?.order_id) {
      const order = await Order.findOne({ 'payment.razorpayOrderId': pay.order_id });
      if (order) await markPaid(order, pay.id);
    }
  }
  res.json({ received: true });
});

// release stock of online orders never paid
exports.expireUnpaid = async () => {
  const stale = await Order.find({ 'payment.method': 'razorpay', 'payment.status': 'pending', status: 'placed', createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } }).limit(50);
  for (const o of stale) await cancelAndRestock(o, 'Payment not completed in time');
  if (stale.length) console.log(`🧹 Released ${stale.length} unpaid order(s)`);
};

// ── Return eligibility + attached requests ─────────────────────
const OPEN = ['requested', 'approved', 'received'];
const returnInfo = (order, S, requests) => {
  if (!(S.returnWindowDays > 0)) return { eligible: false };
  if (order.status !== 'delivered') return { eligible: false };
  if (requests.some((r) => r.status !== 'rejected')) return { eligible: false, reason: OPEN.includes(requests.find((r) => r.status !== 'rejected').status) ? 'A return request is in progress' : 'A return was already processed for this order' };
  const at = [...order.timeline].reverse().find((t) => t.status === 'delivered')?.at || order.updatedAt;
  const until = new Date(new Date(at).getTime() + S.returnWindowDays * 864e5);
  if (until < new Date()) return { eligible: false, reason: `The ${S.returnWindowDays}-day return window ended on ${until.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` };
  return { eligible: true, until };
};

const withReturns = async (orders) => {
  const S = await getSettings();
  const reqs = await ReturnRequest.find({ order: { $in: orders.map((o) => o._id) } }).sort({ createdAt: -1 });
  return orders.map((o) => {
    const mine = reqs.filter((r) => String(r.order) === String(o._id));
    const prods = o.items.map((i) => ({ productId: i.product, variantId: i.variantId }));
    return { ...publicOrder(o), returns: mine.map((r) => ({ _id: r._id, type: r.type, status: r.status, reason: r.reason, comment: r.comment, adminNote: r.adminNote, refundAmount: r.refundAmount, items: r.items, history: r.history, createdAt: r.createdAt })), returnInfo: returnInfo(o, S, mine) };
  });
};
exports.withReturns = withReturns;

// ── Customer reads ─────────────────────────────────────────────
exports.track = asyncHandler(async (req, res) => {
  const orderNumber = String(req.query.orderNumber || '').trim().toUpperCase();
  const phone = String(req.query.phone || '').replace(/\D/g, '').slice(-10);
  const order = await Order.findOne({ orderNumber, 'customer.phone': phone });
  if (!order) throw new ApiError(404, 'No order found with these details');
  res.json({ success: true, order: (await withReturns([order]))[0] });
});

exports.myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, orders: await withReturns(orders) });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const orderNumber = String(req.body.orderNumber || '').trim().toUpperCase();
  const phone = String(req.body.phone || '').replace(/\D/g, '').slice(-10);
  const order = await Order.findOne({ orderNumber, 'customer.phone': phone });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!['placed', 'confirmed'].includes(order.status)) throw new ApiError(400, 'This order can no longer be cancelled. Please contact us.');
  await cancelAndRestock(order, 'Cancelled by customer');
  res.json({ success: true, order: publicOrder(order) });
});

exports.publicOrder = publicOrder;
