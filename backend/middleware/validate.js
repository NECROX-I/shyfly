const { validationResult } = require('express-validator');
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const list = errors.array();
  res.status(400).json({ success: false, message: list[0].msg, errors: list.map((e) => ({ field: e.path, message: e.msg })) });
};
