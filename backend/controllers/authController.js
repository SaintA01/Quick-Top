import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const sendResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
    ...data
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, phone, password, passwordConfirm } = req.body;
    if (!name || !email || !password || !passwordConfirm) {
      return sendResponse(res, 400, { message: 'Missing required fields' });
    }
    if (password !== passwordConfirm) {
      return sendResponse(res, 400, { message: 'Passwords do not match' });
    }
    const existing = await User.findOne({ email });
    if (existing) return sendResponse(res, 409, { message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, password: hashed });
    const token = signToken(user._id);

    sendResponse(res, 201, { data: { user: { id: user._id, name: user.name, email: user.email }, token } });
  } catch (error) {
    console.error('Signup error:', error);
    sendResponse(res, 500, { message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendResponse(res, 400, { message: 'Provide email and password' });

    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, 401, { message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return sendResponse(res, 401, { message: 'Invalid credentials' });

    const token = signToken(user._id);
    sendResponse(res, 200, { data: { user: { id: user._id, name: user.name, email: user.email }, token } });
  } catch (error) {
    console.error('Login error:', error);
    sendResponse(res, 500, { message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    sendResponse(res, 200, { data: { user } });
  } catch (error) {
    console.error('GetMe error:', error);
    sendResponse(res, 500, { message: 'Server error' });
  }
};
