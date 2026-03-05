/**
 * Centralized error handler middleware
 * Maps known errors to proper HTTP status codes and consistent JSON response
 */

const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// Development: send full stack; production: generic message
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    ...(err.errors && { errors: err.errors }),
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }
  console.error('ERROR:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

/**
 * Normalize errors into AppError-like shape with statusCode
 */
const normalizeError = (err) => {
  // Already our AppError
  if (err instanceof AppError) return err;

  // Mongoose validation error (e.g. required, minlength)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join('. ');
    const errors = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
    const appErr = new AppError(message || 'Validation failed', 400);
    appErr.errors = errors;
    return appErr;
  }

  // Mongoose duplicate key (unique index e.g. email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return new AppError(
      `Duplicate value for ${field}. Please use another.`,
      409
    );
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // JWT errors (can be thrown from auth middleware via next(err))
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401);
  }

  // Express-validator or our validate middleware: error with .array()
  if (err.array && typeof err.array === 'function') {
    const arr = err.array();
    const messages = arr.map((e) => e.msg);
    const appErr = new AppError(messages.join('. '), 400);
    appErr.errors = Object.fromEntries(arr.map((e) => [e.path || e.param, e.msg]));
    return appErr;
  }

  // Generic: treat as 500 (programming/unknown error)
  return new AppError(err.message || 'Internal server error', 500);
};

/**
 * Global error handler - must be registered last (after all routes)
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  const normalized = normalizeError(err);
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    sendErrorDev(normalized, res);
  } else {
    sendErrorProd(normalized, res);
  }
};

module.exports = { errorHandler, AppError };
