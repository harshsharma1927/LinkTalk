/**
 * Socket.io real-time messaging
 * - JWT authentication; socket user mapping via utils/socketUserMap
 * - User-specific rooms for targeted delivery; receiveMessage event
 * - Messages saved to DB and emitted in real time
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const {
  addSocket,
  removeSocket,
  getOnlineUserIds,
  isUserOnline,
} = require('../utils/socketUserMap');

const MAX_MESSAGE_LENGTH = 5000;

const markReadBetweenUsers = async ({ readerId, otherUserId }) => {
  const unread = await Message.find({
    sender: otherUserId,
    receiver: readerId,
    readAt: null,
  })
    .select('_id')
    .lean();

  const messageIds = unread.map((m) => m._id.toString());
  if (messageIds.length === 0) return { messageIds: [], readAt: null };

  const readAt = new Date();
  await Message.updateMany(
    { _id: { $in: messageIds } },
    { $set: { readAt } }
  );

  return { messageIds, readAt };
};

/**
 * Extract and verify JWT from handshake (auth.token, query.token, or Authorization header)
 */
const getUserIdFromSocket = async (socket) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.query?.token ||
    (socket.handshake.headers?.authorization &&
      socket.handshake.headers.authorization.split(' ')[1]);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id');
    return user ? user._id.toString() : null;
  } catch {
    return null;
  }
};

/**
 * Initialize Socket.io: auth middleware, connection handling, sendMessage/receiveMessage
 */
const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    const userId = await getUserIdFromSocket(socket);
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    socket.userId = userId;
    next();
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    // Centralized user mapping: userId <-> socketId(s)
    socket.join(`user:${userId}`);
    addSocket(userId, socket.id);

    // Broadcast so clients can update "online" indicators
    io.emit('userOnline', { userId, onlineUserIds: getOnlineUserIds() });

    // Real-time send: validate, save to DB, emit to receiver
    socket.on('sendMessage', async (payload, callback) => {
      try {
        const { receiverId, message } = payload || {};
        const msg = typeof message === 'string' ? message.trim() : '';

        if (!receiverId || !msg) {
          if (callback) callback({ success: false, error: 'receiverId and message are required' });
          return;
        }
        if (msg.length > MAX_MESSAGE_LENGTH) {
          if (callback) callback({ success: false, error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters` });
          return;
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
          if (callback) callback({ success: false, error: 'Receiver not found' });
          return;
        }

        const newMessage = await Message.create({
          sender: userId,
          receiver: receiverId,
          message: msg,
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
          readAt: populated.readAt,
        };

        io.to(`user:${receiverId}`).emit('receiveMessage', messagePayload);
        if (callback) callback({ success: true, message: messagePayload });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message || 'Failed to send message' });
      }
    });

    // Typing indicator: receiver-only
    socket.on('typing', (payload) => {
      const { receiverId, isTyping } = payload || {};
      if (!receiverId) return;
      io.to(`user:${receiverId}`).emit('typing', {
        fromUserId: userId,
        isTyping: Boolean(isTyping),
      });
    });

    // Read receipts: receiver marks conversation as read
    socket.on('markRead', async (payload, callback) => {
      try {
        const { withUserId } = payload || {};
        if (!withUserId) {
          if (callback) callback({ success: false, error: 'withUserId is required' });
          return;
        }

        const { messageIds, readAt } = await markReadBetweenUsers({
          readerId: userId,
          otherUserId: withUserId,
        });

        if (messageIds.length > 0) {
          io.to(`user:${withUserId}`).emit('messagesRead', {
            readerId: userId,
            withUserId,
            messageIds,
            readAt: readAt.toISOString(),
          });
        }

        if (callback) {
          callback({
            success: true,
            messageIds,
            readAt: readAt ? readAt.toISOString() : null,
          });
        }
      } catch (err) {
        if (callback) callback({ success: false, error: err.message || 'Failed to mark read' });
      }
    });

    socket.on('disconnect', () => {
      const removedUserId = removeSocket(socket.id);
      if (removedUserId) {
        io.emit('userOffline', { userId: removedUserId, onlineUserIds: getOnlineUserIds() });
      }
    });
  });

  return io;
};

/** Get currently online user IDs (e.g. for API or admin) */
const getConnectedUserIds = getOnlineUserIds;

module.exports = { initializeSocket, getConnectedUserIds, isUserOnline };
