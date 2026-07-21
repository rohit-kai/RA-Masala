import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  value: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  expiryDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Discount', DiscountSchema);
