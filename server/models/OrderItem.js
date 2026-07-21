import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String }
}, { timestamps: true });

export default mongoose.model('OrderItem', OrderItemSchema);
