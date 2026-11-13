const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Category name is required'], trim: true },
  slug: { type: String, unique: true, index: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  tagline: { type: String, default: '' },
  image: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.pre('validate', function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

module.exports = mongoose.model('Category', categorySchema);
