const mongoose = require('mongoose');

const STATUSES = ['requested', 'approved', 'rejected', 'received', 'refunded', 'exchanged', 'closed'];
const REASONS = ['Size / fit issue', 'Damaged or defective', 'Wrong item received', 'Not as described', 'Changed my mind', 'Other'];

const schema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  orderNumber: { type: String, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: { name: String, phone: String, email: String },
  type: { type: String, enum: ['return', 'exchange'], required: true },
  items: [{ product: mongoose.Schema.Types.ObjectId, variantId: mongoose.Schema.Types.ObjectId, name: String, image: String, size: String, color: String, price: Number, qty: Number, _id: false }],
  reason: { type: String, enum: REASONS, required: true },
  comment: { type: String, maxlength: 600, default: '' },
  status: { type: String, enum: STATUSES, default: 'requested', index: true },
  adminNote: { type: String, default: '' },
  refundAmount: { type: Number, default: 0 },
  restocked: { type: Boolean, default: false },
  history: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
}, { timestamps: true });

schema.statics.STATUSES = STATUSES;
schema.statics.REASONS = REASONS;
module.exports = mongoose.model('ReturnRequest', schema);
