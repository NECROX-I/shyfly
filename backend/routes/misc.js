const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const c = require('../controllers/miscController');

const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, message: 'Too many messages, try again later' } });

router.get('/config', c.storeConfig);
router.get('/pincode/:pin', c.pincode);
router.get('/coupons', c.publicCoupons);
router.post('/coupons/validate', c.validateCoupon);
router.post('/contact', contactLimiter, [
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email'),
  body('message').optional().isLength({ max: 3000 }),
], validate, c.contact);

module.exports = router;
