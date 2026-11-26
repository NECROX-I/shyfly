const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const c = require("../controllers/authController");

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(),
    body("phone")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Enter a valid 10-digit mobile number"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("referralCode").optional({ checkFalsy: true }).isString().isLength({ max: 20 }),
  ],
  validate,
  c.register,
);

router.post(
  "/login",
  [
    body()
      .custom(
        (_, { req }) =>
          !!String(req.body.identifier || req.body.email || "").trim(),
      )
      .withMessage("Enter your email or mobile number"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  c.login,
);

router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Enter a valid email")],
  validate,
  c.forgotPassword,
);
router.post(
  "/reset-password",
  [
    body("email").isEmail(),
    body("token").notEmpty(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  c.resetPassword,
);
router.put(
  "/password",
  protect,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Enter your current password"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  validate,
  c.changePassword,
);
router.get("/me", protect, c.me);
router.get("/candies", protect, c.candies);
router.put("/me", protect, c.updateMe);
router.get("/wishlist", protect, c.getWishlist);
router.put("/wishlist", protect, c.setWishlist);

module.exports = router;
