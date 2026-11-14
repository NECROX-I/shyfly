import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiTag,
  FiX,
  FiLock,
  FiCheck,
  FiShield,
  FiTruck,
  FiRefreshCw,
} from "react-icons/fi";
import SEO from "../components/SEO";
import ProductImage from "../components/ProductImage";
import { useCart, useAuth } from "../store";
import { useConfig } from "../lib/hooks";
import { orderAPI, shopAPI } from "../services/api";
import { inr, errMsg } from "../lib/format";

const STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Other",
];

const loadRazorpay = () =>
  new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = res;
    s.onerror = () => rej(new Error("Could not load payment gateway"));
    document.body.appendChild(s);
  });

const Field = ({ f, errors, on, k, label, ...rest }) => (
  <div>
    <label className="label">{label}</label>
    <input
      className={`input ${errors[k] ? "!border-rose-500" : ""}`}
      value={f[k]}
      onChange={on(k)}
      {...rest}
    />
    {errors[k] && <p className="mt-1 text-xs text-rose-500">{errors[k]}</p>}
  </div>
);

export default function Checkout() {
  const nav = useNavigate();
  const cfg = useConfig();
  const user = useAuth((s) => s.user);
  const { items, coupon, setCoupon, clear } = useCart();
  const [f, setF] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });
  const [method, setMethod] = useState("cod");
  const [code, setCode] = useState("");
  const [cBusy, setCBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [offers, setOffers] = useState([]);
  const [pin, setPin] = useState(null);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = coupon?.discount || 0;
  const after = subtotal - discount;
  const shipping = after >= cfg.freeShippingMin ? 0 : cfg.shippingFee;
  const codFee = method === "cod" ? cfg.codFee : 0;
  const total = after + shipping + codFee;
  const codBlocked =
    after + shipping + cfg.codFee > cfg.codMax ||
    cfg.codEnabled === false ||
    pin?.cod === false;

  useEffect(() => {
    if (!cfg.onlinePayment) setMethod("cod");
  }, [cfg.onlinePayment]);
  useEffect(() => {
    if (codBlocked && cfg.onlinePayment) setMethod("razorpay");
  }, [codBlocked, cfg.onlinePayment]);
  useEffect(() => {
    shopAPI
      .coupons()
      .then((r) => setOffers(r.data.coupons))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (coupon)
      shopAPI
        .validateCoupon(coupon.code, subtotal)
        .then((r) =>
          setCoupon({ code: r.data.code, discount: r.data.discount }),
        )
        .catch(() => setCoupon(null));
  }, [subtotal]); // eslint-disable-line

  useEffect(() => {
    if (!/^\d{6}$/.test(f.pincode)) return setPin(null);
    shopAPI
      .pincode(f.pincode)
      .then((r) => setPin(r.data))
      .catch(() => {});
  }, [f.pincode]);
  // pincode → city/state autofill
  useEffect(() => {
    if (!/^\d{6}$/.test(f.pincode)) return;
    const ctrl = new AbortController();
    fetch(`https://api.postalpincode.in/pincode/${f.pincode}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        const po = d?.[0]?.PostOffice?.[0];
        if (po)
          setF((x) => ({
            ...x,
            city: x.city || po.District,
            state: x.state || (STATES.includes(po.State) ? po.State : "Other"),
          }));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [f.pincode]);

  const on = (k) => (e) => {
    setF({
      ...f,
      [k]:
        k === "phone" || k === "pincode"
          ? e.target.value.replace(/\D/g, "").slice(0, k === "phone" ? 10 : 6)
          : e.target.value,
    });
    setErrors({ ...errors, [k]: null });
  };

  const applyCoupon = async (c) => {
    setCBusy(true);
    try {
      const r = await shopAPI.validateCoupon((c || code).trim(), subtotal);
      setCoupon({ code: r.data.code, discount: r.data.discount });
      setCode("");
      toast.success(`${r.data.code} applied`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setCBusy(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Required";
    if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = "10-digit mobile number";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Invalid email";
    if (!f.line1.trim()) e.line1 = "Required";
    if (!f.city.trim()) e.city = "Required";
    if (!f.state) e.state = "Required";
    if (!/^\d{6}$/.test(f.pincode)) e.pincode = "6-digit pincode";
    else if (pin && !pin.serviceable) e.pincode = pin.reason;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const finish = (order) => {
    clear();
    nav(`/order-success/${order.orderNumber}`, {
      state: { order, phone: f.phone },
    });
  };

  const place = async (e) => {
    e.preventDefault();
    if (!validate()) return toast.error("Please fix the highlighted fields");
    setBusy(true);
    try {
      const { data } = await orderAPI.place({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          qty: i.qty,
        })),
        customer: {
          name: f.name.trim(),
          phone: f.phone,
          email: f.email.trim(),
        },
        address: {
          line1: f.line1,
          line2: f.line2,
          landmark: f.landmark,
          city: f.city,
          state: f.state,
          pincode: f.pincode,
        },
        paymentMethod: method,
        couponCode: coupon?.code,
        notes: f.notes,
      });
      if (method === "cod") return finish(data.order);
      await loadRazorpay();
      const rz = new window.Razorpay({
        key: data.razorpay.keyId,
        amount: data.razorpay.amount,
        currency: "INR",
        name: "Shyfly",
        description: `Order ${data.order.orderNumber}`,
        order_id: data.razorpay.orderId,
        image: "/icon-192.png",
        theme: { color: "#6b1544" },
        prefill: { name: f.name, email: f.email, contact: f.phone },
        handler: async (resp) => {
          try {
            const v = await orderAPI.verify(resp);
            finish(v.data.order);
          } catch (err) {
            toast.error(
              "Payment received but verification is pending. Check Track Order shortly.",
            );
            clear();
            nav("/track");
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            toast(
              "Payment not completed. Your items are held for 30 minutes.",
              { icon: "⏳", duration: 5000 },
            );
          },
        },
      });
      rz.on("payment.failed", (r) =>
        toast.error(r.error?.description || "Payment failed, please try again"),
      );
      rz.open();
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  if (!items.length)
    return (
      <div className="container-x py-28 text-center">
        <p className="font-display text-5xl font-semibold text-plum-800">
          Nothing to checkout
        </p>
        <Link to="/shop" className="btn-plum mt-8">
          Shop now
        </Link>
      </div>
    );

  const ctx = { f, errors, on };

  return (
    <form
      id="checkout-form"
      onSubmit={place}
      className="container-x pb-32 pt-10 lg:pb-10"
    >
      <SEO title="Checkout" noindex />
      <h1 className="h-section">Checkout</h1>
      {!user && (
        <p className="mt-2 text-sm text-plum-700/70">
          Checking out as guest.{" "}
          <Link
            to="/login"
            state={{ from: "/checkout" }}
            className="text-rose-500 underline"
          >
            Log in
          </Link>{" "}
          to track orders from your account.
        </p>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-plum-100 p-6">
            <h2 className="font-display text-3xl font-semibold text-plum-800">
              1 · Contact
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field {...ctx} k="name" label="Full name" autoComplete="name" />
              <Field
                {...ctx}
                k="phone"
                label="Mobile number"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit number"
              />
              <div className="sm:col-span-2">
                <Field
                  {...ctx}
                  k="email"
                  label="Email (for order updates)"
                  type="email"
                  autoComplete="email"
                />
              </div>
            </div>
          </section>
          <section className="rounded-3xl border border-plum-100 p-6">
            <h2 className="font-display text-3xl font-semibold text-plum-800">
              2 · Delivery address
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                {...ctx}
                k="pincode"
                label="Pincode"
                inputMode="numeric"
                autoComplete="postal-code"
              />
              <div className="self-end pb-3 text-sm">
                {pin?.serviceable && (
                  <span className="flex items-center gap-2 text-green-700">
                    <FiTruck /> Delivery by{" "}
                    <b>
                      {new Date(pin.from).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      –{" "}
                      {new Date(pin.to).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </b>
                  </span>
                )}
                {pin && !pin.serviceable && (
                  <span className="text-rose-600">{pin.reason}</span>
                )}
              </div>
              <div className="sm:col-span-2">
                <Field
                  {...ctx}
                  k="line1"
                  label="House no., street, area"
                  autoComplete="address-line1"
                />
              </div>
              <Field {...ctx} k="line2" label="Apartment, floor (optional)" />
              <Field {...ctx} k="landmark" label="Landmark (optional)" />
              <Field
                {...ctx}
                k="city"
                label="City / District"
                autoComplete="address-level2"
              />
              <div>
                <label className="label">State</label>
                <select
                  className={`input ${errors.state ? "!border-rose-500" : ""}`}
                  value={f.state}
                  onChange={on("state")}
                >
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-xs text-rose-500">{errors.state}</p>
                )}
              </div>
            </div>
          </section>
          <section className="rounded-3xl border border-plum-100 p-6">
            <h2 className="font-display text-3xl font-semibold text-plum-800">
              3 · Payment
            </h2>
            <div className="mt-5 space-y-3">
              {[
                [
                  "razorpay",
                  "Pay online",
                  "UPI, cards, net banking, wallets",
                  !cfg.onlinePayment,
                ],
                [
                  "cod",
                  "Cash on Delivery",
                  cfg.codFee
                    ? `+ ${inr(cfg.codFee)} handling fee`
                    : "Pay when it arrives",
                  codBlocked,
                ],
              ].map(([id, t, s, disabled]) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition ${method === id ? "border-plum-700 bg-blush" : "border-plum-100"} ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-plum-300"}`}
                >
                  <input
                    type="radio"
                    name="pay"
                    className="accent-plum-700"
                    checked={method === id}
                    disabled={disabled}
                    onChange={() => setMethod(id)}
                  />
                  <div>
                    <p className="font-medium">{t}</p>
                    <p className="text-sm text-plum-700/60">
                      {id === "razorpay" && !cfg.onlinePayment
                        ? "Currently unavailable"
                        : id === "cod" && codBlocked
                          ? cfg.codEnabled === false || pin?.cod === false
                            ? "Not available right now"
                            : `Available up to ${inr(cfg.codMax)}`
                          : s}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="label">Order note (optional)</label>
              <textarea
                rows={2}
                className="input"
                value={f.notes}
                onChange={on("notes")}
                maxLength={300}
                placeholder="Gift message, delivery instructions…"
              />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-3xl bg-blush p-6 lg:sticky lg:top-32">
          <h2 className="font-display text-3xl font-semibold text-plum-800">
            Order summary
          </h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <div key={i.key} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                  <ProductImage
                    product={{
                      name: i.name,
                      images: i.image ? [{ url: i.image }] : [],
                      category: i.category,
                    }}
                    w={120}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute -right-0 -top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-plum-700 text-[10px] text-white">
                    {i.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-1 font-medium">{i.name}</p>
                  <p className="text-xs text-plum-700/60">
                    {[i.color, i.size].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-sm font-medium">{inr(i.price * i.qty)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-green-500 bg-green-50 px-4 py-3 text-sm text-green-800">
                <span className="flex items-center gap-2">
                  <FiCheck /> <b>{coupon.code}</b> applied
                </span>
                <button
                  type="button"
                  onClick={() => setCoupon(null)}
                  aria-label="Remove coupon"
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-plum-300" />
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="input !rounded-full !pl-11 !py-2.5"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!code || cBusy}
                    onClick={() => applyCoupon()}
                    className="btn-outline !px-5 !py-2.5"
                  >
                    Apply
                  </button>
                </div>
                {offers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {offers.map((o) => (
                      <button
                        type="button"
                        key={o.code}
                        onClick={() => applyCoupon(o.code)}
                        title={o.description}
                        className="rounded-full border border-dashed border-rose-400 bg-white px-3 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"
                      >
                        {o.code}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <dl className="mt-5 space-y-2.5 text-[15px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{inr(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>Coupon discount</dt>
                <dd>− {inr(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{shipping ? inr(shipping) : "Free"}</dd>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between">
                <dt>COD fee</dt>
                <dd>{inr(codFee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-plum-200 pt-3 text-xl font-semibold text-plum-800">
              <dt>Total</dt>
              <dd>{inr(total)}</dd>
            </div>
          </dl>
          <button disabled={busy} className="btn-plum btn-sheen mt-5 w-full">
            <FiLock size={15} />{" "}
            {busy
              ? "Please wait…"
              : method === "cod"
                ? `Place order · ${inr(total)}`
                : `Pay ${inr(total)}`}
          </button>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] leading-tight text-plum-800">
            <div className="rounded-xl bg-white p-2.5">
              <FiShield className="mx-auto mb-1 text-green-600" size={18} />
              100% secure payments
            </div>
            <div className="rounded-xl bg-white p-2.5">
              <FiRefreshCw className="mx-auto mb-1 text-rose-500" size={18} />
              {cfg.returnWindowDays > 0
                ? `${cfg.returnWindowDays}-day easy returns`
                : "Quality checked"}
            </div>
            <div className="rounded-xl bg-white p-2.5">
              <FiTruck className="mx-auto mb-1 text-plum-700" size={18} />
              Tracked delivery
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-plum-700/60">
            Online payments are processed by Razorpay (PCI-DSS compliant). We
            never see or store your card details.
          </p>
        </aside>
      </div>
      <div className="safe-b fixed inset-x-0 bottom-0 z-30 border-t border-plum-100 bg-white/95 p-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-plum-700/60">Total</p>
            <p className="text-xl font-semibold leading-tight text-plum-800">
              {inr(total)}
            </p>
          </div>
          <button
            form="checkout-form"
            disabled={busy}
            className="btn-plum btn-sheen flex-1"
          >
            <FiLock size={15} />{" "}
            {busy
              ? "Please wait…"
              : method === "cod"
                ? "Place order"
                : "Pay now"}
          </button>
        </div>
      </div>
    </form>
  );
}
