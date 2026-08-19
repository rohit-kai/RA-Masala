// Generates the SHA-256 hashes the server expects for ADMIN_EMAIL_HASH and
// ADMIN_PASSWORD_HASH (see "Default Admin" check in server/server.js).
//
// Usage:
//   node scripts/generate-admin-hashes.js "admin@ramasala.com" "YourPassword123"
import crypto from 'crypto';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.log(
    'Usage: node scripts/generate-admin-hashes.js "<admin email>" "<admin password>"'
  );
  process.exit(1);
}

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

console.log(`ADMIN_EMAIL_HASH=${hash(email)}`);
console.log(`ADMIN_PASSWORD_HASH=${hash(password)}`);