# Shyfly — Owner's Guide

Everything below is done from your admin panel: **`https://<your-site>/admin`**. You do not need a developer for any of it.

---

## 1. Every day

### Add a new product
1. **Products → Add product**.
2. Fill name, category, sub-category, price. Put the original price in **MRP** if it's on sale — the discount % shows automatically.
3. **Images:** click Upload (first image = main photo). Use clear, bright photos, portrait shape works best.
4. **Variants & stock:** type colours (`Gold, Silver`) and sizes (`S, M, L` — leave blank for free size), the stock per variant, click **Generate**. Adjust any row's stock. Pick the colour swatch for each colour.
5. **Save.** It is live immediately. Untick **Visible in store** to hide a product without deleting it.

### Change a price or stock
Products → pencil icon → change → Save. Prices already in someone's bag update the next time they open it; orders always use the current price.

### Handle an order
Orders → click an order → set **Status** as you go: Confirmed → Packed → Shipped (type the courier name and tracking ID) → Out for delivery → Delivered. The customer sees it on Track Order (and gets an email if email is set up).
- **Cash on Delivery** orders become "paid" automatically when you mark them Delivered.
- **Cancel:** set status to Cancelled — stock goes back automatically.
- **Refund an online payment:** open the order → **Refund via Razorpay**. Money goes back to the customer's original method (usually 5–7 working days).
- **Invoice:** **Print invoice** button (print or save as PDF).

### Sending the invoice to a customer
- **Email (automatic):** if email is set up, every order email goes out with the **invoice PDF attached** to the customer's email address (they type it at checkout). Check Store settings → Setup checklist to see if email is on.
- **WhatsApp (free, one click):** open the order → **WhatsApp invoice**. WhatsApp opens with the customer's number and a ready message containing the invoice PDF link — just press send. **WhatsApp update** does the same for status/tracking updates.
- **Email again:** open the order → **Email invoice** (only shows if the customer gave an email).
- The customer can also download the PDF anytime from Track Order or My account.

### Deleting many products at once
Products → tick the boxes (the top box ticks the whole page) → **Delete**, **Hide** or **Show** in the bar that appears. After ticking a full page, click **Select all N matching** to act on every product in the current search. Past orders keep their product details. Deleting cannot be undone — use **Hide** if unsure.

### Returns & exchanges
Customers request these themselves from **Track Order** (or My account) once an order is **Delivered**, within your return window (Store settings → Return window; set 0 to turn returns off). You see them under **Returns** (and a banner on the Dashboard).
1. **Approve** or **Reject** (write a message — the customer sees it on Track Order).
2. When the parcel comes back click **Item received** (tick *add back to stock* if it's resellable).
3. **Refund:** online orders → *Refund via Razorpay* (partial amounts allowed). Cash on Delivery orders → send the money by UPI/bank yourself, then click *Mark refunded* to record it.
4. For an **exchange**, ship the new size and set the status to *Exchanged*.
Mark a product **Returnable = off** in its edit form for items you never take back (e.g. earrings, innerwear).

### Coupons
Coupons → create a code (percent or flat ₹, minimum order, max discount, expiry, usage limit). Switch off any time.

---

## 2. Change how the store works (Store settings)
Shipping fee · free-shipping amount · return window (days) · COD on/off · COD fee and max amount · online payment on/off · packing days · delivery days · faster zones (e.g. your own city) · pincodes you don't deliver to · business name/address/GSTIN (printed on invoices) · WhatsApp number · top announcement bar. Click **Save all changes** — it's live in seconds.

The **Setup checklist** at the top shows what's connected. Items marked with a warning need a one-time setup in your hosting/payment dashboards (see section 5).

## 3. Change what the website says (Website content)
Home page banner slides and the four promo tiles · social links · footer line · About page · optional Shipping/Returns/Privacy/Terms pages (empty by default — a page and its footer link appear only after you write text). Links inside slides look like `/shop/ornaments`, `/shop/footwear/heels`, `/shop?sale=true`.
> If you add policy pages, have them reviewed by your CA / lawyer first.

## 4. Team & security
- **Team & security → Change my password** — do this on day one.
- Add a family member or staff as another admin; disable or remove them when they leave.
- Forgot password? Use **Forgot password?** on the login page. If email isn't set up, ask your developer to run the reset command (see DEPLOY.md §10).
- Never share your admin password in WhatsApp groups. Use a different password from your email.

## 5. Things that need a dashboard (not the admin panel)
These are set once and rarely change:
| What | Where |
|---|---|
| Razorpay keys, refunds limits, payouts | Razorpay dashboard |
| Photo storage | Cloudinary dashboard |
| Emails | Resend dashboard |
| Website hosting, domain | Vercel / Render / your domain registrar |
| Database | MongoDB Atlas |

**Keep the logins for all of these in your name and in a password manager.** Whoever holds these logins controls your shop.

## 6. Backups — please do this weekly
**Store settings → Backups & exports → Full backup (JSON).** Save the file somewhere safe (Google Drive, private). If anything ever goes wrong, a developer can restore from it.
Also download **Orders (CSV)** monthly for your accounts / GST filing.

## 7. When something looks wrong
| Problem | Do this |
|---|---|
| Customer paid but order says pending | Wait 2 min and refresh; check Razorpay dashboard → Payments. If paid there, mark Payment = Paid in the order and tell your developer. |
| Customer can't see a product | Is **Visible in store** ticked? Is stock > 0? Is it in a category? |
| Photo upload fails | Setup checklist → Cloudinary. You can also paste an image link instead. |
| Site is down | Check Render and Vercel status pages, then contact your developer with the time and what you saw. |
| Forgot admin password | Login page → Forgot password. |

## 8. Running costs (typical — check each provider's current prices)
Domain (yearly) · Render backend (a paid plan is recommended so it never "sleeps") · Vercel (free for small shops) · MongoDB Atlas (free to start; paid plan adds automatic backups) · Cloudinary/Resend (free tiers) · Razorpay (a % per online payment).
