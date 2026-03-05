/**
 * Chat application backend - entry point
 * Express REST API + Socket.io; centralized errors, validation, rate limit, helmet
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { initializeSocket } = require('./socket/socket');
const { errorHandler } = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// Security: default headers (CSP, XSS, etc.)
app.use(helmet());

// Rate limiting: 100 requests per 15 min per IP (adjust for production)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Chat API is running' });
});

initializeSocket(io);

// 404: must be after all routes
app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// Centralized error handler (last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
  console.log(`Socket.io: attached to same server`);
});
