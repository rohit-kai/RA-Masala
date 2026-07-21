import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  id: { type: String, required: true }, // FE reference
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String }
});

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // custom order ID e.g. ORD-XXXXX
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  shipping: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Cancelled'], default: 'Pending' },
  paymentMethod: { type: String, required: true },
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true }
  }
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
