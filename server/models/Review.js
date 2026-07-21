import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Review', ReviewSchema);
