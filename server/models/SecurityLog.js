import mongoose from 'mongoose';

const SecurityLogSchema = new mongoose.Schema({
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  targetName: { type: String, required: true },
  targetEmail: { type: String, required: true },
  action: { type: String, enum: ['activated', 'deactivated', 'system_lockout'], required: true },
  details: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('SecurityLog', SecurityLogSchema);
