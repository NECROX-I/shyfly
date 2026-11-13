const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
module.exports = async () => {
  if (!process.env.MONGO_URI) { console.error('MONGO_URI missing in backend/.env'); process.exit(1); }
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  return mongoose;
};
