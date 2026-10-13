import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  brand: { type: String, default: 'masale' },
  subCategory: { type: String, default: '' }
}, { timestamps: true });

// GET /api/products sorts by newest first on every request
ProductSchema.index({ createdAt: -1 });

export default mongoose.model('Product', ProductSchema);
