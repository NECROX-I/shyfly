const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/authController');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, c.register);

router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], validate, c.login);

router.post('/forgot-password', [body('email').isEmail().withMessage('Enter a valid email')], validate, c.forgotPassword);
router.post('/reset-password', [
  body('email').isEmail(), body('token').notEmpty(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, c.resetPassword);
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Enter your current password'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], validate, c.changePassword);
router.get('/me', protect, c.me);
router.put('/me', protect, c.updateMe);
router.get('/wishlist', protect, c.getWishlist);
router.put('/wishlist', protect, c.setWishlist);

module.exports = router;
