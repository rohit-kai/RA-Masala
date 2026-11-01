import 'dotenv/config';
import mongoose from 'mongoose';
import { compressBase64Image, makeThumb } from './imageUtils.js';

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

// 1. Shrink any still-large images + ensure every product has a thumb
const col = db.collection('products');
const docs = await col.find({}, { projection: { name: 1, image: 1, thumb: 1 } }).toArray();

let updated = 0;
for (const d of docs) {
  const set = {};
  if (typeof d.image === 'string' && d.image.startsWith('data:') && d.image.length > 150 * 1024) {
    const smaller = await compressBase64Image(d.image);
    if (smaller) set.image = smaller;
  }
  const effectiveImage = set.image || d.image;
  const wantThumb = await makeThumb(effectiveImage);
  if (wantThumb !== (d.thumb || '')) set.thumb = wantThumb;
  if (Object.keys(set).length) {
    await col.updateOne({ _id: d._id }, { $set: set });
    updated++;
  }
}
console.log(`products: updated ${updated} of ${docs.length}`);

// 2. Report sizes of all collections + scan for stray base64 bloat
const collections = await db.listCollections().toArray();
console.log('\ncollection sizes:');
let grandTotal = 0;
for (const c of collections) {
  try {
    const s = await db.command({ collStats: c.name });
    grandTotal += s.size;
    console.log(`  ${c.name.padEnd(20)} ${((s.size || 0) / 1024 / 1024).toFixed(2)} MB  (${s.count} docs)`);
  } catch (e) {
    console.log(`  ${c.name}: stats failed`);
  }
}
console.log(`  TOTAL: ${(grandTotal / 1024 / 1024).toFixed(2)} MB`);

const stats = await db.command({ collStats: 'products' });
console.log('\nproducts now:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
process.exit(0);
