/**
 * Authentication routes
 * Signup, login (public, validated); get current user (protected)
 */

const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { signupRules, loginRules, validate } = require('../validators/authValidators');

router.post('/signup', signupRules(), validate, asyncHandler(signup));
router.post('/login', loginRules(), validate, asyncHandler(login));
router.get('/me', protect, asyncHandler(getMe));

module.exports = router;
