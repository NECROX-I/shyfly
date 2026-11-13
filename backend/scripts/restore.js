// Restore from a backup made by `npm run backup`.  Usage: npm run restore -- backups/<file>.json   (add --wipe to clear collections first)
const fs = require('fs');
const connect = require('./_db');
(async () => {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) { console.error('Usage: npm run restore -- <backup-file.json> [--wipe]'); process.exit(1); }
  const mongoose = await connect();
  const { EJSON } = mongoose.mongo.BSON;
  const data = EJSON.parse(fs.readFileSync(file, 'utf8'));
  const wipe = process.argv.includes('--wipe');
  for (const [name, docs] of Object.entries(data)) {
    if (name === 'meta' || !Array.isArray(docs)) continue;
    const col = mongoose.connection.db.collection(name);
    if (wipe) await col.deleteMany({});
    if (docs.length) await col.bulkWrite(docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } })));
    console.log(`  ${name}: ${docs.length} restored`);
  }
  console.log('✅ Restore complete');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
