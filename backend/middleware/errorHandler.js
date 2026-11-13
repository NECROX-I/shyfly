module.exports = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  if (err.code === 11000) { status = 400; message = `${Object.keys(err.keyValue || {})[0] || 'Value'} already exists`; }
  if (err.name === 'CastError') { status = 400; message = `Invalid ${err.path}`; }
  if (err.code === 'LIMIT_FILE_SIZE') { status = 400; message = 'Image too large (max 6MB)'; }
  if (status >= 500) console.error(`[${new Date().toISOString()}]`, err);
  res.status(status).json({ success: false, message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong' : message });
};
