// Optional: automatic WhatsApp messages through Meta's WhatsApp Cloud API.
// Needs: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID and an APPROVED message template (WHATSAPP_TEMPLATE) with 4 body variables:
//   {{1}} customer name  {{2}} order number  {{3}} total in rupees  {{4}} invoice link
// Meta charges a small per-message fee for business-initiated messages — check current pricing before enabling.
exports.waEnabled = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TEMPLATE);

exports.sendOrderWhatsApp = async (order, link) => {
  if (!exports.waEnabled()) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to: `91${order.customer.phone}`, type: 'template',
        template: { name: process.env.WHATSAPP_TEMPLATE, language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' }, components: [{ type: 'body', parameters: [order.customer.name, order.orderNumber, String(order.total), link].map((text) => ({ type: 'text', text: String(text) })) }] },
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    return true;
  } catch (e) {
    console.error('WhatsApp error:', e.message);
    return false;
  }
};
