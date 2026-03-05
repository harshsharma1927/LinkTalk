# Chat App Backend

Production-ready Node.js backend for real-time chat: Express, MongoDB, JWT, Socket.io.

## Features

- **Centralized error handling** – AppError + global handler; consistent status codes and JSON
- **Input validation** – express-validator on auth and message routes (body/params)
- **Proper status codes** – 400, 401, 404, 409, 500 via error handler
- **Socket user mapping** – `utils/socketUserMap.js`: userId ↔ socketId(s), online list
- **Scalability** – rate limiting, helmet, asyncHandler, request body size limit

## Quick start

1. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `MONGODB_URI` and `JWT_SECRET`.

2. **Install and run**
   ```bash
   npm install
   npm run dev
   ```

Server runs at `http://localhost:5000`. MongoDB must be running.

## API overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Register (name, email, password) |
| POST | `/api/auth/login` | No | Login; returns JWT |
| GET | `/api/auth/me` | Yes | Current user profile |
| POST | `/api/messages` | Yes | Send message (body: receiverId, message) |
| GET | `/api/messages/users/list` | Yes | All users except current |
| GET | `/api/messages/users/online` | Yes | Online user IDs (from socket map) |
| GET | `/api/messages/:userId` | Yes | Messages between current user and :userId |

**Auth:** Send JWT in header: `Authorization: Bearer <token>`.

Validation errors and operational errors return `{ success: false, message, errors? }` with appropriate status codes.

## Socket.io

Connect with JWT: `auth: { token: '<access_token>' }` or query `?token=<access_token>`.

- **Join room:** Each user is in room `user:<userId>`.
- **Events:** `sendMessage` (payload: receiverId, message) — saved to DB and emitted as `receiveMessage` to receiver.
- **Tracking:** `userOnline` / `userOffline` broadcast with `userId` and `onlineUserIds` (from socket user map).

Messages sent via REST `POST /api/messages` are also emitted in real time to the receiver.
