import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email'
    }
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number'],
    validate: {
      validator: function(phone) {
        return /^(080|081|070|090|091)\d{8}$/.test(phone);
      },
      message: 'Please provide a valid Nigerian phone number'
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  accountNumber: {
    type: String,
    unique: true
  },
  bankName: {
    type: String,
    default: 'QuickTop Microfinance Bank'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate account number before saving
userSchema.pre('save', function(next) {
  if (!this.accountNumber) {
    this.accountNumber = 'QT' + Date.now().toString().slice(-8);
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update last login on login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Compare password method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if user has sufficient balance
userSchema.methods.hasSufficientBalance = function(amount) {
  return this.walletBalance >= amount;
};

// Deduct from wallet
userSchema.methods.deductFromWallet = function(amount) {
  if (this.hasSufficientBalance(amount)) {
    this.walletBalance -= amount;
    return true;
  }
  return false;
};

// Add to wallet
userSchema.methods.addToWallet = function(amount) {
  this.walletBalance += amount;
  return this.walletBalance;
};

export default mongoose.model('User', userSchema);
