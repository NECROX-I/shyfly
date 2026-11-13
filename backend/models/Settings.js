const mongoose = require('mongoose');

// Single document (key: 'main'). Fields are intentionally WITHOUT defaults so .env values act as fallback.
const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  // money rules
  freeShippingMin: Number, shippingFee: Number, codFee: Number, codMax: Number,
  codEnabled: Boolean, onlineEnabled: Boolean,
  // delivery promise
  returnWindowDays: Number, processingDays: Number, deliveryMinDays: Number, deliveryMaxDays: Number,
  fastZones: [{ label: String, prefix: String, minDays: Number, maxDays: Number, _id: false }],
  blockedPincodes: [String],
  // business / contact (printed on invoices)
  storeName: String, businessName: String, address: String, gstin: String,
  supportPhone: String, supportEmail: String, whatsapp: String,
  announcements: [String],
  // website content (editable in Admin → Website content)
  heroSlides: [{ eyebrow: String, title1: String, title2: String, sub: String, cta: String, to: String, kind: String, image: String, _id: false }],
  promoTiles: [{ tag: String, label: String, sub: String, to: String, kind: String, _id: false }],
  social: { instagram: String, facebook: String, youtube: String },
  about: { heading: String, intro: String, story: String },
  policies: { shipping: String, returns: String, privacy: String, terms: String },
  footerTagline: String,
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
