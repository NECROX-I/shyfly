# Shyfly — Deployment & Handover (for the developer)

Goal: **every account is owned by the shop owner**. You work as a collaborator, then step out.

## 0. Accounts (create in the owner's name/email)
GitHub · MongoDB Atlas · Render (or Railway) · Vercel · Razorpay (KYC takes days — start first) · Cloudinary · Resend · domain registrar.

## 1. Code
Push this repo to the owner's GitHub (private). `.env` files are git-ignored — never commit secrets.

## 2. Database — MongoDB Atlas
1. Create a cluster (M0 free to start), a DB user, and a connection string (`mongodb+srv://…/shyfly`).
2. Network access: allow `0.0.0.0/0` (Render IPs change) — rely on a strong DB password.
3. **Backups:** M0 has none. Either upgrade to a paid tier with continuous backup, or schedule `npm run backup` (cron / Render cron job) **and** have the owner download the weekly backup from the admin panel.

## 3. Backend — Render (Web Service)
- Root directory: `backend` · Build: `npm install` · Start: `npm start` · Health check path: `/health`
- Use a paid instance (free instances sleep → slow first request, and the unpaid-order cleanup timer stops).
- Environment variables:

| Var | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas string |
| `JWT_SECRET` | 48+ random chars (`openssl rand -hex 32`) |
| `CLIENT_URL` | `https://www.yourdomain.in` (comma-separate extra origins) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | from Razorpay |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | from Cloudinary |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | from Resend / owner |
| `STORE_WHATSAPP`, `FREE_SHIPPING_MIN`, `SHIPPING_FEE`, `COD_FEE`, `COD_MAX_ORDER` | first-run defaults — owner later edits these in Admin → Store settings (admin values override) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | used only by `npm run seed` |

## 4. First data
Run once against the production DB (Render shell, or locally with the prod `MONGO_URI`):
```
cd backend && npm run seed
```
This creates the category tree, the admin user, sample products and 2 coupons. Owner then **deletes the sample products** (Admin → Products), edits categories, and **changes the admin password immediately**.
(`npm run seed:fresh` wipes catalogue/orders/coupons — never run it on a live shop.)

## 5. Frontend — Vercel
- Root directory: `frontend` · Build: `npm run build` · Output: `dist`
- Env: `VITE_API_URL=https://api.yourdomain.in/api`
- `vercel.json` already rewrites all routes to `index.html`.
- Domains: `www.yourdomain.in` → Vercel, `api.yourdomain.in` → Render (CNAME as each dashboard instructs). HTTPS is automatic.

## 6. Razorpay
1. Test mode first: put test keys on Render, place an online order with Razorpay's test card/UPI.
2. Dashboard → Webhooks → URL `https://api.yourdomain.in/api/payments/webhook`, events **`payment.captured`** and **`order.paid`**, set a secret → `RAZORPAY_WEBHOOK_SECRET`.
3. After KYC approval, swap in live keys + live webhook secret.

## 7. Cloudinary / Resend
- Cloudinary: copy the three values. Uploads land in the `shyfly/` folder.
- Resend: verify the sending domain (DNS records), then set `EMAIL_FROM="Shyfly <orders@yourdomain.in>"`. Without email, password-reset links print in the server log, and order emails are skipped.

## 7b. Invoice delivery (email + WhatsApp)
- Every confirmed order generates a PDF invoice (`backend/utils/invoicePdf.js`, fonts in `backend/assets/`). Customers get it by email as an attachment; the admin has one-click **WhatsApp invoice / update** buttons (wa.me links, free).
- **Email provider (pick one):**
  - **Brevo** (free tier, no domain): create account → Senders → add + verify the shop's email address → SMTP & API → create an API key → set `BREVO_API_KEY` and `EMAIL_FROM="Shyfly <that-verified-address>"`. (Free-mail senders such as Gmail can land in spam; a domain email is better when available.)
  - **Resend**: needs a verified domain to send to customers → `RESEND_API_KEY`, `EMAIL_FROM="Shyfly <orders@yourdomain.in>"`.
  - Render's free plan blocks classic SMTP ports, so use these HTTP APIs (already how the code works).
- `PUBLIC_API_URL` is optional on Render (it provides `RENDER_EXTERNAL_URL`); set it if you use a custom API domain, otherwise invoice links in emails/WhatsApp point to the wrong host.
- **Optional automatic WhatsApp** (Meta WhatsApp Cloud API): create a Meta Business app + WhatsApp number, create an approved *utility* template with 4 body variables — e.g. `Hi {{1}}, thank you for your Shyfly order {{2}} (₹{{3}}). Download your invoice: {{4}}` — then set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TEMPLATE` (+ `WHATSAPP_TEMPLATE_LANG`). Meta charges per business-initiated message and needs business verification; this path is untested here, so test it with your own number first.

## 8. Go-live test (do all of these on production)
- [ ] COD order → appears in Admin → Orders; stock decreases
- [ ] Online order (live ₹1 product) → "paid" automatically; webhook shows delivered in Razorpay dashboard
- [ ] Admin → Refund works; Cancel restocks
- [ ] Mark an order Delivered → customer requests a return → approve → received → refund (online order) works
- [ ] Invoice PDF downloads (Track Order) with business name/GSTIN (fill Store settings first); order email arrives with the PDF attached; Admin → Order → WhatsApp invoice opens WhatsApp with the right number
- [ ] Pincode check on product page; a blocked pincode is rejected at checkout
- [ ] Forgot-password email arrives and works
- [ ] Mobile: browse, bag, checkout
- [ ] Admin → Store settings → Setup checklist is all green
- [ ] `https://www…/robots.txt` loads; add the site to Google Search Console

## 9. Handing over (checklist)
- [ ] Repo, Render, Vercel, Atlas, Razorpay, Cloudinary, Resend, domain all under the owner's accounts
- [ ] Owner can log in to each (2FA on)
- [ ] **Rotate secrets** you've ever seen: new `JWT_SECRET` (logs everyone out), new DB password, regenerate Razorpay/Cloudinary/Resend keys, update Render env
- [ ] Owner's admin created; your admin disabled/removed (Admin → Team & security)
- [ ] You're removed as collaborator everywhere
- [ ] Owner has done one backup download; `HANDOVER.md` given to owner

## 10. Operations cheat-sheet
```
cd backend
npm run backup                                   # full dump → backend/backups/*.json (contains password hashes — keep private)
npm run restore -- backups/<file>.json [--wipe]  # restore (use --wipe to replace data)
npm run admin:reset -- owner@mail.com "NewPass123"   # last-resort: create/reset an admin
```
Logs: Render dashboard → Logs. Unpaid online orders are auto-cancelled and restocked after 30 min.

## 11. Known limits (be upfront with the owner)
- Courier booking/tracking is manual (Admin → Orders). Integrating Shiprocket/Delhivery is a future project.
- Returns are request-and-review only: no automatic reverse-pickup booking, and customers can't attach photos. No SMS/OTP login.
- SPA: product pages aren't server-rendered, so Google ranking is weaker than a Next.js storefront.
- Invoices are simple (taxes inclusive). A CA must confirm the GST invoice format required for the business.
- No policy text ships by default; the owner (with a CA/lawyer) writes any policy pages in Admin → Website content.
