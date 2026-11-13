const num = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v !== undefined ? Number(v) : d);

const rules = () => ({
  freeShippingMin: num(process.env.FREE_SHIPPING_MIN, 999),
  shippingFee: num(process.env.SHIPPING_FEE, 79),
  codFee: num(process.env.COD_FEE, 40),
  codMax: num(process.env.COD_MAX_ORDER, 15000),
});

const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { rules, escapeRegex };
