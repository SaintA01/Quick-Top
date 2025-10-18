import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  serviceType: {
    type: String,
    enum: ['airtime', 'data', 'cable', 'electricity', 'wallet_funding', 'transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'successful', 'failed'],
    default: 'pending'
  },
  reference: {
    type: String,
    unique: true
  },
  recipient: {
    type: String // phone number, meter number, etc.
  },
  provider: {
    type: String // MTN, DSTV, EKEDC, etc.
  },
  plan: {
    type: String // Plan details
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Additional data
  }
}, {
  timestamps: true
});

// Generate reference before saving
transactionSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = 'TXN' + Date.now().toString() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

export default mongoose.model('Transaction', transactionSchema);
