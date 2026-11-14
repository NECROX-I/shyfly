const { Resend } = require('resend');

const FROM = process.env.EMAIL_FROM || 'Shyfly <onboarding@resend.dev>';
const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

// Two providers, whichever key is set: Brevo (no domain needed — verify a sender address) or Resend (needs a verified domain to email customers).
const provider = () => (process.env.BREVO_API_KEY ? 'brevo' : process.env.RESEND_API_KEY ? 'resend' : null);
// Brevo needs a verified sender address in EMAIL_FROM; Resend can start with its test sender
exports.emailEnabled = () => { const p = provider(); return !!p && (p === 'resend' || !!process.env.EMAIL_FROM); };
exports.emailProvider = provider;

const shell = (title, body) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #f3d5df;border-radius:16px;overflow:hidden">
  <div style="background:#6b1544;color:#fff;padding:22px;text-align:center"><h2 style="margin:0;letter-spacing:1px">Shyfly</h2><div style="opacity:.8;font-size:12px">For Every Woman, Every You</div></div>
  <div style="padding:24px;color:#3b2030"><h3 style="margin-top:0">${title}</h3>${body}</div>
</div>`;

const itemsTable = (order) =>
  `<table style="width:100%;border-collapse:collapse;font-size:14px">${order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.name}${i.size ? ' · ' + i.size : ''}${i.color ? ' · ' + i.color : ''} × ${i.qty}</td><td style="text-align:right">${inr(i.price * i.qty)}</td></tr>`
    )
    .join('')}<tr><td style="padding-top:10px;font-weight:bold">Total</td><td style="text-align:right;font-weight:bold">${inr(order.total)}</td></tr></table>`;

// attachments: [{ name, content: Buffer }]
const send = async ({ to, subject, html, attachments }) => {
  const p = provider();
  if (!p) return false;
  try {
    if (p === 'resend') {
      const r = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to, subject, html, attachments: attachments?.map((x) => ({ filename: x.name, content: x.content })) });
      if (r?.error) throw new Error(r.error.message);
    } else {
      const m = FROM.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
      const sender = m ? { name: m[1].trim() || 'Shyfly', email: m[2].trim() } : { name: 'Shyfly', email: FROM.trim() };
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html, attachment: attachments?.map((x) => ({ name: x.name, content: Buffer.from(x.content).toString('base64') })) }),
      });
      if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 160)}`);
    }
    return true;
  } catch (e) {
    console.error('Email error:', e.message);
    return false;
  }
};

exports.sendOrderPlaced = async (order, ctx = {}) => {
  const { pdf, link } = ctx;
  if (order.customer.email)
    await send({
      to: order.customer.email,
      subject: `Order ${order.orderNumber} confirmed — Shyfly`,
      html: shell(`Thank you, ${order.customer.name}!`, `<p>Your order <b>${order.orderNumber}</b> is received.</p>${itemsTable(order)}${pdf ? '<p style="font-size:13px;color:#555">Your invoice is attached as a PDF.</p>' : ''}${link ? `<p><a href="${link}" style="color:#6b1544">View / download invoice</a></p>` : ''}<p style="font-size:13px;color:#8a6b79">Track anytime on our website using your order number and phone.</p>`),
      attachments: pdf ? [{ name: `Invoice-${order.orderNumber}.pdf`, content: pdf }] : undefined,
    });
  if (process.env.ADMIN_NOTIFY_EMAIL)
    await send({
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: `🛍️ New order ${order.orderNumber} — ${inr(order.total)}`,
      html: shell('New order', `<p>${order.customer.name} · ${order.customer.phone}<br/>${order.payment.method.toUpperCase()} · ${order.payment.status}</p>${itemsTable(order)}`),
      attachments: pdf ? [{ name: `Invoice-${order.orderNumber}.pdf`, content: pdf }] : undefined,
    });
};

// re-send the invoice on demand (admin button) — returns true/false
exports.sendInvoice = async (order, ctx = {}) => {
  if (!order.customer.email) return false;
  return send({
    to: order.customer.email, subject: `Your Shyfly invoice — ${order.orderNumber}`,
    html: shell('Your invoice', `<p>Hi ${order.customer.name}, here is the invoice for order <b>${order.orderNumber}</b>.</p>${itemsTable(order)}${ctx.link ? `<p><a href="${ctx.link}" style="color:#6b1544">View / download invoice</a></p>` : ''}`),
    attachments: ctx.pdf ? [{ name: `Invoice-${order.orderNumber}.pdf`, content: ctx.pdf }] : undefined,
  });
};

exports.sendStatusUpdate = async (order) => {
  if (!order.customer.email) return;
  await send({
    to: order.customer.email,
    subject: `Order ${order.orderNumber}: ${order.status.replace(/_/g, ' ')}`,
    html: shell('Order update', `<p>Your order <b>${order.orderNumber}</b> is now <b>${order.status.replace(/_/g, ' ')}</b>.</p>${order.trackingId ? `<p>Tracking: ${order.courier || ''} ${order.trackingId}</p>` : ''}`),
  });
};

exports.sendContact = async ({ name, email, phone, message }) => {
  if (!process.env.ADMIN_NOTIFY_EMAIL) return;
  await send({ to: process.env.ADMIN_NOTIFY_EMAIL, subject: `New message from ${name}`, html: shell('Contact message', `<p>${name} · ${email || ''} · ${phone || ''}</p><p>${String(message).replace(/</g, '&lt;')}</p>`) });
};

exports.sendPasswordReset = async (user, link) => {
  if (!provider()) return false;
  return send({ to: user.email, subject: 'Reset your Shyfly password', html: shell('Reset your password', `<p>Hi ${user.name}, click below to choose a new password. This link works for 30 minutes.</p><p style="text-align:center;margin:26px 0"><a href="${link}" style="background:#6b1544;color:#fff;padding:13px 28px;border-radius:999px;text-decoration:none">Reset password</a></p><p style="font-size:12px;color:#8a6b79">If you did not ask for this, you can ignore this email.</p>`) });
};

exports.sendReturnRequested = async (rr) => {
  const list = rr.items.map((i) => `${i.name}${i.size ? ' · ' + i.size : ''} × ${i.qty}`).join('<br/>');
  if (process.env.ADMIN_NOTIFY_EMAIL) await send({ to: process.env.ADMIN_NOTIFY_EMAIL, subject: `↩️ ${rr.type} request — ${rr.orderNumber}`, html: shell('New return request', `<p>${rr.customer.name} · ${rr.customer.phone}</p><p><b>${rr.type}</b> — ${rr.reason}</p><p>${list}</p>${rr.comment ? `<p>“${String(rr.comment).replace(/</g, '&lt;')}”</p>` : ''}`) });
  if (rr.customer.email) await send({ to: rr.customer.email, subject: `We received your ${rr.type} request — ${rr.orderNumber}`, html: shell('Request received', `<p>Hi ${rr.customer.name}, we have your ${rr.type} request for order <b>${rr.orderNumber}</b>. We will review it and update you shortly.</p><p>${list}</p>`) });
};

exports.sendReturnUpdate = async (rr) => {
  if (!rr.customer.email) return;
  await send({ to: rr.customer.email, subject: `Your ${rr.type} request is ${rr.status} — ${rr.orderNumber}`, html: shell('Return update', `<p>Your ${rr.type} request for order <b>${rr.orderNumber}</b> is now <b>${rr.status}</b>.</p>${rr.adminNote ? `<p>${String(rr.adminNote).replace(/</g, '&lt;')}</p>` : ''}${rr.refundAmount ? `<p>Refund: ₹${rr.refundAmount}</p>` : ''}`) });
};
