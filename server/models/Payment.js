import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true }, // e.g. COD, UPI, Card
  status: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  transactionId: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Payment', PaymentSchema);
