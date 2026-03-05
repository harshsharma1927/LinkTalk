/**
 * Input validation for message routes using express-validator
 */

const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

const sendMessageRules = () => [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required')
    .custom(isValidObjectId)
    .withMessage('Invalid receiver ID'),
  body('message')
    .notEmpty()
    .withMessage('Message content is required')
    .isString()
    .withMessage('Message must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
];

const userIdParamRules = () => [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID'),
];

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const err = new Error(errors.array().map((e) => e.msg).join('. '));
  err.statusCode = 400;
  err.errors = Object.fromEntries(errors.array().map((e) => [e.path, e.msg]));
  err.array = () => errors.array();
  next(err);
};

module.exports = { sendMessageRules, userIdParamRules, validate };
