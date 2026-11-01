import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
const col = mongoose.connection.db.collection('products');

let t = Date.now();
const docs = await col.find({}, { projection: { image: 1 } }).toArray();
const bytes = docs.reduce((s, d) => s + (typeof d.image === 'string' ? d.image.length : 0), 0);
console.log('raw driver image read:', docs.length, 'docs,', (bytes/1024/1024).toFixed(2), 'MB in', Date.now() - t, 'ms');

t = Date.now();
const again = await col.find({}, { projection: { image: 1 } }).toArray();
console.log('second read (warm):', (Date.now() - t), 'ms');
process.exit(0);
