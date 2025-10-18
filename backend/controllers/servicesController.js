import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

const sendResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
    ...data
  });
};

// Mock service function (replace with actual VTU API)
const processServicePurchase = async (serviceData) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate successful purchase 95% of the time
  const isSuccess = Math.random() > 0.05;
  
  if (isSuccess) {
    return {
      success: true,
      message: 'Service purchased successfully',
      reference: `SRV${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase()
    };
  } else {
    throw new Error('Service temporarily unavailable. Please try again.');
  }
};

export const buyAirtime = async (req, res) => {
  try {
    const { network, phone, amount } = req.body;

    // Validate input
    if (!network || !phone || !amount) {
      return sendResponse(res, 400, {
        message: 'Please provide network, phone number, and amount'
      });
    }

    if (amount < 50) {
      return sendResponse(res, 400, {
        message: 'Minimum airtime purchase is ₦50'
      });
    }

    const user = await User.findById(req.user.id);

    // Check balance
    if (!user.hasSufficientBalance(amount)) {
      return sendResponse(res, 400, {
        message: 'Insufficient balance. Please fund your wallet.'
      });
    }

    // Create pending transaction
    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'debit',
      serviceType: 'airtime',
      amount: amount,
      description: `Airtime purchase - ${network.toUpperCase()} ${phone}`,
      status: 'pending',
      recipient: phone,
      provider: network,
      plan: `${amount} Airtime`
    });

    try {
      // Process purchase with mock service
      const serviceResult = await processServicePurchase({
        network,
        phone,
        amount
      });

      // Deduct from wallet
      user.deductFromWallet(amount);
      await user.save();

      // Update transaction status
      transaction.status = 'successful';
      transaction.reference = serviceResult.reference;
      await transaction.save();

      sendResponse(res, 200, {
        message: `Airtime purchase successful! ₦${amount} sent to ${phone}`,
        data: {
          transaction: {
            id: transaction._id,
            amount,
            network,
            phone,
            reference: serviceResult.reference
          },
          newBalance: user.walletBalance
        }
      });

    } catch (serviceError) {
      // Update transaction as failed
      transaction.status = 'failed';
      transaction.metadata = { error: serviceError.message };
      await transaction.save();

      sendResponse(res, 400, {
        message: serviceError.message
      });
    }

  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};

export const buyData = async (req, res) => {
  try {
    const { network, phone, plan, amount } = req.body;

    if (!network || !phone || !plan || !amount) {
      return sendResponse(res, 400, {
        message: 'Please provide all required fields'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user.hasSufficientBalance(amount)) {
      return sendResponse(res, 400, {
        message: 'Insufficient balance. Please fund your wallet.'
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'debit',
      serviceType: 'data',
      amount: amount,
      description: `Data purchase - ${network.toUpperCase()} ${plan}`,
      status: 'pending',
      recipient: phone,
      provider: network,
      plan: plan
    });

    try {
      const serviceResult = await processServicePurchase({
        network,
        phone,
        plan,
        amount
      });

      user.deductFromWallet(amount);
      await user.save();

      transaction.status = 'successful';
      transaction.reference = serviceResult.reference;
      await transaction.save();

      sendResponse(res, 200, {
        message: `Data purchase successful! ${plan} sent to ${phone}`,
        data: {
          transaction: {
            id: transaction._id,
            amount,
            network,
            phone,
            plan,
            reference: serviceResult.reference
          },
          newBalance: user.walletBalance
        }
      });

    } catch (serviceError) {
      transaction.status = 'failed';
      transaction.metadata = { error: serviceError.message };
      await transaction.save();

      sendResponse(res, 400, {
        message: serviceError.message
      });
    }

  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};

// Similar functions for cable and electricity...
export const buyCable = async (req, res) => {
  try {
    const { provider, smartcard, package: pkg, amount } = req.body;

    if (!provider || !smartcard || !pkg || !amount) {
      return sendResponse(res, 400, {
        message: 'Please provide all required fields'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user.hasSufficientBalance(amount)) {
      return sendResponse(res, 400, {
        message: 'Insufficient balance. Please fund your wallet.'
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'debit',
      serviceType: 'cable',
      amount: amount,
      description: `Cable subscription - ${provider.toUpperCase()} ${pkg.name}`,
      status: 'pending',
      recipient: smartcard,
      provider: provider,
      plan: pkg.name
    });

    try {
      const serviceResult = await processServicePurchase({
        provider,
        smartcard,
        package: pkg,
        amount
      });

      user.deductFromWallet(amount);
      await user.save();

      transaction.status = 'successful';
      transaction.reference = serviceResult.reference;
      await transaction.save();

      sendResponse(res, 200, {
        message: `Cable subscription successful! ${pkg.name} activated for ${smartcard}`,
        data: {
          transaction: {
            id: transaction._id,
            amount,
            provider,
            smartcard,
            package: pkg.name,
            reference: serviceResult.reference
          },
          newBalance: user.walletBalance
        }
      });

    } catch (serviceError) {
      transaction.status = 'failed';
      transaction.metadata = { error: serviceError.message };
      await transaction.save();

      sendResponse(res, 400, {
        message: serviceError.message
      });
    }

  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};

export const buyElectricity = async (req, res) => {
  try {
    const { disco, meterNumber, meterType, amount } = req.body;

    if (!disco || !meterNumber || !meterType || !amount) {
      return sendResponse(res, 400, {
        message: 'Please provide all required fields'
      });
    }

    if (amount < 1000) {
      return sendResponse(res, 400, {
        message: 'Minimum electricity purchase is ₦1000'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user.hasSufficientBalance(amount)) {
      return sendResponse(res, 400, {
        message: 'Insufficient balance. Please fund your wallet.'
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'debit',
      serviceType: 'electricity',
      amount: amount,
      description: `Electricity token - ${disco.toUpperCase()} ${meterNumber}`,
      status: 'pending',
      recipient: meterNumber,
      provider: disco,
      plan: `${meterType} meter`
    });

    try {
      const serviceResult = await processServicePurchase({
        disco,
        meterNumber,
        meterType,
        amount
      });

      user.deductFromWallet(amount);
      await user.save();

      transaction.status = 'successful';
      transaction.reference = serviceResult.reference;
      await transaction.save();

      sendResponse(res, 200, {
        message: `Electricity token purchase successful! ₦${amount} token generated for ${meterNumber}`,
        data: {
          transaction: {
            id: transaction._id,
            amount,
            disco,
            meterNumber,
            meterType,
            reference: serviceResult.reference
          },
          newBalance: user.walletBalance
        }
      });

    } catch (serviceError) {
      transaction.status = 'failed';
      transaction.metadata = { error: serviceError.message };
      await transaction.save();

      sendResponse(res, 400, {
        message: serviceError.message
      });
    }

  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};
