const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');

const fresh = process.argv.includes('--fresh');

const HEX = {
  Gold: '#D4AF37', 'Rose Gold': '#E8B4A0', Silver: '#C9CED6', Oxidised: '#4A4A4A', Pearl: '#F4EDE4',
  Red: '#C0213E', Maroon: '#6B1544', Pink: '#E8527F', Blush: '#F7C6D0', Peach: '#FFB59E', Mustard: '#E0A526',
  Emerald: '#0F7B5F', Teal: '#1F8A8A', Navy: '#1F2A56', Black: '#1A1A1A', White: '#FAFAFA', Ivory: '#F6F0E4',
  Beige: '#D8C3A5', Tan: '#B07A4F', Brown: '#6B4423', Lavender: '#B9A5E0', Sky: '#9CC8E8', Olive: '#7A8450', Nude: '#E3BFA6', Tortoise: '#8B5A2B',
};
const C = (names) => names.map((n) => ({ color: n, colorHex: HEX[n] || '#999' }));

const SIZES = {
  cloth: ['S', 'M', 'L', 'XL'], shoe: ['36', '37', '38', '39', '40'], ring: ['12', '14', '16', '18'], free: [''],
};

const TREE = [
  { name: 'Ornaments', tagline: 'Jewellery that tells your story', subs: ['Necklaces', 'Earrings', 'Rings', 'Bangles & Bracelets', 'Anklets', 'Jewellery Sets'] },
  { name: 'Clothing', tagline: 'Drapes, dresses & everyday ease', subs: ['Sarees', 'Kurtis & Suits', 'Dresses', 'Tops & Tees', 'Co-ord Sets'] },
  { name: 'Footwear', tagline: 'Step into every mood', subs: ['Heels', 'Flats', 'Sandals & Slides', 'Sneakers', 'Ethnic Juttis'] },
  { name: 'Handbags', tagline: 'Carry your world beautifully', subs: ['Totes', 'Sling Bags', 'Clutches', 'Backpacks', 'Wallets'] },
  { name: 'Eyewear', tagline: 'See it. Own it.', subs: ['Sunglasses', 'Eyeglasses', 'Blue-light Glasses'] },
  { name: 'Accessories', tagline: 'The little things that finish the look', subs: ['Hair Accessories', 'Scarves & Stoles', 'Belts', 'Watches'] },
];

