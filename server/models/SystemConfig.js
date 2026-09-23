import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'payment_settings', 'email_settings'
  value: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('SystemConfig', SystemConfigSchema);
