import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ status: 'error', message: 'You are not logged in' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ status: 'error', message: 'User no longer exists' });

    req.user = { id: user._id, email: user.email };
    next();
  } catch (error) {
    console.error('Auth protect error:', error?.message || error);
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};

export const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '90d' });
};
