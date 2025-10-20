import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide your name'], trim: true },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      message: 'Please provide a valid email'
    }
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number'],
    validate: {
      validator: phone => /^(080|081|070|090|091)\d{8}$/.test(phone),
      message: 'Please provide a valid Nigerian phone number'
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  walletBalance: { type: Number, default: 0 },
  accountNumber: { type: String, unique: true },
  bankName: { type: String, default: 'QuickTop Microfinance Bank' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

// ✅ Generate unique account number
userSchema.pre('save', function (next) {
  if (!this.accountNumber) {
    this.accountNumber = 'QT' + Date.now().toString().slice(-8);
  }
  next();
});

// ✅ Hash password before saving using crypto
userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(this.password, salt, 1000, 64, 'sha512')
    .toString('hex');

  this.password = `${salt}:${hash}`;
  next();
});

// ✅ Compare entered password with stored hash
userSchema.methods.correctPassword = function (candidatePassword, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) return false;

  const [salt, originalHash] = storedPassword.split(':');
  const hash = crypto
    .pbkdf2Sync(candidatePassword, salt, 1000, 64, 'sha512')
    .toString('hex');

  return hash === originalHash;
};

// ✅ Wallet helper methods
userSchema.methods.hasSufficientBalance = function (amount) {
  return this.walletBalance >= amount;
};

userSchema.methods.deductFromWallet = function (amount) {
  if (this.hasSufficientBalance(amount)) {
    this.walletBalance -= amount;
    return true;
  }
  return false;
};

userSchema.methods.addToWallet = function (amount) {
  this.walletBalance += amount;
  return this.walletBalance;
};

export default mongoose.model('User', userSchema);
