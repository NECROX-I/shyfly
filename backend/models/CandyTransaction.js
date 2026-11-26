const mongoose = require("mongoose");

// One row per candy movement (earned, spent, refunded). User.candies is the live balance; this is the history.
const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true }, // + earned, − spent
    balanceAfter: Number,
    type: {
      type: String,
      enum: [
        "signup",
        "referral_bonus", // new user joined with a friend's code
        "referral_reward", // you referred someone
        "redeem",
        "refund",
        "admin",
      ],
      required: true,
    },
    note: { type: String, default: "" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    orderNumber: String,
  },
  { timestamps: true },
);

schema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model("CandyTransaction", schema);
