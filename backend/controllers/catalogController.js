const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { escapeRegex } = require('../utils/pricing');

const CARD_FIELDS = 'name slug brand price mrp images variants category subCategory featured isNewArrival soldCount rating tags material';
const list = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);

// ── Categories (tree) ──────────────────────────────────────────
exports.getCategories = asyncHandler(async (req, res) => {
  const all = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  const tops = all.filter((c) => !c.parent);
  const tree = tops.map((t) => ({ ...t, children: all.filter((c) => String(c.parent) === String(t._id)) }));
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, categories: tree });
});

// ── Product list with filters / sort / facets ──────────────────
exports.getProducts = asyncHandler(async (req, res) => {
  const { q, category, sub, minPrice, maxPrice, sort = 'newest', featured, isNew, sale, inStock } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit) || 12));

  const scope = { isActive: true }; // category/search scope (used for facets)
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (!cat) return res.json({ success: true, products: [], total: 0, page, pages: 0, facets: {} });
    if (cat.parent) scope.subCategory = cat._id; else scope.category = cat._id;
  }
  if (sub) {
    const s = await Category.findOne({ slug: sub });
    if (s) scope.subCategory = s._id;
  }
  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim().slice(0, 60)), 'i');
    scope.$or = [{ name: rx }, { tags: rx }, { brand: rx }, { material: rx }];
  }

  const match = { ...scope };
  if (minPrice || maxPrice) {
    match.price = {};
    if (minPrice) match.price.$gte = Number(minPrice);
    if (maxPrice) match.price.$lte = Number(maxPrice);
  }
  const sizes = list(req.query.sizes);
  const colors = list(req.query.colors);
  const variantMatch = {};
  if (sizes.length) variantMatch.size = { $in: sizes };
  if (colors.length) variantMatch.color = { $in: colors.map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i')) };
  if (inStock === 'true') variantMatch.stock = { $gt: 0 };
  if (Object.keys(variantMatch).length) match.variants = { $elemMatch: variantMatch };
  if (featured === 'true') match.featured = true;
  if (isNew === 'true') match.isNewArrival = true;
  if (sale === 'true') match.$expr = { $gt: ['$mrp', '$price'] };

  const sorts = {
    newest: { createdAt: -1 }, popular: { soldCount: -1, createdAt: -1 },
    price_asc: { price: 1 }, price_desc: { price: -1 }, rating: { 'rating.avg': -1, 'rating.count': -1 },
  };

  const [products, total, facetAgg] = await Promise.all([
    Product.find(match).select(CARD_FIELDS).populate('category', 'name slug').populate('subCategory', 'name slug')
      .sort(sorts[sort] || sorts.newest).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(match),
    page === 1
      ? Product.aggregate([
          { $match: scope },
          { $unwind: '$variants' },
          { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' }, sizes: { $addToSet: '$variants.size' }, colors: { $addToSet: { name: '$variants.color', hex: '$variants.colorHex' } } } },
        ])
      : Promise.resolve(null),
  ]);

  let facets;
  if (facetAgg && facetAgg[0]) {
    const f = facetAgg[0];
    const seen = new Set();
    facets = {
      minPrice: f.min, maxPrice: f.max,
      sizes: f.sizes.filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      colors: f.colors.filter((c) => c.name && !seen.has(c.name.toLowerCase()) && seen.add(c.name.toLowerCase())),
    };
  }
  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit), facets });
});

exports.suggest = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 40);
  if (q.length < 2) return res.json({ success: true, products: [], categories: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const [products, categories] = await Promise.all([
    Product.find({ isActive: true, $or: [{ name: rx }, { tags: rx }] }).select('name slug price images category').limit(6).populate('category', 'slug'),
    Category.find({ isActive: true, name: rx }).select('name slug parent').limit(4),
  ]);
  res.json({ success: true, products, categories });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug').populate('subCategory', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

exports.getRelated = asyncHandler(async (req, res) => {
  const p = await Product.findOne({ slug: req.params.slug }).select('category subCategory');
  if (!p) throw new ApiError(404, 'Product not found');
  let products = await Product.find({ isActive: true, _id: { $ne: p._id }, subCategory: p.subCategory }).select(CARD_FIELDS).sort({ soldCount: -1 }).limit(8);
  if (products.length < 4) {
    const more = await Product.find({ isActive: true, _id: { $nin: [p._id, ...products.map((x) => x._id)] }, category: p.category }).select(CARD_FIELDS).sort({ soldCount: -1 }).limit(8 - products.length);
    products = products.concat(more);
  }
  // "complete the look": best sellers from other categories
  const look = await Product.find({ isActive: true, category: { $ne: p.category } }).select(CARD_FIELDS).sort({ soldCount: -1 }).limit(4);
  res.json({ success: true, products, look });
});

exports.byIds = asyncHandler(async (req, res) => {
  const ids = (Array.isArray(req.body.ids) ? req.body.ids : []).filter((i) => mongoose.isValidObjectId(i)).slice(0, 60);
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).populate('category', 'name slug').populate('subCategory', 'name slug');
  res.json({ success: true, products });
});

// ── Reviews ────────────────────────────────────────────────────
exports.getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 }).limit(50);
  const dist = await Review.aggregate([{ $match: { product: new mongoose.Types.ObjectId(req.params.id) } }, { $group: { _id: '$rating', n: { $sum: 1 } } }]);
  res.json({ success: true, reviews, distribution: Object.fromEntries(dist.map((d) => [d._id, d.n])) });
});

exports.addReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const verified = !!(await Order.exists({ user: req.user._id, 'items.product': product._id, status: 'delivered' }));
  const { rating, title, comment } = req.body;
  await Review.findOneAndUpdate(
    { product: product._id, user: req.user._id },
    { rating, title, comment, name: req.user.name, verified },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  const [agg] = await Review.aggregate([{ $match: { product: product._id } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  product.rating = { avg: Math.round(agg.avg * 10) / 10, count: agg.count };
  await product.save();
  res.status(201).json({ success: true, rating: product.rating });
});
