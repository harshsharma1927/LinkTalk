/**
 * JWT authentication middleware
 * Verifies Bearer token and attaches user to req.user; passes errors to centralized handler
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Verify JWT and attach user to req.user.
 * On failure, calls next(err) with AppError for consistent status codes (401).
 */
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new AppError('User not found', 401));
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(err);
  }
};

module.exports = { protect };
