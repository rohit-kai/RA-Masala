import 'dotenv/config';
import mongoose from 'mongoose';
import { compressBase64Image } from './imageUtils.js';

await mongoose.connect(process.env.MONGODB_URI);
const col = mongoose.connection.db.collection('products');
const docs = await col.find({ image: /^data:/ }, { projection: { name: 1, image: 1 } }).toArray();

let before = 0, after = 0;
for (const d of docs) {
  const b = d.image.length;
  before += b;
  try {
    const out = await compressBase64Image(d.image);
    const a = out ? out.length : b;
    after += a;
    if (b > 150 * 1024) {
      console.log(`${String((b/1024).toFixed(0)).padStart(5)}KB -> ${String((a/1024).toFixed(0)).padStart(4)}KB  ${d.name}`);
    }
  } catch (e) {
    console.log('FAILED on', d.name, e.message);
    after += b;
  }
}
console.log('---');
console.log('base64 images:', docs.length, '| before:', (before/1024/1024).toFixed(2), 'MB | after:', (after/1024/1024).toFixed(2), 'MB');
process.exit(0);
