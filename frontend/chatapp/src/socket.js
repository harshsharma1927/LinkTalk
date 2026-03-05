import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token },
    });
  } else {
    socket.auth = { token };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

