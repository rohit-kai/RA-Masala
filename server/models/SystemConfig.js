import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'payment_settings'
  value: {
    merchantUpi: { type: String, default: 'ramasala@upi' },
    merchantName: { type: String, default: 'RA Masala' },
    gatewayKeyId: { type: String, default: '' },
    gatewayKeySecret: { type: String, default: '' }
  }
}, { timestamps: true });

export default mongoose.model('SystemConfig', SystemConfigSchema);
