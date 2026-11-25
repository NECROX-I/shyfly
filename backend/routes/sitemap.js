const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');

const router = express.Router();
const site = () => (process.env.SITE_URL || 'https://shyflyfashion.com').replace(/\/+$/, '');
const esc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

// GET /sitemap.xml — home, shop, categories, sub-categories, every live product (with its images), about, contact.
// Served on the main domain through the rewrite in frontend/vercel.json.
router.get('/', async (req, res, next) => {
  try {
    const [cats, prods] = await Promise.all([
      Category.find({ isActive: true }).select('slug parent updatedAt').lean(),
      Product.find({ isActive: true }).select('slug updatedAt images').sort('-updatedAt').limit(10000).lean(),
    ]);
    const byId = new Map(cats.map((c) => [String(c._id), c]));
    const base = site();
    const urls = [
      { loc: `${base}/`, freq: 'daily', pri: '1.0' },
      { loc: `${base}/shop`, freq: 'daily', pri: '0.9' },
    ];
    for (const c of cats) {
      const parent = c.parent ? byId.get(String(c.parent)) : null;
      if (c.parent && !parent) continue; // orphan sub-category
      urls.push({ loc: `${base}/shop/${parent ? `${parent.slug}/` : ''}${c.slug}`, mod: day(c.updatedAt), freq: 'weekly', pri: parent ? '0.7' : '0.8' });
    }
    for (const p of prods) {
      if (!p.slug) continue;
      urls.push({ loc: `${base}/product/${p.slug}`, mod: day(p.updatedAt), freq: 'weekly', pri: '0.7', images: (p.images || []).map((i) => i.url).filter((u) => /^https?:\/\//i.test(u || '')).slice(0, 5) });
    }
    urls.push({ loc: `${base}/about`, freq: 'monthly', pri: '0.4' }, { loc: `${base}/contact`, freq: 'monthly', pri: '0.4' });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ''}<changefreq>${u.freq}</changefreq><priority>${u.pri}</priority>${(u.images || []).map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join('')}</url>`).join('\n')}\n</urlset>\n`;
    res.set('Content-Type', 'application/xml; charset=utf-8').set('Cache-Control', 'public, max-age=3600').send(xml);
  } catch (e) { next(e); }
});

module.exports = router;
