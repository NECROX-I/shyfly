const Coupon = require('../models/Coupon');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getSettings, checkPincode } = require('../utils/settings');
const mail = require('../utils/email');

exports.storeConfig = asyncHandler(async (req, res) => {
  const S = await getSettings();
  const keys = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  res.set('Cache-Control', 'public, max-age=30');
  res.json({
    success: true,
    config: {
      freeShippingMin: S.freeShippingMin, shippingFee: S.shippingFee, codFee: S.codFee, codMax: S.codMax,
      codEnabled: S.codEnabled, returnWindowDays: S.returnWindowDays, onlinePayment: keys && S.onlineEnabled,
      invoiceEmail: require('../utils/email').emailEnabled(), whatsapp: S.whatsapp, announcements: S.announcements,
      store: { name: S.storeName, businessName: S.businessName, address: S.address, gstin: S.gstin, phone: S.supportPhone, email: S.supportEmail },
      delivery: { min: S.deliveryMinDays + S.processingDays, max: S.deliveryMaxDays + S.processingDays },
      content: {
        heroSlides: S.heroSlides, promoTiles: S.promoTiles, social: S.social, about: S.about, footerTagline: S.footerTagline,
        policies: Object.fromEntries(Object.entries(S.policies).map(([k, t]) => [k, String(t).replace(/\{\{(\w+)\}\}/g, (m, key) => (S[key] !== undefined ? S[key] : m))])),
      },
    },
  });
});

exports.pincode = asyncHandler(async (req, res) => {
  const S = await getSettings();
  res.json({ success: true, ...checkPincode(S, req.params.pin) });
});

exports.validateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: String(req.body.code || '').toUpperCase().trim() });
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');
  const r = coupon.compute(Number(req.body.subtotal) || 0);
  if (r.error) throw new ApiError(400, r.error);
  res.json({ success: true, code: coupon.code, discount: r.amount, description: coupon.description });
});

exports.publicCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).select('code description minOrder').limit(5);
  res.json({ success: true, coupons });
});

exports.contact = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.create({ type: req.body.type === 'newsletter' ? 'newsletter' : 'contact', name: req.body.name, email: req.body.email, phone: req.body.phone, message: req.body.message });
  if (msg.type === 'contact') mail.sendContact(msg);
  res.status(201).json({ success: true });
});
