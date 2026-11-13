const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { razorpayWebhook, expireUnpaid } = require('./controllers/orderController');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('❌ Set a JWT_SECRET (16+ chars) in backend/.env');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(cors({ origin: origins, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));

// Razorpay webhook needs the raw body → mount BEFORE express.json
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests, slow down a little' } }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: 'Too many login attempts, try again in a few minutes' } });

app.get('/health', (req, res) => res.json({ ok: true, name: 'Shyfly API', time: new Date() }));
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/products', require('./routes/catalog'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/store', require('./routes/misc'));

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`🦋 Shyfly API on :${PORT} (${process.env.NODE_ENV || 'development'})`));
    setInterval(() => expireUnpaid().catch((e) => console.error('expireUnpaid', e.message)), 10 * 60 * 1000);
  });
}
module.exports = app;
