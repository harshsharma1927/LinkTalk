/**
 * Input validation for auth routes using express-validator
 */

const { body, validationResult } = require('express-validator');

const signupRules = () => [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = () => [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Middleware: run validation and pass errors to next() for centralized handler
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const err = new Error(errors.array().map((e) => e.msg).join('. '));
  err.statusCode = 400;
  err.errors = Object.fromEntries(errors.array().map((e) => [e.path, e.msg]));
  err.array = () => errors.array();
  next(err);
};

module.exports = { signupRules, loginRules, validate };
