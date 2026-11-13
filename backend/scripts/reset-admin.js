// Emergency: create an admin or reset an admin password.  Usage: npm run admin:reset -- you@example.com "NewStrongPassword"
const connect = require('./_db');
(async () => {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8) { console.error('Usage: npm run admin:reset -- <email> "<password, min 8 chars>"'); process.exit(1); }
  await connect();
  const User = require('../models/User');
  let u = await User.findOne({ email: email.toLowerCase() });
  if (!u) u = new User({ name: 'Shyfly Admin', email });
  u.password = password; u.role = 'admin'; u.isActive = true;
  await u.save();
  console.log(`✅ ${email} is now an active admin with the new password.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