// [name, sub, price, mrp, colours, sizeKind, material, extra tags]
const P = {
  Ornaments: [
    ['Kundan Choker Necklace', 'Necklaces', 1299, 2199, ['Gold', 'Rose Gold'], 'free', 'Brass, 22k gold plating', 'bridal,festive,kundan'],
    ['Layered Pearl Necklace', 'Necklaces', 749, 1299, ['Pearl', 'Gold'], 'free', 'Freshwater-look pearls, brass', 'pearl,party,layered'],
    ['Jhumka Earrings', 'Earrings', 499, 899, ['Gold', 'Oxidised', 'Silver'], 'free', 'Oxidised brass', 'jhumka,ethnic,festive'],
    ['Statement Hoop Earrings', 'Earrings', 399, 699, ['Gold', 'Silver'], 'free', 'Stainless steel, anti-tarnish', 'hoops,daily,minimal'],
    ['Solitaire Zircon Ring', 'Rings', 599, 999, ['Silver', 'Rose Gold'], 'ring', 'Sterling-look alloy, AAA zircon', 'ring,solitaire,gift'],
    ['Floral Kada Bangles (Set of 4)', 'Bangles & Bracelets', 899, 1499, ['Gold', 'Maroon'], 'free', 'Brass with enamel', 'bangles,festive,set'],
    ['Charm Chain Anklet', 'Anklets', 349, 599, ['Silver', 'Gold'], 'free', 'Anti-tarnish alloy', 'anklet,beach,charm'],
    ['Temple Haar Bridal Set', 'Jewellery Sets', 2499, 4299, ['Gold'], 'free', 'Antique gold plated brass', 'bridal,set,temple,wedding'],
  ],
  Clothing: [
    ['Banarasi Silk Saree', 'Sarees', 2899, 4999, ['Maroon', 'Emerald', 'Navy'], 'free', 'Banarasi silk blend', 'saree,wedding,silk'],
    ['Chiffon Floral Saree', 'Sarees', 1299, 2299, ['Pink', 'Peach', 'Sky'], 'free', 'Georgette chiffon', 'saree,party,floral'],
    ['Chikankari Straight Kurti', 'Kurtis & Suits', 1099, 1799, ['White', 'Blush', 'Sky'], 'cloth', 'Pure cotton', 'kurti,chikankari,summer'],
    ['Anarkali Suit Set', 'Kurtis & Suits', 2199, 3699, ['Mustard', 'Teal', 'Maroon'], 'cloth', 'Rayon with dupatta', 'anarkali,festive,suit'],
    ['Wrap Midi Dress', 'Dresses', 1599, 2599, ['Red', 'Navy', 'Olive'], 'cloth', 'Crepe', 'dress,western,party'],
    ['Breezy Linen Shirt', 'Tops & Tees', 899, 1499, ['White', 'Beige', 'Sky'], 'cloth', 'Linen blend', 'shirt,office,summer'],
    ['Ruffle Co-ord Set', 'Co-ord Sets', 1899, 2999, ['Lavender', 'Peach', 'Black'], 'cloth', 'Poly-crepe', 'coord,brunch,trending'],
    ['Pleated Satin Skirt Set', 'Co-ord Sets', 1699, 2799, ['Nude', 'Emerald'], 'cloth', 'Satin', 'coord,evening'],
  ],
  Footwear: [
    ['Block Heel Sandals', 'Heels', 1399, 2299, ['Nude', 'Black', 'Gold'], 'shoe', 'Vegan leather', 'heels,party,comfort'],
    ['Pearl-Strap Stilettos', 'Heels', 1799, 2999, ['Ivory', 'Red'], 'shoe', 'Satin, vegan leather sole', 'stilettos,wedding'],
    ['Ballet Flats', 'Flats', 899, 1499, ['Black', 'Blush', 'Tan'], 'shoe', 'Soft synthetic leather', 'flats,office,daily'],
    ['Cushion Slides', 'Sandals & Slides', 599, 999, ['Beige', 'Pink', 'Black'], 'shoe', 'EVA cushion', 'slides,home,comfort'],
    ['Chunky Platform Sneakers', 'Sneakers', 1999, 3299, ['White', 'Pink', 'Black'], 'shoe', 'Canvas & rubber', 'sneakers,street,trending'],
    ['Embroidered Punjabi Juttis', 'Ethnic Juttis', 799, 1299, ['Mustard', 'Maroon', 'Teal'], 'shoe', 'Faux leather, thread work', 'jutti,ethnic,festive'],
  ],
  Handbags: [
    ['Structured Tote Bag', 'Totes', 2199, 3499, ['Tan', 'Black', 'Maroon'], 'free', 'Vegan leather', 'tote,office,work'],
    ['Quilted Sling Bag', 'Sling Bags', 1299, 2199, ['Blush', 'Black', 'Nude'], 'free', 'Quilted PU, gold chain', 'sling,party,chain'],
    ['Beaded Evening Clutch', 'Clutches', 999, 1799, ['Gold', 'Silver', 'Red'], 'free', 'Beadwork, satin lining', 'clutch,wedding,party'],
    ['Mini Backpack', 'Backpacks', 1499, 2499, ['Pink', 'Black', 'Lavender'], 'free', 'Water-resistant nylon', 'backpack,college,travel'],
    ['Zip-around Wallet', 'Wallets', 599, 999, ['Maroon', 'Tan', 'Navy'], 'free', 'Vegan leather', 'wallet,gift,daily'],
    ['Woven Jute Tote', 'Totes', 1099, 1799, ['Beige', 'Olive'], 'free', 'Jute with cotton lining', 'tote,beach,eco'],
  ],
  Eyewear: [
    ['Cat-Eye Sunglasses', 'Sunglasses', 799, 1499, ['Black', 'Tortoise', 'Pink'], 'free', 'Acetate frame, UV400', 'sunglasses,cat-eye,uv400'],
    ['Oversized Round Shades', 'Sunglasses', 899, 1599, ['Brown', 'Black'], 'free', 'Lightweight TR90, UV400', 'sunglasses,round,oversized'],
    ['Gold-rim Aviators', 'Sunglasses', 999, 1799, ['Gold', 'Silver'], 'free', 'Metal frame, polarised', 'aviator,polarised'],
    ['Classic Cat-Eye Frames', 'Eyeglasses', 1299, 2199, ['Black', 'Tortoise', 'Maroon'], 'free', 'Acetate, prescription ready', 'eyeglasses,frames,office'],
    ['Blue-light Blockers', 'Blue-light Glasses', 699, 1199, ['Black', 'Pink', 'Sky'], 'free', 'TR90, anti-glare lens', 'bluelight,screen,wfh'],
  ],
  Accessories: [
    ['Satin Scrunchie Set (Pack of 5)', 'Hair Accessories', 249, 449, ['Blush', 'Maroon', 'Ivory'], 'free', 'Satin', 'scrunchie,hair,pack'],
    ['Pearl Hair Claw Clip', 'Hair Accessories', 349, 599, ['Pearl', 'Gold'], 'free', 'Acrylic pearls, alloy', 'claw,hair,pearl'],
    ['Printed Silk Scarf', 'Scarves & Stoles', 599, 999, ['Pink', 'Navy', 'Mustard'], 'free', 'Satin-silk', 'scarf,stole,print'],
    ['Pashmina-feel Stole', 'Scarves & Stoles', 1299, 2199, ['Beige', 'Maroon', 'Olive'], 'free', 'Soft acrylic wool', 'stole,winter'],
    ['Skinny Waist Belt', 'Belts', 499, 899, ['Tan', 'Black', 'Gold'], 'free', 'Vegan leather, metal buckle', 'belt,waist'],
    ['Minimal Rose-gold Watch', 'Watches', 1999, 3499, ['Rose Gold', 'Silver'], 'free', 'Stainless steel, mesh strap', 'watch,gift,minimal'],
  ],
};

