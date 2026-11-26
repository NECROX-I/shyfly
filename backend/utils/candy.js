const crypto = require("crypto");
const User = require("../models/User");
const CandyTransaction = require("../models/CandyTransaction");

// 🍬 Candy = Shyfly's reward currency. 1 candy = ₹1.
// Defaults can be overridden from the server env (Render) without touching code.
const num = (v, d) =>
  v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : d;

const RULES = {
  rate: 1, // ₹ per candy
  signupBonus: num(process.env.CANDY_SIGNUP_BONUS, 200), // joined on their own
  referralBonus: num(process.env.CANDY_REFERRAL_BONUS, 100), // each side, when joined with a code
  // max share of an order (after coupon, before shipping) that can be paid with candies. Capped at 90 so an order never becomes ₹0.
  maxRedeemPercent: Math.min(
    90,
    Math.max(0, num(process.env.CANDY_MAX_REDEEM_PERCENT, 50)),
  ),
};
exports.RULES = RULES;

// how many candies can be used on an order worth `amount` ₹ by someone holding `balance` candies
exports.redeemable = (balance, amount) =>
  Math.max(
    0,
    Math.min(
      Math.floor(Number(balance) || 0),
      Math.floor(((Number(amount) || 0) * RULES.maxRedeemPercent) / 100 / RULES.rate),
    ),
  );

// ── referral codes ─────────────────────────────────────────────
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const makeCode = () =>
  "SHY" +
  [...crypto.randomBytes(6)].map((b) => ALPHA[b % ALPHA.length]).join("");

// Every user gets a code (new users at signup, existing users the first time they log in / open the app)
exports.ensureReferralCode = async (user) => {
  if (user.referralCode) return user.referralCode;
  for (let i = 0; i < 8; i++) {
    const code = makeCode();
    try {
      const r = await User.updateOne(
        {
          _id: user._id,
          $or: [
            { referralCode: { $exists: false } },
            { referralCode: null },
            { referralCode: "" },
          ],
        },
        { $set: { referralCode: code } },
      );
      if (r.matchedCount) {
        user.referralCode = code;
        return code;
      }
      // already has one (set by another request)
      const fresh = await User.findById(user._id).select("referralCode");
      user.referralCode = fresh?.referralCode;
      return user.referralCode;
    } catch (e) {
      if (e.code !== 11000) throw e; // code collision → try another
    }
  }
  return null;
};

// ── ledger + balance ───────────────────────────────────────────
// never throws: a failed history row must not break signup / checkout
exports.log = async (userId, amount, type, note, order, balanceAfter) => {
  try {
    await CandyTransaction.create({
      user: userId,
      amount,
      type,
      note,
      balanceAfter,
      order: order?._id,
      orderNumber: order?.orderNumber,
    });
  } catch (e) {
    console.error("candy.log:", e.message);
  }
};

// add candies (amount > 0) and write the history row. Returns the new balance.
exports.credit = async (userId, amount, type, note, order) => {
  const u = await User.findByIdAndUpdate(
    userId,
    { $inc: { candies: amount } },
    { new: true },
  ).select("candies");
  if (!u) return null;
  await exports.log(userId, amount, type, note, order, u.candies);
  return u.candies;
};

// atomically spend candies — only succeeds if the balance still covers it. Returns the new balance, or null.
exports.take = async (userId, amount) => {
  const u = await User.findOneAndUpdate(
    { _id: userId, candies: { $gte: amount } },
    { $inc: { candies: -amount } },
    { new: true },
  ).select("candies");
  return u ? u.candies : null;
};

// undo a take() when the order could not be created (no history row was written yet)
exports.give = (userId, amount) =>
  User.updateOne({ _id: userId }, { $inc: { candies: amount } });
