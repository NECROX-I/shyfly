const Order = require('../models/Order');
const Product = require('../models/Product');
const ReturnRequest = require('../models/ReturnRequest');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getSettings } = require('../utils/settings');
const { restock, rzp, rzpEnabled, withReturns } = require('./orderController');
const mail = require('../utils/email');

// ── Customer: request a return / exchange ──────────────────────
exports.requestReturn = asyncHandler(async (req, res) => {
  const orderNumber = String(req.body.orderNumber || '').trim().toUpperCase();
  const phone = String(req.body.phone || '').replace(/\D/g, '').slice(-10);
  const order = await Order.findOne({ orderNumber, 'customer.phone': phone });
  if (!order) throw new ApiError(404, 'Order not found');

  const S = await getSettings();
  const [shaped] = await withReturns([order]);
  if (!shaped.returnInfo.eligible) throw new ApiError(400, shaped.returnInfo.reason || 'This order is not eligible for return');

  const products = await Product.find({ _id: { $in: order.items.map((i) => i.product) } }).select('returnable');
  const returnable = new Map(products.map((p) => [String(p._id), p.returnable !== false]));

  const items = [];
  for (const r of req.body.items) {
    const line = order.items.find((i) => String(i.variantId) === String(r.variantId));
    if (!line) throw new ApiError(400, 'Invalid item selected');
    if (returnable.get(String(line.product)) === false) throw new ApiError(400, `"${line.name}" is not eligible for return`);
    const qty = Math.min(Number(r.qty) || 1, line.qty);
    items.push({ product: line.product, variantId: line.variantId, name: line.name, image: line.image, size: line.size, color: line.color, price: line.price, qty });
  }
  if (!items.length) throw new ApiError(400, 'Select at least one item');

  const rr = await ReturnRequest.create({
    order: order._id, orderNumber: order.orderNumber, user: order.user,
    customer: { name: order.customer.name, phone: order.customer.phone, email: order.customer.email },
    type: req.body.type, items, reason: req.body.reason, comment: req.body.comment || '',
    history: [{ status: 'requested', note: 'Request submitted by customer' }],
  });
  mail.sendReturnRequested && mail.sendReturnRequested(rr);
  res.status(201).json({ success: true, returnRequest: { _id: rr._id, status: rr.status } });
});

// ── Admin ──────────────────────────────────────────────────────
exports.listReturns = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.status) match.status = req.query.status;
  const returns = await ReturnRequest.find(match).sort({ createdAt: -1 }).limit(200).populate('order', 'total payment status');
  res.json({ success: true, returns });
});

exports.updateReturn = asyncHandler(async (req, res) => {
  const rr = await ReturnRequest.findById(req.params.id).populate('order');
  if (!rr) throw new ApiError(404, 'Return request not found');
  const { status, adminNote, refundAmount, restock: doRestock, refund } = req.body;
  const order = rr.order;

  if (adminNote !== undefined) rr.adminNote = String(adminNote).slice(0, 500);
  if (status && !ReturnRequest.STATUSES.includes(status)) throw new ApiError(400, 'Invalid status');

  let note = rr.adminNote;
  if (refund) {
    const amount = Math.round(Number(refundAmount) || 0);
    if (amount <= 0) throw new ApiError(400, 'Enter a refund amount');
    const already = order.payment.refundedAmount || 0;
    if (already + amount > order.total) throw new ApiError(400, `Refund exceeds the order total (already refunded ₹${already})`);
    if (order.payment.method === 'razorpay' && order.payment.razorpayPaymentId) {
      if (!rzpEnabled()) throw new ApiError(400, 'Razorpay keys are not configured');
      try {
        const r = await rzp().payments.refund(order.payment.razorpayPaymentId, { amount: amount * 100, notes: { order: order.orderNumber, return: String(rr._id) } });
        order.payment.refundId = r.id;
        note = `Refund of ₹${amount} sent to original payment method (${r.id})`;
      } catch (e) { throw new ApiError(400, e?.error?.description || e.message || 'Razorpay refund failed'); }
    } else {
      note = `₹${amount} refunded manually (Cash on Delivery order)`;
    }
    order.payment.refundedAmount = already + amount;
    order.payment.refundedAt = new Date();
    if (order.payment.refundedAmount >= order.total) order.payment.status = 'refunded';
    rr.refundAmount = (rr.refundAmount || 0) + amount;
  }

  if (doRestock && !rr.restocked) { await restock(rr.items); rr.restocked = true; note = (note ? note + ' · ' : '') + 'Items added back to stock'; }

  const newStatus = refund && !status ? 'refunded' : status;
  if (newStatus && newStatus !== rr.status) rr.status = newStatus;
  rr.history.push({ status: rr.status, note: note || undefined });

  // whole order returned → reflect on the order
  const fullyReturned = order.items.every((i) => rr.items.some((r) => String(r.variantId) === String(i.variantId) && r.qty >= i.qty));
  if (['refunded', 'exchanged'].includes(rr.status) && fullyReturned && rr.type === 'return' && order.status === 'delivered') {
    order.status = 'returned'; order.timeline.push({ status: 'returned', note: 'Return completed' });
  } else if (refund || doRestock) order.timeline.push({ status: order.status, note: `Return ${rr._id.toString().slice(-6)}: ${note}` });

  await order.save();
  await rr.save();
  mail.sendReturnUpdate && mail.sendReturnUpdate(rr);
  res.json({ success: true, returnRequest: rr });
});
