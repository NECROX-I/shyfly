const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');
const mail = require('../utils/email');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, wishlist: u.wishlist, addresses: u.addresses });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (await User.findOne({ email })) throw new ApiError(400, 'An account with this email already exists');
  const user = await User.create({ name, email, phone, password });
  res.status(201).json({ success: true, token: sign(user._id), user: publicUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Incorrect email or password');
  if (!user.isActive) throw new ApiError(401, 'This account is deactivated');
  res.json({ success: true, token: sign(user._id), user: publicUser(user) });
});

exports.me = asyncHandler(async (req, res) => res.json({ success: true, user: publicUser(req.user) }));

exports.updateMe = asyncHandler(async (req, res) => {
  const { name, phone, addresses } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (Array.isArray(addresses)) req.user.addresses = addresses.slice(0, 5);
  await req.user.save();
  res.json({ success: true, user: publicUser(req.user) });
});

exports.getWishlist = asyncHandler(async (req, res) => {
  const products = await Product.find({ _id: { $in: req.user.wishlist }, isActive: true }).populate('category', 'name slug');
  res.json({ success: true, products });
});

// replace wishlist with the given product ids (client merges guest + server lists first)
exports.setWishlist = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.slice(0, 200) : [];
  const valid = await Product.find({ _id: { $in: ids } }).select('_id');
  req.user.wishlist = valid.map((p) => p._id);
  await req.user.save();
  res.json({ success: true, ids: req.user.wishlist });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = newPassword; await user.save();
  res.json({ success: true });
});

const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email, isActive: true });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = hash(token); user.resetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const link = `${(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim()}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const sent = await mail.sendPasswordReset(user, link);
    if (!sent) console.log(`🔑 Password reset link for ${email} (email not configured): ${link}`);
  }
  res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() }).select('+resetTokenHash +resetExpires');
  if (!user || !user.resetTokenHash || !user.resetExpires || user.resetExpires < new Date() || user.resetTokenHash !== hash(String(token || ''))) throw new ApiError(400, 'This reset link is invalid or has expired');
  user.password = password; user.resetTokenHash = undefined; user.resetExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Password updated. You can log in now.' });
});
