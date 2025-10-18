import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';

// Utility function to send response
const sendResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
    ...data
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, phone, password, passwordConfirm } = req.body;

    // 1) Check if passwords match
    if (password !== passwordConfirm) {
      return sendResponse(res, 400, {
        message: 'Passwords do not match'
      });
    }

    // 2) Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return sendResponse(res, 400, {
        message: 'User with this email or phone already exists'
      });
    }

    // 3) Create new user
    const newUser = await User.create({
      name,
      email,
      phone,
      password
    });

    // 4) Generate token
    const token = signToken(newUser._id);

    // 5) Update last login
    await newUser.updateLastLogin();

    // 6) Send response
    sendResponse(res, 201, {
      message: 'Account created successfully!',
      token,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          walletBalance: newUser.walletBalance,
          accountNumber: newUser.accountNumber,
          bankName: newUser.bankName
        }
      }
    });

  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return sendResponse(res, 400, {
        message: 'Please provide email and password'
      });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return sendResponse(res, 401, {
        message: 'Incorrect email or password'
      });
    }

    // 3) If everything ok, send token to client
    const token = signToken(user._id);

    // 4) Update last login
    await user.updateLastLogin();

    sendResponse(res, 200, {
      message: 'Login successful!',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          walletBalance: user.walletBalance,
          accountNumber: user.accountNumber,
          bankName: user.bankName
        }
      }
    });

  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    sendResponse(res, 200, {
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          walletBalance: user.walletBalance,
          accountNumber: user.accountNumber,
          bankName: user.bankName,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    sendResponse(res, 400, {
      message: error.message
    });
  }
};
