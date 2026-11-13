// Full backup (includes password hashes — keep the file PRIVATE).  Usage: npm run backup
const fs = require('fs');
const path = require('path');
const connect = require('./_db');
(async () => {
  const mongoose = await connect();
  const { EJSON } = mongoose.mongo.BSON;
  const names = ['settings', 'categories', 'products', 'orders', 'returnrequests', 'coupons', 'reviews', 'contactmessages', 'users'];
  const out = { meta: { app: 'shyfly', exportedAt: new Date().toISOString() } };
  for (const n of names) out[n] = await mongoose.connection.db.collection(n).find({}).toArray();
  const dir = path.join(__dirname, '..', 'backups'); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `shyfly-full-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, EJSON.stringify(out, { relaxed: false }));
  console.log('✅ Backup written:', file, '\n', names.map((n) => `${n}: ${out[n].length}`).join(' · '));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
