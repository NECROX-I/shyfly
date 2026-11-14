const { getSettings } = require('./settings');
const { buildInvoicePdf } = require('./invoicePdf');
const mail = require('./email');
const wa = require('./whatsapp');

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
// public URL of this API (Render sets RENDER_EXTERNAL_URL automatically); `req` is used when available
const apiUrl = (req) => (process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL || (req ? `${req.protocol}://${req.get('host')}` : '')).replace(/\/$/, '');

exports.links = (order, req) => ({
  pdf: `${apiUrl(req)}/api/orders/invoice.pdf?order=${order.orderNumber}&t=${order.invoiceToken}`,
  page: `${clientUrl()}/invoice?order=${order.orderNumber}&t=${order.invoiceToken}`,
  track: `${clientUrl()}/track?order=${order.orderNumber}`,
});

exports.pdfFor = async (order) => buildInvoicePdf(order, await getSettings());

// order confirmed → email (with PDF attached) + optional automatic WhatsApp. Never throws.
exports.orderPlaced = async (order, req) => {
  try {
    const l = exports.links(order, req);
    let pdf = null;
    try { pdf = await exports.pdfFor(order); } catch (e) { console.error('Invoice PDF error:', e.message); }
    await mail.sendOrderPlaced(order, { pdf, link: l.pdf });
    await wa.sendOrderWhatsApp(order, l.pdf);
  } catch (e) { console.error('notify.orderPlaced:', e.message); }
};
