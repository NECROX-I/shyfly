const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '', maxlength: 100 },
  comment: { type: String, default: '', maxlength: 1500 },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
module.exports = mongoose.model('Review', reviewSchema);
