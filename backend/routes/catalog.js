const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/catalogController');

router.get('/categories', c.getCategories);
router.get('/home', c.home);
router.get('/suggest', c.suggest);
router.post('/by-ids', c.byIds);
router.get('/', c.getProducts);
router.get('/:slug/related', c.getRelated);
router.get('/:id/reviews', c.getReviews);
router.post('/:id/reviews', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
  body('comment').optional().isLength({ max: 1500 }),
], validate, c.addReview);
router.get('/:slug', c.getProduct);

module.exports = router;
