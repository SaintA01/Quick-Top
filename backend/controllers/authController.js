import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';

// Helper to send responses
const sendResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
    ...data
  });
};

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { name, email, phone, password, passwordConfirm } = req.body;
    if (!email || !password) return sendResponse(res, 400, { message: 'Please provide email and password' });
    if (password !== passwordConfirm) return sendResponse(res, 400, { message: 'Passwords do not match' });

    const existing = await User.findOne({ email });
    if (existing) return sendResponse(res, 400, { message: 'Email already registered' });

    const user = await User.create({ name, email, phone, password });
    const token = signToken(user._id);

    sendResponse(res, 201, {
      data: { token, user: { id: user._id, name: user.name, email: user.email } }
    });
  } catch (error) {
    sendResponse(res, 500, { message: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendResponse(res, 400, { message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return sendResponse(res, 401, { message: 'Invalid email or password' });

    const isMatch = user.correctPassword(password, user.password);
    if (!isMatch) return sendResponse(res, 401, { message: 'Invalid email or password' });

    const token = signToken(user._id);
    user.password = undefined;
    sendResponse(res, 200, { data: { token, user } });
  } catch (error) {
    sendResponse(res, 500, { message: error.message });
  }
};
