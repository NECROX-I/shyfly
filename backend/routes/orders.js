const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');
const c = require('../controllers/orderController');
const rc = require('../controllers/returnController');
const ReturnRequest = require('../models/ReturnRequest');

const orderLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, message: { success: false, message: 'Too many attempts, please try again shortly' } });
const trackLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, message: { success: false, message: 'Too many lookups, please try again shortly' } });

router.post('/', orderLimiter, optionalAuth, [
  body('items').isArray({ min: 1, max: 25 }).withMessage('Your bag is empty'),
  body('items.*.productId').isMongoId().withMessage('Invalid product'),
  body('items.*.qty').isInt({ min: 1, max: 10 }).withMessage('Quantity must be 1–10'),
  body('customer.name').trim().notEmpty().withMessage('Name is required'),
  body('customer.phone').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('customer.email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email'),
  body('address.line1').trim().notEmpty().withMessage('Address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.pincode').matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode'),
  body('paymentMethod').isIn(['cod', 'razorpay']).withMessage('Choose a payment method'),
], validate, c.placeOrder);

router.post('/verify-payment', orderLimiter, [
  body('razorpay_order_id').notEmpty(), body('razorpay_payment_id').notEmpty(), body('razorpay_signature').notEmpty(),
], validate, c.verifyPayment);

router.post('/return', trackLimiter, [
  body('orderNumber').notEmpty(), body('phone').matches(/^[6-9]\d{9}$/).withMessage('Enter the mobile number used for the order'),
  body('type').isIn(['return', 'exchange']).withMessage('Choose return or exchange'),
  body('reason').isIn(ReturnRequest.REASONS).withMessage('Choose a reason'),
  body('items').isArray({ min: 1, max: 20 }).withMessage('Select at least one item'),
  body('items.*.variantId').isMongoId(), body('items.*.qty').isInt({ min: 1, max: 10 }),
  body('comment').optional().isLength({ max: 600 }),
], validate, rc.requestReturn);
router.get('/track', trackLimiter, c.track);
router.post('/cancel', trackLimiter, c.cancelOrder);
router.get('/mine', protect, c.myOrders);

module.exports = router;
