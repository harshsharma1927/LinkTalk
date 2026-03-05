/**
 * Authentication controller
 * Signup, login (JWT), get current user. Validation done in validators; errors via asyncHandler.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/signup - Register (name, email, password). Validation by signupRules.
 */
const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User already exists with this email', 409));
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email },
      token,
    },
  });
};

/**
 * POST /api/auth/login - Login; returns JWT. Validation by loginRules.
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  const token = generateToken(user._id);
  res.status(200).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email },
      token,
    },
  });
};

/**
 * GET /api/auth/me - Current user profile. Requires protect middleware.
 */
const getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.status(200).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email },
    },
  });
};

module.exports = { signup, login, getMe, generateToken };
