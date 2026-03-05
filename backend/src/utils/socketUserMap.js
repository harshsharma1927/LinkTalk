/**
 * Socket user mapping for scalability and single source of truth.
 * - userId -> Set(socketIds): one user can have multiple connections (tabs/devices)
 * - socketId -> userId: reverse lookup for disconnect and targeted ops
 */

const userIdToSockets = new Map(); // string -> Set<string>
const socketIdToUser = new Map();  // string -> string

/**
 * Register a socket for a user (e.g. on connection).
 */
function addSocket(userId, socketId) {
  const uid = String(userId);
  if (!userIdToSockets.has(uid)) {
    userIdToSockets.set(uid, new Set());
  }
  userIdToSockets.get(uid).add(socketId);
  socketIdToUser.set(socketId, uid);
}

/**
 * Remove a socket (e.g. on disconnect).
 */
function removeSocket(socketId) {
  const userId = socketIdToUser.get(socketId);
  if (!userId) return null;
  socketIdToUser.delete(socketId);
  const set = userIdToSockets.get(userId);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) userIdToSockets.delete(userId);
  }
  return userId;
}

/**
 * Get all socket IDs for a user (for emitting to their room or single-user targeting).
 */
function getSocketIdsByUserId(userId) {
  const set = userIdToSockets.get(String(userId));
  return set ? Array.from(set) : [];
}

/**
 * Get userId for a socket (reverse lookup).
 */
function getUserIdBySocketId(socketId) {
  return socketIdToUser.get(socketId) || null;
}

/**
 * List of currently online user IDs.
 */
function getOnlineUserIds() {
  return Array.from(userIdToSockets.keys());
}

/**
 * Check if a user is currently connected.
 */
function isUserOnline(userId) {
  return userIdToSockets.has(String(userId));
}

module.exports = {
  addSocket,
  removeSocket,
  getSocketIdsByUserId,
  getUserIdBySocketId,
  getOnlineUserIds,
  isUserOnline,
};
