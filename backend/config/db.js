const mongoose = require('mongoose');

module.exports = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI missing in .env');
    process.exit(1);
  }
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (e) {
    console.error('❌ MongoDB connection error:', e.message);
    process.exit(1);
  }
};
