const mongoose = require('mongoose');

module.exports = mongoose.model('ContactMessage', new mongoose.Schema({
  type: { type: String, enum: ['contact', 'newsletter'], default: 'contact' },
  name: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, default: '' },
  message: { type: String, maxlength: 3000, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true }));
