import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