const rnd = (() => { let s = 42; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

(async () => {
  await connectDB();

  if (fresh) {
    await Promise.all([Category.deleteMany(), Product.deleteMany(), Order.deleteMany(), Coupon.deleteMany(), Review.deleteMany()]);
    console.log('🧹 Cleared catalogue, orders, coupons');
  }

  // admin
  const email = (process.env.ADMIN_EMAIL || 'admin@shyfly.in').toLowerCase();
  if (!(await User.findOne({ email }))) {
    await User.create({ name: process.env.ADMIN_NAME || 'Shyfly Admin', email, password: process.env.ADMIN_PASSWORD || 'ChangeMe@123', role: 'admin' });
    console.log(`👑 Admin created: ${email}`);
  }

  if ((await Category.countDocuments()) > 0) {
    console.log('ℹ️  Catalogue already exists — run `npm run seed:fresh` to rebuild it.');
    return mongoose.disconnect();
  }

  const cats = {}; const subs = {};
  let order = 0;
  for (const t of TREE) {
    const top = await Category.create({ name: t.name, tagline: t.tagline, sortOrder: order++ });
    cats[t.name] = top;
    let so = 0;
    for (const s of t.subs) subs[`${t.name}/${s}`] = await Category.create({ name: s, parent: top._id, sortOrder: so++ });
  }

  let count = 0;
  for (const [catName, list] of Object.entries(P)) {
    let i = 0;
    for (const [name, sub, price, mrp, colours, sizeKind, material, tags] of list) {
      const variants = [];
      for (const c of C(colours)) for (const size of SIZES[sizeKind]) variants.push({ ...c, size, stock: Math.floor(rnd() * 14) + (rnd() > 0.85 ? 0 : 2), sku: `SHY-${count}-${c.color.slice(0, 2).toUpperCase()}${size}` });
      await Product.create({
        name, category: cats[catName]._id, subCategory: subs[`${catName}/${sub}`]._id, price, mrp, material,
        description: `${name} from Shyfly — designed for the woman who likes her style effortless. Crafted in ${material.toLowerCase()}, finished with care and quality-checked before it leaves our studio.`,
        details: [{ label: 'Material', value: material }, { label: 'Style', value: sub }, { label: 'Occasion', value: tags.split(',')[0] }, { label: 'Origin', value: 'Made in India' }],
        careNote: catName === 'Ornaments' ? 'Keep away from water, perfume and moisture. Store in the pouch provided.' : catName === 'Clothing' ? 'Gentle hand wash or dry clean. Do not bleach.' : 'Wipe clean with a soft dry cloth. Store in a cool, dry place.',
        tags: tags.split(','), variants,
        featured: i < 3, isNewArrival: i % 3 === 0, soldCount: Math.floor(rnd() * 120),
        rating: { avg: Math.round((3.9 + rnd() * 1.1) * 10) / 10, count: Math.floor(rnd() * 80) + 4 },
      });
      i++; count++;
    }
  }

  await Coupon.create([
    { code: 'WELCOME10', description: '10% off your first order (max ₹300)', type: 'percent', value: 10, minOrder: 499, maxDiscount: 300 },
    { code: 'SHY200', description: '₹200 off on orders above ₹1,999', type: 'flat', value: 200, minOrder: 1999 },
  ]);

  console.log(`✅ Seeded ${Object.keys(cats).length} categories, ${Object.keys(subs).length} sub-categories, ${count} products, 2 coupons`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
