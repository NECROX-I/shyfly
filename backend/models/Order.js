const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: String, slug: String, image: String,
  size: String, color: String,
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
}, { _id: false });

const STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'] },
    email: { type: String, lowercase: true, trim: true, default: '' },
  },
  address: {
    line1: { type: String, required: true }, line2: String, landmark: String,
    city: { type: String, required: true }, state: { type: String, required: true },
    pincode: { type: String, required: true, match: [/^\d{6}$/, 'Enter a valid 6-digit pincode'] },
  },
  items: { type: [itemSchema], validate: [(v) => v.length > 0, 'Order has no items'] },
  subtotal: Number, discount: { type: Number, default: 0 }, couponCode: String,
  shipping: { type: Number, default: 0 }, codFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  payment: {
    method: { type: String, enum: ['cod', 'razorpay'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refund_pending', 'refunded'], default: 'pending' },
    razorpayOrderId: String, razorpayPaymentId: String, paidAt: Date, refundId: String, refundedAt: Date, refundedAmount: Number,
  },
  eta: { from: Date, to: Date },
  status: { type: String, enum: STATUSES, default: 'placed', index: true },
  timeline: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
  courier: String, trackingId: String, notes: String, adminNotes: String,
  stockRestored: { type: Boolean, default: false },
}, { timestamps: true });

orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const d = new Date();
    const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    this.orderNumber = `SHY-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
  }
  next();
});

orderSchema.statics.STATUSES = STATUSES;
module.exports = mongoose.model('Order', orderSchema);
