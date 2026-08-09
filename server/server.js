const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const loggerMiddleware = require('./middlewares/loggerMiddleware');
const errorHandler = require('./middlewares/errorMiddleware');
const { apiRateLimiter } = require('./middlewares/rateLimiter');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const progressRoutes = require('./routes/progressRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const logRoutes = require('./routes/logRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for iframe embedding of local task HTML
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach IP, OS, Browser logger middleware
app.use(loggerMiddleware);
app.use('/api', apiRateLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'NerdLab Learning Platform REST API',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);

// Static Tasks Directory Serving
app.use('/tasks', express.static(path.join(__dirname, 'tasks')));

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found on this server.`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` NerdLab Learning Platform API Server Running `);
    console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(` Port        : ${PORT}`);
    console.log(` Health      : http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;
