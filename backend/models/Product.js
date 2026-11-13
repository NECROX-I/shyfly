const mongoose = require('mongoose');
const slugify = require('slugify');
const crypto = require('crypto');

const variantSchema = new mongoose.Schema({
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  colorHex: { type: String, default: '' },
  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String, default: '' },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 160 },
  slug: { type: String, unique: true, index: true },
  brand: { type: String, default: 'Shyfly', trim: true },
  description: { type: String, default: '', maxlength: 4000 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'], index: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  mrp: { type: Number, min: 0 },
  images: [{ url: String, publicId: String }],
  variants: { type: [variantSchema], validate: [(v) => v.length > 0, 'Add at least one variant (size/colour/stock)'] },
  details: [{ label: String, value: String }],
  tags: [{ type: String, lowercase: true, trim: true }],
  material: { type: String, default: '' },
  careNote: { type: String, default: '' },
  returnable: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  soldCount: { type: Number, default: 0 },
  rating: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('totalStock').get(function () { return (this.variants || []).reduce((s, v) => s + v.stock, 0); });
productSchema.virtual('inStock').get(function () { return this.totalStock > 0; });
productSchema.virtual('discount').get(function () { return this.mrp && this.mrp > this.price ? Math.round(((this.mrp - this.price) / this.mrp) * 100) : 0; });

productSchema.pre('validate', function (next) {
  if (!this.slug && this.name) this.slug = `${slugify(this.name, { lower: true, strict: true })}-${crypto.randomBytes(2).toString('hex')}`;
  if (!this.mrp || this.mrp < this.price) this.mrp = this.price;
  next();
});

productSchema.index({ price: 1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', tags: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
