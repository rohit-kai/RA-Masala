import mongoose from 'mongoose';

const InventoryLogSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  changeType: { type: String, enum: ['sale', 'restock', 'correction'], required: true },
  quantityChanged: { type: Number, required: true },
  newStock: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('InventoryLog', InventoryLogSchema);
