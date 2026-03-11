/**
 * Message routes
 * All routes protected; validation on body/params. Order: /users/list before /:userId
 */

const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markConversationRead,
   getConversationUsers,
   searchUsers,
  getUsers,
  getOnlineUsers,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const {
  sendMessageRules,
  userIdParamRules,
  validate,
} = require('../validators/messageValidators');

router.use(protect);

router.post('/', sendMessageRules(), validate, asyncHandler(sendMessage));
router.get('/conversations', asyncHandler(getConversationUsers));
router.get('/users/list', asyncHandler(getUsers));
router.get('/users/search', asyncHandler(searchUsers));
router.get('/users/online', asyncHandler(getOnlineUsers));
router.post('/:userId/read', userIdParamRules(), validate, asyncHandler(markConversationRead));
router.get('/:userId', userIdParamRules(), validate, asyncHandler(getMessages));

module.exports = router;
