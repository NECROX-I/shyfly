const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['percent', 'flat'], required: true },
  value: { type: Number, required: true, min: 1 },
  minOrder: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  expiresAt: Date,
  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

couponSchema.methods.compute = function (subtotal) {
  if (!this.isActive) return { error: 'This coupon is not active' };
  if (this.expiresAt && this.expiresAt < new Date()) return { error: 'This coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { error: 'This coupon has been fully used' };
  if (subtotal < this.minOrder) return { error: `Add items worth ₹${this.minOrder - subtotal} more to use this coupon` };
  let amount = this.type === 'percent' ? Math.round((subtotal * this.value) / 100) : this.value;
  if (this.type === 'percent' && this.maxDiscount) amount = Math.min(amount, this.maxDiscount);
  return { amount: Math.min(amount, subtotal) };
};

module.exports = mongoose.model('Coupon', couponSchema);
