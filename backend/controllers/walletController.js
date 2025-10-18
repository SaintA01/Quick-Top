import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

const sendResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
    ...data
  });
};

export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    sendResponse(res, 200, {
      data: {
        balance: user.walletBalance,
        accountNumber: user.accountNumber,
        bankName: user.bankName
      }
    });
  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    sendResponse(res, 200, {
      data: {
        transactions
      }
    });
  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};

export const fundWallet = async (req, res) => {
  try {
    const { amount, reference } = req.body;
    
    if (!amount || amount <= 0) {
      return sendResponse(res, 400, {
        message: 'Please provide a valid amount'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Add to wallet
    const newBalance = user.addToWallet(amount);
    await user.save();

    // Create transaction record
    await Transaction.create({
      user: req.user.id,
      type: 'credit',
      serviceType: 'wallet_funding',
      amount: amount,
      description: `Wallet funding - ₦${amount}`,
      status: 'successful',
      reference: reference || `FUND${Date.now()}`,
      metadata: { fundingMethod: 'online' }
    });

    sendResponse(res, 200, {
      message: 'Wallet funded successfully',
      data: {
        newBalance,
        transaction: {
          amount,
          type: 'credit',
          description: 'Wallet Funding'
        }
      }
    });

  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};
