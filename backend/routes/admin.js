const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const c = require('../controllers/adminController');
const rc = require('../controllers/returnController');

router.use(protect, adminOnly);

router.get('/stats', c.stats);
router.post('/upload', upload.array('images', 8), c.uploadImages);

router.post('/products/bulk', c.bulkProducts);
router.route('/products').get(c.listProducts).post(c.createProduct);
router.route('/products/:id').get(c.getProduct).put(c.updateProduct).delete(c.deleteProduct);

router.route('/categories').get(c.listCategories).post(c.createCategory);
router.route('/categories/:id').put(c.updateCategory).delete(c.deleteCategory);

router.get('/orders', c.listOrders);
router.put('/orders/:id', c.updateOrder);
router.post('/orders/:id/refund', c.refundOrder);
router.get('/orders/:id/invoice-link', c.invoiceLink);
router.post('/orders/:id/send-invoice', c.sendInvoiceEmail);
router.route('/settings').get(c.getSettings).put(c.updateSettings);

router.route('/coupons').get(c.listCoupons).post(c.createCoupon);
router.route('/coupons/:id').put(c.updateCoupon).delete(c.deleteCoupon);

router.get('/returns', rc.listReturns);
router.put('/returns/:id', rc.updateReturn);
router.get('/customers', c.customers);
router.route('/admins').get(c.listAdmins).post(c.createAdmin);
router.put('/admins/:id', c.updateAdmin);
router.get('/setup-status', c.setupStatus);
router.get('/backup', c.backup);
router.get('/orders-export', c.ordersCsv);
router.get('/messages', c.messages);
router.put('/messages/:id/read', c.markMessage);

module.exports = router;
