const { Resend } = require('resend');

const client = () => (process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null);
const FROM = process.env.EMAIL_FROM || 'Shyfly <onboarding@resend.dev>';
const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

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

const send = async (payload) => {
  const c = client();
  if (!c) return;
  try {
    await c.emails.send({ from: FROM, ...payload });
  } catch (e) {
    console.error('Email error:', e.message);
  }
};

exports.sendOrderPlaced = async (order) => {
  if (order.customer.email)
    await send({
      to: order.customer.email,
      subject: `Order ${order.orderNumber} confirmed — Shyfly`,
      html: shell(`Thank you, ${order.customer.name}!`, `<p>Your order <b>${order.orderNumber}</b> is received.</p>${itemsTable(order)}<p style="font-size:13px;color:#8a6b79">Track anytime on our website using your order number and phone.</p>`),
    });
  if (process.env.ADMIN_NOTIFY_EMAIL)
    await send({
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: `🛍️ New order ${order.orderNumber} — ${inr(order.total)}`,
      html: shell('New order', `<p>${order.customer.name} · ${order.customer.phone}<br/>${order.payment.method.toUpperCase()} · ${order.payment.status}</p>${itemsTable(order)}`),
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
  if (!client()) return false;
  await send({ to: user.email, subject: 'Reset your Shyfly password', html: shell('Reset your password', `<p>Hi ${user.name}, click below to choose a new password. This link works for 30 minutes.</p><p style="text-align:center;margin:26px 0"><a href="${link}" style="background:#6b1544;color:#fff;padding:13px 28px;border-radius:999px;text-decoration:none">Reset password</a></p><p style="font-size:12px;color:#8a6b79">If you did not ask for this, you can ignore this email.</p>`) });
  return true;
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
