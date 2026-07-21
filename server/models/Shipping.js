import mongoose from 'mongoose';

const ShippingSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  carrier: { type: String, default: 'RA Logistics' },
  trackingNumber: { type: String, default: '' },
  status: { type: String, enum: ['Order Placed', 'In Transit', 'Out for Delivery', 'Delivered'], default: 'Order Placed' }
}, { timestamps: true });

export default mongoose.model('Shipping', ShippingSchema);
