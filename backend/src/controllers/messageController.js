/**
 * Message controller
 * Send message, get conversation, get users list. Validation in validators; errors via asyncHandler.
 */

const Message = require('../models/Message');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { getOnlineUserIds } = require('../utils/socketUserMap');

/**
 * POST /api/messages - Send message. Validated (receiverId, message). Saved to DB + Socket.io emit.
 */
const sendMessage = async (req, res, next) => {
  const { receiverId, message } = req.body;
  const senderId = req.user.id;

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(new AppError('Receiver user not found', 404));
  }

  const newMessage = await Message.create({
    sender: senderId,
    receiver: receiverId,
    message: message.trim(),
  });

  const populated = await Message.findById(newMessage._id)
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .lean();

  const messagePayload = {
    _id: populated._id,
    sender: populated.sender,
    receiver: populated.receiver,
    message: populated.message,
    createdAt: populated.createdAt,
  };

  const io = req.app.get('io');
  if (io) io.to(`user:${receiverId}`).emit('receiveMessage', messagePayload);

  res.status(201).json({
    success: true,
    data: { message: populated },
  });
};

/**
 * GET /api/messages/:userId - Messages between current user and :userId. Param validated.
 */
const getMessages = async (req, res, next) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .lean();

  res.status(200).json({
    success: true,
    data: { messages },
  });
};

/**
 * POST /api/messages/:userId/read - Mark messages from :userId -> current user as read.
 * Emits Socket.io "messagesRead" to the other user so their UI can update read receipts.
 */
const markConversationRead = async (req, res, next) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;

  const unread = await Message.find({
    sender: otherUserId,
    receiver: currentUserId,
    readAt: null,
  })
    .select('_id')
    .lean();

  const messageIds = unread.map((m) => m._id.toString());
  if (messageIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: { messageIds: [], readAt: null },
    });
  }

  const readAt = new Date();
  await Message.updateMany(
    { _id: { $in: messageIds } },
    { $set: { readAt } }
  );

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${otherUserId}`).emit('messagesRead', {
      readerId: currentUserId,
      withUserId: otherUserId,
      messageIds,
      readAt: readAt.toISOString(),
    });
  }

  res.status(200).json({
    success: true,
    data: { messageIds, readAt: readAt.toISOString() },
  });
};

/**
 * GET /api/messages/users/list - All users except current (for chat list).
 */
const getUsers = async (req, res, next) => {
  const currentUserId = req.user.id;
  const users = await User.find({ _id: { $ne: currentUserId } })
    .select('name email _id')
    .lean();

  res.status(200).json({
    success: true,
    data: { users },
  });
};

/**
 * GET /api/messages/users/online - User IDs currently connected via Socket (from user map).
 */
const getOnlineUsers = async (req, res, next) => {
  const onlineUserIds = getOnlineUserIds();
  res.status(200).json({
    success: true,
    data: { onlineUserIds },
  });
};

module.exports = {
  sendMessage,
  getMessages,
  markConversationRead,
  getUsers,
  getOnlineUsers,
};
