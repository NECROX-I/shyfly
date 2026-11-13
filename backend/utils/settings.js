const Settings = require('../models/Settings');

const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);

const defaults = () => ({
  freeShippingMin: num(process.env.FREE_SHIPPING_MIN, 999),
  shippingFee: num(process.env.SHIPPING_FEE, 79),
  codFee: num(process.env.COD_FEE, 40),
  codMax: num(process.env.COD_MAX_ORDER, 15000),
  codEnabled: true, onlineEnabled: true,
  processingDays: 1, deliveryMinDays: 3, deliveryMaxDays: 6, returnWindowDays: 7,
  fastZones: [], blockedPincodes: [],
  storeName: 'Shyfly', businessName: '', address: '', gstin: '',
  supportPhone: '', supportEmail: process.env.ADMIN_NOTIFY_EMAIL || '', whatsapp: process.env.STORE_WHATSAPP || '',
  announcements: [],
  heroSlides: [
    { eyebrow: 'Festive edit', title1: 'Jewellery that', title2: 'speaks softly', sub: 'Kundan, pearl and oxidised pieces made to be noticed — and loved for years.', cta: 'Shop ornaments', to: '/shop/ornaments', kind: 'ornaments', image: '' },
    { eyebrow: 'New season', title1: 'Step into', title2: 'every mood', sub: 'From block heels to cushioned slides — comfort that keeps up with you.', cta: 'Shop footwear', to: '/shop/footwear', kind: 'footwear', image: '' },
    { eyebrow: 'Carry in style', title1: 'Bags she’ll', title2: 'never put down', sub: 'Totes, slings and clutches in rich colours, finished with gold-tone details.', cta: 'Shop handbags', to: '/shop/handbags', kind: 'handbags', image: '' },
  ],
  promoTiles: [
    { tag: 'Hot', label: 'Festive jhumkas & kundan', sub: 'Weekly offers', to: '/shop/ornaments/earrings', kind: 'ornaments' },
    { tag: 'New', label: 'Fresh handbags just landed', sub: 'Special offers', to: '/shop/handbags?isNew=true', kind: 'handbags' },
    { tag: 'Top Deal', label: 'Heels & flats on offer', sub: 'Top deals', to: '/shop/footwear?sale=true', kind: 'footwear' },
    { tag: 'Best Seller', label: 'Sunglasses she’ll love', sub: 'Weekly offers', to: '/shop/eyewear?sort=popular', kind: 'eyewear' },
  ],
  social: { instagram: '', facebook: '', youtube: '' },
  about: {
    heading: 'Everything she needs, beautifully in one place',
    intro: 'A little butterfly of a brand — light, graceful, and always on the move with the women who wear it.',
    story: 'Shyfly started with a simple idea: shopping for yourself should feel joyful, not overwhelming. From statement jewellery and festive wear to everyday footwear, handbags, eyewear and accessories — every piece is hand-picked and quality-checked.\n\nWe keep prices honest, deliveries quick and returns easy, so you can try something new without a second thought.',
  },
  policies: { shipping: '', returns: '', privacy: '', terms: '' },
  footerTagline: 'Fashion, jewellery and little luxuries — chosen with love for every woman, every mood, every you.',
});

let cache = null; let at = 0;
const TTL = 20 * 1000;

exports.invalidate = () => { cache = null; };

exports.getSettings = async () => {
  if (cache && Date.now() - at < TTL) return cache;
  const doc = await Settings.findOne({ key: 'main' }).lean();
  const d = defaults();
  const out = { ...d };
  if (doc) for (const k of Object.keys(d)) {
    const v = doc[k]; const dv = d[k];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) { if (v.length || !dv.length) out[k] = v; continue; }
    if (typeof v === 'object') { out[k] = { ...dv, ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined && x !== null && x !== '')) }; continue; }
    if (typeof v === 'string' && v === '' && typeof dv === 'string' && dv !== '') continue;
    out[k] = v;
  }
  cache = out; at = Date.now();
  return out;
};

const addDays = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; };

// Serviceability + delivery estimate for a 6-digit pincode, driven by admin settings
exports.checkPincode = (S, pin) => {
  pin = String(pin || '');
  if (!/^\d{6}$/.test(pin)) return { serviceable: false, reason: 'Enter a valid 6-digit pincode' };
  if ((S.blockedPincodes || []).some((p) => p && pin.startsWith(String(p).trim()))) return { serviceable: false, reason: 'Sorry, we do not deliver to this pincode yet' };
  const zone = (S.fastZones || []).filter((z) => z.prefix && pin.startsWith(String(z.prefix).trim())).sort((a, b) => b.prefix.length - a.prefix.length)[0];
  const min = zone ? zone.minDays : S.deliveryMinDays;
  const max = zone ? zone.maxDays : S.deliveryMaxDays;
  const lead = S.processingDays || 0;
  return { serviceable: true, cod: !!S.codEnabled, zone: zone?.label || null, from: addDays(lead + min), to: addDays(lead + max) };
};
