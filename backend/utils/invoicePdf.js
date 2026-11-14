const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const FONT = path.join(__dirname, '..', 'assets', 'fonts', 'Carlito-Regular.ttf');
const BOLD = path.join(__dirname, '..', 'assets', 'fonts', 'Carlito-Bold.ttf');
const LOGO = path.join(__dirname, '..', 'assets', 'logo.png');
const PLUM = '#6b1544'; const MUTED = '#8a6b79'; const LINE = '#ecd5df';

const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const dmy = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Builds a one-page (or more) A4 invoice and resolves with a Buffer.
exports.buildInvoicePdf = (order, store = {}) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Invoice ${order.orderNumber}`, Author: store.storeName || 'Shyfly' } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
  doc.registerFont('r', FONT); doc.registerFont('b', BOLD);

  const L = 48; const R = doc.page.width - 48; const W = R - L;

  // header
  if (fs.existsSync(LOGO)) doc.image(LOGO, L, 42, { width: 110 });
  doc.font('b').fontSize(22).fillColor(PLUM).text('INVOICE', L, 46, { width: W, align: 'right' });
  doc.font('r').fontSize(10).fillColor('#333').text(`No: ${order.orderNumber}`, L, 74, { width: W, align: 'right' }).text(`Date: ${dmy(order.createdAt)}`, { width: W, align: 'right' });

  let y = 112;
  doc.moveTo(L, y).lineTo(R, y).lineWidth(1.5).strokeColor(PLUM).stroke();
  y += 14;

  // seller / buyer
  doc.font('b').fontSize(9).fillColor(MUTED).text('SOLD BY', L, y).text('BILLED & SHIPPED TO', L + W / 2, y);
  y += 14;
  const seller = [store.businessName || store.storeName || 'Shyfly', store.address, store.gstin && `GSTIN: ${store.gstin}`, [store.supportPhone, store.supportEmail].filter(Boolean).join(' · ')].filter(Boolean);
  const a = order.address;
  const buyer = [order.customer.name, [a.line1, a.line2, a.landmark].filter(Boolean).join(', '), `${a.city}, ${a.state} - ${a.pincode}`, `Phone: ${order.customer.phone}`];
  doc.font('r').fontSize(10).fillColor('#222');
  const sy = y;
  doc.text(seller.join('\n'), L, sy, { width: W / 2 - 16, lineGap: 2 });
  const sEnd = doc.y;
  doc.text(buyer.join('\n'), L + W / 2, sy, { width: W / 2, lineGap: 2 });
  y = Math.max(sEnd, doc.y) + 8;
  doc.fillColor(MUTED).fontSize(9.5).text(`Payment: ${order.payment.method === 'cod' ? 'Cash on Delivery' : 'Paid online (Razorpay)'}  ·  Status: ${String(order.payment.status).replace('_', ' ')}`, L, y);
  y += 26;

  // table
  const cols = [L, L + W * 0.58, L + W * 0.68, L + W * 0.82];
  const header = () => {
    doc.rect(L, y, W, 22).fill('#f8ebf1');
    doc.font('b').fontSize(9).fillColor(PLUM).text('ITEM', cols[0] + 8, y + 7).text('QTY', cols[1], y + 7, { width: cols[2] - cols[1] - 8, align: 'right' }).text('RATE', cols[2], y + 7, { width: cols[3] - cols[2] - 8, align: 'right' }).text('AMOUNT', cols[3], y + 7, { width: R - cols[3] - 8, align: 'right' });
    y += 28;
  };
  header();
  for (const i of order.items) {
    if (y > doc.page.height - 170) { doc.addPage(); y = 48; header(); }
    const sub = [i.color, i.size && `Size ${i.size}`].filter(Boolean).join(' · ');
    doc.font('r').fontSize(10.5).fillColor('#222').text(i.name, cols[0] + 8, y, { width: cols[1] - cols[0] - 16 });
    const nameBottom = doc.y;
    if (sub) { doc.fontSize(9).fillColor(MUTED).text(sub, cols[0] + 8, nameBottom, { width: cols[1] - cols[0] - 16 }); }
    const rowBottom = doc.y;
    doc.font('r').fontSize(10.5).fillColor('#222').text(String(i.qty), cols[1], y, { width: cols[2] - cols[1] - 8, align: 'right' }).text(inr(i.price), cols[2], y, { width: cols[3] - cols[2] - 8, align: 'right' }).text(inr(i.price * i.qty), cols[3], y, { width: R - cols[3] - 8, align: 'right' });
    y = rowBottom + 8;
    doc.moveTo(L, y - 3).lineTo(R, y - 3).lineWidth(0.5).strokeColor(LINE).stroke();
  }

  // totals
  if (y > doc.page.height - 170) { doc.addPage(); y = 48; }
  y += 6;
  const row = (label, value, bold) => {
    doc.font(bold ? 'b' : 'r').fontSize(bold ? 13 : 10.5).fillColor(bold ? PLUM : '#222');
    doc.text(label, cols[2] - 60, y, { width: 120 }).text(value, cols[3], y, { width: R - cols[3] - 8, align: 'right' });
    y += bold ? 22 : 17;
  };
  row('Subtotal', inr(order.subtotal));
  if (order.discount > 0) row(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, '− ' + inr(order.discount));
  row('Shipping', order.shipping ? inr(order.shipping) : 'Free');
  if (order.codFee > 0) row('COD fee', inr(order.codFee));
  doc.moveTo(cols[2] - 60, y).lineTo(R, y).lineWidth(1).strokeColor(PLUM).stroke(); y += 6;
  row('Total', inr(order.total), true);

  doc.font('r').fontSize(8.5).fillColor(MUTED).text('All prices are in INR and inclusive of applicable taxes. This is a computer-generated invoice and does not require a signature.', L, doc.page.height - 80, { width: W, align: 'center' });
  doc.end();
});
