const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getUser = async (req) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  return user && user.isActive ? user : null;
};

exports.protect = async (req, res, next) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Please log in' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: 'Session expired, please log in again' });
  }
};

// attaches req.user if a valid token exists, never blocks (guest checkout)
exports.optionalAuth = async (req, res, next) => {
  try { req.user = await getUser(req); } catch (_) { req.user = null; }
  next();
};

exports.adminOnly = (req, res, next) =>
  req.user && req.user.role === 'admin' ? next() : res.status(403).json({ success: false, message: 'Admin access only' });
