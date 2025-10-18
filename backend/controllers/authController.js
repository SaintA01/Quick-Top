import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

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
    if (!email || !password) {
      return sendResponse(res, 400, { message: 'Please provide email and password' });
    }
    if (password !== passwordConfirm) {
      return sendResponse(res, 400, { message: 'Passwords do not match' });
    }

    const existing = await User.findOne({ email });
    if (existing) return sendResponse(res, 400, { message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, password: hashed });

    const token = signToken(user._id);
    sendResponse(res, 201, { data: { token, user: { id: user._id, name: user.name, email: user.email } } });
  } catch (error) {
    sendResponse(res, 500, { message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendResponse(res, 400, { message: 'Please provide email and password' });

    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, 401, { message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return sendResponse(res, 401, { message: 'Invalid credentials' });

    const token = signToken(user._id);
    sendResponse(res, 200, { data: { token, user: { id: user._id, name: user.name, email: user.email } } });
  } catch (error) {
    sendResponse(res, 500, { message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    // protect middleware should attach req.user with id
    const userId = req.user && req.user.id;
    if (!userId) return sendResponse(res, 401, { message: 'Not authenticated' });
    const user = await User.findById(userId).select('-password');
    if (!user) return sendResponse(res, 404, { message: 'User not found' });
    sendResponse(res, 200, { data: { user } });
  } catch (error) {
    sendResponse(res, 500, { message: error.message });
  }
};
