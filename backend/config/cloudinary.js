const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('stream');

const isConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (isConfigured) {
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => (file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed'))),
});

const uploadBuffer = (buffer, folder = 'shyfly') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 1400, height: 1400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }))
    );
    Readable.from(buffer).pipe(stream);
  });

const destroy = async (publicId) => {
  if (!isConfigured || !publicId) return;
  try { await cloudinary.uploader.destroy(publicId); } catch (e) { console.error('Cloudinary delete:', e.message); }
};

module.exports = { upload, uploadBuffer, destroy, isConfigured };
